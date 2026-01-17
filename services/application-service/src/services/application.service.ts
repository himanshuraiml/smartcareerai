import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';

export class ApplicationService {
    // Get all applications for a user
    async getApplications(userId: string, status?: string) {
        const where: any = { userId };

        if (status) {
            where.status = status;
        }

        return prisma.application.findMany({
            where,
            include: { job: true },
            orderBy: { updatedAt: 'desc' },
        });
    }

    // Get single application by ID
    async getApplicationById(userId: string, applicationId: string) {
        const application = await prisma.application.findFirst({
            where: { id: applicationId, userId },
            include: { job: true },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        return application;
    }

    // Create new application
    async createApplication(userId: string, data: any) {
        let jobId = data.jobId;

        // If no jobId provided but job details are present, create a manual job listing
        if (!jobId && data.job) {
            const newJob = await prisma.jobListing.create({
                data: {
                    title: data.job.title,
                    company: data.job.company,
                    location: data.job.location || 'Unknown',
                    locationType: data.job.locationType || 'onsite',
                    description: data.job.description || 'Manual entry',
                    requirements: [],
                    requiredSkills: [],
                    source: 'manual',
                    sourceUrl: data.job.sourceUrl || null,
                    externalId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    isActive: true,
                    // If salary is provided in job details
                    salaryMin: data.job.salaryMin,
                    salaryMax: data.job.salaryMax,
                }
            });
            jobId = newJob.id;
        }

        if (!jobId) {
            throw new AppError('Job ID or Job details are required', 400);
        }

        // Check if already applied to this job
        const existing = await prisma.application.findUnique({
            where: { userId_jobId: { userId, jobId } },
        });

        if (existing) {
            throw new AppError('Already applied to this job', 400);
        }

        return prisma.application.create({
            data: {
                userId,
                jobId,
                status: data.status || 'APPLIED',
                appliedAt: data.status === 'APPLIED' ? new Date() : (data.appliedAt ? new Date(data.appliedAt) : null),
                notes: data.notes,
                resumeUsed: data.resumeUsed,
                coverLetter: data.coverLetter,
                salaryExpected: data.salaryExpected,
            },
            include: { job: true },
        });
    }

    // Update application details
    async updateApplication(userId: string, applicationId: string, data: any) {
        const application = await prisma.application.findFirst({
            where: { id: applicationId, userId },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        return prisma.application.update({
            where: { id: applicationId },
            data: {
                notes: data.notes,
                interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined,
                coverLetter: data.coverLetter,
                salaryExpected: data.salaryExpected,
            },
            include: { job: true },
        });
    }

    // Update application status (Kanban move)
    async updateStatus(userId: string, applicationId: string, status: string, notes?: string) {
        const application = await prisma.application.findFirst({
            where: { id: applicationId, userId },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        const updateData: any = { status };

        // Set appliedAt when moving to APPLIED
        if (status === 'APPLIED' && !application.appliedAt) {
            updateData.appliedAt = new Date();
        }

        // Append to notes if provided
        if (notes) {
            const timestamp = new Date().toISOString();
            const newNote = `[${timestamp}] Status: ${status}\n${notes}`;
            updateData.notes = application.notes
                ? `${application.notes}\n\n${newNote}`
                : newNote;
        }

        return prisma.application.update({
            where: { id: applicationId },
            data: updateData,
            include: { job: true },
        });
    }

    // Delete application
    async deleteApplication(userId: string, applicationId: string) {
        const application = await prisma.application.findFirst({
            where: { id: applicationId, userId },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        await prisma.application.delete({
            where: { id: applicationId },
        });
    }

    // Get application statistics for dashboard
    async getStats(userId: string) {
        const applications = await prisma.application.findMany({
            where: { userId },
        });

        const stats = {
            total: applications.length,
            saved: 0,
            applied: 0,
            screening: 0,
            interviewing: 0,
            offers: 0,
            rejected: 0,
            withdrawn: 0,
            responseRate: 0,
            interviewRate: 0,
        };

        for (const app of applications) {
            switch (app.status) {
                case 'SAVED': stats.saved++; break;
                case 'APPLIED': stats.applied++; break;
                case 'SCREENING': stats.screening++; break;
                case 'INTERVIEWING': stats.interviewing++; break;
                case 'OFFER': stats.offers++; break;
                case 'REJECTED': stats.rejected++; break;
                case 'WITHDRAWN': stats.withdrawn++; break;
            }
        }

        // Calculate rates
        const appliedTotal = stats.total - stats.saved;
        if (appliedTotal > 0) {
            const responded = stats.screening + stats.interviewing + stats.offers + stats.rejected;
            stats.responseRate = Math.round((responded / appliedTotal) * 100);
            stats.interviewRate = Math.round((stats.interviewing + stats.offers) / appliedTotal * 100);
        }

        return stats;
    }

    // Get application timeline (status history from notes)
    async getTimeline(userId: string, applicationId: string) {
        const application = await prisma.application.findFirst({
            where: { id: applicationId, userId },
            include: { job: true },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        // Parse notes for timeline entries
        const timeline = [];

        timeline.push({
            date: application.createdAt,
            status: 'Created',
            description: 'Application added',
        });

        if (application.appliedAt) {
            timeline.push({
                date: application.appliedAt,
                status: 'Applied',
                description: 'Application submitted',
            });
        }

        if (application.interviewDate) {
            timeline.push({
                date: application.interviewDate,
                status: 'Interview',
                description: 'Interview scheduled',
            });
        }

        return {
            application,
            timeline: timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
    }
}
