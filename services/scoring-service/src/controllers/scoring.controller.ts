import { Request, Response, NextFunction } from 'express';
import { ScoringService } from '../services/scoring.service';
import { logger } from '../utils/logger';

const scoringService = new ScoringService();

export class ScoringController {
    async analyzeResume(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { resumeId, jobRole, jobDescription } = req.body;

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
