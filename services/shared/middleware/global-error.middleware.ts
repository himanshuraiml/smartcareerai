/**
 * Global Error Middleware
 * 
 * Enhanced error handler for production with:
 * - Error classification
 * - Admin alerts for critical errors
 * - Request context tracking
 * - Error deduplication
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorSeverity, classifyError, getErrorHandlingConfig } from '../config/error-handling.config';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
    context?: Record<string, unknown>;
}

interface ErrorContext {
    requestId?: string;
    userId?: string;
    path: string;
    method: string;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    userAgent?: string;
    ip?: string;
}

// Error deduplication cache
const errorCache = new Map<string, { count: number; firstSeen: number; lastSeen: number }>();

/**
 * Generate error fingerprint for deduplication
 */
function getErrorFingerprint(error: Error, context: ErrorContext): string {
    return `${error.name}:${error.message}:${context.path}`.slice(0, 200);
}

/**
 * Check if error should be deduplicated
 */
function shouldDeduplicateError(fingerprint: string): boolean {
    const config = getErrorHandlingConfig();
    const cached = errorCache.get(fingerprint);
    const now = Date.now();

    if (!cached) {
        errorCache.set(fingerprint, { count: 1, firstSeen: now, lastSeen: now });
        return false;
    }

    // Check if within deduplication window
    if (now - cached.firstSeen < config.logging.deduplicationWindow) {
        cached.count++;
        cached.lastSeen = now;

        // Log every Nth occurrence
        if (cached.count % 10 === 0) {
            return false;  // Allow logging for milestone counts
        }
        return true;  // Deduplicate
    }

    // Window expired, reset counter
    errorCache.set(fingerprint, { count: 1, firstSeen: now, lastSeen: now });
    return false;
}

/**
 * Clean up old entries from error cache
 */
function cleanupErrorCache(): void {
    const config = getErrorHandlingConfig();
    const now = Date.now();

    for (const [fingerprint, data] of errorCache) {
        if (now - data.lastSeen > config.logging.deduplicationWindow) {
            errorCache.delete(fingerprint);
        }
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupErrorCache, 5 * 60 * 1000);

/**
 * Log error with structured format
 */
function logError(
    error: AppError,
    severity: ErrorSeverity,
    context: ErrorContext,
    serviceName: string
): void {
    const config = getErrorHandlingConfig();

    const logEntry = {
        timestamp: new Date().toISOString(),
        level: severity,
        service: serviceName,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode || 500,
        context,
        ...(config.logging.includeStackTrace && { stack: error.stack }),
    };

    // Use appropriate console method based on severity
    switch (severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.ERROR:
            console.error(JSON.stringify(logEntry));
            break;
        case ErrorSeverity.WARNING:
            console.warn(JSON.stringify(logEntry));
            break;
        default:
            console.log(JSON.stringify(logEntry));
    }
}

/**
 * Send admin alert for critical errors
 */
async function sendAdminAlert(
    error: AppError,
    severity: ErrorSeverity,
    context: ErrorContext,
    serviceName: string
): Promise<void> {
    const config = getErrorHandlingConfig();

    // Only alert on critical/error if configured
    if (config.alerts.criticalErrorsOnly && severity !== ErrorSeverity.CRITICAL) {
        return;
    }

    if (severity !== ErrorSeverity.CRITICAL && severity !== ErrorSeverity.ERROR) {
        return;
    }

    // Alert logic will be handled by error-monitoring service
    // For now, log the alert intent
    console.log(JSON.stringify({
        type: 'ADMIN_ALERT',
        timestamp: new Date().toISOString(),
        service: serviceName,
        severity,
        error: {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
        },
        context,
    }));
}

/**
 * Create global error handler middleware
 */
export function createErrorHandler(serviceName: string) {
    return (
        err: AppError,
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const statusCode = err.statusCode || 500;
        const severity = classifyError(err);

        // Build context
        const context: ErrorContext = {
            requestId: (req as Request & { id?: string }).id,
            userId: (req as Request & { user?: { id?: string } }).user?.id,
            path: req.path,
            method: req.method,
            query: req.query as Record<string, unknown>,
            userAgent: req.get('user-agent'),
            ip: req.ip,
        };

        // Check deduplication
        const fingerprint = getErrorFingerprint(err, context);
        const isDuplicate = shouldDeduplicateError(fingerprint);

        if (!isDuplicate) {
            // Log error
            logError(err, severity, context, serviceName);

            // Send admin alert for critical errors
            if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR) {
                sendAdminAlert(err, severity, context, serviceName).catch(alertErr => {
                    console.error('Failed to send admin alert:', alertErr);
                });
            }
        }

        // Send response
        res.status(statusCode).json({
            success: false,
            error: {
                message: err.isOperational ? err.message : 'An unexpected error occurred',
                code: err.code || 'INTERNAL_ERROR',
                ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
            },
        });
    };
}

/**
 * Create error with operational flag
 */
export function createOperationalError(
    message: string,
    statusCode: number = 500,
    code?: string
): AppError {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = true;
    return error;
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

export default createErrorHandler;
