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

export class JobService {
    // Get paginated job listings
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

        const [jobs, total] = await Promise.all([
            prisma.jobListing.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.jobListing.count({ where }),
        ]);

        return {
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get single job by ID
    async getJobById(jobId: string) {
        const job = await prisma.jobListing.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        return job;
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

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        return prisma.jobListing.update({
            where: { id: jobId },
            data,
        });
    }

    // Soft delete job
    async deleteJob(jobId: string) {
        await prisma.jobListing.update({
            where: { id: jobId },
            data: { isActive: false },
        });
    }

    // Search jobs with filters
    async searchJobs(filters: SearchFilters) {
        const { query, location, skills, remote, page, limit } = filters;
        const skip = (page - 1) * limit;

        const where: any = { isActive: true };

        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { company: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }

        if (remote) {
            where.locationType = 'remote';
        }

        if (skills && skills.length > 0) {
            where.requiredSkills = { hasSome: skills };
        }

        const [jobs, total] = await Promise.all([
            prisma.jobListing.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.jobListing.count({ where }),
        ]);

        return {
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get jobs matching user's skills
    async getMatchingJobs(userId: string, limit: number) {
        // Get user's skills
        const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            include: { skill: true },
        });

        const skillNames = userSkills.map(us => us.skill.name);

        if (skillNames.length === 0) {
            // Return latest jobs if user has no skills
            return prisma.jobListing.findMany({
                where: { isActive: true },
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
        }

        // Find jobs that match user's skills
        const jobs = await prisma.jobListing.findMany({
            where: {
                isActive: true,
                requiredSkills: { hasSome: skillNames },
            },
            take: limit * 2, // Get more to score and rank
            orderBy: { createdAt: 'desc' },
        });

        // Score jobs by skill match percentage
        const scoredJobs = jobs.map(job => {
            const requiredSkills = job.requiredSkills as string[];
            const matchedCount = requiredSkills.filter(skill =>
                skillNames.some(us => us.toLowerCase() === skill.toLowerCase())
            ).length;
            const matchPercent = requiredSkills.length > 0
                ? Math.round((matchedCount / requiredSkills.length) * 100)
                : 0;

            return {
                ...job,
                matchPercent,
                matchedSkills: matchedCount,
                totalRequired: requiredSkills.length,
            };
        });

        // Sort by match percentage and return top results
        return scoredJobs
            .sort((a, b) => b.matchPercent - a.matchPercent)
            .slice(0, limit);
    }

    // Get jobs personalized for user based on their target job role
    async getJobsForUser(userId: string, limit: number = 20) {
        // Get user's target job role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { targetJobRole: true },
        });

        if (!user?.targetJobRole) {
            // No target role - fall back to matching jobs or latest
            return this.getMatchingJobs(userId, limit);
        }

        const roleTitle = user.targetJobRole.title;
        const roleRequiredSkills = user.targetJobRole.requiredSkills as string[] || [];

        // Search jobs that match the role title OR have overlapping skills
        const jobs = await prisma.jobListing.findMany({
            where: {
                isActive: true,
                OR: [
                    // Match by title containing role
                    { title: { contains: roleTitle.split(' ')[0], mode: 'insensitive' } },
                    // Match by required skills overlap
                    ...(roleRequiredSkills.length > 0 ? [{ requiredSkills: { hasSome: roleRequiredSkills } }] : []),
                ],
            },
            take: limit * 2,
            orderBy: { createdAt: 'desc' },
        });

        // Get user's skills for scoring
        const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            include: { skill: true },
        });
        const userSkillNames = userSkills.map(us => us.skill.name);

        // Score and rank jobs
        const scoredJobs = jobs.map(job => {
            const requiredSkills = job.requiredSkills as string[];

            // Score based on user's skills
            const matchedCount = requiredSkills.filter(skill =>
                userSkillNames.some(us => us.toLowerCase() === skill.toLowerCase())
            ).length;
            const matchPercent = requiredSkills.length > 0
                ? Math.round((matchedCount / requiredSkills.length) * 100)
                : 0;

            // Bonus for role title match
            const titleMatch = job.title.toLowerCase().includes(roleTitle.toLowerCase().split(' ')[0]) ? 10 : 0;

            return {
                ...job,
                matchPercent: Math.min(matchPercent + titleMatch, 100),
                matchedSkills: matchedCount,
                totalRequired: requiredSkills.length,
            };
        });

        // Sort by match percentage and return top results
        const result = scoredJobs
            .sort((a, b) => b.matchPercent - a.matchPercent)
            .slice(0, limit);

        logger.info(`Found ${result.length} jobs for user ${userId} with role ${roleTitle}`);
        return result;
    }

    // Save/bookmark a job
    async saveJob(userId: string, jobId: string) {
        const job = await prisma.jobListing.findUnique({ where: { id: jobId } });

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        return prisma.application.upsert({
            where: {
                userId_jobId: { userId, jobId },
            },
            create: {
                userId,
                jobId,
                status: 'SAVED',
            },
            update: {}, // Don't update if exists
            include: { job: true },
        });
    }

    // Remove saved job
    async unsaveJob(userId: string, jobId: string) {
        const app = await prisma.application.findUnique({
            where: { userId_jobId: { userId, jobId } },
        });

        if (app && app.status === 'SAVED') {
            await prisma.application.delete({
                where: { userId_jobId: { userId, jobId } },
            });
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

        // Check existing application
        const existing = await prisma.application.findUnique({
            where: { userId_jobId: { userId, jobId } },
        });

        if (existing && existing.status !== 'SAVED') {
            throw new AppError('Already applied to this job', 400);
        }

        // Create or update application
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
}

