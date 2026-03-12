import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { behaviorMetricsService } from '../services/behavior-metrics.service';
import { logger } from '../utils/logger';

const visionSampleSchema = z.object({
    timestamp: z.number(),
    emotion: z.string().optional(),
    eyeContact: z.number().min(0).max(1).optional(),
    posture: z.number().min(0).max(1).optional(),
});

const saveBehaviorMetricsSchema = z.object({
    visionSamples: z.array(visionSampleSchema).default([]),
    speechMetrics: z.object({
        wordsPerMinute: z.number().optional(),
        fillerWordCount: z.number().optional(),
        avgPauseSeconds: z.number().optional(),
        clarityScore: z.number().optional(),
        confidenceScore: z.number().optional(),
    }).default({}),
});

export class BehaviorMetricsController {
    /**
     * POST /sessions/:id/behavior-metrics
     * Saves aggregated vision + speech metrics for an interview session.
     */
    save = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id: sessionId } = req.params;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const body = saveBehaviorMetricsSchema.parse(req.body);

            const metrics = await behaviorMetricsService.saveBehaviorMetrics(
                sessionId,
                userId,
                body.visionSamples,
                body.speechMetrics
            );

            logger.info(`Behavior metrics saved for session ${sessionId} by user ${userId}`);
            res.json({ success: true, data: metrics });
        } catch (error) {
            logger.error('Save behavior metrics error:', error);
            next(error);
        }
    };

    /**
     * GET /sessions/:id/behavior-metrics
     * Retrieves the aggregated behavior metrics for an interview session.
     */
    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id: sessionId } = req.params;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const metrics = await behaviorMetricsService.getBehaviorMetrics(sessionId, userId);
            res.json({ success: true, data: metrics });
        } catch (error) {
            logger.error('Get behavior metrics error:', error);
            next(error);
        }
    };
}
