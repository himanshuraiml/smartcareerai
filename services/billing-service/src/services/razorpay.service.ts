import Razorpay from 'razorpay';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// Lazy initialize Razorpay instance to prevent crash when credentials missing
let razorpay: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
    if (!razorpay) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret || keyId.includes('xxxx') || keySecret.includes('xxxx')) {
            logger.warn('Razorpay credentials not configured - payment features will be disabled');
            // Return a mock instance for development
            throw new Error('Razorpay credentials not configured');
        }

        razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return razorpay;
}

export interface CreateSubscriptionParams {
    planId: string;
    customerId?: string;
    customerEmail: string;
    customerName: string;
    customerContact?: string;
    totalCount?: number; // Number of billing cycles
}

export interface CreateOrderParams {
    amount: number; // Amount in paise (INR * 100)
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}

export class RazorpayService {
    /**
     * Create or get existing Razorpay customer
     */
    async createCustomer(email: string, name: string, contact?: string) {
        try {
            const customer = await getRazorpayInstance().customers.create({
                email,
                name,
                contact: contact || '',
                fail_existing: 0, // Return existing customer if exists (0 = false)
            });
            logger.info(`Created Razorpay customer: ${customer.id}`);
            return customer;
        } catch (error: any) {
            // If customer already exists, fetch by email
            if (error?.error?.code === 'BAD_REQUEST_ERROR' &&
                error?.error?.description?.includes('already exists')) {
                logger.info(`Customer already exists for ${email}, fetching existing customer`);
                const existingCustomer = await this.getCustomerByEmail(email);
                if (existingCustomer) {
                    return existingCustomer;
                }
            }
            logger.error('Failed to create Razorpay customer', error);
            throw error;
        }
    }

    /**
     * Get customer by email (searches through customers)
     */
    async getCustomerByEmail(email: string) {
        try {
            const customers = await getRazorpayInstance().customers.all({
                count: 100,
            });
            const customer = customers.items.find((c: any) => c.email === email);
            if (customer) {
                logger.info(`Found existing customer: ${customer.id}`);
                return customer;
            }
            return null;
        } catch (error) {
            logger.error('Failed to fetch customers', error);
            return null;
        }
    }

    /**
     * Create a subscription for a customer
     */
    async createSubscription(params: CreateSubscriptionParams) {
        try {
            // First, get or create customer
            let customerId = params.customerId;
            if (!customerId) {
                const customer = await this.createCustomer(
                    params.customerEmail,
                    params.customerName,
                    params.customerContact
                );
                customerId = customer.id;
            }

            const subscription = await getRazorpayInstance().subscriptions.create({
                plan_id: params.planId,
                total_count: params.totalCount || 12, // Default 12 billing cycles
                customer_notify: 1,
                notes: {
                    customer_id: customerId || '',
                },
            } as any);

            logger.info(`Created subscription: ${subscription.id}`);
            return { subscription, customerId };
        } catch (error) {
            logger.error('Failed to create subscription', error);
            throw error;
        }
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(subscriptionId: string, cancelAtCycleEnd = true) {
        try {
            const subscription = await getRazorpayInstance().subscriptions.cancel(
                subscriptionId,
                cancelAtCycleEnd
            );
            logger.info(`Cancelled subscription: ${subscriptionId}`);
            return subscription;
        } catch (error) {
            logger.error('Failed to cancel subscription', error);
            throw error;
        }
    }

    /**
     * Get subscription details
     */
    async getSubscription(subscriptionId: string) {
        try {
            return await getRazorpayInstance().subscriptions.fetch(subscriptionId);
        } catch (error) {
            logger.error('Failed to fetch subscription', error);
            throw error;
        }
    }

    /**
     * Create an order for one-time payment (credits purchase)
     */
    async createOrder(params: CreateOrderParams) {
        try {
            const order = await getRazorpayInstance().orders.create({
                amount: params.amount,
                currency: params.currency || 'INR',
                receipt: params.receipt,
                notes: params.notes,
            });
            logger.info(`Created order: ${order.id}`);
            return order;
        } catch (error) {
            logger.error('Failed to create order', error);
            throw error;
        }
    }

    /**
     * Verify payment signature
     */
    verifyPaymentSignature(
        orderId: string,
        paymentId: string,
        signature: string
    ): boolean {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Verify subscription payment signature
     */
    verifySubscriptionSignature(
        subscriptionId: string,
        paymentId: string,
        signature: string
    ): boolean {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${paymentId}|${subscriptionId}`)
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(body: string, signature: string): boolean {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Get Razorpay plan details
     */
    async getPlan(planId: string) {
        try {
            return await getRazorpayInstance().plans.fetch(planId);
        } catch (error) {
            logger.error('Failed to fetch plan', error);
            throw error;
        }
    }
}

export const razorpayService = new RazorpayService();
