import { Request, Response, NextFunction } from 'express';
import { ValidationService } from '../services/validation.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const validationService = new ValidationService();

const submitSchema = z.object({
    answers: z.record(z.string(), z.string()), // { questionId: "answer" }
});

export class ValidationController {
    getTests = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const skillId = req.query.skillId as string | undefined;
            const tests = await validationService.getTests(skillId);
            res.json({ success: true, data: tests });
        } catch (error) {
            logger.error('Get tests error:', error);
            next(error);
        }
    };

    getTest = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const test = await validationService.getTest(id);
            res.json({ success: true, data: test });
        } catch (error) {
            logger.error('Get test error:', error);
            next(error);
        }
    };

    startTest = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            const attempt = await validationService.startTest(userId, id);
            res.status(201).json({ success: true, data: attempt });
        } catch (error) {
            logger.error('Start test error:', error);
            next(error);
        }
    };

    submitTest = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            const data = submitSchema.parse(req.body);
            const result = await validationService.submitTest(userId, id, data.answers);
            res.json({ success: true, data: result });
        } catch (error) {
            logger.error('Submit test error:', error);
            next(error);
        }
    };

    getUserAttempts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const attempts = await validationService.getUserAttempts(userId);
            res.json({ success: true, data: attempts });
        } catch (error) {
            logger.error('Get attempts error:', error);
            next(error);
        }
    };

    getAttempt = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            const attempt = await validationService.getAttempt(userId, id);
            res.json({ success: true, data: attempt });
        } catch (error) {
            logger.error('Get attempt error:', error);
            next(error);
        }
    };

    getUserBadges = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const badges = await validationService.getUserBadges(userId);
            res.json({ success: true, data: badges });
        } catch (error) {
            logger.error('Get badges error:', error);
            next(error);
        }
    };
}
