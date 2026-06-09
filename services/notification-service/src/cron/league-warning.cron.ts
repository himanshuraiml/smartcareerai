import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { notificationService } from '../services/notification.service';
import { getWeekRange } from '../utils/date';

export function setupLeagueWarningCron() {
    // Run every Friday at 6:00 PM IST (12:30 UTC)
    cron.schedule('30 12 * * 5', async () => {
        logger.info('⏰ Running weekly league demotion warning cron job...');

        try {
            const { weekStart } = getWeekRange();

            // Find all active leagues for this week
            const activeLeagues = await prisma.league.findMany({
                where: {
                    weekStart,
                    isActive: true
                },
                include: {
                    memberships: {
                        orderBy: {
                            weeklyXp: 'desc'
                        }
                    }
                }
            });

            for (const league of activeLeagues) {
                const totalMembers = league.memberships.length;
                if (totalMembers <= 10) continue; // No demotions if league is tiny

                // Demotion zone is bottom 5 users (rank 26-30 or totalMembers-4 to totalMembers)
                const demotionZone = league.memberships.slice(Math.max(0, totalMembers - 5));

                // Safe rank boundary (usually rank 25)
                const safeRankIndex = Math.max(0, totalMembers - 6);
                const safeWeeklyXp = league.memberships[safeRankIndex]?.weeklyXp || 0;

                for (let index = 0; index < demotionZone.length; index++) {
                    const membership = demotionZone[index];
                    const rank = totalMembers - demotionZone.length + index + 1;
                    const xpNeeded = Math.max(0, safeWeeklyXp - membership.weeklyXp + 10); // add 10 XP buffer

                    await notificationService.send({
                        userId: membership.userId,
                        type: 'league',
                        title: '⚠️ Demotion Zone Alert!',
                        message: `You are currently rank #${rank} in ${league.tier} League. Earn ${xpNeeded} XP to climb to safety!`,
                        category: 'urgent',
                        channels: ['in_app', 'whatsapp'],
                        metadata: {
                            rank,
                            tier: league.tier,
                            xpNeeded,
                            ctaUrl: '/dashboard/daily',
                            ctaLabel: 'Earn XP'
                        }
                    });
                }
            }
        } catch (error: any) {
            logger.error('Error executing league-warning cron:', error.message);
        }
    });
}
