import { Request, Response } from 'express';
import { leagueService } from '../services/league.service';
import { logger } from '../utils/logger';

export const leagueController = {
    async getUserLeague(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const result = await leagueService.getUserLeague(userId);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error fetching user league:', error);
            res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
        }
    },

    async getLeagueLeaderboard(req: Request, res: Response) {
        try {
            const { leagueId } = req.params;
            if (!leagueId) return res.status(400).json({ error: 'Missing leagueId parameter' });

            const result = await leagueService.getLeagueLeaderboard(leagueId);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error fetching league leaderboard:', error);
            res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
        }
    },

    async getLeagueHistory(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const history = await leagueService.getLeagueHistory(userId);
            res.json({ success: true, data: history });
        } catch (error: any) {
            logger.error('Error fetching league history:', error);
            res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
        }
    },

    async getLastWeekResult(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const result = await leagueService.getLastWeekResult(userId);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error fetching last week result:', error);
            res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
        }
    },

    async processWeeklyReset(req: Request, res: Response) {
        try {
            // In a real application, check for admin role here
            const result = await leagueService.processWeeklyReset();
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error running manual weekly reset:', error);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    },
};
