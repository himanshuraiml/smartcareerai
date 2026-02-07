import { prisma } from '../utils/prisma';

export class LeaderboardService {
    async getLeaderboard(currentUserId?: string, limit: number = 20) {
        const users = await prisma.user.findMany({
            where: { role: 'USER' },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                _count: {
                    select: {
                        resumes: true,
                        atsScores: true,
                        testAttempts: true,
                        interviews: true,
                        applications: true,
                        skillBadges: true,
                    },
                },
            },
        });

        const ranked = users.map((user) => {
            const xp =
                user._count.resumes * 100 +
                user._count.atsScores * 50 +
                user._count.testAttempts * 75 +
                user._count.interviews * 100 +
                user._count.applications * 25;

            const level = Math.floor(xp / 500) + 1;

            const nameParts = (user.name || 'Anonymous').trim().split(' ');
            const displayName =
                nameParts.length > 1
                    ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`
                    : nameParts[0];

            return {
                userId: user.id,
                name: displayName,
                avatarUrl: user.avatarUrl,
                xp,
                level,
                badges: user._count.skillBadges,
            };
        });

        ranked.sort((a, b) => b.xp - a.xp);

        const topN = ranked.slice(0, limit).map((entry, index) => ({
            ...entry,
            rank: index + 1,
        }));

        let currentUser = null;
        if (currentUserId) {
            const userIndex = ranked.findIndex((u) => u.userId === currentUserId);
            if (userIndex !== -1) {
                currentUser = {
                    ...ranked[userIndex],
                    rank: userIndex + 1,
                };
            }
        }

        return {
            leaderboard: topN,
            currentUser,
            totalParticipants: ranked.length,
        };
    }
}
