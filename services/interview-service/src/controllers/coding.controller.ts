import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CodingService } from '../services/coding.service';
import { BillingClient } from '../utils/billing-client';
import { logger } from '../utils/logger';

const codingService = new CodingService();

const runCodeSchema = z.object({
    language: z.string().min(1),
    code: z.string().min(1),
});

const submitCodeSchema = z.object({
    language: z.string().min(1),
    code: z.string().min(1),
});

export class CodingController {
    /**
     * GET /coding/challenges
     * List challenges with optional ?difficulty=EASY|MEDIUM|HARD&category=arrays
     */
    listChallenges = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string | undefined;
            const { difficulty, category } = req.query as { difficulty?: string; category?: string };

            const challenges = await codingService.listChallenges(userId, { difficulty, category });
            res.json({ success: true, data: challenges });
        } catch (error) {
            logger.error('List challenges error:', error);
            next(error);
        }
    };

    /**
     * GET /coding/challenges/:id
     * Get challenge details (no hidden test cases)
     */
    getChallenge = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const challenge = await codingService.getChallenge(id);
            res.json({ success: true, data: challenge });
        } catch (error: any) {
            if (error.message === 'Challenge not found') {
                return res.status(404).json({ success: false, error: 'Challenge not found' });
            }
            logger.error('Get challenge error:', error);
            next(error);
        }
    };

    /**
     * POST /coding/challenges/:id/run
     * Run code against visible test cases only — no credit consumed.
     */
    runCode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { language, code } = runCodeSchema.parse(req.body);

            const result = await codingService.runCode(id, language, code);
            res.json({ success: true, data: result });
        } catch (error: any) {
            if (error.message === 'Challenge not found') {
                return res.status(404).json({ success: false, error: 'Challenge not found' });
            }
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, error: error.errors });
            }
            logger.error('Run code error:', error);
            next(error);
        }
    };

    /**
     * POST /coding/challenges/:id/submit
     * Submit code — consumes SKILL_TEST credit, runs all tests + AI analysis.
     */
    submitCode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ success: false, error: 'Authorization required' });

            const { id } = req.params;
            const { language, code } = submitCodeSchema.parse(req.body);

            // Consume SKILL_TEST credit before processing
            try {
                await BillingClient.consumeCredit(authHeader, 'SKILL_TEST');
            } catch (creditError: any) {
                logger.warn(`Credit check failed for user ${userId}: ${creditError.message}`);
                return res.status(creditError.statusCode || 402).json({
                    success: false,
                    error: creditError.message || 'Insufficient credits',
                    code: creditError.code || 'INSUFFICIENT_CREDITS',
                });
            }

            const result = await codingService.submitCode(userId, id, language, code);
            res.json({ success: true, data: result });
        } catch (error: any) {
            if (error.message === 'Challenge not found') {
                return res.status(404).json({ success: false, error: 'Challenge not found' });
            }
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, error: error.errors });
            }
            logger.error('Submit code error:', error);
            next(error);
        }
    };

    /**
     * GET /coding/submissions
     * Get user's submission history. Optional ?challengeId=...
     */
    getUserSubmissions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const { challengeId } = req.query as { challengeId?: string };
            const submissions = await codingService.getUserSubmissions(userId, challengeId);
            res.json({ success: true, data: submissions });
        } catch (error) {
            logger.error('Get submissions error:', error);
            next(error);
        }
    };

    /**
     * GET /coding/submissions/:id
     * Get a specific submission (must belong to the requesting user).
     */
    getSubmission = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const submission = await codingService.getSubmission(req.params.id, userId);
            res.json({ success: true, data: submission });
        } catch (error: any) {
            if (error.message === 'Submission not found') {
                return res.status(404).json({ success: false, error: 'Submission not found' });
            }
            logger.error('Get submission error:', error);
            next(error);
        }
    };
}
