import { LeagueTier } from '@prisma/client';
export interface WeekRange {
    weekStart: Date;
    weekEnd: Date;
}
/**
 * Get current week range in IST (which starts Monday 00:00 IST / Sunday 18:30 UTC)
 */
export declare function getWeekRange(date?: Date): WeekRange;
export declare class LeagueService {
    /**
     * Assign a user to a league for the current week.
     * Finds an existing league with space (< 30 members) or creates a new one.
     */
    assignNewUser(userId: string, tier?: LeagueTier): Promise<any>;
    /**
     * Get user's current league info and position
     */
    getUserLeague(userId: string): Promise<any>;
    /**
     * Get league leaderboard
     */
    getLeagueLeaderboard(leagueId: string): Promise<any[]>;
    /**
     * Increment weekly XP for user in their current league
     */
    addWeeklyXp(userId: string, xpAmount: number): Promise<void>;
    /**
     * Process weekly reset: promotion, demotion, shield consumption, new leagues creation.
     * Run every Monday at 00:00 IST (Sunday 18:30 UTC).
     */
    processWeeklyReset(): Promise<any>;
    /**
     * Get league history for profile
     */
    getLeagueHistory(userId: string): Promise<any[]>;
    /**
     * Get last week's result for display in the promotion modal
     */
    getLastWeekResult(userId: string): Promise<any>;
    /**
     * Setup database trigger to sync users.xp increments with weekly league membership XP.
     */
    setupXpTrigger(): Promise<void>;
}
export declare const leagueService: LeagueService;
//# sourceMappingURL=league.service.d.ts.map