import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { emailDigestService } from '../services/email-digest.service';

export function setupWeeklyDigestCron() {
    // Run every Sunday at 10:00 AM IST (04:30 UTC)
    cron.schedule('30 4 * * 0', async () => {
        logger.info('⏰ Starting weekly digest compilation and dispatch...');

        try {
            // Find all users who have emailEnabled preference
            const users = await prisma.user.findMany({
                where: {
                    isVerified: true,
                    notificationPreference: {
                        emailEnabled: true
                    }
                }
            });

            logger.info(`Found ${users.length} verified users subscribed to weekly digest.`);

            for (const user of users) {
                // Skip if user has been inactive for more than 60 days
                if (user.lastLoginAt) {
                    const daysInactive = Math.floor((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24));
                    if (daysInactive > 60) {
                        logger.info(`Skipping weekly digest for inactive user ${user.id} (${daysInactive} days inactive)`);
                        continue;
                    }
                }

                await emailDigestService.sendWeeklyDigest(user.id, user.email);

                // Sleep 100ms to avoid rate limits
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            logger.info('Weekly digest dispatch completed successfully.');
        } catch (error: any) {
            logger.error('Error executing weekly-digest cron:', error.message);
        }
    });
}
