import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger';
import { ttsService } from './tts.service';

export interface PlainTransportParams {
    transportId: string;
    ip: string;
    port: number;
    producerId: string;
}

/**
 * AIParticipantService manages a single AI participant's media presence in one
 * meeting room.
 *
 * Flow:
 *  1. `connect(meetingId)` — calls media-service to create a PlainTransport
 *     and Producer for the AI participant.  Returns the producerId that other
 *     participants must consume to hear the AI.
 *  2. `speak(text)` — synthesises text via OpenAI TTS → pipes MP3 into an
 *     FFmpeg child process → sends Opus RTP to the PlainTransport's UDP port.
 *  3. `disconnect()` — kills FFmpeg and notifies media-service.
 */
export class AIParticipantService {
    private meetingId: string;
    private mediaServiceUrl: string;
    private internalSecret: string;
    private transportParams: PlainTransportParams | null = null;
    private ffmpegProc: ChildProcess | null = null;
    private isSpeaking = false;
    /** Queue of pending utterances while FFmpeg is busy */
    private speakQueue: string[] = [];

    constructor(meetingId: string) {
        this.meetingId = meetingId;
        this.mediaServiceUrl = process.env.MEDIA_SERVICE_URL || 'http://localhost:3014';
        this.internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'internal-secret';
    }

    /** Create PlainTransport + Producer in media-service and cache params. */
    async connect(): Promise<PlainTransportParams> {
        const res = await fetch(
            `${this.mediaServiceUrl}/meetings/${this.meetingId}/ai-transport/create`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': this.internalSecret,
                },
            }
        );

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to create AI transport: ${res.status} ${text}`);
        }

        const data = await res.json() as PlainTransportParams;
        this.transportParams = data;
        logger.info(`AI participant connected to meeting ${this.meetingId} — transport ${data.transportId}, producer ${data.producerId}, RTP port ${data.port}`);
        return data;
    }

    /**
     * Synthesise `text` and deliver it as RTP audio into the meeting room.
     * If already speaking, queues the utterance.
     */
    async speak(text: string): Promise<void> {
        if (!this.transportParams) throw new Error('AI participant not connected');

        if (this.isSpeaking) {
            this.speakQueue.push(text);
            return;
        }

        await this._deliverAudio(text);
    }

    private async _deliverAudio(text: string): Promise<void> {
        if (!this.transportParams) return;
        this.isSpeaking = true;

        try {
            const mp3Buffer = await ttsService.synthesise(text);
            await this._sendRtp(mp3Buffer, this.transportParams.port);
        } catch (err) {
            logger.error(`AI participant speak error for meeting ${this.meetingId}:`, err);
        } finally {
            this.isSpeaking = false;
            // Drain queue
            if (this.speakQueue.length > 0) {
                const next = this.speakQueue.shift()!;
                void this._deliverAudio(next);
            }
        }
    }

    /**
     * Pipe an MP3 buffer through FFmpeg → Opus RTP → MediaSoup PlainTransport.
     *
     * FFmpeg command:
     *   ffmpeg -f mp3 -i pipe:0
     *          -ar 48000 -ac 2 -c:a libopus -b:a 128k
     *          -f rtp rtp://127.0.0.1:<port>?pkt_size=1200
     */
    private _sendRtp(mp3Buffer: Buffer, rtpPort: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const rtpTarget = `rtp://127.0.0.1:${rtpPort}?pkt_size=1200`;

            this.ffmpegProc = spawn('ffmpeg', [
                '-loglevel', 'error',
                '-f', 'mp3',
                '-i', 'pipe:0',
                '-ar', '48000',
                '-ac', '2',
                '-c:a', 'libopus',
                '-b:a', '128k',
                '-ssrc', '11111111',
                '-payload_type', '101',
                '-f', 'rtp', rtpTarget,
            ]);

            this.ffmpegProc.stderr?.on('data', (d: Buffer) => {
                logger.warn(`FFmpeg: ${d.toString().trim()}`);
            });

            this.ffmpegProc.on('close', (code) => {
                this.ffmpegProc = null;
                if (code === 0 || code === null) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });

            this.ffmpegProc.on('error', (err) => {
                this.ffmpegProc = null;
                reject(err);
            });

            // Write MP3 data to FFmpeg stdin and close to signal EOF
            this.ffmpegProc.stdin?.write(mp3Buffer);
            this.ffmpegProc.stdin?.end();
        });
    }

    /** Terminate the AI participant — kill FFmpeg and close the transport. */
    async disconnect(): Promise<void> {
        if (this.ffmpegProc) {
            this.ffmpegProc.kill('SIGTERM');
            this.ffmpegProc = null;
        }

        if (!this.transportParams) return;

        try {
            await fetch(
                `${this.mediaServiceUrl}/meetings/${this.meetingId}/ai-transport/close`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-internal-secret': this.internalSecret,
                    },
                    body: JSON.stringify({ transportId: this.transportParams.transportId }),
                }
            );
        } catch (err) {
            logger.warn(`Failed to close AI transport for meeting ${this.meetingId}:`, err);
        }

        this.transportParams = null;
        this.speakQueue = [];
        logger.info(`AI participant disconnected from meeting ${this.meetingId}`);
    }

    isConnected(): boolean {
        return this.transportParams !== null;
    }

    getProducerId(): string | null {
        return this.transportParams?.producerId ?? null;
    }
}
