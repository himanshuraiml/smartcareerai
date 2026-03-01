import { Request, Response } from 'express';
import { engagementService } from '../services/engagement.service';
import { logger } from '../utils/logger';

export const engagementController = {
    async processDailyLogin(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const result = await engagementService.processDailyLogin(userId);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error processing daily login:', error);
            res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
        }
    },

    async getStats(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const stats = await engagementService.getEngagementStats(userId);
            res.json({ success: true, data: stats });
        } catch (error: any) {
            logger.error('Error fetching engagement stats:', error);
            res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
        }
    },
};
