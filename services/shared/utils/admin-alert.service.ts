/**
 * Admin Alert Service
 * 
 * Sends alerts to administrators for critical errors.
 * Features:
 * - Email alerts with rate limiting
 * - Error batching to reduce noise
 * - Configurable thresholds
 */

import { ErrorSeverity, getErrorHandlingConfig } from '../config/error-handling.config';

interface ErrorAlert {
    timestamp: Date;
    service: string;
    severity: ErrorSeverity;
    message: string;
    code?: string;
    context?: Record<string, unknown>;
    stack?: string;
}

interface AlertBatch {
    errors: ErrorAlert[];
    startTime: Date;
}

// Alert tracking
let alertsSentThisHour = 0;
let lastHourReset = Date.now();
let pendingBatch: AlertBatch | null = null;
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Reset hourly alert counter
 */
function checkHourlyReset(): void {
    const now = Date.now();
    if (now - lastHourReset > 60 * 60 * 1000) {
        alertsSentThisHour = 0;
        lastHourReset = now;
    }
}

/**
 * Check if we can send more alerts this hour
 */
function canSendAlert(): boolean {
    checkHourlyReset();
    const config = getErrorHandlingConfig();
    return alertsSentThisHour < config.alerts.emailRateLimit;
}

/**
 * Format error for email body
 */
function formatErrorForEmail(error: ErrorAlert): string {
    return `
## ${error.severity}: ${error.message}

**Service:** ${error.service}
**Time:** ${error.timestamp.toISOString()}
**Code:** ${error.code || 'N/A'}

### Context
\`\`\`json
${JSON.stringify(error.context || {}, null, 2)}
\`\`\`

${error.stack ? `### Stack Trace\n\`\`\`\n${error.stack}\n\`\`\`` : ''}
---
`;
}

/**
 * Send email alert (placeholder - integrates with email service)
 */
async function sendEmailAlert(subject: string, body: string, recipients: string[]): Promise<void> {
    // This would integrate with your email service
    // For now, log the alert
    console.log(JSON.stringify({
        type: 'EMAIL_ALERT',
        timestamp: new Date().toISOString(),
        subject,
        recipients,
        bodyPreview: body.slice(0, 200) + '...',
    }));

    // In production, this would call your email service:
    // await emailService.send({
    //     to: recipients,
    //     subject,
    //     html: marked(body),  // Convert markdown to HTML
    // });
}

/**
 * Process and send batched alerts
 */
async function processBatch(): Promise<void> {
    if (!pendingBatch || pendingBatch.errors.length === 0) {
        pendingBatch = null;
        return;
    }

    const config = getErrorHandlingConfig();
    const batch = pendingBatch;
    pendingBatch = null;

    if (!canSendAlert()) {
        console.warn('Alert rate limit reached. Dropping batch of', batch.errors.length, 'errors');
        return;
    }

    // Group errors by severity
    const criticalErrors = batch.errors.filter(e => e.severity === ErrorSeverity.CRITICAL);
    const regularErrors = batch.errors.filter(e => e.severity !== ErrorSeverity.CRITICAL);

    // Build email content
    const subject = criticalErrors.length > 0
        ? `🚨 [CRITICAL] ${criticalErrors.length} critical error(s) in SmartCareerAI`
        : `⚠️ [ERROR] ${batch.errors.length} error(s) in SmartCareerAI`;

    let body = `# Error Alert Summary\n\n`;
    body += `**Time Range:** ${batch.startTime.toISOString()} - ${new Date().toISOString()}\n\n`;
    body += `**Total Errors:** ${batch.errors.length}\n`;
    body += `**Critical:** ${criticalErrors.length}\n`;
    body += `**Other:** ${regularErrors.length}\n\n`;

    // Add critical errors first
    if (criticalErrors.length > 0) {
        body += `# 🚨 Critical Errors\n\n`;
        for (const error of criticalErrors) {
            body += formatErrorForEmail(error);
        }
    }

    // Add regular errors (limit to first 5 to avoid huge emails)
    if (regularErrors.length > 0) {
        body += `# ⚠️ Other Errors\n\n`;
        const errorsToShow = regularErrors.slice(0, 5);
        for (const error of errorsToShow) {
            body += formatErrorForEmail(error);
        }
        if (regularErrors.length > 5) {
            body += `\n*...and ${regularErrors.length - 5} more errors*\n`;
        }
    }

    // Send email
    try {
        await sendEmailAlert(subject, body, config.alerts.adminEmails);
        alertsSentThisHour++;
    } catch (err) {
        console.error('Failed to send admin alert email:', err);
    }
}

