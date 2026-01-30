import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

// Default credit pricing (fallback when not in database)
const DEFAULT_CREDIT_PRICES = {
    RESUME_REVIEW: 4900,    // ₹49 per credit (in paise)
    AI_INTERVIEW: 9900,     // ₹99 per credit
    SKILL_TEST: 2900,       // ₹29 per credit
};

const DEFAULT_CREDIT_BUNDLES = {
    RESUME_REVIEW: [
        { quantity: 5, price: 19900, savings: '20%' },
        { quantity: 10, price: 34900, savings: '30%' },
        { quantity: 25, price: 74900, savings: '40%' },
    ],
    AI_INTERVIEW: [
        { quantity: 5, price: 39900, savings: '20%' },
        { quantity: 10, price: 69900, savings: '30%' },
        { quantity: 25, price: 149900, savings: '40%' },
    ],
    SKILL_TEST: [
        { quantity: 10, price: 24900, savings: '15%' },
        { quantity: 25, price: 54900, savings: '25%' },
        { quantity: 50, price: 99900, savings: '35%' },
    ],
};

export class BillingController {
    /**
     * Get billing settings (toggles)
     */
    async getBillingSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const settings = await prisma.systemSettings.findMany({
                where: {
                    settingKey: {
                        in: ['billing_enabled', 'subscription_enabled', 'credit_pricing_enabled']
                    }
                }
            });

            const settingsMap: Record<string, any> = {
                billing_enabled: true,
                subscription_enabled: true,
                credit_pricing_enabled: true
            };

            settings.forEach(s => {
                settingsMap[s.settingKey] = s.settingValue;
            });

