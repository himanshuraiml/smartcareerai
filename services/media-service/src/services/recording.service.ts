import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as mediasoup from 'mediasoup';
import { RtpForwarderService, SdpInfo } from './rtp-forwarder.service';
import { uploadFile, getPresignedUrl } from '../utils/minio-client';
import { emitToRoom } from '../socket/signaling.socket';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const TRANSCRIPT_CHUNK_SECONDS = 5;
const INTERVIEW_SERVICE_URL = process.env.INTERVIEW_SERVICE_URL || 'http://localhost:3007';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'internal-secret';

interface ActiveRecording {
    ffmpegProcess: ChildProcess;
    chunkProcesses: Map<string, NodeJS.Timeout>; // producerId → chunk timer
    forwarder: RtpForwarderService;
    outputPath: string;
    startTime: Date;
    sdpInfos: SdpInfo[];
}

export class RecordingService {
    private recordings = new Map<string, ActiveRecording>(); // meetingId → recording
    private tempDir: string;

    constructor() {
        this.tempDir = path.join(process.cwd(), 'temp', 'recordings');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Start recording a meeting.
     * Creates PlainTransport+Consumer for each audio producer then launches FFmpeg.
     */
    async startRecording(
        meetingId: string,
        router: mediasoup.types.Router,
        audioProducers: Array<{ producer: mediasoup.types.Producer; participantId: string; userId: string }>,
    ): Promise<void> {
        if (this.recordings.has(meetingId)) {
            logger.warn(`Recording already active for meeting ${meetingId}`);
            return;
        }

        if (audioProducers.length === 0) {
            throw new Error('No audio producers to record');
        }

        const forwarder = new RtpForwarderService();
        const sdpInfos: SdpInfo[] = [];

        for (const { producer, participantId, userId } of audioProducers) {
            try {
                const sdpInfo = await forwarder.startForwarding(router, producer, participantId, userId);
                sdpInfos.push(sdpInfo);
            } catch (err: any) {
                logger.error(`Failed to start forwarder for producer ${producer.id}:`, err.message);
            }
        }

        if (sdpInfos.length === 0) {
            throw new Error('Could not start any RTP forwarders');
        }

        const outputPath = path.join(this.tempDir, `${meetingId}-${Date.now()}.webm`);

        // Build FFmpeg command: read all audio SDP inputs → amix → webm output
        const ffmpegArgs = this.buildFfmpegArgs(sdpInfos, outputPath);
        logger.info(`Starting FFmpeg recording for meeting ${meetingId}: ${ffmpegArgs.join(' ')}`);

        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

        ffmpegProcess.stderr?.on('data', (data: Buffer) => {
            logger.debug(`FFmpeg [${meetingId}]: ${data.toString().trim()}`);
        });

        ffmpegProcess.on('exit', (code) => {
            logger.info(`FFmpeg [${meetingId}] exited with code ${code}`);
        });

        // Start transcription chunk timers for each participant
        const chunkProcesses = new Map<string, NodeJS.Timeout>();
        for (const sdpInfo of sdpInfos) {
            this.scheduleTranscriptionChunks(meetingId, sdpInfo, chunkProcesses);
        }

        this.recordings.set(meetingId, {
            ffmpegProcess,
            chunkProcesses,
            forwarder,
            outputPath,
            startTime: new Date(),
            sdpInfos,
        });

        logger.info(`Recording started for meeting ${meetingId}: ${sdpInfos.length} participant(s)`);
    }

    /**
     * Stop recording, upload to MinIO, update DB with recordingUrl.
     * Returns the MinIO presigned URL.
     */
    async stopRecording(meetingId: string): Promise<string | null> {
        const recording = this.recordings.get(meetingId);
        if (!recording) {
            logger.warn(`No active recording for meeting ${meetingId}`);
            return null;
        }

        // Clear chunk timers
        for (const timer of recording.chunkProcesses.values()) {
            clearTimeout(timer);
        }

        // Kill FFmpeg (SIGTERM first, then SIGKILL if needed)
        await this.killFfmpeg(recording.ffmpegProcess);

        // Stop all RTP forwarders
        recording.forwarder.stopAll();

        this.recordings.delete(meetingId);

        // Wait briefly for FFmpeg to flush to disk
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (!fs.existsSync(recording.outputPath)) {
            logger.warn(`Recording file not found: ${recording.outputPath}`);
            return null;
        }

        // Upload to MinIO
        const objectKey = `recordings/${meetingId}/${path.basename(recording.outputPath)}`;
        try {
            await uploadFile(objectKey, recording.outputPath);
        } catch (err: any) {
            logger.error(`MinIO upload failed for ${meetingId}:`, err.message);
            return null;
        } finally {
            // Clean up temp file
            try { fs.unlinkSync(recording.outputPath); } catch { /* ignore */ }
        }

        // Generate presigned URL (7-day)
        let presignedUrl: string;
        try {
            presignedUrl = await getPresignedUrl(objectKey);
        } catch (err: any) {
            logger.error(`Failed to generate presigned URL for ${meetingId}:`, err.message);
            return null;
        }

        // Update MeetingRoom in DB
        try {
            await prisma.meetingRoom.update({
                where: { id: meetingId },
                data: { recordingUrl: presignedUrl },
            });
        } catch (err: any) {
            logger.error(`Failed to update recordingUrl for ${meetingId}:`, err.message);
        }

        logger.info(`Recording stopped and uploaded for meeting ${meetingId}: ${presignedUrl}`);

        // Trigger AI analysis in the background (fire-and-forget)
        this.triggerMeetingAnalysis(meetingId).catch(err => {
            logger.warn(`Failed to trigger meeting analysis for ${meetingId}: ${err.message}`);
        });

        return presignedUrl;
    }

    /**
     * POST to interview-service to kick off async AI analysis.
     * Called after recording upload completes.
     */
    private async triggerMeetingAnalysis(meetingId: string): Promise<void> {
        const url = `${INTERVIEW_SERVICE_URL}/meeting-analysis/${meetingId}/analyze`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': INTERNAL_SECRET,
            },
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            throw new Error(`Analysis trigger responded ${response.status}`);
        }
        logger.info(`Meeting analysis triggered for ${meetingId}`);

