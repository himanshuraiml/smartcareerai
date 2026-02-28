import { razorpayService } from './razorpay.service';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';
import { prisma } from '../utils/prisma';
import { promotionService } from './promotion.service';

export interface CreateSubscriptionInput {
    userId: string;
    planName: string;
    billingCycle?: 'monthly' | 'yearly'; // Defaults to monthly
    userEmail: string;
    userName: string;
    userContact?: string;
    couponCode?: string;
}

export class SubscriptionService {
    /**
     * Get all active subscription plans
     */
    async getPlans() {
        return prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    /**
     * Get a plan by name
     */
    async getPlanByName(name: string) {
        return prisma.subscriptionPlan.findUnique({
            where: { name },
        });
    }

    /**
     * Get user's current subscription
     */
    async getUserSubscription(userId: string) {
        return prisma.userSubscription.findUnique({
            where: { userId },
            include: { plan: true },
        });
    }

    /**
     * Create a new subscription
     */
    async createSubscription(input: CreateSubscriptionInput) {
        const { userId, planName, billingCycle = 'monthly', userEmail, userName, userContact, couponCode } = input;

        // Check for existing subscription
        const existingSubscription = await this.getUserSubscription(userId);

        // Handle existing active subscriptions
        if (existingSubscription && existingSubscription.status === 'ACTIVE') {
            const currentPlanName = existingSubscription.plan.name;
            const isCurrentlyOnFreePlan = currentPlanName === 'free';
            const isTargetFreePlan = planName === 'free';

            // Case 1: Already subscribed to the same plan
            if (currentPlanName === planName) {
                throw createError('You are already subscribed to this plan', 400, 'ALREADY_SUBSCRIBED');
            }

            // Case 2: On a paid plan trying to switch to another plan (upgrade/downgrade)
            // They need to cancel their current subscription first
            if (!isCurrentlyOnFreePlan && !isTargetFreePlan) {
                throw createError('Please cancel your current subscription before switching plans', 400, 'SUBSCRIPTION_EXISTS');
            }

            // Case 3: On a paid plan trying to downgrade to free - need to cancel first
            if (!isCurrentlyOnFreePlan && isTargetFreePlan) {
                throw createError('Please cancel your current subscription to downgrade to free plan', 400, 'CANCEL_REQUIRED');
            }

            // Case 4: On free plan upgrading to paid - this is allowed, continue
            // (This is implicitly handled by not throwing an error)
        }

        // Get the plan
        const plan = await this.getPlanByName(planName);
        if (!plan) {
            throw createError('Plan not found', 404, 'PLAN_NOT_FOUND');
        }

        // Handle free plan
        if (plan.name === 'free') {
            return this.createFreeSubscription(userId, plan.id);
        }

        // Get the correct Razorpay plan ID based on billing cycle
        const razorpayPlanId = billingCycle === 'yearly'
            ? plan.razorpayPlanIdYearly
            : plan.razorpayPlanId;

        // Check if plan has Razorpay plan ID for the selected billing cycle
        if (!razorpayPlanId) {
            throw createError(
                `Plan not configured for ${billingCycle} payments. Please configure Razorpay ${billingCycle} plan ID.`,
                400,
                'PLAN_NOT_CONFIGURED'
            );
        }

        // Apply coupon if provided
        let appliedCouponId: string | undefined;
        if (couponCode) {
            const coupon = await promotionService.validateCoupon(couponCode, userId, 'SUBSCRIPTION');
            // For subscriptions, Razorpay doesn't easily allow ad-hoc discounts on standard plans
            // without creating a new plan or using addons. 
            // For MVP, we'll validate the coupon and record that it was applied. 
            // In a real scenario, you'd use Razorpay "Offer" or "Addon" with negative amount.
            appliedCouponId = coupon.id;
            logger.info(`Coupon ${couponCode} validated for subscription of user ${userId}`);
        }

        // Create Razorpay subscription
        const { subscription, customerId } = await razorpayService.createSubscription({
            planId: razorpayPlanId,
            customerEmail: userEmail,
            customerName: userName,
            customerContact: userContact,
        });

        // Calculate period end based on billing cycle
        const periodDays = billingCycle === 'yearly' ? 365 : 30;
        const periodEndDate = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

        // Create subscription record in database with PENDING status until payment is confirmed
        const userSubscription = await prisma.userSubscription.upsert({
            where: { userId },
            create: {
                userId,
                planId: plan.id,
                razorpayCustomerId: customerId,
                razorpaySubscriptionId: subscription.id,
                status: 'PENDING',
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEndDate,
            },
            update: {
                planId: plan.id,
                razorpayCustomerId: customerId,
                razorpaySubscriptionId: subscription.id,
                status: 'PENDING',
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEndDate,
            },
            include: { plan: true },
        });

        // Record coupon usage immediately if it's a subscription 
        // (Assuming validation is enough for activation link generation)
        if (appliedCouponId) {
            await promotionService.recordUsage(appliedCouponId, userId);
        }

        // NOTE: Credits are NOT initialized here. They will be added only after
        // payment is confirmed via the Razorpay webhook (handlePaymentSuccess)

        logger.info(`Created PENDING subscription for user ${userId} with plan ${planName}. Awaiting payment confirmation.`);

        return {
            subscription: userSubscription,
            razorpaySubscriptionId: subscription.id,
            shortUrl: subscription.short_url, // Razorpay payment link
        };
    }

    /**
     * Create a free tier subscription
     */
    async createFreeSubscription(userId: string, planId: string) {
        logger.info(`Creating free subscription for user ${userId} with plan ID: ${planId}`);

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

        logger.info(`Found plan: ${plan ? plan.name : 'NOT FOUND'}, features: ${JSON.stringify(plan?.features)}`);

        const userSubscription = await prisma.userSubscription.upsert({
            where: { userId },
            create: {
                userId,
                planId,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            update: {
                planId,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            include: { plan: true },
        });

        if (plan) {
            logger.info(`Initializing credits for plan ${plan.name}`);
            await this.initializeCreditsForPlan(userId, plan);
            logger.info(`Credits initialized for user ${userId}`);
        } else {
            logger.error(`Plan not found with ID: ${planId} - cannot initialize credits`);
        }

        return {
            subscription: userSubscription,
            razorpaySubscriptionId: undefined,
            shortUrl: undefined,
        };
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(userId: string, cancelImmediately = false) {
        const subscription = await this.getUserSubscription(userId);

        if (!subscription) {
            throw createError('No subscription found', 404, 'SUBSCRIPTION_NOT_FOUND');
        }

        // Cancel on Razorpay if it's a paid subscription
        if (subscription.razorpaySubscriptionId) {
            await razorpayService.cancelSubscription(
                subscription.razorpaySubscriptionId,
                !cancelImmediately // Cancel at cycle end by default
            );
        }

        // Update database
        const updated = await prisma.userSubscription.update({
            where: { userId },
            data: {
                status: cancelImmediately ? 'CANCELLED' : 'ACTIVE',
                cancelAtPeriodEnd: !cancelImmediately,
            },
            include: { plan: true },
        });

        logger.info(`Cancelled subscription for user ${userId}`);
        return updated;
    }

    /**
     * Initialize credits based on subscription plan
     */
    async initializeCreditsForPlan(userId: string, plan: any) {
        const features = plan.features as any;

        logger.info(`Initializing credits - Plan: ${plan.name}, Features: ${JSON.stringify(features)}`);

        const creditTypes = [
            { type: 'RESUME_REVIEW', amount: features.resumeReviews || 0 },
            { type: 'AI_INTERVIEW', amount: features.interviews || 0 },
            { type: 'SKILL_TEST', amount: features.skillTests || 0 },
        ];

        logger.info(`Credit types to initialize: ${JSON.stringify(creditTypes)}`);

        for (const credit of creditTypes) {
            if (credit.amount === 'unlimited') continue; // Handle unlimited separately

            logger.info(`Upserting ${credit.type} with amount ${credit.amount} for user ${userId}`);

            await prisma.userCredit.upsert({
                where: {
                    userId_creditType: { userId, creditType: credit.type as any },
                },
                create: {
                    userId,
                    creditType: credit.type as any,
                    balance: credit.amount,
                },
                update: {
                    balance: { increment: credit.amount },
                },
            });

            // Log the transaction
            await prisma.creditTransaction.create({
                data: {
                    userId,
                    creditType: credit.type as any,
                    amount: credit.amount,
                    transactionType: 'GRANT',
                    description: `Monthly credit refill from ${plan.displayName} plan`,
                },
            });

            logger.info(`Successfully upserted ${credit.type} credit for user ${userId}`);
        }
    }

    /**
     * Check and renew subscription if billing period has passed (lazy renewal)
     * This ensures Free users and all users get their monthly credits refilled
     */
    async checkAndRenewSubscription(userId: string) {
        const subscription = await this.getUserSubscription(userId);

        if (!subscription || subscription.status !== 'ACTIVE') {
            return null;
        }

        const now = new Date();
        const periodEnd = new Date(subscription.currentPeriodEnd);

        // If the current period has not ended, no renewal needed
        if (now < periodEnd) {
            return subscription;
        }

        // Calculate the new period dates
        const newPeriodStart = new Date();
        const newPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

        // Update the subscription period
        const updatedSubscription = await prisma.userSubscription.update({
            where: { userId },
            data: {
                currentPeriodStart: newPeriodStart,
                currentPeriodEnd: newPeriodEnd,
            },
            include: { plan: true },
        });

        // Reset credits based on the plan (refill monthly allowance)
        await this.resetCreditsForPlan(userId, updatedSubscription.plan);

        logger.info(`Renewed subscription for user ${userId} (lazy renewal)`);

        return updatedSubscription;
    }

    /**
     * Reset credits for a new billing period (sets balance to plan limits)
     */
    async resetCreditsForPlan(userId: string, plan: any) {
        const features = plan.features as any;

        const creditTypes = [
            { type: 'RESUME_REVIEW', amount: features.resumeReviews || 0 },
            { type: 'AI_INTERVIEW', amount: features.interviews || 0 },
            { type: 'SKILL_TEST', amount: features.skillTests || 0 },
        ];

        for (const credit of creditTypes) {
            if (credit.amount === 'unlimited') continue;

            await prisma.userCredit.upsert({
                where: {
                    userId_creditType: { userId, creditType: credit.type as any },
                },
                create: {
                    userId,
                    creditType: credit.type as any,
                    balance: credit.amount,
                },
                update: {
                    balance: credit.amount, // Reset to plan limit, not increment
                },
            });

            // Log the transaction
            await prisma.creditTransaction.create({
                data: {
                    userId,
                    creditType: credit.type as any,
                    amount: credit.amount,
                    transactionType: 'GRANT',
                    description: `Monthly credit renewal from ${plan.displayName} plan`,
                },
            });
        }
    }

    /**
     * Handle subscription payment confirmation (webhook)
     * This is called when Razorpay confirms the payment was successful
     */
    async handlePaymentSuccess(subscriptionId: string) {
        const subscription = await prisma.userSubscription.findFirst({
            where: { razorpaySubscriptionId: subscriptionId },
            include: { plan: true },
        });

        if (!subscription) {
            logger.warn(`Subscription not found: ${subscriptionId}`);
            return;
        }

        // Only initialize credits if the subscription was PENDING (first-time activation)
        // This prevents duplicate credits on renewal webhooks
        const wasFirstTimeActivation = subscription.status === 'PENDING';

        await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        // Only add credits on first-time activation (when status was PENDING)
        // For renewals (status was already ACTIVE), credits are handled by checkAndRenewSubscription
        if (wasFirstTimeActivation) {
            await this.initializeCreditsForPlan(subscription.userId, subscription.plan);
            logger.info(`Subscription activated and credits initialized: ${subscriptionId}`);
        } else {
            logger.info(`Subscription renewal confirmed: ${subscriptionId}`);
        }
    }
}

export const subscriptionService = new SubscriptionService();
