import { Router } from 'express';
import { creditController } from '../controllers/credit.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/pricing', creditController.getPricing);

// Protected routes
router.get('/balances', authMiddleware, creditController.getBalances);
router.get('/history', authMiddleware, creditController.getHistory);
router.get('/check', authMiddleware, creditController.checkCredits);
router.post('/order', authMiddleware, creditController.createOrder);
router.post('/confirm', authMiddleware, creditController.confirmPurchase);
router.post('/consume', authMiddleware, creditController.consume);

export { router as creditRouter };
