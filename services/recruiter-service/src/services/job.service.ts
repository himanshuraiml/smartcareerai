import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface CreateJobInput {
    title: string;
    description: string;
    requirements: string[];
    requiredSkills: string[];
    location: string;
    locationType?: string;
    salaryMin?: number;
    salaryMax?: number;
    experienceMin?: number;
    experienceMax?: number;
}

export class JobService {
    /**
     * Create a job posting
     */
    async createJob(recruiterId: string, input: CreateJobInput) {
        const job = await prisma.recruiterJob.create({
            data: {
                recruiterId,
                title: input.title,
                description: input.description,
                requirements: input.requirements,
                requiredSkills: input.requiredSkills,
                location: input.location,
                locationType: input.locationType || 'onsite',
                salaryMin: input.salaryMin,
                salaryMax: input.salaryMax,
                experienceMin: input.experienceMin,
                experienceMax: input.experienceMax,
            },
        });

        logger.info(`Created job posting: ${job.id}`);
        return job;
    }

    /**
     * Get recruiter's job postings
     */
    async getJobs(recruiterId: string, activeOnly = false) {
        const where: any = { recruiterId };
        if (activeOnly) {
            where.isActive = true;
        }

        return prisma.recruiterJob.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get job by ID
     */
    async getJobById(jobId: string, recruiterId: string) {
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
        });

        if (!job) {
            throw createError('Job not found', 404, 'JOB_NOT_FOUND');
        }

        return job;
    }

    /**
     * Update job posting
     */
    async updateJob(jobId: string, recruiterId: string, input: Partial<CreateJobInput>) {
        // Verify ownership
        await this.getJobById(jobId, recruiterId);

        return prisma.recruiterJob.update({
            where: { id: jobId },
            data: input,
        });
    }

    /**
     * Toggle job active status
     */
    async toggleJobStatus(jobId: string, recruiterId: string) {
        const job = await this.getJobById(jobId, recruiterId);

        return prisma.recruiterJob.update({
            where: { id: jobId },
            data: { isActive: !job.isActive },
        });
    }

    /**
     * Delete job posting
     */
    async deleteJob(jobId: string, recruiterId: string) {
        // Verify ownership
        await this.getJobById(jobId, recruiterId);

        await prisma.recruiterJob.delete({
            where: { id: jobId },
        });

        logger.info(`Deleted job posting: ${jobId}`);
    }
}

export const jobService = new JobService();
