import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const emailController = new EmailController();

// OAuth routes
router.get('/oauth/url', authMiddleware, emailController.getOAuthUrl);
router.get('/oauth/callback', emailController.handleOAuthCallback);

// Email connection status
router.get('/connection', authMiddleware, emailController.getConnectionStatus);
router.delete('/connection', authMiddleware, emailController.disconnectEmail);

// Tracked emails
router.get('/tracked', authMiddleware, emailController.getTrackedEmails);
router.get('/tracked/:id', authMiddleware, emailController.getTrackedEmailById);

// Manual sync trigger
router.post('/sync', authMiddleware, emailController.triggerSync);

export { router as emailRoutes };
