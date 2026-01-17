import cron from 'node-cron';
import { JobAggregatorService } from './services/job-aggregator.service';
import { logger } from './utils/logger';

export const startCronJobs = () => {
    const aggregator = new JobAggregatorService();

    // Schedule task to run every 6 hours
    // "0 */12* * *" = 
    cron.schedule('0 */12 * * *', async () => {
        logger.info('Starting scheduled job sync (every 6 hours)...');
        try {
            await aggregator.syncAllJobs();
            logger.info('Scheduled job sync completed successfully.');
        } catch (error) {
            logger.error('Scheduled job sync failed:', error);
        }
    });

    logger.info('Job Scraper Cron initialized (0 */6 * * *)');
};
