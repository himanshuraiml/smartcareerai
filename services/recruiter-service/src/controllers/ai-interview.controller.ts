import { Request, Response, NextFunction } from 'express';
import { aiInterviewService, AIInterviewConfig, ScoringWeights } from '../services/ai-interview.service';

export class AIInterviewController {

    // POST /recruiter/jobs/:id/ai-interview/config
    async generateConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const jobId = req.params.id;

            const {
                enabled = true,
                questionCount = 5,
                interviewType = 'TECHNICAL',
                difficulty = 'MEDIUM',
                timeLimitMinutes = 3,
                customInstructions,
            } = req.body;

            const config = await aiInterviewService.generateAndSaveConfig(jobId, recruiterId, {
                enabled,
                questionCount: Math.min(10, Math.max(3, questionCount)),
                interviewType,
                difficulty,
                timeLimitMinutes,
                customInstructions,
            });

            res.status(201).json({
                success: true,
                data: config,
                message: `Generated ${config.questions?.length || 0} AI interview questions`,
            });
        } catch (err) {
            next(err);
        }
    }

    // GET /recruiter/jobs/:id/ai-interview/config
    async getConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const config = await aiInterviewService.getConfig(req.params.id, recruiterId);
            res.json({ success: true, data: config });
        } catch (err) {
            next(err);
        }
    }

    // POST /recruiter/jobs/:id/ai-interview/evaluate/:applicationId
    async evaluate(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id: jobId, applicationId } = req.params;
            const { submissions, scoringWeights } = req.body;

            if (!Array.isArray(submissions) || submissions.length === 0) {
                res.status(400).json({ success: false, message: 'submissions array is required' });
                return;
            }

            const result = await aiInterviewService.evaluateCandidate(
                jobId,
                recruiterId,
                applicationId,
                submissions,
                scoringWeights as ScoringWeights | undefined
            );

            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    // GET /recruiter/jobs/:id/ai-interview/analytics
    async getAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const analytics = await aiInterviewService.getJobAnalytics(req.params.id, recruiterId);
            res.json({ success: true, data: analytics });
        } catch (err) {
            next(err);
        }
    }
}

export const aiInterviewController = new AIInterviewController();
