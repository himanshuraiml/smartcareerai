import { Request, Response, NextFunction } from 'express';
import { BuilderService } from '../services/builder.service';

const builderService = new BuilderService();

export class BuilderController {
    async getTemplates(_req: Request, res: Response, next: NextFunction) {
        try {
            const templates = await builderService.getTemplates();
            res.json({
                success: true,
                data: templates,
            });
        } catch (error) {
            next(error);
        }
    }

    async optimize(req: Request, res: Response, next: NextFunction) {
        try {
            const { sectionType, content, targetRole } = req.body;
            if (!sectionType || !content || !targetRole) {
                res.status(400).json({ error: 'Missing analyzing parameters' });
                return;
            }

            const optimizedContent = await builderService.optimizeResumeContent(
                sectionType,
                content,
                targetRole
            );

            res.json({
                success: true,
                data: { optimizedContent },
            });
        } catch (error) {
            next(error);
        }
    }

    async generateBullets(req: Request, res: Response, next: NextFunction) {
        try {
            const { role, responsibilities } = req.body;
            if (!role || !responsibilities) {
                res.status(400).json({ error: 'Missing generation parameters' });
                return;
            }

            const bullets = await builderService.generateBullets(role, responsibilities);

            res.json({
                success: true,
                data: { bullets },
            });
        } catch (error) {
            next(error);
        }
    }

    async tailor(req: Request, res: Response, next: NextFunction) {
        try {
            const { resumeContent, jobDescription } = req.body;
            if (!resumeContent || !jobDescription) {
                res.status(400).json({ error: 'Missing tailoring parameters' });
                return;
            }

            const result = await builderService.tailorResume(resumeContent, jobDescription);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
