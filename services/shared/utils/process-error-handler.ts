/**
 * Process Error Handler
 * 
 * Handles uncaught exceptions and unhandled rejections
 * at the process level for production systems.
 */

import { ErrorSeverity } from '../config/error-handling.config';
import { queueErrorAlert, flushAlerts } from './admin-alert.service';

interface ProcessHandlerOptions {
    serviceName: string;
    exitOnUncaught?: boolean;
    gracefulShutdownTimeout?: number;
    onShutdown?: () => Promise<void>;
}

let isShuttingDown = false;

/**
 * Handle critical error at process level
 */
function handleCriticalError(
    error: Error,
    type: 'uncaughtException' | 'unhandledRejection',
    serviceName: string
): void {
    console.error(`[${type}] Critical error in ${serviceName}:`, error);

    // Queue alert
    queueErrorAlert(serviceName, ErrorSeverity.CRITICAL, error.message, {
        code: type.toUpperCase(),
        context: {
            type,
            name: error.name,
        },
        stack: error.stack,
    });
}

/**
 * Perform graceful shutdown
 */
async function gracefulShutdown(
    serviceName: string,
    timeout: number,
    onShutdown?: () => Promise<void>
): Promise<void> {
    if (isShuttingDown) {
        console.log(`[${serviceName}] Shutdown already in progress...`);
        return;
    }

    isShuttingDown = true;
    console.log(`[${serviceName}] Initiating graceful shutdown...`);

    const shutdownTimer = setTimeout(() => {
        console.error(`[${serviceName}] Shutdown timeout exceeded. Forcing exit.`);
        process.exit(1);
    }, timeout);

    try {
        // Flush any pending alerts
        await flushAlerts();

        // Run custom shutdown handler
        if (onShutdown) {
            await onShutdown();
        }

        clearTimeout(shutdownTimer);
        console.log(`[${serviceName}] Graceful shutdown complete.`);
        process.exit(0);
    } catch (err) {
        clearTimeout(shutdownTimer);
        console.error(`[${serviceName}] Error during shutdown:`, err);
        process.exit(1);
    }
}

/**
 * Setup global process error handlers
 */
export function setupProcessErrorHandlers(options: ProcessHandlerOptions): void {
    const {
        serviceName,
        exitOnUncaught = true,
        gracefulShutdownTimeout = 30000,
        onShutdown,
    } = options;

    // Uncaught Exception Handler
    process.on('uncaughtException', (error: Error) => {
        handleCriticalError(error, 'uncaughtException', serviceName);

        if (exitOnUncaught) {
            // Give time for alert to be sent
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        }
    });

    // Unhandled Promise Rejection Handler
    process.on('unhandledRejection', (reason: unknown) => {
        const error = reason instanceof Error
            ? reason
            : new Error(String(reason));

        handleCriticalError(error, 'unhandledRejection', serviceName);
    });

    // SIGTERM - Graceful shutdown
    process.on('SIGTERM', () => {
        console.log(`[${serviceName}] Received SIGTERM signal.`);
        gracefulShutdown(serviceName, gracefulShutdownTimeout, onShutdown);
    });

    // SIGINT - Ctrl+C
    process.on('SIGINT', () => {
        console.log(`[${serviceName}] Received SIGINT signal.`);
        gracefulShutdown(serviceName, gracefulShutdownTimeout, onShutdown);
    });

    console.log(`[${serviceName}] Process error handlers initialized.`);
}

/**
 * Check if shutdown is in progress
 */
export function isShutdownInProgress(): boolean {
    return isShuttingDown;
}

export default {
    setupProcessErrorHandlers,
    isShutdownInProgress,
};
