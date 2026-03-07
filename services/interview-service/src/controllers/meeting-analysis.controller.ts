import { Request, Response, NextFunction } from 'express';
import { meetingTranscriptionService } from '../services/meeting-transcription.service';
import { meetingIntelligenceService } from '../services/meeting-intelligence.service';
import { logger } from '../utils/logger';

const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'internal-secret';

function verifyInternalSecret(req: Request, res: Response): boolean {
    const secret = req.headers['x-internal-secret'];
    if (secret !== INTERNAL_SECRET) {
        res.status(401).json({ success: false, error: 'Unauthorized internal call' });
        return false;
    }
    return true;
}

/**
 * POST /meeting-analysis/:meetingId/transcript-chunk
 * Called by media-service with a base64 WAV audio chunk.
 */
export async function receiveTranscriptChunk(req: Request, res: Response, next: NextFunction) {
    try {
        if (!verifyInternalSecret(req, res)) return;

        const { meetingId } = req.params;
        const { audio, userId, participantId } = req.body as {
            audio: string;
            userId: string;
            participantId: string;
        };

        if (!audio || !userId) {
            return res.status(400).json({ success: false, error: 'audio and userId are required' });
        }

        const segment = await meetingTranscriptionService.processChunk({
            meetingId,
            userId,
            participantId: participantId || userId,
            audioBase64: audio,
        });

        if (!segment) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: segment });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /meeting-analysis/:meetingId/transcript
 * Returns the full transcript for a meeting (ordered by startTime).
 */
export async function getMeetingTranscript(req: Request, res: Response, next: NextFunction) {
    try {
        const { meetingId } = req.params;
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const segments = await meetingTranscriptionService.getTranscript(meetingId);
        res.json({ success: true, data: segments });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /meeting-analysis/:meetingId/analyze
 * Triggered by media-service after recording stops.
 * Kicks off async AI analysis (returns immediately; analysis runs in background).
 */
export async function triggerMeetingAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
        if (!verifyInternalSecret(req, res)) return;

        const { meetingId } = req.params;

        // Respond immediately — analysis is async
        res.json({ success: true, message: 'Analysis started' });

        // Fire-and-forget background processing
        meetingIntelligenceService.analyzeMeeting(meetingId).catch(err => {
            logger.error(`Background meeting analysis error for ${meetingId}:`, err.message);
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /meeting-analysis/:meetingId/result
 * Returns the MeetingAiAnalysis for a meeting (recruiter-facing).
 */
export async function getAnalysisResult(req: Request, res: Response, next: NextFunction) {
    try {
        const { meetingId } = req.params;
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const analysis = await meetingIntelligenceService.getAnalysisResult(meetingId);
        if (!analysis) {
            return res.status(404).json({ success: false, error: 'Analysis not found' });
        }

        res.json({ success: true, data: analysis });
    } catch (err) {
        next(err);
    }
}
