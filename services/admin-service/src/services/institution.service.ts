import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface InstitutionStudentFilters {
    search?: string;
    targetJobRoleId?: string;
    minScore?: number;
    maxScore?: number;
    minAtsScore?: number;
    minSkillScore?: number;
    minInterviewScore?: number;
    scoreType?: 'all' | 'ats' | 'skill' | 'interview'; // Filter by specific score type
    isActive?: boolean; // Active in last 30 days
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'score' | 'atsScore' | 'skillScore' | 'interviewScore' | 'lastActive';
    sortOrder?: 'asc' | 'desc';
}

class InstitutionService {
    /**
     * Get dashboard overview for an institution
     */
    async getDashboard(institutionId: string) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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

        // Students with resumes
        const studentsWithResumes = await prisma.user.count({
            where: {
                institutionId,
                role: UserRole.USER,
                resumes: { some: {} },
            },
        });

        // Students with badges
        const studentsWithBadges = await prisma.user.count({
            where: {
                institutionId,
                role: UserRole.USER,
                skillBadges: { some: {} },
            },
        });

        // B2B: Placed students (Hired)
        const placedStudents = await prisma.user.count({
            where: {
                institutionId,
                role: UserRole.USER,
                OR: [
                    {
                        applications: {
                            some: { status: 'PLACED' }
                        }
                    },
                    {
                        // Check B2B specific recruiter applications
                        recruiterApplications: {
                            some: { status: 'PLACED' }
                        }
                    }
                ]
            },
        });

        // B2B: Profile Completion Stats
        const [studentsWithSkills, studentsWithTargetRole] = await Promise.all([
            prisma.user.count({
                where: {
                    institutionId,
                    role: UserRole.USER,
                    userSkills: { some: {} },
                },
            }),
            prisma.user.count({
                where: {
                    institutionId,
                    role: UserRole.USER,
                    targetJobRoleId: { not: null },
                },
            }),
        ]);

        const profileCompletion = {
            hasResume: studentsWithResumes,
            hasSkills: studentsWithSkills,
            hasTargetRole: studentsWithTargetRole,
            averageCompletion: totalStudents > 0
                ? Math.round(((studentsWithResumes + studentsWithSkills + studentsWithTargetRole) / (totalStudents * 3)) * 100)
                : 0
        };

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

        // Interviews in last 7 days
        const recentInterviewCount = await prisma.interviewSession.count({
            where: {
                user: { institutionId },
                createdAt: { gte: sevenDaysAgo },
            },
        });

        // Score distribution for interviews
        const allScores = await prisma.interviewSession.findMany({
            where: {
                user: { institutionId },
                overallScore: { not: null },
            },
            select: { overallScore: true },
        });

        const scoreDistribution = {
            excellent: 0, // 80-100
            good: 0,      // 60-79
            average: 0,   // 40-59
            needsWork: 0, // 0-39
        };

        allScores.forEach((s) => {
            const score = s.overallScore || 0;
            if (score >= 80) scoreDistribution.excellent++;
            else if (score >= 60) scoreDistribution.good++;
            else if (score >= 40) scoreDistribution.average++;
            else scoreDistribution.needsWork++;
        });

        // Top performers (students with highest avg scores)
        const studentsWithScores = await prisma.user.findMany({
            where: {
                institutionId,
                role: UserRole.USER,
                interviews: { some: { status: 'COMPLETED', overallScore: { not: null } } },
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                targetJobRole: { select: { title: true } },
                interviews: {
                    where: { status: 'COMPLETED', overallScore: { not: null } },
                    select: { overallScore: true },
                },
                skillBadges: { select: { id: true } },
            },
        });

