import { Request, Response, NextFunction } from 'express';
import { LeaderboardService } from '../services/leaderboard.service';

const leaderboardService = new LeaderboardService();

export class LeaderboardController {
    async getLeaderboard(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUserId = req.headers['x-user-id'] as string | undefined;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

            const result = await leaderboardService.getLeaderboard(currentUserId, limit);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const leaderboardController = new LeaderboardController();
