import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { logger } from '../utils/logger';

export class SubscriptionController {
    /**
     * Get all available subscription plans
     */
    async getPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const plans = await subscriptionService.getPlans();

            res.json({
                success: true,
                data: plans.map(plan => ({
                    id: plan.id,
                    name: plan.name,
                    displayName: plan.displayName,
                    priceMonthly: Number(plan.priceMonthly),
                    priceYearly: Number(plan.priceYearly),
                    features: plan.features,
                })),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user's subscription
     */
    async getSubscription(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const subscription = await subscriptionService.getUserSubscription(userId);

            res.json({
                success: true,
                data: subscription ? {
                    id: subscription.id,
                    status: subscription.status,
                    plan: {
                        name: subscription.plan.name,
                        displayName: subscription.plan.displayName,
                        features: subscription.plan.features,
                    },
                    currentPeriodStart: subscription.currentPeriodStart,
                    currentPeriodEnd: subscription.currentPeriodEnd,
                    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                } : null,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Subscribe to a plan
     */
    async subscribe(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { planName, billingCycle, contact } = req.body;

            const result = await subscriptionService.createSubscription({
                userId,
                planName,
                billingCycle: billingCycle || 'monthly',
                userEmail: req.user!.email,
                userName: req.user!.email.split('@')[0], // Use email prefix as name
                userContact: contact,
            });

            res.status(201).json({
                success: true,
                data: {
                    subscription: {
                        id: result.subscription.id,
                        status: result.subscription.status,
                        plan: result.subscription.plan,
                    },
                    razorpaySubscriptionId: result.razorpaySubscriptionId,
                    paymentUrl: result.shortUrl, // Razorpay hosted payment page
                },
                message: result.shortUrl
                    ? 'Subscription created. Complete payment to activate.'
                    : 'Free subscription activated.',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancel subscription
     */
    async cancel(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { immediate } = req.body;

            const subscription = await subscriptionService.cancelSubscription(userId, immediate);

            res.json({
                success: true,
                data: subscription,
                message: immediate
                    ? 'Subscription cancelled immediately.'
                    : 'Subscription will be cancelled at the end of the billing period.',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const subscriptionController = new SubscriptionController();
