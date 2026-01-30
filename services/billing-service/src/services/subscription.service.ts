import { PrismaClient } from '@prisma/client';
import { razorpayService } from './razorpay.service';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface CreateSubscriptionInput {
    userId: string;
    planName: string;
    userEmail: string;
    userName: string;
    userContact?: string;
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
        const { userId, planName, userEmail, userName, userContact } = input;

        // Check for existing subscription
        const existingSubscription = await this.getUserSubscription(userId);

        // Allow upgrade from free plan, block if already on a paid plan
        if (existingSubscription && existingSubscription.status === 'ACTIVE') {
            const isFreePlan = existingSubscription.plan.name === 'free';
            const isUpgrading = planName !== 'free';

            if (!isFreePlan && isUpgrading) {
                // Already on a paid plan - need to cancel first or use upgrade flow
                throw createError('Please cancel your current subscription before upgrading', 400, 'SUBSCRIPTION_EXISTS');
            }
            // If on free plan and upgrading to paid, allow it (continue with subscription creation)
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

        // Check if plan has Razorpay plan ID
        if (!plan.razorpayPlanId) {
            throw createError('Plan not configured for payments', 400, 'PLAN_NOT_CONFIGURED');
        }

        // Create Razorpay subscription
        const { subscription, customerId } = await razorpayService.createSubscription({
            planId: plan.razorpayPlanId,
            customerEmail: userEmail,
            customerName: userName,
            customerContact: userContact,
        });

        // Create subscription record in database (pending until payment)
        const userSubscription = await prisma.userSubscription.upsert({
            where: { userId },
            create: {
                userId,
                planId: plan.id,
                razorpayCustomerId: customerId,
                razorpaySubscriptionId: subscription.id,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            update: {
                planId: plan.id,
                razorpayCustomerId: customerId,
                razorpaySubscriptionId: subscription.id,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            include: { plan: true },
        });

        // Initialize credits based on plan
        await this.initializeCreditsForPlan(userId, plan);

        logger.info(`Created subscription for user ${userId} with plan ${planName}`);

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

        await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        // Refill credits
        await this.initializeCreditsForPlan(subscription.userId, subscription.plan);

        logger.info(`Subscription payment confirmed: ${subscriptionId}`);
    }
}

export const subscriptionService = new SubscriptionService();
