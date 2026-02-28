import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface JobFilters {
    page: number;
    limit: number;
    location?: string;
    locationType?: string;
    experienceMin?: number;
    experienceMax?: number;
}

interface SearchFilters {
    query?: string;
    location?: string;
    skills?: string[];
    remote?: boolean;
    page: number;
    limit: number;
}

// Shape returned for platform (recruiter-posted) jobs — normalised to look like a JobListing
function normalizePlatformJob(rj: any): any {
    const company =
        rj.recruiter?.organization?.name ||
        rj.recruiter?.companyName ||
        'Company';

    return {
        id: rj.id,
        title: rj.title,
        company,
        companyLogo: rj.recruiter?.companyLogo || rj.recruiter?.organization?.logoUrl || null,
        location: rj.location,
        locationType: rj.locationType,
        description: rj.description,
        requirements: rj.requirements,
        requiredSkills: rj.requiredSkills,
        salaryMin: rj.salaryMin,
        salaryMax: rj.salaryMax,
        salaryCurrency: 'INR',
        experienceMin: rj.experienceMin,
        experienceMax: rj.experienceMax,
        source: 'platform',
        sourceUrl: null,
        postedAt: rj.createdAt,
        createdAt: rj.createdAt,
        isActive: rj.isActive,
        // Extra fields that signal this is a recruiter-posted platform job
        isPlatformJob: true,
        recruiterId: rj.recruiterId,
    };
}

