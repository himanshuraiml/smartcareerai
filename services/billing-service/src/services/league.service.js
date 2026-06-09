"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leagueService = exports.LeagueService = void 0;
exports.getWeekRange = getWeekRange;
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
/**
 * Get current week range in IST (which starts Monday 00:00 IST / Sunday 18:30 UTC)
 */
function getWeekRange(date = new Date()) {
    const now = new Date(date);
    const day = now.getUTCDay();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    let diffDays = day;
    // If it's Sunday before 18:30 UTC, it belongs to the previous week
    if (day === 0 && (hours < 18 || (hours === 18 && minutes < 30))) {
        diffDays = 7;
    }
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - diffDays);
    weekStart.setUTCHours(18, 30, 0, 0);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000);
    return { weekStart, weekEnd };
}
const TIER_ORDER = [
    client_1.LeagueTier.BRONZE,
    client_1.LeagueTier.SILVER,
    client_1.LeagueTier.GOLD,
    client_1.LeagueTier.PLATINUM,
    client_1.LeagueTier.DIAMOND,
];
class LeagueService {
    /**
     * Assign a user to a league for the current week.
     * Finds an existing league with space (< 30 members) or creates a new one.
     */
    async assignNewUser(userId, tier = client_1.LeagueTier.BRONZE) {
        const { weekStart, weekEnd } = getWeekRange();
        // 1. Check if user already has a membership for this week
        const existingMembership = await prisma_1.prisma.leagueMembership.findFirst({
            where: {
                userId,
                league: {
                    weekStart,
                },
            },
            include: {
                league: true,
            },
        });
        if (existingMembership) {
            return existingMembership;
        }
        // 2. Find a league in this tier for the current week that is not full (< 30 members)
        const leagues = await prisma_1.prisma.league.findMany({
            where: {
                tier,
                weekStart,
                isActive: true,
            },
            include: {
                _count: {
                    select: { memberships: true },
                },
            },
            orderBy: {
                groupIndex: 'asc',
            },
        });
        let targetLeague = leagues.find((l) => l._count.memberships < 30);
        if (!targetLeague) {
            // Create a new league group
            const groupIndex = leagues.length;
            targetLeague = await prisma_1.prisma.league.create({
                data: {
                    tier,
                    weekStart,
                    weekEnd,
                    groupIndex,
                    isActive: true,
                },
            });
            logger_1.logger.info(`Created new ${tier} league (group index: ${groupIndex}) for week starting ${weekStart.toISOString()}`);
        }
        // Check if user has a demotion shield from previous week's top 3 finish
        // We will look up if they have any unused shield. In our schema, shields are stored on the membership.
        // Let's see if the user was awarded a shield in the previous week's membership.
        const lastWeekRange = getWeekRange(new Date(weekStart.getTime() - 24 * 60 * 60 * 1000));
        const lastWeekMembership = await prisma_1.prisma.leagueMembership.findFirst({
            where: {
                userId,
                league: {
                    weekStart: lastWeekRange.weekStart,
                },
            },
            include: {
                league: true,
            },
        });
        const carriesShield = lastWeekMembership ? lastWeekMembership.outcome === client_1.LeagueOutcome.PROMOTED && lastWeekMembership.rank !== null && lastWeekMembership.rank <= 3 : false;
        // 3. Create membership
        const membership = await prisma_1.prisma.leagueMembership.create({
            data: {
                userId,
                leagueId: targetLeague.id,
                hasShield: carriesShield,
            },
            include: {
                league: true,
            },
        });
        logger_1.logger.info(`Assigned user ${userId} to league ${targetLeague.id} (${tier})`);
        return membership;
    }
    /**
     * Get user's current league info and position
     */
    async getUserLeague(userId) {
        const { weekStart } = getWeekRange();
        let membership = await prisma_1.prisma.leagueMembership.findFirst({
            where: {
                userId,
                league: {
                    weekStart,
                },
            },
            include: {
                league: true,
            },
        });
        // Auto-assign to Bronze if not in any league
        if (!membership) {
            // Check if they had a previous week's membership to inherit the tier
            const lastWeekRange = getWeekRange(new Date(weekStart.getTime() - 24 * 60 * 60 * 1000));
            const lastWeekMembership = await prisma_1.prisma.leagueMembership.findFirst({
                where: {
                    userId,
                    league: {
                        weekStart: lastWeekRange.weekStart,
                    },
                },
                include: {
                    league: true,
                },
            });
            let targetTier = client_1.LeagueTier.BRONZE;
            if (lastWeekMembership && lastWeekMembership.outcome) {
                const currentTierIndex = TIER_ORDER.indexOf(lastWeekMembership.league.tier);
                if (lastWeekMembership.outcome === client_1.LeagueOutcome.PROMOTED && currentTierIndex < TIER_ORDER.length - 1) {
                    targetTier = TIER_ORDER[currentTierIndex + 1];
                }
                else if (lastWeekMembership.outcome === client_1.LeagueOutcome.DEMOTED && currentTierIndex > 0) {
                    targetTier = TIER_ORDER[currentTierIndex - 1];
                }
                else {
                    targetTier = lastWeekMembership.league.tier;
                }
            }
            membership = await this.assignNewUser(userId, targetTier);
        }
        // Get full leaderboard to calculate current rank dynamically
        const leaderboard = await this.getLeagueLeaderboard(membership.leagueId);
        const userPosition = leaderboard.find((m) => m.userId === userId);
        return {
            membership,
            rank: userPosition?.rank || 1,
            leaderboard,
        };
    }
    /**
     * Get league leaderboard
     */
    async getLeagueLeaderboard(leagueId) {
        const memberships = await prisma_1.prisma.leagueMembership.findMany({
            where: {
                leagueId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        xp: true,
                    },
                },
            },
            orderBy: {
                weeklyXp: 'desc',
            },
        });
        return memberships.map((m, index) => ({
            id: m.id,
            userId: m.userId,
            userName: m.user.name || 'Anonymous Student',
            userAvatar: m.user.avatarUrl,
            weeklyXp: m.weeklyXp,
            hasShield: m.hasShield,
            rank: index + 1,
        }));
    }
    /**
     * Increment weekly XP for user in their current league
     */
    async addWeeklyXp(userId, xpAmount) {
        const { weekStart } = getWeekRange();
        const membership = await prisma_1.prisma.leagueMembership.findFirst({
            where: {
                userId,
                league: {
                    weekStart,
                    isActive: true,
                },
            },
        });
        if (membership) {
            await prisma_1.prisma.leagueMembership.update({
                where: { id: membership.id },
                data: {
                    weeklyXp: { increment: xpAmount },
                    daysActive: { increment: 1 }, // simplified active days tracker
                },
            });
            logger_1.logger.info(`Incremented weekly XP by ${xpAmount} for user ${userId} in membership ${membership.id}`);
        }
        else {
            // Assign user first if they aren't assigned
            const newMembership = await this.assignNewUser(userId);
            await prisma_1.prisma.leagueMembership.update({
                where: { id: newMembership.id },
                data: {
                    weeklyXp: { increment: xpAmount },
                    daysActive: 1,
                },
            });
        }
    }
    /**
     * Process weekly reset: promotion, demotion, shield consumption, new leagues creation.
     * Run every Monday at 00:00 IST (Sunday 18:30 UTC).
     */
    async processWeeklyReset() {
        const { weekStart: currentWeekStart } = getWeekRange();
        // Last week's start is 7 days before current week start
        const lastWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        logger_1.logger.info(`Processing weekly league reset for week: ${lastWeekStart.toISOString()}`);
        // Find all active leagues for last week
        const activeLeagues = await prisma_1.prisma.league.findMany({
            where: {
                weekStart: lastWeekStart,
                isActive: true,
            },
            include: {
                memberships: {
                    orderBy: {
                        weeklyXp: 'desc',
                    },
                },
            },
        });
        let promotions = 0;
        let demotions = 0;
        let stays = 0;
        let shieldsUsed = 0;
        for (const league of activeLeagues) {
            const memberCount = league.memberships.length;
            if (memberCount === 0) {
                // Empty league, just close it
                await prisma_1.prisma.league.update({
                    where: { id: league.id },
                    data: { isActive: false, processedAt: new Date() },
                });
                continue;
            }
            const tierIndex = TIER_ORDER.indexOf(league.tier);
            for (let index = 0; index < memberCount; index++) {
                const membership = league.memberships[index];
                const rank = index + 1;
                let outcome = client_1.LeagueOutcome.STAYED;
                let newTier = league.tier;
                if (rank <= 10) {
                    // Promotion zone
                    if (tierIndex < TIER_ORDER.length - 1) {
                        outcome = client_1.LeagueOutcome.PROMOTED;
                        newTier = TIER_ORDER[tierIndex + 1];
                        promotions++;
                    }
                    else {
                        outcome = client_1.LeagueOutcome.STAYED; // Already Diamond
                        stays++;
                    }
                }
                else if (rank >= 26) {
                    // Demotion zone
                    if (membership.hasShield) {
                        outcome = client_1.LeagueOutcome.SHIELDED;
                        // Keep current tier, shield consumed
                        shieldsUsed++;
                        stays++;
                    }
                    else if (tierIndex > 0) {
                        outcome = client_1.LeagueOutcome.DEMOTED;
                        newTier = TIER_ORDER[tierIndex - 1];
                        demotions++;
                    }
                    else {
                        outcome = client_1.LeagueOutcome.STAYED; // Already Bronze
                        stays++;
                    }
                }
                else {
                    outcome = client_1.LeagueOutcome.STAYED;
                    stays++;
                }
                // Update outcome on the membership
                await prisma_1.prisma.leagueMembership.update({
                    where: { id: membership.id },
                    data: {
                        rank,
                        outcome,
                        hasShield: outcome === client_1.LeagueOutcome.SHIELDED ? false : membership.hasShield,
                    },
                });
                // Archive to user league history
                await prisma_1.prisma.userLeagueHistory.create({
                    data: {
                        userId: membership.userId,
                        weekStart: lastWeekStart,
                        tier: league.tier,
                        finalRank: rank,
                        weeklyXp: membership.weeklyXp,
                        outcome,
                    },
                });
                // Award XP for promotion/top performance
                let xpBonus = 0;
                if (outcome === client_1.LeagueOutcome.PROMOTED) {
                    xpBonus = 200;
                    if (rank <= 3) {
                        xpBonus = 300; // Top 3 gets 300 XP
                    }
                }
                if (xpBonus > 0) {
                    await prisma_1.prisma.user.update({
                        where: { id: membership.userId },
                        data: { xp: { increment: xpBonus } },
                    });
                }
                // Send notification
                let title = 'League Week Ended';
                let message = `You finished rank #${rank} in the ${league.tier} league with ${membership.weeklyXp} XP.`;
                if (outcome === client_1.LeagueOutcome.PROMOTED) {
                    title = '🎉 You Promoted!';
                    message = `Congratulations! You promoted to the ${newTier} League. Keep up the placement habit!`;
                }
                else if (outcome === client_1.LeagueOutcome.DEMOTED) {
                    title = '⚠️ You Demoted';
                    message = `You finished in the demotion zone and fell back to the ${newTier} League. Grind harder this week!`;
                }
                else if (outcome === client_1.LeagueOutcome.SHIELDED) {
                    title = '🛡️ Shield Activated';
                    message = `Your demotion shield saved you! You stay in the ${league.tier} League.`;
                }
                await prisma_1.prisma.notification.create({
                    data: {
                        userId: membership.userId,
                        type: outcome === client_1.LeagueOutcome.PROMOTED ? 'league_promotion' : 'league_demotion',
                        title,
                        message,
                        metadata: {
                            rank,
                            oldTier: league.tier,
                            newTier,
                            outcome,
                            weeklyXp: membership.weeklyXp,
                        },
                    },
                });
                // Auto-assign user to the new week's league
                await this.assignNewUser(membership.userId, newTier);
            }
            // Close the old league
            await prisma_1.prisma.league.update({
                where: { id: league.id },
                data: { isActive: false, processedAt: new Date() },
            });
        }
        logger_1.logger.info(`Weekly reset processing completed successfully: ${promotions} promotions, ${demotions} demotions, ${stays} stays, ${shieldsUsed} shields used.`);
        return { promotions, demotions, stays, shieldsUsed };
    }
    /**
     * Get league history for profile
     */
    async getLeagueHistory(userId) {
        return prisma_1.prisma.userLeagueHistory.findMany({
            where: { userId },
            orderBy: { weekStart: 'desc' },
        });
    }
    /**
     * Get last week's result for display in the promotion modal
     */
    async getLastWeekResult(userId) {
        const { weekStart } = getWeekRange();
        const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastWeekHistory = await prisma_1.prisma.userLeagueHistory.findFirst({
            where: {
                userId,
                weekStart: lastWeekStart,
            },
        });
        if (!lastWeekHistory)
            return null;
        return {
            tier: lastWeekHistory.tier,
            rank: lastWeekHistory.finalRank,
            weeklyXp: lastWeekHistory.weeklyXp,
            outcome: lastWeekHistory.outcome,
            weekStart: lastWeekHistory.weekStart,
        };
    }
    /**
     * Setup database trigger to sync users.xp increments with weekly league membership XP.
     */
    async setupXpTrigger() {
        const createFunctionSql = `
            CREATE OR REPLACE FUNCTION sync_weekly_xp()
            RETURNS TRIGGER AS $$
            DECLARE
                active_membership_id VARCHAR;
                week_start_date DATE;
            BEGIN
                IF NEW.xp > OLD.xp THEN
                    -- Calculate current week's Sunday 18:30 UTC start date
                    SELECT CAST(
                        date_trunc('week', timezone('UTC', now()) + INTERVAL '5 hours 30 minutes') - INTERVAL '5 hours 30 minutes'
                        AS DATE
                    ) INTO week_start_date;

                    SELECT lm.id INTO active_membership_id
                    FROM league_memberships lm
                    JOIN leagues l ON lm.league_id = l.id
                    WHERE lm.user_id = NEW.id AND l.week_start = week_start_date AND l.is_active = true
                    LIMIT 1;

                    IF active_membership_id IS NOT NULL THEN
                        UPDATE league_memberships
                        SET weekly_xp = weekly_xp + (NEW.xp - OLD.xp),
                            days_active = days_active + 1
                        WHERE id = active_membership_id;
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;
        try {
            await prisma_1.prisma.$executeRawUnsafe(createFunctionSql);
            await prisma_1.prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_sync_weekly_xp ON users;`);
            await prisma_1.prisma.$executeRawUnsafe(`
                CREATE TRIGGER trg_sync_weekly_xp
                AFTER UPDATE OF xp ON users
                FOR EACH ROW
                EXECUTE FUNCTION sync_weekly_xp();
            `);
            logger_1.logger.info('Database trigger trg_sync_weekly_xp created successfully.');
        }
        catch (error) {
            logger_1.logger.error('Error creating database trigger trg_sync_weekly_xp:', error);
        }
    }
}
exports.LeagueService = LeagueService;
exports.leagueService = new LeagueService();
//# sourceMappingURL=league.service.js.map