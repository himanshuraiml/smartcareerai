import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface DateRange {
    startDate?: Date;
    endDate?: Date;
}

export class AnalyticsService {
    /**
     * Get dashboard overview metrics
     */
    async getOverview() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            newUsersThisMonth,
            newUsersThisWeek,
            totalResumes,
            totalInterviews,
            totalTests,
            activeSubscriptions,
            revenueStats,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: { createdAt: { gte: thirtyDaysAgo } },
            }),
            prisma.user.count({
                where: { createdAt: { gte: sevenDaysAgo } },
            }),
            prisma.resume.count(),
            prisma.interviewSession.count(),
            prisma.testAttempt.count(),
            prisma.userSubscription.count({
                where: { status: 'ACTIVE' },
            }),
            this.getRevenueStats(thirtyDaysAgo),
        ]);

        return {
            users: {
                total: totalUsers,
                newThisMonth: newUsersThisMonth,
                newThisWeek: newUsersThisWeek,
            },
            activity: {
                resumes: totalResumes,
                interviews: totalInterviews,
                tests: totalTests,
            },
            subscriptions: {
                active: activeSubscriptions,
            },
            revenue: revenueStats,
        };
    }

    /**
     * Get user growth over time
     */
    async getUserGrowth(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const users = await prisma.user.findMany({
            where: { createdAt: { gte: startDate } },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        // Group by date
        const growth: Record<string, number> = {};
        users.forEach(user => {
            const date = user.createdAt.toISOString().split('T')[0];
            growth[date] = (growth[date] || 0) + 1;
        });

        return Object.entries(growth).map(([date, count]) => ({ date, count }));
    }

    /**
     * Get subscription distribution
     */
    async getSubscriptionDistribution() {
        const subscriptions = await prisma.userSubscription.groupBy({
            by: ['planId'],
            where: { status: 'ACTIVE' },
            _count: { planId: true },
        });

        const plans = await prisma.subscriptionPlan.findMany();
        const planMap = new Map(plans.map(p => [p.id, p.displayName]));

        return subscriptions.map(sub => ({
            plan: planMap.get(sub.planId) || 'Unknown',
            count: sub._count.planId,
        }));
    }

    /**
     * Get revenue statistics
     */
    async getRevenueStats(startDate?: Date) {
        // This would typically integrate with Razorpay API
        // For now, we'll calculate based on active subscriptions
        const activeSubscriptions = await prisma.userSubscription.findMany({
            where: {
                status: 'ACTIVE',
                ...(startDate && { createdAt: { gte: startDate } }),
            },
            include: { plan: true },
        });

        let mrr = 0;
        activeSubscriptions.forEach(sub => {
            mrr += Number(sub.plan.priceMonthly);
        });

        return {
            mrr,
            arr: mrr * 12,
            activeSubscribers: activeSubscriptions.length,
        };
    }

    /**
     * Get feature usage statistics
     */
    async getFeatureUsage(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [resumeScores, interviews, tests] = await Promise.all([
            prisma.atsScore.count({
                where: { createdAt: { gte: startDate } },
            }),
            prisma.interviewSession.count({
                where: { createdAt: { gte: startDate } },
            }),
            prisma.testAttempt.count({
                where: { startedAt: { gte: startDate } },
            }),
        ]);

        return {
            resumeScores,
            interviews,
            tests,
            period: `Last ${days} days`,
        };
    }

    /**
     * Get top job roles being analyzed
     */
    async getTopJobRoles(limit = 10) {
        const roles = await prisma.atsScore.groupBy({
            by: ['jobRole'],
            _count: { jobRole: true },
            orderBy: { _count: { jobRole: 'desc' } },
            take: limit,
        });

        return roles.map(r => ({
            role: r.jobRole,
            count: r._count.jobRole,
        }));
    }
}

export const analyticsService = new AnalyticsService();
