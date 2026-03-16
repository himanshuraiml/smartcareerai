import { Request, Response, NextFunction } from 'express';
import { pushNotificationService } from '../services/push-notification.service';

export class PushNotificationController {

    // POST /recruiter/push-subscription
    async subscribe(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { endpoint, keys } = req.body;

            if (!endpoint || !keys?.p256dh || !keys?.auth) {
                return res.status(400).json({ success: false, message: 'endpoint and keys (p256dh, auth) are required' });
            }

            const result = await pushNotificationService.subscribe(userId, { endpoint, keys });
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // DELETE /recruiter/push-subscription
    async unsubscribe(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { endpoint } = req.body;

            if (!endpoint) {
                return res.status(400).json({ success: false, message: 'endpoint is required' });
            }

            await pushNotificationService.unsubscribe(userId, endpoint);
            res.json({ success: true, message: 'Unsubscribed from push notifications' });
        } catch (error) {
            next(error);
        }
    }
}

export const pushNotificationController = new PushNotificationController();
