import { Request, Response, NextFunction } from 'express';
import { motivationService } from '../services/motivation.service';
import { AppError } from '../utils/errors';

export class MotivationController {
    async getDailyQuote(req: Request, res: Response, next: NextFunction) {
        try {
            const quote = await motivationService.getDailyQuote();
            res.status(200).json({
                success: true,
                data: quote
            });
        } catch (error) {
            next(new AppError('Failed to fetch daily quote', 500));
        }
    }
}

export const motivationController = new MotivationController();
