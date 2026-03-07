import { prisma } from '../utils/prisma';
import { whisperService } from './whisper.service';
import { speakerDiarizationService } from './speaker-diarization.service';
import { logger } from '../utils/logger';

export interface TranscriptChunkInput {
    meetingId: string;
    userId: string;
    participantId: string;
    audioBase64: string;
}

export interface TranscriptSegment {
    id: string;
    meetingId: string;
    speakerId: string;
    speakerName: string;
    text: string;
    startTime: number;
    endTime: number;
    wordCount: number;
    isFinal: boolean;
}

/**
 * Accepts 5-second audio chunks from media-service, transcribes via Groq Whisper,
 * persists MeetingTranscriptEntry, and pushes the segment back to media-service
 * so it can broadcast via Socket.io.
 */
export class MeetingTranscriptionService {
    /** Map: meetingId → seconds elapsed (approximated from chunk count) */
    private meetingTimers = new Map<string, number>();

    async processChunk(input: TranscriptChunkInput): Promise<TranscriptSegment | null> {
        const { meetingId, userId, audioBase64 } = input;

        // Decode base64 audio buffer
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        if (audioBuffer.length < 500) {
            logger.debug(`Skipping tiny audio chunk for meeting ${meetingId} (${audioBuffer.length} bytes)`);
            return null;
        }

        // Transcribe with Groq Whisper
        let transcriptionResult;
        try {
            transcriptionResult = await whisperService.transcribeAudio(audioBuffer, `chunk-${meetingId}-${userId}-${Date.now()}.wav`);
        } catch (err: any) {
            logger.error(`Whisper transcription error for meeting ${meetingId}:`, err.message);
            return null;
        }

        const text = transcriptionResult.text.trim();
        if (!text) {
            logger.debug(`Empty transcription for meeting ${meetingId} user ${userId}`);
            return null;
        }

        // Resolve speaker name
        const { speakerName } = await speakerDiarizationService.getSpeakerInfo(userId);

        // Track approximate time offset
        const elapsed = this.meetingTimers.get(meetingId) ?? 0;
        const startTime = elapsed;
        const endTime = elapsed + transcriptionResult.duration;
        this.meetingTimers.set(meetingId, endTime);

        // Persist to DB
        let entry;
        try {
            entry = await prisma.meetingTranscriptEntry.create({
                data: {
                    meetingId,
                    speakerId: userId,
                    speakerName,
                    text,
                    startTime,
                    endTime,
                    wordCount: transcriptionResult.wordCount,
                    isFinal: true,
                },
            });
        } catch (err: any) {
            logger.error(`Failed to save transcript entry for meeting ${meetingId}:`, err.message);
            return null;
        }

        const segment: TranscriptSegment = {
            id: entry.id,
            meetingId,
            speakerId: userId,
            speakerName,
            text,
            startTime,
            endTime,
            wordCount: transcriptionResult.wordCount,
            isFinal: true,
        };

        logger.info(`Transcript segment saved: meeting=${meetingId} speaker=${speakerName} words=${transcriptionResult.wordCount}`);
        return segment;
    }

    async getTranscript(meetingId: string): Promise<TranscriptSegment[]> {
        const entries = await prisma.meetingTranscriptEntry.findMany({
            where: { meetingId },
            orderBy: { startTime: 'asc' },
        });

        return entries.map(e => ({
            id: e.id,
            meetingId: e.meetingId,
            speakerId: e.speakerId,
            speakerName: e.speakerName,
            text: e.text,
            startTime: e.startTime,
            endTime: e.endTime,
            wordCount: e.wordCount,
            isFinal: e.isFinal,
        }));
    }

    clearMeetingTimer(meetingId: string): void {
        this.meetingTimers.delete(meetingId);
        speakerDiarizationService.clearCache();
    }
}

export const meetingTranscriptionService = new MeetingTranscriptionService();
