import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface RecruiterProfileInput {
    companyName: string;
    companyLogo?: string;
    companySize?: string;
    industry?: string;
    website?: string;
    location?: string;
    description?: string;
}

export interface CandidateSearchFilters {
    skills?: string[];
    location?: string;
    experienceMin?: number;
    experienceMax?: number;
    hasResume?: boolean;
    page?: number;
    limit?: number;
}

export class RecruiterService {
    /**
     * Register as a recruiter
     */
    async register(userId: string, input: RecruiterProfileInput) {
        // Check if user already has a recruiter profile
        const existing = await prisma.recruiter.findUnique({
            where: { userId },
        });

        if (existing) {
            throw createError('Recruiter profile already exists', 400, 'RECRUITER_EXISTS');
        }

        // Update user role
        await prisma.user.update({
            where: { id: userId },
            data: { role: 'RECRUITER' },
        });

        // Create recruiter profile
        const recruiter = await prisma.recruiter.create({
            data: {
                userId,
                companyName: input.companyName,
                companyLogo: input.companyLogo,
                companySize: input.companySize,
                industry: input.industry,
                website: input.website,
                location: input.location,
            },
        });

        logger.info(`Created recruiter profile for user ${userId}`);
        return recruiter;
    }

    /**
     * Get recruiter profile
     */
    async getProfile(userId: string) {
        const recruiter = await prisma.recruiter.findUnique({
            where: { userId },
            include: {
                _count: {
                    select: {
                        savedCandidates: true,
                        jobPostings: true,
                    },
                },
            },
        });

        if (!recruiter) {
            throw createError('Recruiter profile not found', 404, 'RECRUITER_NOT_FOUND');
        }

        return recruiter;
    }

    /**
     * Update recruiter profile
     */
    async updateProfile(userId: string, input: Partial<RecruiterProfileInput>) {
        return prisma.$transaction(async (tx) => {
            const recruiter = await tx.recruiter.update({
                where: { userId },
                data: input,
            });

            if (recruiter.organizationId && (recruiter.orgRole === 'OWNER' || recruiter.orgRole === 'ADMIN')) {
                // Sync with organization
                await tx.organization.update({
                    where: { id: recruiter.organizationId },
                    data: {
                        name: input.companyName,
                        logoUrl: input.companyLogo,
                        companySize: input.companySize,
                        industry: input.industry,
                        website: input.website,
                        description: input.description,
                    },
                });
            }

            return recruiter;
        });
    }

