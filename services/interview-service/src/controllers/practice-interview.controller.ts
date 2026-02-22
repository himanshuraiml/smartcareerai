import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PracticeInterviewService } from '../services/practice-interview.service';
import { logger } from '../utils/logger';

const practiceService = new PracticeInterviewService();

// Validation schemas
const createPracticeSessionSchema = z.object({
    type: z.enum(['TECHNICAL', 'BEHAVIORAL', 'HR', 'MIXED']),
    targetRole: z.string().min(1).max(100),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});

const submitPracticeAnswerSchema = z.object({
    questionId: z.string().uuid(),
    answer: z.string().min(1).max(5000),
});

export class PracticeInterviewController {

    /**
     * Create a free practice interview session
     * POST /practice/sessions
     * No billing check — completely free
     */
    static async createSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            const data = createPracticeSessionSchema.parse(req.body);

            logger.info(`Creating practice session for user ${userId}: ${data.type} - ${data.targetRole}`);

            const result = await practiceService.createSession(userId, data);

            return res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: error.errors,
                });
            }
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }

    /**
     * Get user's practice sessions
     * GET /practice/sessions
     */
    static async getSessions(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            const sessions = await practiceService.getUserSessions(userId);

            return res.json({
                success: true,
                data: sessions,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific practice session
     * GET /practice/sessions/:id
     */
    static async getSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            const { id } = req.params;
            const session = await practiceService.getSession(id, userId);

            return res.json({
                success: true,
                data: session,
            });
        } catch (error: any) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }

    /**
     * Submit an answer for a practice question
     * POST /practice/sessions/:id/answer
     * Evaluated using keyword matching — no LLM
     */
    static async submitAnswer(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            const { id } = req.params;
            const { questionId, answer } = submitPracticeAnswerSchema.parse(req.body);

            logger.info(`Practice answer submitted for session ${id}, question ${questionId}`);

            const result = await practiceService.submitAnswer(id, userId, questionId, answer);

            return res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: error.errors,
                });
            }
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }

    /**
     * Complete a practice session
     * POST /practice/sessions/:id/complete
     */
    static async completeSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            const { id } = req.params;

            const result = await practiceService.completeSession(id, userId);

            return res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
}
