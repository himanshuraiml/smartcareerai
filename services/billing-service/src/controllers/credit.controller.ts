import { Request, Response, NextFunction } from 'express';
import { creditService } from '../services/credit.service';
import { CreditType } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class CreditController {
    /**
     * Get credit pricing and bundles
     */
    async getPricing(req: Request, res: Response, next: NextFunction) {
        try {
            const pricing = await creditService.getPricing();
            res.json({
                success: true,
                data: pricing,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user's credit balances
     */
    async getBalances(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const balances = await creditService.getBalances(userId);

            res.json({
                success: true,
                data: balances,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get transaction history
     */
    async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const limit = parseInt(req.query.limit as string) || 50;

            const transactions = await creditService.getTransactionHistory(userId, limit);

            res.json({
                success: true,
                data: transactions,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a credit purchase order
     */
    async createOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { creditType, quantity } = req.body;

            logger.info(`Credit order request: userId=${userId}, creditType=${creditType}, quantity=${quantity}`);

            // Validate credit type
            if (!creditType || !['RESUME_REVIEW', 'AI_INTERVIEW', 'SKILL_TEST'].includes(creditType)) {
                logger.error(`Invalid credit type: ${creditType}`);
                throw createError('Invalid credit type', 400, 'INVALID_CREDIT_TYPE');
            }

            // Parse quantity if it's a string (JSON body parser might convert it)
            const parsedQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;

            // Validate quantity
            if (!parsedQuantity || typeof parsedQuantity !== 'number' || parsedQuantity <= 0 || !Number.isInteger(parsedQuantity) || isNaN(parsedQuantity)) {
                logger.error(`Invalid quantity: ${quantity} (type: ${typeof quantity}, parsed: ${parsedQuantity})`);
                throw createError('Invalid quantity. Must be a positive integer.', 400, 'INVALID_QUANTITY');
            }

            const order = await creditService.createPurchaseOrder(
                userId,
                creditType as CreditType,
                parsedQuantity
            );

            logger.info(`Credit order created successfully: ${order.orderId}`);

            res.json({
                success: true,
                data: order,
            });
        } catch (error) {
            logger.error('Error creating credit order:', error);
            next(error);
        }
    }

    /**
     * Confirm credit purchase after payment
     */
    async confirmPurchase(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { orderId, paymentId, signature, creditType, quantity } = req.body;

            const userCredit = await creditService.confirmPurchase(
                userId,
                orderId,
                paymentId,
                signature,
                creditType as CreditType,
                quantity
            );

            res.json({
                success: true,
                data: {
                    creditType: userCredit.creditType,
                    newBalance: userCredit.balance,
                },
                message: `Successfully added ${quantity} ${creditType} credits.`,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Consume a credit (internal API for other services)
     */
    async consume(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { creditType, featureId } = req.body;

            const result = await creditService.consumeCredit(
                userId,
                creditType as CreditType,
                featureId
            );

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Check if user has credits (without consuming)
     */
    async checkCredits(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { creditType } = req.query;

            if (!creditType || !['RESUME_REVIEW', 'AI_INTERVIEW', 'SKILL_TEST'].includes(creditType as string)) {
                throw createError('Invalid credit type', 400, 'INVALID_CREDIT_TYPE');
            }

            const hasCredits = await creditService.hasCredits(userId, creditType as CreditType);

            res.json({
                success: true,
                data: { hasCredits },
            });
        } catch (error) {
            next(error);
        }
    }
}

export const creditController = new CreditController();
