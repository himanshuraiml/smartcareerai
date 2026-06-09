export interface WeekRange {
    weekStart: Date;
    weekEnd: Date;
}

/**
 * Get current week range in IST (which starts Monday 00:00 IST / Sunday 18:30 UTC)
 */
export function getWeekRange(date = new Date()): WeekRange {
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
