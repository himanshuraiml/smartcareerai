import { z } from 'zod';

export const ScoreRequestSchema = z.object({
    resumeId: z.string().uuid('Invalid resume ID'),
    jobRole: z.string().min(1, 'Job role is required'),
    jobDescription: z.string().optional(),
});
