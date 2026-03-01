import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';

const DAILY_REWARD_XP = 25;
const STREAK_MILESTONE_DAYS = 7;
const STREAK_MILESTONE_CREDIT_TYPE = 'AI_INTERVIEW';
const STREAK_MILESTONE_CREDIT_AMOUNT = 1;

export class EngagementService {
    /**
     * Called on every login. Checks streak, grants daily XP reward.
     * Returns current streak info.
     */
    async processDailyLogin(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, lastLoginAt: true, streakCount: true, xp: true },
        });

        if (!user) throw createError('User not found', 404, 'USER_NOT_FOUND');

        const now = new Date();
        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;

        // Determine if today's reward has already been claimed
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const alreadyClaimed = lastLogin && lastLogin >= todayStart;

        if (alreadyClaimed) {
            // Just return current state — no double-reward
            return {
                streakCount: user.streakCount || 0,
                xp: user.xp || 0,
                rewardGranted: false,
                message: 'Daily reward already claimed today.',
                milestoneReached: false,
            };
        }

        // Check if streak continues (last login was yesterday)
        const yesterday = new Date(todayStart);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayStart = new Date(yesterday);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);

        let newStreakCount: number;
        if (lastLogin && lastLogin >= yesterdayStart && lastLogin <= yesterdayEnd) {
            // Continuing streak
            newStreakCount = (user.streakCount || 0) + 1;
        } else if (!lastLogin) {
            // First ever login
            newStreakCount = 1;
        } else {
            // Streak broken — reset to 1
            newStreakCount = 1;
        }

        const newXp = (user.xp || 0) + DAILY_REWARD_XP;

        // Check for streak milestone
        const milestoneReached = newStreakCount > 0 && newStreakCount % STREAK_MILESTONE_DAYS === 0;

        // Update user in DB
        await prisma.user.update({
            where: { id: userId },
            data: {
                lastLoginAt: now,
                streakCount: newStreakCount,
                xp: newXp,
            },
        });

        // Grant milestone credit if applicable
        if (milestoneReached) {
            await prisma.userCredit.upsert({
                where: { userId_creditType: { userId, creditType: STREAK_MILESTONE_CREDIT_TYPE } },
                create: { userId, creditType: STREAK_MILESTONE_CREDIT_TYPE, balance: STREAK_MILESTONE_CREDIT_AMOUNT },
                update: { balance: { increment: STREAK_MILESTONE_CREDIT_AMOUNT } },
            });

            await prisma.creditTransaction.create({
                data: {
                    userId,
                    creditType: STREAK_MILESTONE_CREDIT_TYPE,
                    amount: STREAK_MILESTONE_CREDIT_AMOUNT,
                    transactionType: 'GRANT',
                    description: `🔥 ${newStreakCount}-day streak milestone reward!`,
                },
            });

            logger.info(`Streak milestone: ${newStreakCount} days for user ${userId} → granted 1 AI Interview credit`);
        }

        logger.info(`Daily login processed for user ${userId}: streak=${newStreakCount}, xp=${newXp}`);

        return {
            streakCount: newStreakCount,
            xp: newXp,
            rewardGranted: true,
            xpGranted: DAILY_REWARD_XP,
            milestoneReached,
            milestoneDetails: milestoneReached
                ? { days: newStreakCount, creditType: STREAK_MILESTONE_CREDIT_TYPE, amount: STREAK_MILESTONE_CREDIT_AMOUNT }
                : null,
            nextMilestone: STREAK_MILESTONE_DAYS - (newStreakCount % STREAK_MILESTONE_DAYS),
        };
    }

    /**
     * Get user's current engagement stats (streak, XP, level)
     */
    async getEngagementStats(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, lastLoginAt: true, streakCount: true, xp: true },
        });

        if (!user) throw createError('User not found', 404, 'USER_NOT_FOUND');

        const xp = user.xp || 0;
        const streakCount = user.streakCount || 0;
        const level = Math.floor(xp / 500) + 1;
        const xpToNextLevel = 500 - (xp % 500);

        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
        const rewardAvailable = !lastLogin || lastLogin < todayStart;

        return {
            streakCount,
            xp,
            level,
            xpToNextLevel,
            xpInCurrentLevel: xp % 500,
            rewardAvailable,
            nextMilestoneDays: STREAK_MILESTONE_DAYS - (streakCount % STREAK_MILESTONE_DAYS),
            lastLoginAt: user.lastLoginAt,
        };
    }
}

export const engagementService = new EngagementService();
