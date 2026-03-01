import { Router } from 'express';
import { engagementController } from '../controllers/engagement.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All engagement routes are authenticated
router.post('/daily-login', authMiddleware, engagementController.processDailyLogin);
router.get('/stats', authMiddleware, engagementController.getStats);

export { router as engagementRouter };
