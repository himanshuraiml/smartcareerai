import { Request, Response, NextFunction } from 'express';
import { notificationService, NotificationChannel, BroadcastOptions } from '../services/notification.service';
import { logger } from '../utils/logger';

class BroadcastController {
    /**
     * Send professional communication to a group of users (Phase 2 Broadcast)
     */
    async broadcast(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = (req as any).user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized or not an institution admin');

            const { title, message, targetGroup, channels, ctaText, ctaLink, metadata } = req.body;

            const options: BroadcastOptions = {
                institutionId,
                title,
                message,
                targetGroup: targetGroup || 'ALL',
                channels: channels || [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                ctaText,
                ctaLink,
                metadata
            };

            const result = await notificationService.broadcast(options);

            logger.info(`Broadcast executed for ${institutionId} to ${targetGroup || 'ALL'}`);
            res.json({ success: true, data: result });
        } catch (error) {
            logger.error('Error broadcasting notification', error);
            next(error);
        }
    }

    /**
     * Get recent notifications history for institution
     */
    async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = (req as any).user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');
            const history = await notificationService.getInstitutionNotifications(institutionId);
            res.json({ success: true, data: history });
        } catch (error) {
            next(error);
        }
    }
}

export const broadcastController = new BroadcastController();
