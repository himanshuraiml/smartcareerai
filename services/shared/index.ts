/**
 * Shared Error Handling Utilities
 * 
 * Export all error handling utilities from a single entry point.
 */

// Retry utility
export {
    withRetry,
    createRetryableFunction,
    isRetryableError,
    calculateDelay,
    type RetryOptions,
} from './utils/retry.util';

// Circuit breaker
export {
    CircuitBreaker,
    CircuitBreakerError,
    CircuitState,
    getCircuitBreaker,
    circuitBreakerRegistry,
    type CircuitBreakerOptions,
} from './utils/circuit-breaker.util';

// Configuration
export {
    ErrorSeverity,
    classifyError,
    getErrorHandlingConfig,
    type ErrorHandlingConfig,
} from './config/error-handling.config';

// Global error middleware
export {
    createErrorHandler,
    createOperationalError,
    asyncHandler,
    type AppError,
} from './middleware/global-error.middleware';

// Admin alerts
export {
    queueErrorAlert,
    sendImmediateAlert,
    getAlertStats,
    flushAlerts,
} from './utils/admin-alert.service';

// Process handlers
export {
    setupProcessErrorHandlers,
    isShutdownInProgress,
} from './utils/process-error-handler';
