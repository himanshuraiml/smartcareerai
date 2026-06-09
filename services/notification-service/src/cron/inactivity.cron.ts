import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { emailDigestService } from '../services/email-digest.service';

export function setupInactivityCron() {
    // Run daily at 11:00 AM IST (05:30 UTC)
    cron.schedule('30 5 * * *', async () => {
        logger.info('⏰ Running daily user inactivity re-engagement check...');

        try {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Find users whose lastLoginAt is between 3 and 7 days ago,
            // who are verified, and have email notifications enabled.
            const users = await prisma.user.findMany({
                where: {
                    lastLoginAt: {
                        lte: threeDaysAgo,
                        gte: sevenDaysAgo
                    },
                    isVerified: true,
                    notificationPreference: {
                        emailEnabled: true
                    }
                }
            });

            logger.info(`Found ${users.length} users in the 3-7 days inactivity window.`);

            for (const user of users) {
                // Ensure we don't send multiple re-engagement alerts in the same week
                const alreadySent = await prisma.notification.findFirst({
                    where: {
                        userId: user.id,
                        type: 'general',
                        title: { contains: 'miss you' },
                        createdAt: { gte: sevenDaysAgo }
                    }
                });

                if (alreadySent) continue;

                const inactiveDays = Math.floor((Date.now() - new Date(user.lastLoginAt!).getTime()) / (1000 * 60 * 60 * 24));

                await emailDigestService.sendReEngagementEmail(user.id, user.email, inactiveDays);

                // Create a notification log in DB
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        type: 'general',
                        title: 'We miss you!',
                        message: `It has been ${inactiveDays} days since you last practiced. Keep your streak alive!`,
                        category: 'info',
                        channels: ['email']
                    }
                });

                // Sleep 100ms
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        } catch (error: any) {
            logger.error('Error executing inactivity cron:', error.message);
        }
    });
}
