import { Request, Response, NextFunction } from 'express';
import { masteryService } from '../services/mastery.service';
import { logger } from '../utils/logger';

export class MasteryController {
    /**
     * Get all skill masteries for the authenticated user
     */
    async getUserMasteries(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const masteries = await masteryService.getUserMasteries(userId);
            res.json({ success: true, data: masteries });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Trigger level up for a specific skill
     */
    async levelUpSkill(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { skillId } = req.params;

            const updated = await masteryService.levelUpSkill(userId, skillId);
            
            logger.info(`User ${userId} leveled up skill ${skillId}`);
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }
}

export const masteryController = new MasteryController();
