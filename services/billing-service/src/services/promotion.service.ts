import { prisma } from '../utils/prisma';
import { Coupon, DiscountType, CouponType } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class PromotionService {
    /**
     * Validate a coupon code for a specific user and purchase type
     */
    async validateCoupon(code: string, userId: string, type: CouponType): Promise<Coupon> {
        const coupon = await prisma.coupon.findUnique({
            where: { code },
        });

        if (!coupon) {
            throw createError('Invalid coupon code', 404, 'INVALID_COUPON');
        }

        if (!coupon.isActive) {
            throw createError('This coupon is no longer active', 400, 'COUPON_INACTIVE');
        }

        if (coupon.expiryDate && new Date() > coupon.expiryDate) {
            throw createError('This coupon has expired', 400, 'COUPON_EXPIRED');
        }

        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            throw createError('This coupon has reached its maximum usage limit', 400, 'COUPON_LIMIT_REACHED');
        }

        if (coupon.applicableTo !== 'ALL' && coupon.applicableTo !== type) {
            throw createError(`This coupon is only applicable to ${coupon.applicableTo.toLowerCase()} purchases`, 400, 'COUPON_TYPE_MISMATCH');
        }

        // Check if user has already used this coupon (optional, usually coupons are one-time per user)
        const usage = await prisma.couponUsage.findFirst({
            where: {
                couponId: coupon.id,
                userId: userId,
            },
        });

        if (usage) {
            throw createError('You have already used this coupon code', 400, 'COUPON_ALREADY_USED');
        }

        return coupon;
    }

    /**
     * Calculate discount amount
     */
    calculateDiscount(originalAmount: number, coupon: Coupon): number {
        if (coupon.discountType === 'PERCENTAGE') {
            return Math.floor(originalAmount * (coupon.discountValue / 100));
        } else {
            // FIXED_AMOUNT (assuming value is in currency units, e.g., INR)
            // Convert to paise if originalAmount is in paise
            const discountInPaise = coupon.discountValue * 100;
            return Math.min(discountInPaise, originalAmount);
        }
    }

    /**
     * Record coupon usage
     */
    async recordUsage(couponId: string, userId: string) {
        return prisma.$transaction(async (tx) => {
            // Increment usedCount
            await tx.coupon.update({
                where: { id: couponId },
                data: { usedCount: { increment: 1 } },
            });

            // Create usage record
            return tx.couponUsage.create({
                data: {
                    couponId,
                    userId,
                },
            });
        });
    }
}

export const promotionService = new PromotionService();
