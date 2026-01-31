---
description: Global error handling workflow for production resilience
---

# Global Error Handling Workflow

This workflow describes how to use the error handling infrastructure in SmartCareerAI.

## 1. Import Shared Utilities

For any service that needs error handling features:

```typescript
// From the shared package
import {
    withRetry,
    getCircuitBreaker,
    createErrorHandler,
    setupProcessErrorHandlers,
    queueErrorAlert,
    ErrorSeverity,
} from '../../shared';
```

## 2. Setup Process Error Handlers

At the top of your service's index.ts (after imports):

```typescript
// Uncaught Exception Handler
process.on('uncaughtException', (error: Error) => {
    logger.error({
        type: 'UNCAUGHT_EXCEPTION',
        service: 'your-service-name',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });
    setTimeout(() => process.exit(1), 1000);
});

// Unhandled Promise Rejection Handler
process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error({
        type: 'UNHANDLED_REJECTION',
        service: 'your-service-name',
        message: error.message,
        stack: error.stack,
    });
});

// SIGTERM/SIGINT handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

## 3. Use Retry for External Calls

// turbo
```typescript
import { withRetry } from '../../shared';

// Basic retry
const data = await withRetry(() => fetchExternalAPI(), {
    maxAttempts: 3,
    baseDelay: 1000,
});

// With custom options
const result = await withRetry(
    () => callThirdPartyService(),
    {
        maxAttempts: 5,
        baseDelay: 500,
        maxDelay: 15000,
        onRetry: (error, attempt) => {
            logger.warn(`Retry attempt ${attempt}: ${error.message}`);
        },
    }
);
```

## 4. Use Circuit Breaker for Unreliable Services

```typescript
import { getCircuitBreaker } from '../../shared';

const circuitBreaker = getCircuitBreaker('external-api', {
    failureThreshold: 5,
    resetTimeout: 30000,
});

try {
    const result = await circuitBreaker.execute(() => callExternalAPI());
} catch (error) {
    if (error.name === 'CircuitBreakerError') {
        // Service is unavailable, use fallback
        return fallbackResponse;
    }
    throw error;
}
```

## 5. Queue Admin Alerts

```typescript
import { queueErrorAlert, ErrorSeverity } from '../../shared';

// For critical errors
queueErrorAlert('your-service', ErrorSeverity.CRITICAL, 'Database connection failed', {
    code: 'DB_CONNECTION_ERROR',
    context: { host: dbHost },
});
```

## 6. Environment Variables

Add these to your `.env`:

```env
# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=30000

# Circuit Breaker
CB_FAILURE_THRESHOLD=5
CB_RESET_TIMEOUT=30000

# Admin Alerts
ADMIN_EMAILS=admin@example.com,alerts@example.com
ALERT_EMAIL_RATE_LIMIT=10
ALERT_CRITICAL_ONLY=false

# Logging
INCLUDE_STACK_TRACE=true
ERROR_DEDUP_WINDOW=300000
```

## 7. Testing Error Handling

```bash
# Test uncaught exception (in dev only)
curl http://localhost:3011/admin/test-error

# Check circuit breaker status
curl http://localhost:3011/admin/health/detailed
```