/**
 * Add error to alert queue
 */
export function queueErrorAlert(
    service: string,
    severity: ErrorSeverity,
    message: string,
    options?: {
        code?: string;
        context?: Record<string, unknown>;
        stack?: string;
    }
): void {
    const config = getErrorHandlingConfig();

    // Skip non-critical if configured
    if (config.alerts.criticalErrorsOnly && severity !== ErrorSeverity.CRITICAL) {
        return;
    }

    // Skip INFO and WARNING
    if (severity === ErrorSeverity.INFO || severity === ErrorSeverity.WARNING) {
        return;
    }

    const alert: ErrorAlert = {
        timestamp: new Date(),
        service,
        severity,
        message,
        code: options?.code,
        context: options?.context,
        stack: options?.stack,
    };

    // Initialize batch if needed
    if (!pendingBatch) {
        pendingBatch = {
            errors: [],
            startTime: new Date(),
        };

        // Set timer to process batch
        if (batchTimeout) {
            clearTimeout(batchTimeout);
        }
        batchTimeout = setTimeout(() => {
            processBatch().catch(console.error);
        }, config.alerts.batchInterval);
    }

    pendingBatch.errors.push(alert);

    // Send immediately for critical errors
    if (severity === ErrorSeverity.CRITICAL) {
        if (batchTimeout) {
            clearTimeout(batchTimeout);
            batchTimeout = null;
        }
        processBatch().catch(console.error);
    }
}

/**
 * Send immediate alert (bypasses batching)
 */
export async function sendImmediateAlert(
    service: string,
    severity: ErrorSeverity,
    message: string,
    options?: {
        code?: string;
        context?: Record<string, unknown>;
        stack?: string;
    }
): Promise<void> {
    const config = getErrorHandlingConfig();

    if (!canSendAlert()) {
        console.warn('Alert rate limit reached. Skipping immediate alert.');
        return;
    }

    const alert: ErrorAlert = {
        timestamp: new Date(),
        service,
        severity,
        message,
        code: options?.code,
        context: options?.context,
        stack: options?.stack,
    };

    const subject = severity === ErrorSeverity.CRITICAL
        ? `🚨 [CRITICAL] ${service}: ${message.slice(0, 50)}`
        : `⚠️ [ERROR] ${service}: ${message.slice(0, 50)}`;

    const body = formatErrorForEmail(alert);

    await sendEmailAlert(subject, body, config.alerts.adminEmails);
    alertsSentThisHour++;
}

/**
 * Get alert service stats
 */
export function getAlertStats(): {
    alertsSentThisHour: number;
    pendingAlerts: number;
    rateLimit: number;
} {
    checkHourlyReset();
    const config = getErrorHandlingConfig();

    return {
        alertsSentThisHour,
        pendingAlerts: pendingBatch?.errors.length || 0,
        rateLimit: config.alerts.emailRateLimit,
    };
}

/**
 * Flush pending alerts (useful for shutdown)
 */
export async function flushAlerts(): Promise<void> {
    if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
    }
    await processBatch();
}

export default {
    queueErrorAlert,
    sendImmediateAlert,
    getAlertStats,
    flushAlerts,
};
