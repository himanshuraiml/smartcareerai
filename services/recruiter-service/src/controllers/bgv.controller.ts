import { Request, Response, NextFunction } from 'express';
import { bgvService } from '../services/bgv.service';

export class BgvController {
    // POST /recruiter/applications/:id/bgv/initiate
    async initiate(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const userId = req.user!.id;
            const { id: applicationId } = req.params;

            const result = await bgvService.initiate(applicationId, recruiterId, userId);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/applications/:id/bgv/status
    async getStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id: applicationId } = req.params;

            const result = await bgvService.getStatus(applicationId, recruiterId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // POST /recruiter/webhooks/bgv  (public — no auth, validated by provider secret)
    async handleWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            // Optional: verify HMAC signature from provider
            // const signature = req.headers['x-bgv-signature'];
            const result = await bgvService.handleWebhook(req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const bgvController = new BgvController();