        // Notify meeting room that analysis has started
        emitToRoom(meetingId, 'meeting:analysis-started', { meetingId });
    }

    isRecording(meetingId: string): boolean {
        return this.recordings.has(meetingId);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private buildFfmpegArgs(sdpInfos: SdpInfo[], outputPath: string): string[] {
        const args: string[] = [
            '-y',
            '-protocol_whitelist', 'file,rtp,udp,crypto',
        ];

        // Add each SDP input
        for (const info of sdpInfos) {
            args.push('-f', 'sdp', '-i', info.sdpPath);
        }

        if (sdpInfos.length === 1) {
            // Single participant — just pass through audio
            args.push('-map', '0:a', '-c:a', 'copy');
        } else {
            // Mix multiple audio streams
            const amixInputs = sdpInfos.map((_, i) => `[${i}:a]`).join('');
            args.push(
                '-filter_complex', `${amixInputs}amix=inputs=${sdpInfos.length}:duration=longest[aout]`,
                '-map', '[aout]',
                '-c:a', 'libopus',
            );
        }

        args.push('-f', 'webm', outputPath);
        return args;
    }

    /**
     * Schedule periodic transcription: every TRANSCRIPT_CHUNK_SECONDS, capture
     * a 5-second audio chunk per participant and POST to interview-service.
     */
    private scheduleTranscriptionChunks(
        meetingId: string,
        sdpInfo: SdpInfo,
        timers: Map<string, NodeJS.Timeout>,
    ): void {
        const captureChunk = async () => {
            if (!this.recordings.has(meetingId)) return;

            const chunkPath = path.join(
                this.tempDir,
                `${meetingId}-${sdpInfo.userId}-${Date.now()}.wav`,
            );

            try {
                await this.captureAudioChunk(sdpInfo, chunkPath);
                await this.sendTranscriptChunk(meetingId, sdpInfo.userId, sdpInfo.participantId, chunkPath);
            } catch (err: any) {
                logger.debug(`Transcription chunk error for ${sdpInfo.userId}: ${err.message}`);
            } finally {
                try { if (fs.existsSync(chunkPath)) fs.unlinkSync(chunkPath); } catch { /* ignore */ }
            }

            // Schedule the next chunk if still recording
            if (this.recordings.has(meetingId)) {
                const timer = setTimeout(captureChunk, TRANSCRIPT_CHUNK_SECONDS * 1000);
                timers.set(sdpInfo.producerId, timer);
            }
        };

        // Start first chunk after the chunk duration
        const timer = setTimeout(captureChunk, TRANSCRIPT_CHUNK_SECONDS * 1000);
        timers.set(sdpInfo.producerId, timer);
    }

    /**
     * Capture exactly TRANSCRIPT_CHUNK_SECONDS of audio from a participant's
     * RTP stream into a WAV file using FFmpeg.
     */
    private captureAudioChunk(sdpInfo: SdpInfo, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const args = [
                '-y',
                '-protocol_whitelist', 'file,rtp,udp,crypto',
                '-f', 'sdp', '-i', sdpInfo.sdpPath,
                '-t', String(TRANSCRIPT_CHUNK_SECONDS),
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                outputPath,
            ];

            const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
            const stderr: string[] = [];

            proc.stderr?.on('data', (d: Buffer) => stderr.push(d.toString()));
            proc.on('exit', (code) => {
                if (code === 0 || (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0)) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg chunk exit ${code}: ${stderr.join('')}`));
                }
            });
            proc.on('error', reject);

            // Safety timeout
            setTimeout(() => {
                proc.kill('SIGKILL');
                reject(new Error('FFmpeg chunk timed out'));
            }, (TRANSCRIPT_CHUNK_SECONDS + 3) * 1000);
        });
    }

    /**
     * POST a WAV audio chunk to interview-service for Whisper transcription.
     */
    private async sendTranscriptChunk(
        meetingId: string,
        userId: string,
        participantId: string,
        wavPath: string,
    ): Promise<void> {
        if (!fs.existsSync(wavPath) || fs.statSync(wavPath).size < 1000) return;

        const audioBuffer = fs.readFileSync(wavPath);
        const base64Audio = audioBuffer.toString('base64');

        const response = await fetch(
            `${INTERVIEW_SERVICE_URL}/meeting-analysis/${meetingId}/transcript-chunk`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': INTERNAL_SECRET,
                    'x-speaker-id': userId,
                    'x-participant-id': participantId,
                },
                body: JSON.stringify({ audio: base64Audio, userId, participantId }),
                signal: AbortSignal.timeout(30000),
            },
        );

        if (!response.ok) {
            throw new Error(`Transcript chunk POST failed: ${response.status}`);
        }

        // Broadcast the returned segment to participants via Socket.io
        const body = await response.json() as Record<string, unknown>;
        if (body.success && body.data) {
            emitToRoom(meetingId, 'transcript-segment', body.data);
        }
    }

    private killFfmpeg(proc: ChildProcess): Promise<void> {
        return new Promise((resolve) => {
            if (proc.exitCode !== null) { resolve(); return; }

            proc.once('exit', () => resolve());
            proc.kill('SIGTERM');

            // Force kill after 3 seconds if it doesn't stop
            const killer = setTimeout(() => {
                try { proc.kill('SIGKILL'); } catch { /* ignore */ }
            }, 3000);

            proc.once('exit', () => clearTimeout(killer));
        });
    }
}

export const recordingService = new RecordingService();
