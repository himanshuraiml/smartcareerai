import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { whatsappService } from '../services/whatsapp.service';
import { logger } from '../utils/logger';

export class NotificationController {
    /**
     * Get paginated notifications for the authenticated user
     */
    async getNotifications(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const unreadOnly = req.query.unread === 'true';

            const data = await notificationService.getUserNotifications(userId, { page, limit, unreadOnly });

            return res.status(200).json({
                success: true,
                data: data.items,
                pagination: data.pagination
            });
        } catch (error: any) {
            logger.error('Error in getNotifications controller:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get unread count
     */
    async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const count = await notificationService.getUnreadCount(userId);
            return res.status(200).json({ success: true, data: { unreadCount: count } });
        } catch (error: any) {
            logger.error('Error in getUnreadCount controller:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            await notificationService.markAsRead(userId, id);
            return res.status(200).json({ success: true, message: 'Notification marked as read' });
        } catch (error: any) {
            logger.error('Error in markAsRead controller:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            await notificationService.markAllAsRead(userId);
            return res.status(200).json({ success: true, message: 'All notifications marked as read' });
        } catch (error: any) {
            logger.error('Error in markAllAsRead controller:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get user preferences
     */
    async getPreferences(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const prefs = await notificationService.getPreferences(userId);
            return res.status(200).json({ success: true, data: prefs });
        } catch (error: any) {
            logger.error('Error in getPreferences controller:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update user preferences
     */
    async updatePreferences(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            await notificationService.updatePreferences(userId, req.body);
            return res.status(200).json({ success: true, message: 'Preferences updated successfully' });
        } catch (error: any) {
            logger.error('Error in updatePreferences controller:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Initiate WhatsApp opt-in (sends OTP)
     */
    async whatsappOptIn(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { phone } = req.body;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            if (!phone) {
                return res.status(400).json({ success: false, error: 'Phone number is required' });
            }

            const otp = await whatsappService.sendVerificationOtp(userId, phone);
            return res.status(200).json({
                success: true,
                message: 'OTP sent to your WhatsApp number',
                // Expose OTP in development/sandbox mode for testing, but in production we hide it.
                otp: process.env.NODE_ENV !== 'production' ? otp : undefined
            });
        } catch (error: any) {
            logger.error('Error in whatsappOptIn controller:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Verify WhatsApp OTP
     */
    async whatsappVerify(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { otp } = req.body;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            if (!otp) {
                return res.status(400).json({ success: false, error: 'OTP is required' });
            }

            const verified = await whatsappService.verifyOtp(userId, otp);

            if (!verified) {
                return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
            }

            return res.status(200).json({ success: true, message: 'WhatsApp verification successful and opt-in active.' });
        } catch (error: any) {
            logger.error('Error in whatsappVerify controller:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * WhatsApp Webhook callback
     */
    async whatsappWebhook(req: Request, res: Response) {
        try {
            // Verify Meta token if it is a GET verification challenge
            if (req.method === 'GET') {
                const mode = req.query['hub.mode'];
                const token = req.query['hub.verify_token'];
                const challenge = req.query['hub.challenge'];

                if (mode && token) {
                    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
                        logger.info('WhatsApp webhook verified successfully.');
                        return res.status(200).send(challenge);
                    }
                    return res.status(403).send('Forbidden');
                }
            }

            // Otherwise, process webhook payload (status, receipts, messages)
            await whatsappService.handleWebhook(req.body);
            return res.status(200).json({ success: true });
        } catch (error: any) {
            logger.error('Error in whatsappWebhook controller:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const notificationController = new NotificationController();
