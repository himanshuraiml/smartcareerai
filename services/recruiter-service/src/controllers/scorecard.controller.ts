import { Request, Response, NextFunction } from 'express';
import { scorecardService } from '../services/scorecard.service';

export class ScorecardController {
    // POST /recruiter/applications/:id/interviewers
    async assignInterviewers(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id: applicationId } = req.params;
            const { interviewerIds, stageName } = req.body;

            if (!Array.isArray(interviewerIds) || interviewerIds.length === 0) {
                return res.status(400).json({ success: false, message: 'interviewerIds array is required' });
            }
            if (!stageName) {
                return res.status(400).json({ success: false, message: 'stageName is required' });
            }

            const result = await scorecardService.assignInterviewers(applicationId, interviewerIds, stageName, recruiterId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/applications/:id/scorecards
    async getScorecards(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id: applicationId } = req.params;

            const result = await scorecardService.getApplicationScorecards(applicationId, recruiterId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // POST /recruiter/applications/:id/scorecards  (interviewer submits)
    async submitScorecard(req: Request, res: Response, next: NextFunction) {
        try {
            const interviewerId = req.user!.id;
            const { id: applicationId } = req.params;
            const { dimensions, notes, recommendation } = req.body;

            const result = await scorecardService.submitScorecard(
                applicationId,
                interviewerId,
                dimensions,
                notes,
                recommendation,
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/scorecards/pending  (interviewer sees their queue)
    async getPending(req: Request, res: Response, next: NextFunction) {
        try {
            const interviewerId = req.user!.id;
            const result = await scorecardService.getPendingScorecards(interviewerId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const scorecardController = new ScorecardController();
