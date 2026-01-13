import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from '../services/application.service';
import { logger } from '../utils/logger';

const applicationService = new ApplicationService();

export class ApplicationController {
    async getApplications(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { status } = req.query;

            const applications = await applicationService.getApplications(
                userId,
                status as string
            );

            res.json({ success: true, data: applications });
        } catch (error) {
            next(error);
        }
    }

    async getApplicationById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const application = await applicationService.getApplicationById(userId, id);
            res.json({ success: true, data: application });
        } catch (error) {
            next(error);
        }
    }

    async createApplication(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const application = await applicationService.createApplication(userId, req.body);

            logger.info(`Application created for user ${userId}`);
            res.status(201).json({ success: true, data: application });
        } catch (error) {
            next(error);
        }
    }

    async updateApplication(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const application = await applicationService.updateApplication(userId, id, req.body);
            res.json({ success: true, data: application });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const { status, notes } = req.body;

            const application = await applicationService.updateStatus(userId, id, status, notes);

            logger.info(`Application ${id} status updated to ${status}`);
            res.json({ success: true, data: application });
        } catch (error) {
            next(error);
        }
    }

    async deleteApplication(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await applicationService.deleteApplication(userId, id);
            res.json({ success: true, message: 'Application deleted' });
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const stats = await applicationService.getStats(userId);
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    async getTimeline(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const timeline = await applicationService.getTimeline(userId, id);
            res.json({ success: true, data: timeline });
        } catch (error) {
            next(error);
        }
    }
}
