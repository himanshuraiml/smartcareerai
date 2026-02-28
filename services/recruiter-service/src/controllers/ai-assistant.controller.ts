import { Request, Response, NextFunction } from 'express';
import { aiAssistantService } from '../services/ai-assistant.service';

export class AIAssistantController {

    // POST /recruiter/ai-assistant/generate-jd
    async generateJobDescription(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { title, keywords } = req.body;

            if (!title || !Array.isArray(keywords) || keywords.length === 0) {
                return res.status(400).json({ success: false, message: 'Valid title and keywords array are required' });
            }

            const result = await aiAssistantService.generateJobDescription(title, keywords, recruiterId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // POST /recruiter/ai-assistant/salary-band
    async suggestSalaryBand(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, location, experienceLevel } = req.body;

            if (!title) {
                return res.status(400).json({ success: false, message: 'Job title is required' });
            }

            const result = await aiAssistantService.suggestSalaryBand(title, location, experienceLevel);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/jobs/:id/ai-assistant/suggest-questions
    async suggestInterviewQuestions(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id } = req.params;
            const count = parseInt(req.query.count as string) || 5;

            const questions = await aiAssistantService.suggestInterviewQuestions(id, recruiterId, count);
            res.json({ success: true, data: questions });
        } catch (error) {
            next(error);
        }
    }

    // POST /recruiter/applications/:id/ai-assistant/summary
    async generateCandidateSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id } = req.params;

            const result = await aiAssistantService.generateCandidateSummary(id, recruiterId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // POST /recruiter/applications/:id/ai-assistant/shortlist-justification
    async generateShortlistJustification(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id } = req.params;

            const result = await aiAssistantService.generateShortlistJustification(id, recruiterId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const aiAssistantController = new AIAssistantController();
