import { Request, Response, NextFunction } from 'express';
import { dailyChallengeService } from '../services/daily-challenge.service';
import { sprintService } from '../services/sprint.service';

export class DailyChallengeController {
    /**
     * Get today's daily challenge state for the authenticated user
     */
    async getDailyChallenge(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const challenge = await dailyChallengeService.getDailyChallenge(userId);
            res.json({ success: true, data: challenge });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submit answers for today's daily challenge quiz
     */
    async submitDailyQuiz(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { challengeId, answers, timeMs } = req.body;

            if (!challengeId || !answers) {
                res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'Missing challengeId or answers' },
                });
                return;
            }

            const result = await dailyChallengeService.submitDailyQuiz(
                userId,
                challengeId,
                answers,
                timeMs || 0
            );

            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Record reading today's career insight
     */
    async readDailyInsight(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { challengeId, reaction } = req.body;

            if (!challengeId) {
                res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'Missing challengeId' },
                });
                return;
            }

            const result = await dailyChallengeService.readDailyInsight(userId, challengeId, reaction);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Record completing today's skill sprint
     */
    async completeDailySprint(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { challengeId } = req.body;

            if (!challengeId) {
                res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'Missing challengeId' },
                });
                return;
            }

            const result = await dailyChallengeService.completeDailySprint(userId, challengeId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get flashcards for today's sprint skill
     */
    async getSprintCards(req: Request, res: Response, next: NextFunction) {
        try {
            const { skillId } = req.query;

            if (!skillId || typeof skillId !== 'string') {
                res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'Missing or invalid skillId' },
                });
                return;
            }

            const cards = await sprintService.getSprintCards(skillId);
            res.json({ success: true, data: cards });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submit a review for a specific flashcard
     */
    async submitSprintReview(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { cardId, confidence } = req.body;

            if (!cardId || confidence === undefined) {
                res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'Missing cardId or confidence score' },
                });
                return;
            }

            const numericConfidence = Number(confidence);
            if (isNaN(numericConfidence) || numericConfidence < 0 || numericConfidence > 5) {
                res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'Confidence score must be a number between 0 and 5' },
                });
                return;
            }

            const result = await sprintService.submitCardReview(userId, cardId, numericConfidence);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const dailyChallengeController = new DailyChallengeController();
