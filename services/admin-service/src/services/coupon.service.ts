import { PrismaClient, Coupon, DiscountType, CouponType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCouponData {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    applicableTo?: CouponType;
    maxUses?: number;
    expiryDate?: Date;
}

export class CouponService {
    async createCoupon(data: CreateCouponData): Promise<Coupon> {
        return prisma.coupon.create({
            data: {
                ...data,
                applicableTo: data.applicableTo || 'ALL',
            },
        });
    }

    async getCoupons(): Promise<Coupon[]> {
        return prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async getCouponById(id: string): Promise<Coupon | null> {
        return prisma.coupon.findUnique({
            where: { id },
            include: {
                usages: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async updateCoupon(id: string, data: Partial<CreateCouponData> & { isActive?: boolean }): Promise<Coupon> {
        return prisma.coupon.update({
            where: { id },
            data,
        });
    }

    async deleteCoupon(id: string): Promise<void> {
        await prisma.coupon.delete({
            where: { id },
        });
    }
}

export const couponService = new CouponService();
