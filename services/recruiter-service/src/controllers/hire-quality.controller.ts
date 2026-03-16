import { Request, Response, NextFunction } from 'express';
import { hireQualityService } from '../services/hire-quality.service';

export class HireQualityController {

    // POST /recruiter/applications/:id/checkin
    async submitCheckIn(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id } = req.params;
            const { dayN, performanceRating, retentionStatus, notes } = req.body;

            if (![30, 60, 90].includes(dayN)) {
                return res.status(400).json({ success: false, message: 'dayN must be 30, 60, or 90' });
            }
            if (!performanceRating || performanceRating < 1 || performanceRating > 5) {
                return res.status(400).json({ success: false, message: 'performanceRating must be 1-5' });
            }
            if (!['RETAINED', 'RESIGNED', 'TERMINATED'].includes(retentionStatus)) {
                return res.status(400).json({ success: false, message: 'Invalid retentionStatus' });
            }

            const result = await hireQualityService.submitCheckIn(id, recruiterId, { dayN, performanceRating, retentionStatus, notes });
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/applications/:id/checkins
    async getCheckIns(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id } = req.params;
            const checkIns = await hireQualityService.getCheckIns(id, recruiterId);
            res.json({ success: true, data: checkIns });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/analytics/hire-quality
    async getHireQualityDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const data = await hireQualityService.getHireQualityDashboard(recruiterId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/applications/:id/proctoring-report (F16)
    async getProctoringReport(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id } = req.params;
            const data = await hireQualityService.getProctoringReport(id, recruiterId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/jobs/:id/proctoring-stats (F16 aggregate)
    async getJobProctoringStats(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id } = req.params;
            const data = await hireQualityService.getJobProctoringStats(id, recruiterId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}

export const hireQualityController = new HireQualityController();
