import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';

export class InstitutionAdminController {
    // Get institution dashboard stats
    async getDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;

            // Get the institution this admin manages
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { adminForInstitution: true }
            });

            if (!user?.adminForInstitution) {
                throw new AppError('Institution not found for this admin', 404);
            }

            const institutionId = user.adminForInstitution.id;

            // Get student count
            const totalStudents = await prisma.user.count({
                where: { institutionId }
            });

            // Get students with resumes
            const studentsWithResumes = await prisma.user.count({
                where: {
                    institutionId,
                    resumes: { some: {} }
                }
            });

            // Get students with completed interviews
            const studentsWithInterviews = await prisma.user.count({
                where: {
                    institutionId,
                    interviews: { some: { status: 'COMPLETED' } }
                }
            });

            // Get students with skill badges
            const studentsWithBadges = await prisma.user.count({
                where: {
                    institutionId,
                    skillBadges: { some: {} }
                }
            });

            // Get average ATS score for institution students
            const avgAtsScore = await prisma.atsScore.aggregate({
                where: {
                    user: { institutionId }
                },
                _avg: { overallScore: true }
            });

            // Get total interviews completed
            const totalInterviews = await prisma.interviewSession.count({
                where: {
                    user: { institutionId },
                    status: 'COMPLETED'
                }
            });

            // Get average interview score
            const avgInterviewScore = await prisma.interviewSession.aggregate({
                where: {
                    user: { institutionId },
                    status: 'COMPLETED',
                    overallScore: { not: null }
                },
                _avg: { overallScore: true }
            });

            // Get recent activity (last 7 days signups)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentSignups = await prisma.user.count({
                where: {
                    institutionId,
                    createdAt: { gte: sevenDaysAgo }
                }
            });

            // Get top performing students (by ATS score)
            const topStudents = await prisma.user.findMany({
                where: { institutionId },
                include: {
                    atsScores: {
                        orderBy: { overallScore: 'desc' },
                        take: 1
                    },
                    skillBadges: { select: { id: true } },
                    interviews: {
                        where: { status: 'COMPLETED' },
                        select: { id: true }
                    }
                },
                take: 5
            });

            const topStudentsData = topStudents
                .filter(s => s.atsScores.length > 0)
                .sort((a, b) => (b.atsScores[0]?.overallScore || 0) - (a.atsScores[0]?.overallScore || 0))
                .slice(0, 5)
                .map(s => ({
                    id: s.id,
                    name: s.name || 'Unknown',
                    email: s.email,
                    avatarUrl: s.avatarUrl,
                    atsScore: s.atsScores[0]?.overallScore || 0,
                    badgesCount: s.skillBadges.length,
                    interviewsCount: s.interviews.length
                }));

            res.json({
                success: true,
                data: {
                    institution: {
                        id: user.adminForInstitution.id,
                        name: user.adminForInstitution.name,
                        domain: user.adminForInstitution.domain,
                        logoUrl: user.adminForInstitution.logoUrl
                    },
                    stats: {
                        totalStudents,
                        studentsWithResumes,
                        studentsWithInterviews,
                        studentsWithBadges,
                        avgAtsScore: Math.round(avgAtsScore._avg.overallScore || 0),
                        avgInterviewScore: Math.round(avgInterviewScore._avg.overallScore || 0),
                        totalInterviews,
                        recentSignups
                    },
                    topStudents: topStudentsData
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all students for the institution
    async getStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { search, page = '1', limit = '20' } = req.query;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { adminForInstitutionId: true }
            });

            if (!user?.adminForInstitutionId) {
                throw new AppError('Institution not found', 404);
            }

            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

            const where: any = {
                institutionId: user.adminForInstitutionId,
                role: 'USER'
            };

            if (search) {
                where.OR = [
                    { name: { contains: search as string, mode: 'insensitive' } },
                    { email: { contains: search as string, mode: 'insensitive' } }
                ];
            }

            const [students, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    include: {
                        resumes: {
                            select: { id: true, status: true },
                            take: 1,
                            orderBy: { createdAt: 'desc' }
                        },
                        atsScores: {
                            select: { overallScore: true },
                            take: 1,
                            orderBy: { createdAt: 'desc' }
                        },
                        interviews: {
                            where: { status: 'COMPLETED' },
                            select: { id: true, overallScore: true }
                        },
                        skillBadges: {
                            select: { id: true }
                        },
                        targetJobRole: {
                            select: { title: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit as string)
                }),
                prisma.user.count({ where })
            ]);

            const studentsData = students.map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                avatarUrl: s.avatarUrl,
                isVerified: s.isVerified,
                createdAt: s.createdAt,
                targetRole: s.targetJobRole?.title || null,
                hasResume: s.resumes.length > 0,
                latestAtsScore: s.atsScores[0]?.overallScore || null,
                completedInterviews: s.interviews.length,
                avgInterviewScore: s.interviews.length > 0
                    ? Math.round(s.interviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / s.interviews.length)
                    : null,
                badgesCount: s.skillBadges.length
            }));

            res.json({
                success: true,
                data: {
                    students: studentsData,
                    pagination: {
                        page: parseInt(page as string),
                        limit: parseInt(limit as string),
                        total,
                        pages: Math.ceil(total / parseInt(limit as string))
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get single student details
    async getStudentDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { studentId } = req.params;

            const adminUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { adminForInstitutionId: true }
            });

            if (!adminUser?.adminForInstitutionId) {
                throw new AppError('Institution not found', 404);
            }

            const student = await prisma.user.findFirst({
                where: {
                    id: studentId,
                    institutionId: adminUser.adminForInstitutionId
                },
                include: {
                    resumes: {
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    },
                    atsScores: {
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    },
                    interviews: {
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    },
                    skillBadges: {
                        include: { skill: true }
                    },
                    userSkills: {
                        include: { skill: true }
                    },
                    targetJobRole: true
                }
            });

            if (!student) {
                throw new AppError('Student not found', 404);
            }

            res.json({
                success: true,
                data: student
            });
        } catch (error) {
            next(error);
        }
    }

    // Add student to institution
    async addStudent(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { email } = req.body;

            const adminUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { adminForInstitutionId: true }
            });

            if (!adminUser?.adminForInstitutionId) {
                throw new AppError('Institution not found', 404);
            }

            // Find user by email
            const student = await prisma.user.findUnique({
                where: { email }
            });

            if (!student) {
                throw new AppError('User not found with this email', 404);
            }

            if (student.institutionId) {
                throw new AppError('User is already associated with an institution', 400);
            }

            // Add student to institution
            const updated = await prisma.user.update({
                where: { id: student.id },
                data: { institutionId: adminUser.adminForInstitutionId }
            });

            res.json({
                success: true,
                data: { id: updated.id, email: updated.email, name: updated.name }
            });
        } catch (error) {
            next(error);
        }
    }

    // Remove student from institution
    async removeStudent(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { studentId } = req.params;

            const adminUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { adminForInstitutionId: true }
            });

            if (!adminUser?.adminForInstitutionId) {
                throw new AppError('Institution not found', 404);
            }

            const student = await prisma.user.findFirst({
                where: {
                    id: studentId,
                    institutionId: adminUser.adminForInstitutionId
                }
            });

            if (!student) {
                throw new AppError('Student not found in your institution', 404);
            }

            await prisma.user.update({
                where: { id: studentId },
                data: { institutionId: null }
            });

            res.json({ success: true, message: 'Student removed from institution' });
        } catch (error) {
            next(error);
        }
    }

    // Get institution settings
    async getSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    adminForInstitution: {
                        include: {
                            _count: { select: { students: true, admins: true } }
                        }
                    }
                }
            });

            if (!user?.adminForInstitution) {
                throw new AppError('Institution not found', 404);
            }

            res.json({
                success: true,
                data: {
                    ...user.adminForInstitution,
                    studentCount: user.adminForInstitution._count.students,
                    adminCount: user.adminForInstitution._count.admins
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update institution settings
    async updateSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { name, logoUrl, address } = req.body;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { adminForInstitutionId: true }
            });

            if (!user?.adminForInstitutionId) {
                throw new AppError('Institution not found', 404);
            }

            const updated = await prisma.institution.update({
                where: { id: user.adminForInstitutionId },
                data: {
                    ...(name && { name }),
                    ...(logoUrl !== undefined && { logoUrl }),
                    ...(address !== undefined && { address })
                }
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    // Get analytics for institution
    async getAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { adminForInstitutionId: true }
            });

            if (!user?.adminForInstitutionId) {
                throw new AppError('Institution not found', 404);
            }

            const institutionId = user.adminForInstitutionId;

            // Get student growth over last 6 months
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const studentGrowth = await prisma.$queryRaw`
                SELECT
                    DATE_TRUNC('month', created_at) as month,
                    COUNT(*) as count
                FROM users
                WHERE institution_id = ${institutionId}
                AND created_at >= ${sixMonthsAgo}
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month ASC
            ` as any[];

            // Get ATS score distribution
            const atsDistribution = await prisma.atsScore.groupBy({
                by: ['overallScore'],
                where: { user: { institutionId } },
                _count: true
            });

            // Bucket scores into ranges
            const scoreBuckets = { '0-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
            atsDistribution.forEach(item => {
                const score = item.overallScore;
                if (score <= 40) scoreBuckets['0-40'] += item._count;
                else if (score <= 60) scoreBuckets['41-60'] += item._count;
                else if (score <= 80) scoreBuckets['61-80'] += item._count;
                else scoreBuckets['81-100'] += item._count;
            });

            // Get top skills among students
            const topSkills = await prisma.userSkill.groupBy({
                by: ['skillId'],
                where: { user: { institutionId } },
                _count: true,
                orderBy: { _count: { skillId: 'desc' } },
                take: 10
            });

            const skillIds = topSkills.map(s => s.skillId);
            const skills = await prisma.skill.findMany({
                where: { id: { in: skillIds } }
            });

            const skillsData = topSkills.map(s => ({
                name: skills.find(sk => sk.id === s.skillId)?.name || 'Unknown',
                count: s._count
            }));

            // Get target job roles distribution
            const jobRoles = await prisma.user.groupBy({
                by: ['targetJobRoleId'],
                where: {
                    institutionId,
                    targetJobRoleId: { not: null }
                },
                _count: true,
                orderBy: { _count: { targetJobRoleId: 'desc' } },
                take: 5
            });

            const roleIds = jobRoles.map(r => r.targetJobRoleId).filter(Boolean) as string[];
            const roles = await prisma.jobRole.findMany({
                where: { id: { in: roleIds } }
            });

            const rolesData = jobRoles.map(r => ({
                role: roles.find(role => role.id === r.targetJobRoleId)?.title || 'Unknown',
                count: r._count
            }));

            res.json({
                success: true,
                data: {
                    studentGrowth: studentGrowth.map((g: any) => ({
                        month: g.month,
                        count: parseInt(g.count)
                    })),
                    atsScoreDistribution: scoreBuckets,
                    topSkills: skillsData,
                    targetJobRoles: rolesData
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

export const institutionAdminController = new InstitutionAdminController();
