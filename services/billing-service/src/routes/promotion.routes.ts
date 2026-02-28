import { Router } from 'express';
import { promotionController } from '../controllers/promotion.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Validation endpoint to check if a coupon is valid before purchase
router.post('/validate-coupon', authMiddleware, promotionController.validateCoupon);

export { router as promotionRouter };
