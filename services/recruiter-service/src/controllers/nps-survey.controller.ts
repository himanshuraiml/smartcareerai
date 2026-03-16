import { Request, Response, NextFunction } from 'express';
import { npsSurveyService } from '../services/nps-survey.service';

export class NpsSurveyController {
    /** POST /applications/:id/survey — recruiter sends survey link to candidate */
    async sendSurvey(req: Request, res: Response, next: NextFunction) {
        try {
            const url = await npsSurveyService.generateSurveyToken(req.params.id, req.recruiter!.id);
            res.json({ success: true, data: { surveyUrl: url } });
        } catch (err) {
            next(err);
        }
    }

    /** GET /public/surveys/:token — validate token (public) */
    async validateToken(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await npsSurveyService.validateToken(req.params.token);
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    /** POST /public/surveys/:token — submit survey (public) */
    async submitSurvey(req: Request, res: Response, next: NextFunction) {
        try {
            const { npsScore, ease, feedback } = req.body;
            if (typeof npsScore !== 'number') {
                return res.status(400).json({ success: false, error: { message: 'npsScore is required (number 1-10)' } });
            }
            const survey = await npsSurveyService.submitSurvey(req.params.token, npsScore, ease || '', feedback || '');
            res.json({ success: true, data: { submitted: true, npsScore: survey.npsScore } });
        } catch (err) {
            next(err);
        }
    }

    /** GET /jobs/:id/surveys — get NPS data for a job */
    async getJobNPS(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await npsSurveyService.getJobNPS(req.params.id, req.recruiter!.id);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }
}

export const npsSurveyController = new NpsSurveyController();
