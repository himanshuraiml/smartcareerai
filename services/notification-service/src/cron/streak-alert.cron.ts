import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { notificationService } from '../services/notification.service';
import { getWeekRange } from '../utils/date';

export function setupStreakAlertCron() {
    // Run daily at 6:00 PM IST (12:30 UTC)
    cron.schedule('30 12 * * *', async () => {
        logger.info('⏰ Running daily streak-at-risk cron job...');

        try {
            // Get current week start
            const { weekStart } = getWeekRange();
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            // Find all users who:
            // 1. Have active streak > 0
            // 2. Haven't completed any daily challenge today
            const users = await prisma.user.findMany({
                where: {
                    streakCount: { gt: 0 },
                    dailyChallengeCompletions: {
                        none: {
                            completedAt: { gte: todayStart }
                        }
                    }
                },
                include: {
                    notificationPreference: true
                }
            });

            logger.info(`Found ${users.length} users with active streaks at risk.`);

            for (const user of users) {
                // Ensure we don't spam if already sent today
                const alreadySent = await prisma.notification.findFirst({
                    where: {
                        userId: user.id,
                        type: 'streak',
                        createdAt: { gte: todayStart }
                    }
                });

                if (alreadySent) continue;

                // Send notification
                await notificationService.send({
                    userId: user.id,
                    type: 'streak',
                    title: '🔥 Your streak is at risk!',
                    message: `Practice today to keep your ${user.streakCount}-day streak alive!`,
                    category: 'warning',
                    channels: ['in_app', 'whatsapp'],
                    metadata: {
                        streakCount: user.streakCount,
                        ctaUrl: '/dashboard/daily',
                        ctaLabel: 'Keep Streak'
                    }
                });
            }
        } catch (error: any) {
            logger.error('Error executing streak-at-risk cron:', error.message);
        }
    });
}
