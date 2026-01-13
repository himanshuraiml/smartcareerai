import { z } from "zod";

export const PlanSchema = z.object({
    id: z.string(),
    name: z.string(),
    displayName: z.string(),
    priceMonthly: z.number(),
    priceYearly: z.number(),
    features: z.object({
        resumeReviews: z.union([z.number(), z.string()]),
        interviews: z.union([z.number(), z.string()]),
        skillTests: z.union([z.number(), z.string()]),
        jobAlerts: z.boolean().optional(),
        prioritySupport: z.boolean().optional(),
        apiAccess: z.boolean().optional(),
    }),
});

export type Plan = z.infer<typeof PlanSchema>;
