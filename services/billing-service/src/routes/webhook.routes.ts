import { Router, Request, Response } from 'express';
import { razorpayService } from '../services/razorpay.service';
import { subscriptionService } from '../services/subscription.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Razorpay webhook handler
 * Handles subscription and payment events
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;
        const body = req.body.toString();

        // Verify webhook signature
        if (!razorpayService.verifyWebhookSignature(body, signature)) {
            logger.warn('Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = JSON.parse(body);
        logger.info(`Received webhook: ${event.event}`);

        switch (event.event) {
            case 'subscription.activated':
            case 'subscription.charged':
                // Payment successful, activate/renew subscription
                await subscriptionService.handlePaymentSuccess(
                    event.payload.subscription.entity.id
                );
                break;

            case 'subscription.pending':
                logger.info(`Subscription pending: ${event.payload.subscription.entity.id}`);
                break;

            case 'subscription.halted':
            case 'subscription.cancelled':
                logger.info(`Subscription status change: ${event.event}`);
                // Handle subscription cancellation/halt
                break;

            case 'payment.captured':
                logger.info(`Payment captured: ${event.payload.payment.entity.id}`);
                break;

            case 'payment.failed':
                logger.warn(`Payment failed: ${event.payload.payment.entity.id}`);
                break;

            default:
                logger.info(`Unhandled webhook event: ${event.event}`);
        }

        res.json({ status: 'ok' });
    } catch (error) {
        logger.error('Webhook processing error', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export { router as webhookRouter };
