import { Request, Response, NextFunction } from 'express';
import { AssessmentService } from '../services/assessment.service';

const assessmentService = new AssessmentService();

export class AssessmentController {
    // Questions
    async createQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const question = await assessmentService.createQuestion(req.body);
            res.status(201).json({ success: true, data: question });
        } catch (error) {
            next(error);
        }
    }

    async getQuestions(req: Request, res: Response, next: NextFunction) {
        try {
            const questions = await assessmentService.getQuestions(req.query);
            res.json({ success: true, data: questions });
        } catch (error) {
            next(error);
        }
    }

    async updateQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const question = await assessmentService.updateQuestion(id, req.body);
            res.json({ success: true, data: question });
        } catch (error) {
            next(error);
        }
    }

    async deleteQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await assessmentService.deleteQuestion(id);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // Templates
    async createTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { jobId } = req.params;
            const template = await assessmentService.createTemplate(jobId, req.body);
            res.json({ success: true, data: template });
        } catch (error) {
            next(error);
        }
    }

    async deleteTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await assessmentService.deleteTemplate(id);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAttemptsByJob(req: Request, res: Response, next: NextFunction) {
        try {
            const { jobId } = req.params;
            const attempts = await assessmentService.getAttemptsByJob(jobId);
            res.json({ success: true, data: attempts });
        } catch (error) {
            next(error);
        }
    }

    async getMyAttempts(req: Request, res: Response, next: NextFunction) {
        try {
            const studentId = (req as any).user.id;
            const attempts = await assessmentService.getMyAttempts(studentId);
            res.json({ success: true, data: attempts });
        } catch (error) {
            next(error);
        }
    }

    async getAvailableAssessments(req: Request, res: Response, next: NextFunction) {
        try {
            const studentId = (req as any).user.id;
            const available = await assessmentService.getAvailableAssessments(studentId);
            res.json({ success: true, data: available });
        } catch (error) {
            next(error);
        }
    }

    async getAttemptById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const studentId = (req as any).user.id;
            const attempt = await assessmentService.getAttemptById(id, studentId);
            res.json({ success: true, data: attempt });
        } catch (error) {
            next(error);
        }
    }

    // Attempts
    async startAttempt(req: Request, res: Response, next: NextFunction) {
        try {
            const { templateId } = req.body;
            const studentId = (req as any).user.id;
            const attempt = await assessmentService.startAttempt(studentId, templateId);
            res.status(201).json({ success: true, data: attempt });
        } catch (error) {
            next(error);
        }
    }

    async logEvent(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const event = await assessmentService.logProctoringEvent(id, req.body);
            res.json({ success: true, data: event });
        } catch (error) {
            next(error);
        }
    }

    // F16: snapshot endpoint
    async addSnapshot(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const studentId = (req as any).user.id;
            const { timestamp, imageData } = req.body;
            const result = await assessmentService.addSnapshot(id, studentId, {
                timestamp: timestamp || new Date().toISOString(),
                imageData,
            });
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // F16: Flag/unflag attempt for recruiter review
    async flagAttempt(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { flagged, reason } = req.body;
            const result = await assessmentService.flagAttempt(id, Boolean(flagged), reason);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async submitAttempt(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { answers } = req.body;
            const result = await assessmentService.submitAttempt(id, answers);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}
