/**
 * Error Reporter Utility
 *
 * Reports errors from all microservices to the admin error monitoring service.
 * Uses fire-and-forget pattern to avoid blocking error responses.
 */

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3011';

interface ErrorReport {
    service: string;
    severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    code?: string;
    path?: string;
    method?: string;
    stack?: string;
    userId?: string;
}

/**
 * Report an error to the admin error monitoring service.
 * This is fire-and-forget - it never throws or blocks.
 */
export function reportErrorToAdmin(report: ErrorReport): void {
    // Skip in test environment
    if (process.env.NODE_ENV === 'test') return;

    fetch(`${ADMIN_SERVICE_URL}/errors/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        signal: AbortSignal.timeout(5000),
    }).catch(() => {
        // Silently ignore - we don't want error reporting to cause more errors
    });
}