    /**
     * Search candidates (users with skills/resumes)
     */
    async searchCandidates(filters: CandidateSearchFilters) {
        const { skills, location, experienceMin, experienceMax, hasResume, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const where: any = {
            role: 'USER', // Only search regular users, not recruiters/admins
        };

        // Filter by skills
        if (skills && skills.length > 0) {
            where.userSkills = {
                some: {
                    skill: {
                        name: { in: skills },
                    },
                },
            };
        }

        // Filter by resume existence
        if (hasResume) {
            where.resumes = {
                some: {},
            };
        }

        const [candidates, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    createdAt: true,
                    userSkills: {
                        include: { skill: true },
                        take: 10,
                    },
                    atsScores: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { overallScore: true, jobRole: true },
                    },
                    skillBadges: {
                        include: { skill: true },
                        take: 5,
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            candidates: candidates.map(c => ({
                id: c.id,
                name: c.name || 'Anonymous',
                avatarUrl: c.avatarUrl,
                skills: c.userSkills.map(us => ({
                    name: us.skill.name,
                    level: us.proficiencyLevel,
                    verified: us.isVerified,
                })),
                latestScore: c.atsScores[0],
                badges: c.skillBadges.map(b => ({
                    skill: b.skill.name,
                    type: b.badgeType,
                })),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Save a candidate
     */
    async saveCandidate(recruiterId: string, candidateId: string, notes?: string, tags?: string[]) {
        // Check if candidate exists
        const candidate = await prisma.user.findUnique({
            where: { id: candidateId },
        });

        if (!candidate) {
            throw createError('Candidate not found', 404, 'CANDIDATE_NOT_FOUND');
        }

        return prisma.savedCandidate.upsert({
            where: {
                recruiterId_candidateId: { recruiterId, candidateId },
            },
            create: {
                recruiterId,
                candidateId,
                notes,
                tags: tags || [],
            },
            update: {
                notes,
                tags: tags || [],
            },
        });
    }

    /**
     * Get saved candidates
     */
    async getSavedCandidates(recruiterId: string, status?: string) {
        const where: any = { recruiterId };
        if (status) {
            where.status = status;
        }

        const saved = await prisma.savedCandidate.findMany({
            where,
            orderBy: { savedAt: 'desc' },
        });

        // Get full candidate details
        const candidateIds = saved.map(s => s.candidateId);
        const candidates = await prisma.user.findMany({
            where: { id: { in: candidateIds } },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                userSkills: {
                    include: { skill: true },
                    take: 5,
                },
            },
        });

        const candidateMap = new Map(candidates.map(c => [c.id, c]));

        return saved.map(s => ({
            ...s,
            candidate: candidateMap.get(s.candidateId),
        }));
    }

    /**
     * Remove saved candidate
     */
    async removeSavedCandidate(recruiterId: string, candidateId: string) {
        await prisma.savedCandidate.delete({
            where: {
                recruiterId_candidateId: { recruiterId, candidateId },
            },
        });
    }

    /**
     * Update saved candidate status
     */
    async updateCandidateStatus(recruiterId: string, candidateId: string, status: string, notes?: string) {
        return prisma.savedCandidate.update({
            where: {
                recruiterId_candidateId: { recruiterId, candidateId },
            },
            data: {
                status,
                ...(notes && { notes }),
            },
        });
    }

    /**
     * Get a single candidate profile by userId — for the recruiter candidate detail page.
     */
    async getCandidateById(candidateId: string) {
        const user = await prisma.user.findUnique({
            where: { id: candidateId },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                createdAt: true,
                targetJobRole: { select: { title: true } },
                userSkills: {
                    select: {
                        proficiencyLevel: true,
                        skill: { select: { name: true } },
                    },
                },
                resumes: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { id: true, fileName: true, fileUrl: true },
                },
                assessmentAttempts: {
                    orderBy: { startedAt: 'desc' },
                    take: 1,
                    select: {
                        analyticalScore: true,
                        behavioralScore: true,
                        overallScore: true,
                        status: true,
                    },
                },
                codingSubmissions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        score: true,
                        status: true,
                    },
                },
            },
        });

        if (!user) throw createError('Candidate not found', 404, 'CANDIDATE_NOT_FOUND');

        const { resumes, assessmentAttempts, codingSubmissions, ...rest } = user as any;

        const latestAttempt = assessmentAttempts?.[0];
        const avgCodingScore = codingSubmissions?.length > 0
            ? Math.round(codingSubmissions.reduce((acc: number, s: any) => acc + (s.score || 0), 0) / codingSubmissions.length)
            : null;

        return {
            ...rest,
            resumeId: resumes[0]?.id || null,
            resumeFileName: resumes[0]?.fileName || null,
            resumeUrl: resumes[0]?.fileUrl || null,
            latestScores: {
                analytical: latestAttempt?.analyticalScore ?? null,
                behavioral: latestAttempt?.behavioralScore ?? null,
                coding: avgCodingScore,
                assessmentStatus: latestAttempt?.status ?? null,
            },
        };
    }

    /**
     * Get all applications a candidate has submitted to this recruiter's jobs.
     */
    async getCandidateApplications(candidateId: string, recruiterId: string) {
        const recruiter = await prisma.recruiter.findUnique({ where: { id: recruiterId } });
        if (!recruiter) throw createError('Recruiter not found', 404, 'RECRUITER_NOT_FOUND');

        const applications = await prisma.recruiterJobApplicant.findMany({
            where: {
                candidateId,
                job: { recruiterId },
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        pipelineSteps: true,
                        applicationDeadline: true,
                        assessmentTemplate: {
                            include: {
                                attempts: {
                                    where: { studentId: candidateId },
                                    orderBy: { startedAt: 'desc' },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { appliedAt: 'desc' },
        });

        // Collect all challenge IDs from pipeline steps to fetch coding submissions in bulk
        const challengeIds = new Set<string>();
        applications.forEach(a => {
            const steps = (a.job.pipelineSteps as any[]) || [];
            steps.forEach(s => {
                if (s.type === 'CODING' && s.challengeIds) {
                    s.challengeIds.forEach((id: string) => challengeIds.add(id));
                }
            });
        });

        const codingSubmissions = challengeIds.size > 0
            ? await prisma.codingSubmission.findMany({
                where: {
                    userId: candidateId,
                    challengeId: { in: Array.from(challengeIds) },
                },
                orderBy: { createdAt: 'desc' },
            })
            : [];

        return applications.map(a => {
            const attempt = a.job.assessmentTemplate?.attempts[0];

            // For coding, we might have multiple challenges. We take the average or the latest?
            // Usually, recruiters want to see if they passed the challenges.
            const jobChallengeIds = new Set<string>();
            ((a.job.pipelineSteps as any[]) || []).forEach(s => {
                if (s.type === 'CODING' && s.challengeIds) {
                    s.challengeIds.forEach((id: string) => jobChallengeIds.add(id));
                }
            });

            const relevantSubmissions = codingSubmissions.filter(s => jobChallengeIds.has(s.challengeId));
            const codingScore = relevantSubmissions.length > 0
                ? Math.round(relevantSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / relevantSubmissions.length)
                : null;

            return {
                id: a.id,
                jobId: a.job.id,
                jobTitle: a.job.title,
                status: a.status,
                appliedAt: a.appliedAt,
                overallScore: a.overallScore,
                fitScore: a.fitScore,
                dropoutRisk: a.dropoutRisk,
                acceptanceLikelihood: a.acceptanceLikelihood,
                analyticalScore: attempt?.analyticalScore ?? null,
                behavioralScore: attempt?.behavioralScore ?? null,
                codingScore: codingScore,
                assessmentStatus: attempt?.status ?? null,
                applicationDeadline: a.job.applicationDeadline ?? null,
                assessmentDeadline: a.job.assessmentTemplate?.assessmentDeadline ?? null,
            };
        });
    }
}

export const recruiterService = new RecruiterService();
