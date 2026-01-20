import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface InstitutionStudentFilters {
    search?: string;
    targetJobRoleId?: string;
    minScore?: number;
    maxScore?: number;
    isActive?: boolean; // Active in last 30 days
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'score' | 'lastActive';
    sortOrder?: 'asc' | 'desc';
}

class InstitutionService {
    /**
     * Get dashboard overview for an institution
     */
    async getDashboard(institutionId: string) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Total students in this institution
        const totalStudents = await prisma.user.count({
            where: { institutionId, role: UserRole.USER },
        });

        // Active students (have interview sessions in last 30 days)
        const activeStudents = await prisma.user.count({
            where: {
                institutionId,
                role: UserRole.USER,
                interviews: {
                    some: {
                        createdAt: { gte: thirtyDaysAgo },
                    },
                },
            },
        });

        // Average interview score
        const avgScoreResult = await prisma.interviewSession.aggregate({
            where: {
                user: { institutionId },
                overallScore: { not: null },
            },
            _avg: { overallScore: true },
        });
        const averageScore = Math.round(avgScoreResult._avg.overallScore || 0);

        // Total interviews conducted
        const totalInterviews = await prisma.interviewSession.count({
            where: {
                user: { institutionId },
                status: 'COMPLETED',
            },
        });

        // Role distribution
        const roleDistribution = await prisma.user.groupBy({
            by: ['targetJobRoleId'],
            where: {
                institutionId,
                targetJobRoleId: { not: null },
            },
            _count: { id: true },
        });

        // Fetch role names for the distribution
        const roleIds = roleDistribution.map((r) => r.targetJobRoleId).filter(Boolean) as string[];
        const roles = await prisma.jobRole.findMany({
            where: { id: { in: roleIds } },
            select: { id: true, title: true },
        });
        const roleMap = Object.fromEntries(roles.map((r) => [r.id, r.title]));

        const formattedRoleDistribution = roleDistribution.map((r) => ({
            roleName: r.targetJobRoleId ? roleMap[r.targetJobRoleId] || 'Unknown' : 'Not Set',
            count: r._count.id,
        }));

        // Activity trend (last 7 days)
        const activityTrend: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await prisma.interviewSession.count({
                where: {
                    user: { institutionId },
                    createdAt: { gte: date, lt: nextDate },
                },
            });
            activityTrend.push({ date: date.toISOString().split('T')[0], count });
        }

        return {
            totalStudents,
            activeStudents,
            averageScore,
            totalInterviews,
            roleDistribution: formattedRoleDistribution,
            activityTrend,
        };
    }

    /**
     * Get paginated and filtered list of students for an institution
     */
    async getStudents(institutionId: string, filters: InstitutionStudentFilters) {
        const {
            search,
            targetJobRoleId,
            minScore,
            isActive,
            page = 1,
            limit = 20,
            sortBy = 'name',
            sortOrder = 'asc',
        } = filters;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const where: any = {
            institutionId,
            role: UserRole.USER,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (targetJobRoleId) {
            where.targetJobRoleId = targetJobRoleId;
        }

        if (isActive !== undefined) {
            if (isActive) {
                where.interviews = { some: { createdAt: { gte: thirtyDaysAgo } } };
            } else {
                where.interviews = { none: { createdAt: { gte: thirtyDaysAgo } } };
            }
        }

        // Build orderBy
        let orderBy: any = {};
        if (sortBy === 'name') {
            orderBy = { name: sortOrder };
        } else if (sortBy === 'lastActive') {
            orderBy = { updatedAt: sortOrder };
        }

        const [students, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    targetJobRole: { select: { id: true, title: true } },
                    interviews: {
                        select: { overallScore: true, status: true },
                        where: { status: 'COMPLETED' },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        // Calculate average score for each student
        const studentsWithScore = students.map((student) => {
            const completedInterviews = student.interviews;
            const scores = completedInterviews
                .map((i) => i.overallScore)
                .filter((s): s is number => s !== null);
            const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                avatarUrl: student.avatarUrl,
                targetJobRole: student.targetJobRole,
                averageScore: avgScore,
                interviewCount: completedInterviews.length,
                lastActive: student.updatedAt,
                createdAt: student.createdAt,
            };
        });

        // Filter by score if provided (post-query filter as it's computed)
        let filteredStudents = studentsWithScore;
        if (minScore !== undefined) {
            filteredStudents = studentsWithScore.filter(
                (s) => s.averageScore !== null && s.averageScore >= minScore
            );
        }

        // Sort by score if requested (post-query sort)
        if (sortBy === 'score') {
            filteredStudents.sort((a, b) => {
                const scoreA = a.averageScore ?? -1;
                const scoreB = b.averageScore ?? -1;
                return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
            });
        }

        return {
            students: filteredStudents,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get detailed student profile for institution view
     */
    async getStudentById(institutionId: string, studentId: string) {
        const student = await prisma.user.findFirst({
            where: {
                id: studentId,
                institutionId,
                role: UserRole.USER,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                targetJobRole: { select: { id: true, title: true, category: true } },
                interviews: {
                    select: {
                        id: true,
                        type: true,
                        targetRole: true,
                        difficulty: true,
                        status: true,
                        overallScore: true,
                        feedback: true,
                        completedAt: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                skillBadges: {
                    select: {
                        id: true,
                        badgeType: true,
                        issuedAt: true,
                        skill: { select: { id: true, name: true, category: true } },
                    },
                },
                atsScores: {
                    select: {
                        id: true,
                        jobRole: true,
                        overallScore: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!student) {
            throw new Error('Student not found or does not belong to this institution');
        }

        // Calculate summary stats
        const completedInterviews = student.interviews.filter((i) => i.status === 'COMPLETED');
        const scores = completedInterviews.map((i) => i.overallScore).filter((s): s is number => s !== null);
        const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

        return {
            ...student,
            summary: {
                averageInterviewScore: averageScore,
                totalInterviews: completedInterviews.length,
                badgesEarned: student.skillBadges.length,
                latestAtsScore: student.atsScores[0]?.overallScore ?? null,
            },
        };
    }

    /**
     * Get institution settings
     */
    async getInstitution(institutionId: string) {
        return prisma.institution.findUnique({
            where: { id: institutionId },
        });
    }

    /**
     * Update institution settings
     */
    async updateInstitution(institutionId: string, data: { name?: string; logoUrl?: string; address?: string }) {
        return prisma.institution.update({
            where: { id: institutionId },
            data,
        });
    }
}

export const institutionService = new InstitutionService();
