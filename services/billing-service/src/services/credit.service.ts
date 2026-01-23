import { PrismaClient, CreditType, TransactionType } from '@prisma/client';
import { razorpayService } from './razorpay.service';
import { subscriptionService } from './subscription.service';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// Credit pricing in paise (INR * 100)
const CREDIT_PRICES = {
    RESUME_REVIEW: 4900,    // ₹49 per credit
    AI_INTERVIEW: 9900,     // ₹99 per credit
    SKILL_TEST: 2900,       // ₹29 per credit
};

// Credit bundles
const CREDIT_BUNDLES = {
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

export class CreditService {
    /**
     * Get credit pricing and bundles
     */
    getPricing() {
        return {
            perCredit: {
                RESUME_REVIEW: CREDIT_PRICES.RESUME_REVIEW / 100,
                AI_INTERVIEW: CREDIT_PRICES.AI_INTERVIEW / 100,
                SKILL_TEST: CREDIT_PRICES.SKILL_TEST / 100,
            },
            bundles: {
                RESUME_REVIEW: CREDIT_BUNDLES.RESUME_REVIEW.map(b => ({
                    ...b,
                    price: b.price / 100,
                })),
                AI_INTERVIEW: CREDIT_BUNDLES.AI_INTERVIEW.map(b => ({
                    ...b,
                    price: b.price / 100,
                })),
                SKILL_TEST: CREDIT_BUNDLES.SKILL_TEST.map(b => ({
                    ...b,
                    price: b.price / 100,
                })),
            },
        };
    }

    /**
     * Get user's credit balances
     */
    async getBalances(userId: string) {
        // Check and renew subscription if billing period has passed (lazy renewal)
        await subscriptionService.checkAndRenewSubscription(userId);

        const credits = await prisma.userCredit.findMany({
            where: { userId },
        });

        // Return all credit types even if not in DB
        const balances: Record<string, number> = {
            RESUME_REVIEW: 0,
            AI_INTERVIEW: 0,
            SKILL_TEST: 0,
        };

        credits.forEach(credit => {
            balances[credit.creditType] = credit.balance;
        });

        return balances;
    }

    /**
     * Get user's transaction history
     */
    async getTransactionHistory(userId: string, limit = 50) {
        return prisma.creditTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Create an order for credit purchase
     */
    async createPurchaseOrder(
        userId: string,
        creditType: CreditType,
        quantity: number
    ) {
        // Calculate price
        const bundle = CREDIT_BUNDLES[creditType]?.find(b => b.quantity === quantity);
        let amount: number;

        if (bundle) {
            amount = bundle.price;
        } else {
            amount = CREDIT_PRICES[creditType] * quantity;
        }

        // Create Razorpay order
        const order = await razorpayService.createOrder({
            amount,
            receipt: `credit_${userId}_${Date.now()}`,
            notes: {
                userId,
                creditType,
                quantity: quantity.toString(),
            },
        });

        logger.info(`Created credit purchase order: ${order.id} for user ${userId}`);

        return {
            orderId: order.id,
            amount: amount / 100,
            currency: 'INR',
            creditType,
            quantity,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        };
    }

    /**
     * Confirm credit purchase after payment
     */
    async confirmPurchase(
        userId: string,
        orderId: string,
        paymentId: string,
        signature: string,
        creditType: CreditType,
        quantity: number
    ) {
        // Verify payment signature
        const isValid = razorpayService.verifyPaymentSignature(orderId, paymentId, signature);

        if (!isValid) {
            throw createError('Invalid payment signature', 400, 'INVALID_SIGNATURE');
        }

        // Add credits to user balance
        const userCredit = await prisma.userCredit.upsert({
            where: {
                userId_creditType: { userId, creditType },
            },
            create: {
                userId,
                creditType,
                balance: quantity,
            },
            update: {
                balance: { increment: quantity },
            },
        });

        // Log the transaction
        await prisma.creditTransaction.create({
            data: {
                userId,
                creditType,
                amount: quantity,
                transactionType: 'PURCHASE',
                description: `Purchased ${quantity} ${creditType} credits`,
                referenceId: paymentId,
            },
        });

        logger.info(`Credit purchase confirmed: ${quantity} ${creditType} for user ${userId}`);

        return userCredit;
    }

    /**
     * Consume credits for a feature
     */
    async consumeCredit(userId: string, creditType: CreditType, featureId?: string) {
        // Check and renew subscription if billing period has passed (lazy renewal)
        await subscriptionService.checkAndRenewSubscription(userId);

        // Check subscription for unlimited access
        const subscription = await prisma.userSubscription.findUnique({
            where: { userId },
            include: { plan: true },
        });

        if (subscription && subscription.status === 'ACTIVE') {
            const features = subscription.plan.features as any;
            const featureKey = creditType === 'RESUME_REVIEW' ? 'resumeReviews'
                : creditType === 'AI_INTERVIEW' ? 'interviews'
                    : 'skillTests';

            if (features[featureKey] === 'unlimited') {
                logger.info(`Unlimited ${creditType} access for user ${userId}`);
                return { consumed: true, unlimited: true };
            }
        }

        // Check credit balance
        const userCredit = await prisma.userCredit.findUnique({
            where: {
                userId_creditType: { userId, creditType },
            },
        });

        if (!userCredit || userCredit.balance <= 0) {
            throw createError(`Insufficient ${creditType} credits`, 402, 'INSUFFICIENT_CREDITS');
        }

        // Deduct credit
        await prisma.userCredit.update({
            where: {
                userId_creditType: { userId, creditType },
            },
            data: {
                balance: { decrement: 1 },
            },
        });

        // Log the transaction
        await prisma.creditTransaction.create({
            data: {
                userId,
                creditType,
                amount: -1,
                transactionType: 'CONSUME',
                description: `Used 1 ${creditType} credit`,
                referenceId: featureId,
            },
        });

        logger.info(`Consumed 1 ${creditType} credit for user ${userId}`);

        return { consumed: true, remainingBalance: userCredit.balance - 1 };
    }

    /**
     * Check if user has credits (without consuming)
     */
    async hasCredits(userId: string, creditType: CreditType): Promise<boolean> {
        // Check and renew subscription if billing period has passed (lazy renewal)
        await subscriptionService.checkAndRenewSubscription(userId);

        // Check for unlimited subscription
        const subscription = await prisma.userSubscription.findUnique({
            where: { userId },
            include: { plan: true },
        });

        if (subscription && subscription.status === 'ACTIVE') {
            const features = subscription.plan.features as any;
            const featureKey = creditType === 'RESUME_REVIEW' ? 'resumeReviews'
                : creditType === 'AI_INTERVIEW' ? 'interviews'
                    : 'skillTests';

            if (features[featureKey] === 'unlimited') {
                return true;
            }
        }

        // Check credit balance
        const userCredit = await prisma.userCredit.findUnique({
            where: {
                userId_creditType: { userId, creditType },
            },
        });

        return (userCredit?.balance ?? 0) > 0;
    }
}

export const creditService = new CreditService();
