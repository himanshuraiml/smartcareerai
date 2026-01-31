/**
 * Centralized Error Handling Configuration
 * 
 * Production-ready configuration for error handling, retry logic,
 * circuit breakers, and admin alerts.
 */

export enum ErrorSeverity {
    CRITICAL = 'CRITICAL',
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    INFO = 'INFO',
}

export interface ErrorHandlingConfig {
    retry: {
        maxAttempts: number;
        baseDelay: number;
        maxDelay: number;
        retryableStatusCodes: number[];
    };
    circuitBreaker: {
        failureThreshold: number;
        resetTimeout: number;
        halfOpenSuccessThreshold: number;
        failureWindow: number;
    };
    alerts: {
        emailRateLimit: number;  // per hour
        criticalErrorsOnly: boolean;
        batchInterval: number;  // ms
        adminEmails: string[];
    };
    logging: {
        includeStackTrace: boolean;
        deduplicationWindow: number;  // ms
        maxErrorsPerWindow: number;
    };
}

const config: ErrorHandlingConfig = {
    retry: {
        maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10),
        baseDelay: parseInt(process.env.RETRY_BASE_DELAY || '1000', 10),
        maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '30000', 10),
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
    circuitBreaker: {
        failureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD || '5', 10),
        resetTimeout: parseInt(process.env.CB_RESET_TIMEOUT || '30000', 10),
        halfOpenSuccessThreshold: parseInt(process.env.CB_HALF_OPEN_THRESHOLD || '2', 10),
        failureWindow: parseInt(process.env.CB_FAILURE_WINDOW || '60000', 10),
    },
    alerts: {
        emailRateLimit: parseInt(process.env.ALERT_EMAIL_RATE_LIMIT || '10', 10),
        criticalErrorsOnly: process.env.ALERT_CRITICAL_ONLY === 'true',
        batchInterval: parseInt(process.env.ALERT_BATCH_INTERVAL || '300000', 10),
        adminEmails: (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean),
    },
    logging: {
        includeStackTrace: process.env.NODE_ENV !== 'production' || process.env.INCLUDE_STACK_TRACE === 'true',
        deduplicationWindow: parseInt(process.env.ERROR_DEDUP_WINDOW || '300000', 10),
        maxErrorsPerWindow: parseInt(process.env.MAX_ERRORS_PER_WINDOW || '100', 10),
    },
};

export function getErrorHandlingConfig(): ErrorHandlingConfig {
    return config;
}

/**
 * Error classification based on status code and error type
 */
export function classifyError(error: Error & { statusCode?: number }): ErrorSeverity {
    const statusCode = error.statusCode || 500;

    // Authentication/Authorization errors are warnings (user issue)
    if (statusCode === 401 || statusCode === 403) {
        return ErrorSeverity.WARNING;
    }

    // Validation errors are info (expected behavior)
    if (statusCode === 400 || statusCode === 422) {
        return ErrorSeverity.INFO;
    }

    // Not found is info
    if (statusCode === 404) {
        return ErrorSeverity.INFO;
    }

    // Rate limiting is warning
    if (statusCode === 429) {
        return ErrorSeverity.WARNING;
    }

    // Server errors
    if (statusCode >= 500) {
        // Database connection errors are critical
        if (error.message.toLowerCase().includes('database') ||
            error.message.toLowerCase().includes('connection') ||
            error.message.toLowerCase().includes('prisma')) {
            return ErrorSeverity.CRITICAL;
        }

        // Memory/resource errors are critical
        if (error.message.toLowerCase().includes('memory') ||
            error.message.toLowerCase().includes('heap') ||
            error.message.toLowerCase().includes('out of')) {
            return ErrorSeverity.CRITICAL;
        }

        return ErrorSeverity.ERROR;
    }

    return ErrorSeverity.ERROR;
}

export default config;
