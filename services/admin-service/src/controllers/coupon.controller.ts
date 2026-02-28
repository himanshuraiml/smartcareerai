import { Request, Response, NextFunction } from 'express';
import { couponService } from '../services/coupon.service';
import { logger } from '../utils/logger';

export class CouponController {
    async createCoupon(req: Request, res: Response, next: NextFunction) {
        try {
            const coupon = await couponService.createCoupon(req.body);
            logger.info(`Admin created coupon: ${coupon.code}`);
            res.status(201).json({ success: true, data: coupon });
        } catch (error) {
            next(error);
        }
    }

    async getCoupons(req: Request, res: Response, next: NextFunction) {
        try {
            const coupons = await couponService.getCoupons();
            res.json({ success: true, data: coupons });
        } catch (error) {
            next(error);
        }
    }

    async getCouponById(req: Request, res: Response, next: NextFunction) {
        try {
            const coupon = await couponService.getCouponById(req.params.id);
            if (!coupon) {
                return res.status(404).json({ success: false, message: 'Coupon not found' });
            }
            res.json({ success: true, data: coupon });
        } catch (error) {
            next(error);
        }
    }

    async updateCoupon(req: Request, res: Response, next: NextFunction) {
        try {
            const coupon = await couponService.updateCoupon(req.params.id, req.body);
            logger.info(`Admin updated coupon: ${req.params.id}`);
            res.json({ success: true, data: coupon });
        } catch (error) {
            next(error);
        }
    }

    async deleteCoupon(req: Request, res: Response, next: NextFunction) {
        try {
            await couponService.deleteCoupon(req.params.id);
            logger.info(`Admin deleted coupon: ${req.params.id}`);
            res.json({ success: true, message: 'Coupon deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export const couponController = new CouponController();