        const topPerformers = studentsWithScores
            .map((student) => {
                const scores = student.interviews.map((i) => i.overallScore).filter((s): s is number => s !== null);
                const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                return {
                    id: student.id,
                    name: student.name || 'Unknown',
                    email: student.email,
                    avatarUrl: student.avatarUrl,
                    targetRole: student.targetJobRole?.title || null,
                    averageScore: avgScore,
                    interviewCount: scores.length,
                    badgeCount: student.skillBadges.length,
                };
            })
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 5);

        // Recent activity (latest interviews)
        const recentActivity = await prisma.interviewSession.findMany({
            where: {
                user: { institutionId },
                status: 'COMPLETED',
            },
            select: {
                id: true,
                targetRole: true,
                type: true,
                overallScore: true,
                completedAt: true,
                user: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
            orderBy: { completedAt: 'desc' },
            take: 8,
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

        const roleIds = roleDistribution.map((r) => r.targetJobRoleId).filter(Boolean) as string[];
        const roles = await prisma.jobRole.findMany({
            where: { id: { in: roleIds } },
            select: { id: true, title: true },
        });
        const roleMap = Object.fromEntries(roles.map((r) => [r.id, r.title]));

        const formattedRoleDistribution = roleDistribution
            .map((r) => ({
                roleName: r.targetJobRoleId ? roleMap[r.targetJobRoleId] || 'Unknown' : 'Not Set',
                count: r._count.id,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        // Top skills among students
        const skillDistribution = await prisma.userSkill.groupBy({
            by: ['skillId'],
            where: {
                user: { institutionId },
            },
            _count: { skillId: true },
            orderBy: { _count: { skillId: 'desc' } },
            take: 8,
        });

        const skillIds = skillDistribution.map((s) => s.skillId);
        const skills = await prisma.skill.findMany({
            where: { id: { in: skillIds } },
            select: { id: true, name: true, category: true },
        });
        const skillMap = Object.fromEntries(skills.map((s) => [s.id, s]));

        const topSkills = skillDistribution.map((s) => ({
            name: skillMap[s.skillId]?.name || 'Unknown',
            category: skillMap[s.skillId]?.category || 'Other',
            count: s._count.skillId,
        }));

        // Activity trend (last 14 days for better visualization)
        const activityTrend: { date: string; interviews: number; signups: number }[] = [];
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const [interviews, signups] = await Promise.all([
                prisma.interviewSession.count({
                    where: {
                        user: { institutionId },
                        createdAt: { gte: date, lt: nextDate },
                    },
                }),
                prisma.user.count({
                    where: {
                        institutionId,
                        role: UserRole.USER,
                        createdAt: { gte: date, lt: nextDate },
                    },
                }),
            ]);
            activityTrend.push({
                date: date.toISOString().split('T')[0],
                interviews,
                signups,
            });
        }

        return {
            // Core stats
            totalStudents,
            activeStudents,
            placedStudents,
            studentsWithResumes,
            studentsWithBadges,
            profileCompletion,
            averageScore,
            totalInterviews,
            recentInterviewCount,
            // Distributions
            scoreDistribution,
            roleDistribution: formattedRoleDistribution,
            topSkills,
            // Lists
            topPerformers,
            recentActivity: recentActivity.map((a) => ({
                id: a.id,
                targetRole: a.targetRole,
                type: a.type,
                score: a.overallScore,
                completedAt: a.completedAt,
                student: a.user,
            })),
            // Trends
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
            minAtsScore,
            minSkillScore,
            minInterviewScore,
            scoreType,
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

        // Build orderBy for DB-level sorting
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
                    // Interview scores
                    interviews: {
                        select: { overallScore: true, status: true },
                        where: { status: 'COMPLETED' },
                        orderBy: { createdAt: 'desc' },
                        take: 20,
                    },
                    // ATS scores
                    atsScores: {
                        select: { overallScore: true },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                    // Skill validation scores (test attempts)
                    testAttempts: {
                        select: { score: true, passed: true },
                        where: { completedAt: { not: null } },
                        orderBy: { completedAt: 'desc' },
                        take: 20,
                    },
                    // Skill badges count
                    skillBadges: {
                        select: { id: true },
                    },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit * 3, // Fetch more to account for post-filtering
            }),
            prisma.user.count({ where }),
        ]);

        // Calculate all score types for each student
        const studentsWithScores = students.map((student) => {
            // Interview score
            const interviewScores = student.interviews
                .map((i) => i.overallScore)
                .filter((s): s is number => s !== null);
            const interviewScore = interviewScores.length > 0
                ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
                : null;

            // ATS score (latest or average)
            const atsScores = student.atsScores
                .map((a) => a.overallScore)
                .filter((s): s is number => s !== null);
            const atsScore = atsScores.length > 0
                ? Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length)
                : null;

            // Skill validation score (average of test attempts)
            const skillScores = student.testAttempts
                .map((t) => t.score)
                .filter((s): s is number => s !== null);
            const skillScore = skillScores.length > 0
                ? Math.round(skillScores.reduce((a, b) => a + b, 0) / skillScores.length)
                : null;

            // Combined average (only include scores that exist)
            const allScores = [interviewScore, atsScore, skillScore].filter((s): s is number => s !== null);
            const combinedScore = allScores.length > 0
                ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
                : null;

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                avatarUrl: student.avatarUrl,
                targetJobRole: student.targetJobRole,
                // All score types
                interviewScore,
                atsScore,
                skillScore,
                combinedScore,
                // Counts
                interviewCount: student.interviews.length,
                testCount: student.testAttempts.length,
                badgeCount: student.skillBadges.length,
                // Metadata
                lastActive: student.updatedAt,
                createdAt: student.createdAt,
            };
        });

        // Apply score filters
        let filteredStudents = studentsWithScores;

        // Filter by specific score type
        if (scoreType === 'ats' && minAtsScore !== undefined) {
            filteredStudents = filteredStudents.filter(
                (s) => s.atsScore !== null && s.atsScore >= minAtsScore
            );
        } else if (scoreType === 'skill' && minSkillScore !== undefined) {
            filteredStudents = filteredStudents.filter(
                (s) => s.skillScore !== null && s.skillScore >= minSkillScore
            );
        } else if (scoreType === 'interview' && minInterviewScore !== undefined) {
            filteredStudents = filteredStudents.filter(
                (s) => s.interviewScore !== null && s.interviewScore >= minInterviewScore
            );
        } else {
            // Combined filters - apply all that are specified
            if (minAtsScore !== undefined) {
                filteredStudents = filteredStudents.filter(
                    (s) => s.atsScore !== null && s.atsScore >= minAtsScore
                );
            }
            if (minSkillScore !== undefined) {
                filteredStudents = filteredStudents.filter(
                    (s) => s.skillScore !== null && s.skillScore >= minSkillScore
                );
            }
            if (minInterviewScore !== undefined) {
                filteredStudents = filteredStudents.filter(
                    (s) => s.interviewScore !== null && s.interviewScore >= minInterviewScore
                );
            }
            if (minScore !== undefined) {
                filteredStudents = filteredStudents.filter(
                    (s) => s.combinedScore !== null && s.combinedScore >= minScore
                );
            }
        }

        // Sort by score type if requested
        if (sortBy === 'score' || sortBy === 'interviewScore') {
            filteredStudents.sort((a, b) => {
                const scoreA = a.interviewScore ?? -1;
                const scoreB = b.interviewScore ?? -1;
                return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
            });
        } else if (sortBy === 'atsScore') {
            filteredStudents.sort((a, b) => {
                const scoreA = a.atsScore ?? -1;
                const scoreB = b.atsScore ?? -1;
                return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
            });
        } else if (sortBy === 'skillScore') {
            filteredStudents.sort((a, b) => {
                const scoreA = a.skillScore ?? -1;
                const scoreB = b.skillScore ?? -1;
                return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
            });
        }

        // Apply pagination after filtering
        const paginatedStudents = filteredStudents.slice(0, limit);

        return {
            students: paginatedStudents,
            pagination: {
                total: filteredStudents.length,
                page,
                limit,
                totalPages: Math.ceil(filteredStudents.length / limit),
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

    /**
     * Get Campus Placements
     */
    async getPlacements(institutionId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [placements, total] = await Promise.all([
            prisma.campusPlacement.findMany({
                where: { institutionId },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, targetJobRole: { select: { title: true } } }
                    }
                },
                orderBy: { placedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.campusPlacement.count({ where: { institutionId } })
        ]);

        return {
            placements,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get Skill Gap Heatmap
     */
    async getSkillGapHeatmap(institutionId: string) {
        // Find users with target job roles and their skills
        const users = await prisma.user.findMany({
            where: { institutionId, role: UserRole.USER, targetJobRole: { isNot: null } },
            select: {
                id: true,
                targetJobRole: {
                    select: {
                        id: true,
                        title: true,
                        requiredSkills: true
                    }
                },
                userSkills: {
                    select: { skill: { select: { id: true, name: true } }, proficiencyLevel: true }
                }
            }
        });

        // Calculate skill gaps per role
        const roleSkillGaps: Record<string, any> = {};

        users.forEach(user => {
            const role = user.targetJobRole!;
            if (!roleSkillGaps[role.title]) {
                roleSkillGaps[role.title] = { studentCount: 0, skills: {} };
            }

            roleSkillGaps[role.title].studentCount++;

            const userSkillLevels = new Map(user.userSkills.map(us => [us.skill.id, us.proficiencyLevel]));

            role.requiredSkills.forEach((skillName: string) => {
                if (!roleSkillGaps[role.title].skills[skillName]) {
                    roleSkillGaps[role.title].skills[skillName] = { acquiredCount: 0, averageProficiency: 0, totalProficiency: 0 };
                }

                // Check if user has this skill (case-insensitive approximation)
                const userSkillMatch = user.userSkills.find(us => us.skill.name.toLowerCase() === skillName.toLowerCase());
                if (userSkillMatch) {
                    roleSkillGaps[role.title].skills[skillName].acquiredCount++;
                    const levelStr = userSkillMatch.proficiencyLevel || 'BEGINNER';
                    const levelNum = levelStr === 'BEGINNER' ? 1 : levelStr === 'INTERMEDIATE' ? 2 : levelStr === 'ADVANCED' ? 3 : levelStr === 'EXPERT' ? 4 : 1;
                    roleSkillGaps[role.title].skills[skillName].totalProficiency += levelNum;
                }
            });
        });

        const heatmaps = Object.entries(roleSkillGaps).map(([roleTitle, data]: any[]) => {
            const skillGaps = Object.entries(data.skills).map(([skillName, skillData]: any[]) => {
                const acquiredPercentage = Math.round((skillData.acquiredCount / data.studentCount) * 100);
                const averageProficiency = skillData.acquiredCount > 0 ? (skillData.totalProficiency / skillData.acquiredCount) : 0;

                let gapLevel = 'HIGH';
                if (acquiredPercentage >= 80 && averageProficiency >= 2.5) gapLevel = 'LOW';
                else if (acquiredPercentage >= 50 && averageProficiency >= 1.5) gapLevel = 'MEDIUM';

                return { skill: skillName, acquiredPercentage, gapLevel, averageProficiency: Number(averageProficiency.toFixed(1)) };
            });

            return { targetRole: roleTitle, studentCount: data.studentCount, skillGaps };
        });

        return heatmaps;
    }

    /**
     * Get Recruiter-Campus Marketplace
     */
    async getRecruiterMarketplace(institutionId: string) {
        // Find jobs that match the institution's top target roles
        const users = await prisma.user.findMany({
            where: { institutionId, targetJobRoleId: { not: null } },
            select: { targetJobRoleId: true }
        });

        const roleCounts = users.reduce((acc: any, u) => {
            acc[u.targetJobRoleId!] = (acc[u.targetJobRoleId!] || 0) + 1;
            return acc;
        }, {});

        const topRoles = Object.keys(roleCounts).sort((a, b) => roleCounts[b] - roleCounts[a]).slice(0, 5);

        // Find active jobs related to these top roles or just active jobs in general
        const marketplaceJobs = await prisma.recruiterJob.findMany({
            where: { isActive: true },
            select: {
                id: true,
                title: true,
                location: true,
                salaryMin: true,
                salaryMax: true,
                requiredSkills: true,
                recruiter: {
                    select: {
                        organization: { select: { name: true, logoUrl: true } }
                    }
                }
            },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });

        return {
            topStudentRolesIds: topRoles,
            recommendedJobs: marketplaceJobs
        };
    }
}

export const institutionService = new InstitutionService();
