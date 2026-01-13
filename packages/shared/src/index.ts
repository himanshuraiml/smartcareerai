import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const RegisterSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// RESUME SCHEMAS
// ============================================

export const ResumeUploadSchema = z.object({
    fileName: z.string(),
    mimeType: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    fileSize: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});

// ============================================
// SCORING SCHEMAS
// ============================================

export const ScoreRequestSchema = z.object({
    resumeId: z.string().uuid('Invalid resume ID'),
    jobRole: z.string().min(1, 'Job role is required'),
    jobDescription: z.string().optional(),
});

// ============================================
// TYPES
// ============================================

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ResumeUploadInput = z.infer<typeof ResumeUploadSchema>;
export type ScoreRequestInput = z.infer<typeof ScoreRequestSchema>;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    createdAt: string;
}

export interface ResumeDetails {
    id: string;
    fileName: string;
    fileUrl: string;
    status: 'PENDING' | 'PARSING' | 'PARSED' | 'FAILED';
    parsedText: string | null;
    createdAt: string;
}

export interface AtsScoreResult {
    id: string;
    resumeId: string;
    jobRole: string;
    overallScore: number;
    keywordMatchPercent: number;
    formattingScore: number;
    experienceScore: number;
    educationScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    formattingIssues: string[];
    suggestions: string[];
    createdAt: string;
}
