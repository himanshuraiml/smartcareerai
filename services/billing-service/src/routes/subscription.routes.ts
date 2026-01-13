import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/plans', subscriptionController.getPlans);

// Protected routes
router.get('/', authMiddleware, subscriptionController.getSubscription);
router.post('/subscribe', authMiddleware, subscriptionController.subscribe);
router.post('/cancel', authMiddleware, subscriptionController.cancel);

export { router as subscriptionRouter };
