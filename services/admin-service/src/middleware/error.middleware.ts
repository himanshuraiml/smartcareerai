import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
}

// Error severity classification
type ErrorSeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

function classifyError(statusCode: number, message: string): ErrorSeverity {
    // Authentication/Authorization errors are warnings
    if (statusCode === 401 || statusCode === 403) return 'WARNING';
    // Validation errors are info
    if (statusCode === 400 || statusCode === 404 || statusCode === 422) return 'INFO';
    // Rate limiting is warning
    if (statusCode === 429) return 'WARNING';
    // Database/connection errors are critical
    if (message.toLowerCase().includes('database') ||
        message.toLowerCase().includes('connection') ||
        message.toLowerCase().includes('prisma')) {
        return 'CRITICAL';
    }
    // Server errors
    if (statusCode >= 500) return 'ERROR';
    return 'ERROR';
}

// Error deduplication cache
const errorCache = new Map<string, { count: number; firstSeen: number }>();
const DEDUP_WINDOW = 5 * 60 * 1000; // 5 minutes

function shouldLogError(fingerprint: string): boolean {
    const now = Date.now();
    const cached = errorCache.get(fingerprint);

    if (!cached) {
        errorCache.set(fingerprint, { count: 1, firstSeen: now });
        return true;
    }

    if (now - cached.firstSeen > DEDUP_WINDOW) {
        errorCache.set(fingerprint, { count: 1, firstSeen: now });
        return true;
    }

    cached.count++;
    // Log every 10th duplicate
    return cached.count % 10 === 0;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const severity = classifyError(statusCode, message);

    // Create error fingerprint for deduplication
    const fingerprint = `${err.name}:${message}:${req.path}`.slice(0, 200);

    if (shouldLogError(fingerprint)) {
        logger.error({
            severity,
            message: err.message,
            stack: err.stack,
            statusCode,
            code: err.code,
            path: req.path,
            method: req.method,
            requestId: (req as any).id,
            userId: (req as any).user?.id,
            timestamp: new Date().toISOString(),
        });

        // Log critical errors for admin alerts
        if (severity === 'CRITICAL') {
            logger.error({
                type: 'ADMIN_ALERT',
                service: 'admin-service',
                severity,
                message: err.message,
                path: req.path,
                timestamp: new Date().toISOString(),
            });
        }
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message: err.isOperational !== false ? message : 'An unexpected error occurred',
            code: err.code || 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        },
    });
};

export const createError = (message: string, statusCode: number, code?: string): AppError => {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = true;
    return error;
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

