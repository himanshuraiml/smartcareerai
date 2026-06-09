import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const notificationRouter = Router();

// Retrieve all notifications (query: ?page=1&limit=20&unread=true)
notificationRouter.get('/', authMiddleware, (req, res) => notificationController.getNotifications(req, res));

// Retrieve unread counts for header notification badge
notificationRouter.get('/unread-count', authMiddleware, (req, res) => notificationController.getUnreadCount(req, res));

// Mark a single notification as read
notificationRouter.put('/:id/read', authMiddleware, (req, res) => notificationController.markAsRead(req, res));

// Mark all notifications as read
notificationRouter.put('/read-all', authMiddleware, (req, res) => notificationController.markAllAsRead(req, res));

// Retrieve notification channel and category preferences
notificationRouter.get('/preferences', authMiddleware, (req, res) => notificationController.getPreferences(req, res));

// Update notification preference settings
notificationRouter.put('/preferences', authMiddleware, (req, res) => notificationController.updatePreferences(req, res));

// Request opt-in code validation message on WhatsApp
notificationRouter.post('/whatsapp/opt-in', authMiddleware, (req, res) => notificationController.whatsappOptIn(req, res));

// Verify code and complete WhatsApp subscription
notificationRouter.post('/whatsapp/verify', authMiddleware, (req, res) => notificationController.whatsappVerify(req, res));

// Webhook endpoints for WhatsApp delivery logs and opt-outs
notificationRouter.all('/webhooks/whatsapp', (req, res) => notificationController.whatsappWebhook(req, res));
