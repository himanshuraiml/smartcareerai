import { Request, Response, NextFunction } from 'express';
import { schedulingService } from '../services/scheduling.service';

export class SchedulingController {
    // GET /api/v1/public/schedule/:token — no auth, candidate fetches available slots
    async getAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.params;
            if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

            const data = await schedulingService.getAvailability(token);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    // POST /api/v1/public/schedule/:token/book — no auth, candidate books a slot
    async bookSlot(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.params;
            const { candidateName, candidateEmail, selectedSlot } = req.body;

            if (!token) return res.status(400).json({ success: false, message: 'Token is required' });
            if (!selectedSlot) return res.status(400).json({ success: false, message: 'selectedSlot is required' });
            if (!candidateName || !candidateEmail) {
                return res.status(400).json({ success: false, message: 'candidateName and candidateEmail are required' });
            }

            const result = await schedulingService.bookSlot(token, candidateName, candidateEmail, selectedSlot);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const schedulingController = new SchedulingController();
