import cron from 'node-cron';
import { EmailTrackingService } from '../services/email-tracking.service';
import { logger } from '../utils/logger';

const emailTrackingService = new EmailTrackingService();

/**
 * Start the email scanning cron job
 */
export function startEmailScanJob(): void {
    const schedule = process.env.SCAN_CRON_SCHEDULE || '*/5 * * * *'; // Default: every 5 minutes

    logger.info(`Starting email scan job with schedule: ${schedule}`);

    cron.schedule(schedule, async () => {
        logger.info('Running scheduled email scan...');

        try {
            await emailTrackingService.syncAllActiveConnections();
            logger.info('Scheduled email scan completed');
        } catch (error) {
            logger.error('Scheduled email scan failed:', error);
        }
    });
}