async function fetchActivePlatformJobs(where: {
    title?: object;
    requiredSkills?: object;
    location?: object;
    locationType?: string;
} = {}): Promise<any[]> {
    const jobs = await (prisma as any).recruiterJob.findMany({
        where: {
            isActive: true,
            ...where,
        },
        include: {
            recruiter: {
                select: {
                    companyName: true,
                    companyLogo: true,
                    organization: { select: { name: true, logoUrl: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return jobs.map(normalizePlatformJob);
}

export class JobService {
    // Get paginated job listings (includes platform jobs at top)
    async getJobs(filters: JobFilters) {
        const { page, limit, location, locationType, experienceMin, experienceMax } = filters;
        const skip = (page - 1) * limit;

        const where: any = { isActive: true };

        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }
        if (locationType) {
            where.locationType = locationType;
        }
        if (experienceMin !== undefined) {
            where.experienceMin = { gte: experienceMin };
        }
        if (experienceMax !== undefined) {
            where.experienceMax = { lte: experienceMax };
        }

        const platformWhere: any = {};
        if (location) platformWhere.location = { contains: location, mode: 'insensitive' };
        if (locationType) platformWhere.locationType = locationType;

        const [regularJobs, total, platformJobs] = await Promise.all([
            prisma.jobListing.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            prisma.jobListing.count({ where }),
            fetchActivePlatformJobs(platformWhere),
        ]);

        return {
            jobs: [...platformJobs, ...regularJobs],
            pagination: {
                page,
                limit,
                total: total + platformJobs.length,
                totalPages: Math.ceil((total + platformJobs.length) / limit),
            },
        };
    }

    // Get single job by ID (checks both tables)
    async getJobById(jobId: string) {
        // Try JobListing first
        const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (job) return job;

        // Fall back to RecruiterJob
        const rj = await (prisma as any).recruiterJob.findFirst({
            where: { id: jobId, isActive: true },
            include: {
                recruiter: {
                    select: {
                        companyName: true,
                        companyLogo: true,
                        organization: { select: { name: true, logoUrl: true } },
                    },
                },
            },
        });

        if (rj) return normalizePlatformJob(rj);

        throw new AppError('Job not found', 404);
    }

    // Create job listing (manual/admin)
    async createJob(data: any) {
        return prisma.jobListing.create({
            data: {
                title: data.title,
                company: data.company,
                location: data.location,
                locationType: data.locationType || 'onsite',
                description: data.description,
                requirements: data.requirements || [],
                requiredSkills: data.requiredSkills || [],
                salaryMin: data.salaryMin,
                salaryMax: data.salaryMax,
                salaryCurrency: data.salaryCurrency || 'USD',
                experienceMin: data.experienceMin,
                experienceMax: data.experienceMax,
                source: data.source || 'manual',
                sourceUrl: data.sourceUrl,
                postedAt: data.postedAt || new Date(),
            },
        });
    }

    // Update job listing
    async updateJob(jobId: string, data: any) {
        const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (!job) throw new AppError('Job not found', 404);
        return prisma.jobListing.update({ where: { id: jobId }, data });
    }

    // Soft delete job
    async deleteJob(jobId: string) {
        await prisma.jobListing.update({ where: { id: jobId }, data: { isActive: false } });
    }

    // Search jobs with filters (platform jobs at top)
    async searchJobs(filters: SearchFilters) {
        const { query, location, skills, remote, page, limit } = filters;
        const skip = (page - 1) * limit;

        const where: any = { isActive: true };
        const platformWhere: any = {};

        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { company: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
            platformWhere.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
        }
        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
            platformWhere.location = { contains: location, mode: 'insensitive' };
        }
        if (remote) {
            where.locationType = 'remote';
            platformWhere.locationType = 'remote';
        }
        if (skills && skills.length > 0) {
            where.requiredSkills = { hasSome: skills };
            platformWhere.requiredSkills = { hasSome: skills };
        }

        const [regularJobs, total, platformJobs] = await Promise.all([
            prisma.jobListing.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            prisma.jobListing.count({ where }),
            fetchActivePlatformJobs(platformWhere),
        ]);

        return {
            jobs: [...platformJobs, ...regularJobs],
            pagination: {
                page,
                limit,
                total: total + platformJobs.length,
                totalPages: Math.ceil((total + platformJobs.length) / limit),
            },
        };
    }

    // Get jobs matching user's skills (platform jobs at top)
    async getMatchingJobs(userId: string, limit: number) {
        const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            include: { skill: true },
        });

        const skillNames = userSkills.map(us => us.skill.name);

        const [platformJobs, regularJobs] = await Promise.all([
            fetchActivePlatformJobs(skillNames.length > 0 ? { requiredSkills: { hasSome: skillNames } } : {}),
            skillNames.length === 0
                ? prisma.jobListing.findMany({ where: { isActive: true }, take: limit, orderBy: { createdAt: 'desc' } })
                : prisma.jobListing.findMany({
                    where: { isActive: true, requiredSkills: { hasSome: skillNames } },
                    take: limit * 2,
                    orderBy: { createdAt: 'desc' },
                }),
        ]);

        if (skillNames.length === 0) {
            return [
                ...platformJobs.slice(0, limit),
                ...regularJobs.slice(0, Math.max(0, limit - platformJobs.length)),
            ];
        }

        const scoreJob = (requiredSkills: string[]) => {
            const matchedCount = requiredSkills.filter(skill =>
                skillNames.some(us => us.toLowerCase() === skill.toLowerCase())
            ).length;
            return requiredSkills.length > 0
                ? Math.round((matchedCount / requiredSkills.length) * 100)
                : 0;
        };

        const scoredRegular = regularJobs.map(job => ({
            ...job,
            matchPercent: scoreJob(job.requiredSkills as string[]),
        })).sort((a, b) => b.matchPercent - a.matchPercent);

        const scoredPlatform = platformJobs.map(job => ({
            ...job,
            matchPercent: scoreJob(job.requiredSkills as string[]),
        })).sort((a, b) => b.matchPercent - a.matchPercent);

        // Platform jobs come first, then regular
        return [...scoredPlatform, ...scoredRegular].slice(0, limit);
    }

    // Get jobs personalized for user based on their target job role (platform jobs pinned at top)
    async getJobsForUser(userId: string, limit: number = 20) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { targetJobRole: true },
        });

        if (!user?.targetJobRole) {
            return this.getMatchingJobs(userId, limit);
        }

        const roleTitle = user.targetJobRole.title;
        const roleRequiredSkills = user.targetJobRole.requiredSkills as string[] || [];

        const titleWord = roleTitle.split(' ')[0];

        const jobListingWhere: any = {
            isActive: true,
            OR: [
                { title: { contains: titleWord, mode: 'insensitive' } },
                ...(roleRequiredSkills.length > 0 ? [{ requiredSkills: { hasSome: roleRequiredSkills } }] : []),
            ],
        };

        const platformWhere: any = {
            OR: [
                { title: { contains: titleWord, mode: 'insensitive' } },
                ...(roleRequiredSkills.length > 0 ? [{ requiredSkills: { hasSome: roleRequiredSkills } }] : []),
            ],
        };

        const [regularJobs, userSkills, platformJobs] = await Promise.all([
            prisma.jobListing.findMany({ where: jobListingWhere, take: limit * 2, orderBy: { createdAt: 'desc' } }),
            prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
            fetchActivePlatformJobs(platformWhere),
        ]);

        const userSkillNames = userSkills.map(us => us.skill.name.toLowerCase().replace(/[-\s]/g, ''));
        const normalizeSkill = (s: string) => s.toLowerCase().replace(/[-\s]/g, '');

        const scoreJob = (job: any) => {
            const requiredSkills: string[] = job.requiredSkills || [];
            const normalizedJobSkills = requiredSkills.map(normalizeSkill);

            const matchedCount = normalizedJobSkills.filter(skill =>
                userSkillNames.some(us => us === skill || us.includes(skill) || skill.includes(us))
            ).length;

            let skillMatchPercent = 0;
            if (requiredSkills.length > 0) {
                skillMatchPercent = Math.round((matchedCount / requiredSkills.length) * 100);
            } else if (userSkillNames.length > 0) {
                skillMatchPercent = 40;
            }

            const normalizedTitle = job.title.toLowerCase();
            const normalizedRoleTitle = roleTitle.toLowerCase();
            const roleTitleWords = normalizedRoleTitle.split(' ').filter((w: string) => w.length > 2);

            let titleMatchBonus = 0;
            if (normalizedTitle.includes(normalizedRoleTitle)) {
                titleMatchBonus = 50;
            } else if (roleTitleWords.some((word: string) => normalizedTitle.includes(word))) {
                titleMatchBonus = 30;
            }

            const finalMatch = userSkillNames.length > 0
                ? Math.min(Math.round(skillMatchPercent * 0.5 + titleMatchBonus), 100)
                : Math.min(titleMatchBonus + 20, 100);

            return {
                ...job,
                matchPercent: Math.max(finalMatch, userSkillNames.length === 0 && titleMatchBonus > 0 ? 50 : 0),
                matchedSkills: matchedCount,
                totalRequired: requiredSkills.length,
            };
        };

        const scoredRegular = regularJobs
            .map(j => scoreJob(j))
            .sort((a, b) => b.matchPercent - a.matchPercent)
            .slice(0, limit);

        // Platform jobs always go first, scored as well
        const scoredPlatform = platformJobs
            .map(j => scoreJob(j))
            .sort((a, b) => b.matchPercent - a.matchPercent);

        const result = [...scoredPlatform, ...scoredRegular].slice(0, limit + scoredPlatform.length);

        logger.info(`Found ${result.length} jobs (${scoredPlatform.length} platform) for user ${userId} with role ${roleTitle}`);
        return result;
    }

    // Save/bookmark a job
    async saveJob(userId: string, jobId: string) {
        const job = await prisma.jobListing.findUnique({ where: { id: jobId } });

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        return prisma.application.upsert({
            where: { userId_jobId: { userId, jobId } },
            create: { userId, jobId, status: 'SAVED' },
            update: {},
            include: { job: true },
        });
    }

    // Remove saved job
    async unsaveJob(userId: string, jobId: string) {
        const app = await prisma.application.findUnique({
            where: { userId_jobId: { userId, jobId } },
        });

        if (app && app.status === 'SAVED') {
            await prisma.application.delete({ where: { userId_jobId: { userId, jobId } } });
        }
    }

    // Get user's saved jobs
    async getSavedJobs(userId: string) {
        const applications = await prisma.application.findMany({
            where: { userId, status: 'SAVED' },
            include: { job: true },
            orderBy: { createdAt: 'desc' },
        });

        return applications.map(app => app.job);
    }

    // One-Click Apply - Create or update application to APPLIED status
    async applyToJob(userId: string, jobId: string, resumeId?: string, coverLetter?: string) {
        const job = await prisma.jobListing.findUnique({ where: { id: jobId } });

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        const existing = await prisma.application.findUnique({
            where: { userId_jobId: { userId, jobId } },
        });

        if (existing && existing.status !== 'SAVED') {
            throw new AppError('Already applied to this job', 400);
        }

        const application = await prisma.application.upsert({
            where: { userId_jobId: { userId, jobId } },
            create: {
                userId,
                jobId,
                status: 'APPLIED',
                appliedAt: new Date(),
                resumeUsed: resumeId,
                coverLetter,
                notes: `Applied via One-Click Apply on ${new Date().toISOString()}`,
            },
            update: {
                status: 'APPLIED',
                appliedAt: new Date(),
                resumeUsed: resumeId,
                coverLetter,
                notes: existing?.notes
                    ? `${existing.notes}\n\n[${new Date().toISOString()}] Applied via One-Click Apply`
                    : `Applied via One-Click Apply on ${new Date().toISOString()}`,
            },
            include: { job: true },
        });

        logger.info(`User ${userId} applied to job ${jobId}`);
        return application;
    }

    // Get user's notifications
    async getNotifications(userId: string, unreadOnly = false) {
        const where: any = { userId };
        if (unreadOnly) where.isRead = false;

        return (prisma as any).notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    // Mark notifications as read
    async markNotificationsRead(userId: string, notificationIds?: string[]) {
        const where: any = { userId };
        if (notificationIds && notificationIds.length > 0) {
            where.id = { in: notificationIds };
        }
        await (prisma as any).notification.updateMany({ where, data: { isRead: true } });
    }

    // Count unread notifications
    async getUnreadCount(userId: string) {
        return (prisma as any).notification.count({ where: { userId, isRead: false } });
    }
}
