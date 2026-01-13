import { z } from 'zod';

export const SubscribePlanSchema = z.object({
    body: z.object({
        planName: z.enum(['free', 'starter', 'pro', 'enterprise']),
        contact: z.string().optional(),
    }),
});

export const CancelSubscriptionSchema = z.object({
    body: z.object({
        immediate: z.boolean().optional().default(false),
    }),
});

export const CreateCreditOrderSchema = z.object({
    body: z.object({
        creditType: z.enum(['RESUME_REVIEW', 'AI_INTERVIEW', 'SKILL_TEST']),
        quantity: z.number().int().positive(),
    }),
});

export const ConfirmCreditPurchaseSchema = z.object({
    body: z.object({
        orderId: z.string(),
        paymentId: z.string(),
        signature: z.string(),
        creditType: z.enum(['RESUME_REVIEW', 'AI_INTERVIEW', 'SKILL_TEST']),
        quantity: z.number().int().positive(),
    }),
});

export const ConsumeCreditSchema = z.object({
    body: z.object({
        creditType: z.enum(['RESUME_REVIEW', 'AI_INTERVIEW', 'SKILL_TEST']),
        featureId: z.string().optional(),
    }),
});
