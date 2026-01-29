import { Request, Response, NextFunction } from 'express';
import { ScoringService } from '../services/scoring.service';
import { logger } from '../utils/logger';
import { BillingClient } from '../utils/billing-client';

const scoringService = new ScoringService();

export class ScoringController {
    async analyzeResume(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { resumeId, jobRole, jobDescription } = req.body;

            // Get auth header to forward to billing service
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).json({ error: 'Authorization required' });
                return;
            }

            // Consume RESUME_REVIEW credit before analyzing
            try {
                await BillingClient.consumeCredit(authHeader, 'RESUME_REVIEW', resumeId);
            } catch (creditError: any) {
                logger.warn(`Credit check failed for user ${userId}: ${creditError.message}`);
                res.status(creditError.statusCode || 402).json({
                    success: false,
                    error: creditError.message || 'Insufficient credits',
                    code: creditError.code || 'INSUFFICIENT_CREDITS',
                });
                return;
            }

            const score = await scoringService.analyzeResume(
                userId,
                resumeId,
                jobRole,
                jobDescription
            );

            logger.info(`Resume analyzed: ${resumeId} for role ${jobRole}`);
            res.status(201).json({
                success: true,
                data: score,
            });
        } catch (error) {
            next(error);
        }
    }

    async getScoreHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const scores = await scoringService.getScoreHistory(userId);

            res.json({
                success: true,
                data: scores,
            });
        } catch (error) {
            next(error);
        }
    }

    async getScoreById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const score = await scoringService.getScoreById(id, userId);

            res.json({
                success: true,
                data: score,
            });
        } catch (error) {
            next(error);
        }
    }

    async getJobRoles(_req: Request, res: Response, next: NextFunction) {
        try {
            const roles = await scoringService.getJobRoles();

            res.json({
                success: true,
                data: roles,
            });
        } catch (error) {
            next(error);
        }
    }
}
