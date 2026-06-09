import cron from 'node-cron';
import { leagueService } from '../services/league.service';
import { logger } from '../utils/logger';

// Schedule to run every Monday at 00:00 IST.
// Monday 00:00 IST is Sunday 18:30 UTC.
// Cron expression for 18:30 on Sunday: '30 18 * * 0'
export function setupLeagueResetCron() {
    // Register DB trigger on startup
    leagueService.setupXpTrigger().catch((err) => {
        logger.error('Failed to setup DB trigger on startup:', err);
    });

    cron.schedule('30 18 * * 0', async () => {
        logger.info('⏰ Cron triggered: Weekly league reset started...');
        try {
            const result = await leagueService.processWeeklyReset();
            logger.info(`⏰ Cron finished: Weekly league reset complete! Promotions: ${result.promotions}, Demotions: ${result.demotions}`);
        } catch (error) {
            logger.error('⏰ Cron error: Weekly league reset failed:', error);
        }
    });
    logger.info('⏰ Weekly league reset cron job scheduled (Sunday 18:30 UTC / Monday 00:00 IST).');
}
