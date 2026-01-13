import { Request, Response, NextFunction } from 'express';
import { ResumeService } from '../services/resume.service';
import { logger } from '../utils/logger';

const resumeService = new ResumeService();

export class ResumeController {
    async upload(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'No file uploaded' },
                });
            }

            const resume = await resumeService.uploadResume(userId, file);

            logger.info(`Resume uploaded: ${resume.id} by user ${userId}`);
            res.status(201).json({
                success: true,
                data: resume,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const resumes = await resumeService.getResumesByUser(userId);

            res.json({
                success: true,
                data: resumes,
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const resume = await resumeService.getResumeById(id, userId);

            res.json({
                success: true,
                data: resume,
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await resumeService.deleteResume(id, userId);

            logger.info(`Resume deleted: ${id} by user ${userId}`);
            res.json({
                success: true,
                message: 'Resume deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async parse(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const resume = await resumeService.parseResume(id, userId);

            logger.info(`Resume parsed: ${id}`);
            res.json({
                success: true,
                data: resume,
            });
        } catch (error) {
            next(error);
        }
    }
}
