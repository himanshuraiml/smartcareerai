import { Request, Response } from 'express';
import { z } from 'zod';
import { sessionManager } from '../services/session-manager.service';
import { logger } from '../utils/logger';

const startSchema = z.object({
    meetingId: z.string().min(1),
    jobRole: z.string().min(1),
    jobDescription: z.string().min(1),
    candidateName: z.string().optional(),
});

/** POST /ai-interviews — Start AI interviewer for a meeting */
export async function startAIInterview(req: Request, res: Response): Promise<void> {
    try {
        const body = startSchema.parse(req.body);
        const session = await sessionManager.startSession(body);
        res.status(201).json({
            sessionId: session.sessionId,
            meetingId: session.meetingId,
            producerId: session.producerId,
            status: session.status,
            startedAt: session.startedAt,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('startAIInterview error:', err);
        if (message.includes('already active')) {
            res.status(409).json({ error: message });
        } else if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: err.errors });
        } else {
            res.status(500).json({ error: message });
        }
    }
}

/** DELETE /ai-interviews/:meetingId — Stop the AI interviewer */
export async function stopAIInterview(req: Request, res: Response): Promise<void> {
    try {
        const meetingId = req.params['meetingId'] as string;
        await sessionManager.stopSession(meetingId);
        res.json({ success: true, meetingId });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('stopAIInterview error:', err);
        res.status(500).json({ error: message });
    }
}

/** GET /ai-interviews/:meetingId — Get session status */
export async function getAIInterviewStatus(req: Request, res: Response): Promise<void> {
    try {
        const meetingId = req.params['meetingId'] as string;
        const session = await sessionManager.getSession(meetingId);
        if (!session) {
            res.status(404).json({ error: 'No active AI interview session for this meeting' });
            return;
        }
        res.json(session);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}

/** GET /ai-interviews — List all active sessions (admin/internal) */
export async function listActiveSessions(_req: Request, res: Response): Promise<void> {
    const sessions = sessionManager.listActiveSessions();
    res.json({ sessions, count: sessions.length });
}
