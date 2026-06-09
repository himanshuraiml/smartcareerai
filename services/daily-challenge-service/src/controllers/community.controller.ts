import { Request, Response, NextFunction } from 'express';
import { communityService } from '../services/community.service';

export class CommunityController {
    /**
     * Submit a new question
     */
    async submitQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authorId = (req as any).user?.id;
            if (!authorId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { skillId, questionText, options, correctAnswer, explanation, difficulty, tags } = req.body;

            if (!skillId || !questionText || !options || !correctAnswer || !explanation || !difficulty) {
                res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'Missing required question fields.' },
                });
                return;
            }

            const question = await communityService.submitQuestion(
                authorId,
                skillId,
                questionText,
                options,
                correctAnswer,
                explanation,
                difficulty,
                tags || []
            );

            res.json({ success: true, data: question });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get list of questions pending review that voter is eligible to vote on
     */
    async getQuestionsForReview(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const questions = await communityService.getQuestionsForReview(userId);
            res.json({ success: true, data: questions });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submit vote (upvote / downvote)
     */
    async submitVote(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { questionId } = req.params;
            const { isUpvote } = req.body;

            if (!questionId || isUpvote === undefined) {
                res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: 'Missing questionId or isUpvote parameter.' },
                });
                return;
            }

            const updatedQuestion = await communityService.submitVote(userId, questionId, !!isUpvote);
            res.json({ success: true, data: updatedQuestion });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user's own submissions
     */
    async getUserSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const submissions = await communityService.getUserSubmissions(userId);
            res.json({ success: true, data: submissions });
        } catch (error) {
            next(error);
        }
    }
}

export const communityController = new CommunityController();