            res.json({
                success: true,
                data: settingsMap
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update billing settings (toggles)
     */
    async updateBillingSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const { billing_enabled, subscription_enabled, credit_pricing_enabled } = req.body;

            const updates: Promise<any>[] = [];

            if (billing_enabled !== undefined) {
                updates.push(
                    prisma.systemSettings.upsert({
                        where: { settingKey: 'billing_enabled' },
                        create: { settingKey: 'billing_enabled', settingValue: billing_enabled },
                        update: { settingValue: billing_enabled }
                    })
                );
            }

            if (subscription_enabled !== undefined) {
                updates.push(
                    prisma.systemSettings.upsert({
                        where: { settingKey: 'subscription_enabled' },
                        create: { settingKey: 'subscription_enabled', settingValue: subscription_enabled },
                        update: { settingValue: subscription_enabled }
                    })
                );
            }

            if (credit_pricing_enabled !== undefined) {
                updates.push(
                    prisma.systemSettings.upsert({
                        where: { settingKey: 'credit_pricing_enabled' },
                        create: { settingKey: 'credit_pricing_enabled', settingValue: credit_pricing_enabled },
                        update: { settingValue: credit_pricing_enabled }
                    })
                );
            }

            await Promise.all(updates);

            logger.info('Billing settings updated', { billing_enabled, subscription_enabled, credit_pricing_enabled });

            res.json({
                success: true,
                message: 'Billing settings updated'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all subscription plans with subscriber counts
     */
    async getSubscriptionPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const plans = await prisma.subscriptionPlan.findMany({
                include: {
                    _count: {
                        select: { subscriptions: true }
                    }
                },
                orderBy: { sortOrder: 'asc' }
            });

            res.json({
                success: true,
                data: plans
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new subscription plan
     */
    async createSubscriptionPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                name,
                displayName,
                priceMonthly,
                priceYearly,
                features,
                razorpayPlanId,
                isActive,
                sortOrder
            } = req.body;

            // Check if plan name already exists
            const existing = await prisma.subscriptionPlan.findUnique({ where: { name } });
            if (existing) {
                throw new AppError('Plan with this name already exists', 400);
            }

            const plan = await prisma.subscriptionPlan.create({
                data: {
                    name,
                    displayName,
                    priceMonthly: priceMonthly || 0,
                    priceYearly: priceYearly || 0,
                    features: features || {},
                    razorpayPlanId: razorpayPlanId || null,
                    isActive: isActive !== undefined ? isActive : true,
                    sortOrder: sortOrder || 0
                }
            });

            logger.info(`Subscription plan created: ${plan.name}`);

            res.status(201).json({
                success: true,
                data: plan
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a subscription plan
     */
    async updateSubscriptionPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const {
                name,
                displayName,
                priceMonthly,
                priceYearly,
                features,
                razorpayPlanId,
                isActive,
                sortOrder
            } = req.body;

            const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
            if (!plan) {
                throw new AppError('Subscription plan not found', 404);
            }

            // If changing name, check it doesn't conflict
            if (name && name !== plan.name) {
                const existing = await prisma.subscriptionPlan.findUnique({ where: { name } });
                if (existing) {
                    throw new AppError('Plan with this name already exists', 400);
                }
            }

            const updated = await prisma.subscriptionPlan.update({
                where: { id },
                data: {
                    name,
                    displayName,
                    priceMonthly,
                    priceYearly,
                    features,
                    razorpayPlanId,
                    isActive,
                    sortOrder
                }
            });

            logger.info(`Subscription plan updated: ${updated.name}`);

            res.json({
                success: true,
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a subscription plan
     */
    async deleteSubscriptionPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const plan = await prisma.subscriptionPlan.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { subscriptions: true }
                    }
                }
            });

            if (!plan) {
                throw new AppError('Subscription plan not found', 404);
            }

            // Check for active subscribers
            if (plan._count.subscriptions > 0) {
                throw new AppError(
                    `Cannot delete plan with ${plan._count.subscriptions} active subscribers. Deactivate it instead.`,
                    400
                );
            }

            await prisma.subscriptionPlan.delete({ where: { id } });

            logger.info(`Subscription plan deleted: ${plan.name}`);

            res.json({
                success: true,
                message: 'Plan deleted'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get credit pricing configuration
     */
    async getCreditPricing(req: Request, res: Response, next: NextFunction) {
        try {
            const settings = await prisma.systemSettings.findMany({
                where: {
                    settingKey: { in: ['credit_prices', 'credit_bundles'] }
                }
            });

            const creditPrices = settings.find(s => s.settingKey === 'credit_prices');
            const creditBundles = settings.find(s => s.settingKey === 'credit_bundles');

            res.json({
                success: true,
                data: {
                    perCredit: creditPrices?.settingValue || DEFAULT_CREDIT_PRICES,
                    bundles: creditBundles?.settingValue || DEFAULT_CREDIT_BUNDLES
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update credit pricing configuration
     */
    async updateCreditPricing(req: Request, res: Response, next: NextFunction) {
        try {
            const { perCredit, bundles } = req.body;

            const updates: Promise<any>[] = [];

            if (perCredit) {
                updates.push(
                    prisma.systemSettings.upsert({
                        where: { settingKey: 'credit_prices' },
                        create: { settingKey: 'credit_prices', settingValue: perCredit },
                        update: { settingValue: perCredit }
                    })
                );
            }

            if (bundles) {
                updates.push(
                    prisma.systemSettings.upsert({
                        where: { settingKey: 'credit_bundles' },
                        create: { settingKey: 'credit_bundles', settingValue: bundles },
                        update: { settingValue: bundles }
                    })
                );
            }

            await Promise.all(updates);

            logger.info('Credit pricing updated');

            res.json({
                success: true,
                message: 'Credit pricing updated'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get billing statistics
     */
    async getBillingStats(req: Request, res: Response, next: NextFunction) {
        try {
            const [
                totalSubscriptions,
                activeSubscriptions,
                subscriptionsByPlan,
                recentTransactions,
                totalRevenue
            ] = await Promise.all([
                prisma.userSubscription.count(),
                prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
                prisma.userSubscription.groupBy({
                    by: ['planId'],
                    _count: { id: true },
                    where: { status: 'ACTIVE' }
                }),
                prisma.creditTransaction.findMany({
                    where: { transactionType: 'PURCHASE' },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        user: {
                            select: { email: true, name: true }
                        }
                    }
                }),
                prisma.creditTransaction.aggregate({
                    where: { transactionType: 'PURCHASE' },
                    _sum: { amount: true }
                })
            ]);

            // Get plan names for subscription distribution
            const planIds = subscriptionsByPlan.map(s => s.planId);
            const plans = await prisma.subscriptionPlan.findMany({
                where: { id: { in: planIds } },
                select: { id: true, name: true, displayName: true }
            });

            const planMap = new Map(plans.map(p => [p.id, p]));

            res.json({
                success: true,
                data: {
                    totalSubscriptions,
                    activeSubscriptions,
                    subscriptionsByPlan: subscriptionsByPlan.map(s => ({
                        planId: s.planId,
                        planName: planMap.get(s.planId)?.displayName || 'Unknown',
                        count: s._count.id
                    })),
                    recentTransactions,
                    totalCreditsPurchased: totalRevenue._sum.amount || 0
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

export const billingController = new BillingController();
