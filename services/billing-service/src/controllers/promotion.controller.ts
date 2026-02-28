import { Request, Response, NextFunction } from 'express';
import { promotionService } from '../services/promotion.service';
import { CouponType } from '@prisma/client';

export class PromotionController {
    async validateCoupon(req: Request, res: Response, next: NextFunction) {
        try {
            const { code, type } = req.body;
            const userId = (req as any).user?.id; // Assuming auth middleware attaches user

            if (!code || !type) {
                return res.status(400).json({ success: false, message: 'Code and type are required' });
            }

            const coupon = await promotionService.validateCoupon(code, userId, type as CouponType);

            res.json({
                success: true,
                data: {
                    id: coupon.id,
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    applicableTo: coupon.applicableTo,
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

export const promotionController = new PromotionController();
