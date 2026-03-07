import { Request, Response, NextFunction } from 'express';
import { meetingAnalyticsService } from '../services/meeting-analytics.service';

/**
 * GET /meeting-analysis/recruiter/dashboard
 * Returns aggregate meeting stats for the authenticated recruiter.
 */
export async function getRecruiterDashboard(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const dashboard = await meetingAnalyticsService.getRecruiterDashboard(userId);
        res.json({ success: true, data: dashboard });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /meeting-analysis/recruiter/candidates/compare
 * Returns all candidates interviewed by this recruiter, sorted by overall score.
 */
export async function getCandidateComparison(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const rows = await meetingAnalyticsService.getCandidateComparison(userId);
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /meeting-analysis/institution/dashboard
 * Returns aggregate analytics for all students in the admin's institution.
 */
export async function getInstitutionDashboard(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const dashboard = await meetingAnalyticsService.getInstitutionDashboard(userId);
        res.json({ success: true, data: dashboard });
    } catch (err) {
        next(err);
    }
}
