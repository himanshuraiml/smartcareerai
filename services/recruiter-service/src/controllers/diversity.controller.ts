import { Request, Response, NextFunction } from 'express';
import { diversityService } from '../services/diversity.service';

export class DiversityController {

    // GET /recruiter/analytics/diversity
    async getDiversityStats(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const stats = await diversityService.getDiversityStats(recruiterId);
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/analytics/diversity/export
    async exportEeoCSV(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const stats = await diversityService.getDiversityStats(recruiterId);
            const csv = diversityService.generateEeoCSV(stats.eeoData);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="eeo-report.csv"');
            res.send(csv);
        } catch (error) {
            next(error);
        }
    }

    // PUT /recruiter/jobs/:id/blind-mode
    async toggleBlindMode(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id } = req.params;
            const { blindReviewMode } = req.body;

            if (typeof blindReviewMode !== 'boolean') {
                return res.status(400).json({ success: false, message: 'blindReviewMode must be a boolean' });
            }

            const job = await diversityService.toggleBlindMode(id, recruiterId, blindReviewMode);
            res.json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }
}

export const diversityController = new DiversityController();
