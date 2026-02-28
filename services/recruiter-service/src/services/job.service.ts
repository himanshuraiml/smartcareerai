import { PrismaClient, InterviewType, Difficulty } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';
import { googleCalendarService } from '../integrations/google-calendar';

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
    targetInstitutionId?: string;
}

export class JobService {
    /**
     * Create a job posting and notify matching users
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
                targetInstitutionId: input.targetInstitutionId,
            },
            include: {
                recruiter: { select: { companyName: true } },
            },
        });

        logger.info(`Created job posting: ${job.id}`);

        // Fire-and-forget: notify matching users
        this.notifyMatchingUsers(job).catch(err =>
            logger.error('Failed to send job notifications', err)
        );

        return job;
    }

    /**
     * Notify users whose skills or target role match this job
     */
    private async notifyMatchingUsers(job: any) {
        const requiredSkills = job.requiredSkills as string[];
        if (requiredSkills.length === 0) return;

        // Find users whose skills overlap with the job requirements
        const matchingUsers = await prisma.user.findMany({
            where: {
                role: 'USER',
                userSkills: {
                    some: {
                        skill: {
                            name: {
                                in: requiredSkills,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            },
            select: { id: true },
            take: 500, // cap to avoid huge inserts
        });

        if (matchingUsers.length === 0) return;

        const companyName = job.recruiter?.companyName || 'A recruiter';
        const notifications = matchingUsers.map(u => ({
            userId: u.id,
            type: 'job_alert',
            title: `New job: ${job.title}`,
            message: `${companyName} posted a new ${job.title} role in ${job.location}. Check it out!`,
            metadata: {
                recruiterJobId: job.id,
                companyName,
                jobTitle: job.title,
                location: job.location,
            },
        }));

        await prisma.notification.createMany({ data: notifications, skipDuplicates: true });
        logger.info(`Sent job alert notifications to ${notifications.length} users for job ${job.id}`);
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
     * Get list of all institutions for targeted posting
     */
    async getInstitutions() {
        return prisma.institution.findMany({
            select: { id: true, name: true, domain: true },
            orderBy: { name: 'asc' },
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
     * Get job by ID public (for candidates)
     */
    async getPublicJobById(jobId: string) {
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, isActive: true },
            include: {
                recruiter: {
                    include: {
                        organization: {
                            select: { name: true, logoUrl: true }
                        }
                    }
                }
            }
        });

        if (!job) {
            throw createError('Job not found or inactive', 404, 'JOB_NOT_FOUND');
        }

        return job;
    }

    /**
     * Update job posting
     */
    async updateJob(jobId: string, recruiterId: string, input: Partial<CreateJobInput>) {
        await this.getJobById(jobId, recruiterId);

        return prisma.recruiterJob.update({
            where: { id: jobId },
            data: input,
        });
    }

    /**
     * Toggle job active status — re-notify users when job re-activated
     */
    async toggleJobStatus(jobId: string, recruiterId: string) {
        const job = await this.getJobById(jobId, recruiterId);

        const updated = await prisma.recruiterJob.update({
            where: { id: jobId },
            data: { isActive: !job.isActive },
            include: { recruiter: { select: { companyName: true } } },
        });

        // If the job was just re-activated, notify matching users
        if (updated.isActive) {
            this.notifyMatchingUsers(updated).catch(err =>
                logger.error('Failed to send re-activation notifications', err)
            );
        }

        return updated;
    }

    /**
     * Candidate applies to a platform job — creates a RecruiterJobApplicant record.
     * Any authenticated user (role=USER) can call this.
     */
    async candidateApply(candidateId: string, jobId: string, coverLetter?: string, resumeId?: string) {
        // Verify the job exists and is active
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, isActive: true },
            include: { recruiter: { select: { companyName: true, userId: true } } },
        });

        if (!job) {
            throw createError('Job not found or is no longer accepting applications', 404, 'JOB_NOT_FOUND');
        }

        // Prevent duplicate application
        const existing = await prisma.recruiterJobApplicant.findUnique({
            where: { jobId_candidateId: { jobId, candidateId } },
        });

        if (existing) {
            throw createError('You have already applied to this job', 409, 'ALREADY_APPLIED');
        }

        // Auto-attach resume: use provided resumeId or fall back to the candidate's latest resume
        let resumeUrl: string | undefined;
        if (resumeId) {
            const resume = await prisma.resume.findFirst({
                where: { id: resumeId, userId: candidateId },
                select: { fileUrl: true },
            });
            resumeUrl = resume?.fileUrl;
        } else {
            const latestResume = await prisma.resume.findFirst({
                where: { userId: candidateId, isActive: true },
                orderBy: { createdAt: 'desc' },
                select: { fileUrl: true },
            });
            resumeUrl = latestResume?.fileUrl;
        }

        const application = await prisma.recruiterJobApplicant.create({
            data: {
                jobId,
                candidateId,
                status: 'APPLIED',
                coverLetter: coverLetter || undefined,
                resumeUrl: resumeUrl || undefined,
            },
            include: {
                job: {
                    select: {
                        title: true,
                        location: true,
                        recruiter: { select: { companyName: true } },
                    },
                },
            },
        });

        logger.info(`Candidate ${candidateId} applied to platform job ${jobId}`);
        return {
            applicationId: application.id,
            jobTitle: application.job.title,
            company: application.job.recruiter.companyName,
            location: application.job.location,
            status: application.status,
            appliedAt: application.appliedAt,
        };
    }

    /**
     * Check if the current user has already applied to a platform job.
     */
    async getMyApplication(candidateId: string, jobId: string) {
        const application = await prisma.recruiterJobApplicant.findUnique({
            where: { jobId_candidateId: { jobId, candidateId } },
            select: {
                id: true,
                status: true,
                appliedAt: true,
            },
        });

        return application || null;
    }

    /**
     * Invite a platform-job applicant to complete an AI interview session.
     * Creates the InterviewSession directly (bypassing billing) and notifies the candidate.
     */
    async inviteApplicantToInterview(
        recruiterId: string,
        jobId: string,
        applicationId: string,
        inviteType: 'AI' | 'COPILOT' = 'AI',
        customMessage?: string,
        scheduledAt?: string,      // ISO datetime string — required for COPILOT
        durationMinutes?: number,  // default 60
    ) {
        const job = await this.getJobById(jobId, recruiterId);

        const applicant = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, jobId },
            include: {
                candidate: { select: { id: true, name: true, email: true } },
            },
        });

        if (!applicant) {
            throw createError('Applicant not found', 404, 'APPLICANT_NOT_FOUND');
        }

        const recruiter = await prisma.recruiter.findUnique({
            where: { userId: recruiterId },
            select: { companyName: true, organizationId: true },
        });
        const companyName = recruiter?.companyName || 'A recruiter';

        // Look up recruiter email for calendar attendee
        const recruiterUser = await prisma.user.findUnique({
            where: { id: recruiterId },
            select: { email: true },
        });

        const config = job.aiInterviewConfig as any;
        const interviewType: string = config?.interviewType || 'MIXED';
        const difficulty: string = config?.difficulty || 'MEDIUM';

        // ── Google Calendar event (COPILOT only) ────────────────────
        let meetLink: string | undefined;
        let calendarEventId: string | undefined;
        let startTime: Date | undefined;
        let endTime: Date | undefined;

        if (inviteType === 'COPILOT' && scheduledAt) {
            startTime = new Date(scheduledAt);
            endTime = new Date(startTime.getTime() + (durationMinutes || 60) * 60 * 1000);

            try {
                if (recruiter?.organizationId) {
                    const calIntegration = await prisma.calendarIntegration.findUnique({
                        where: { organizationId: recruiter.organizationId },
                    });

                    if (calIntegration?.isActive && calIntegration.accessToken) {
                        googleCalendarService.setCredentials({
                            access_token: calIntegration.accessToken,
                            refresh_token: calIntegration.refreshToken,
                            expiry_date: calIntegration.expiryDate,
                        });

                        const attendees = [applicant.candidate.email];
                        if (recruiterUser?.email) attendees.push(recruiterUser.email);

                        const scheduledDateStr = startTime.toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        });
                        const scheduledTimeStr = startTime.toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
                        });

                        const eventDescription = [
                            `Interview for: ${job.title}`,
                            `Candidate: ${applicant.candidate.name}`,
                            `Company: ${companyName}`,
                            '',
                            customMessage || '',
                            '',
                            'This interview uses AI-assisted co-pilot technology for real-time question suggestions and evaluation.',
                        ].join('\n');

                        const event = await googleCalendarService.createInterviewEvent(
                            `Interview: ${job.title} — ${applicant.candidate.name}`,
                            eventDescription,
                            startTime,
                            endTime,
                            attendees,
                        );

                        meetLink = (event as any).hangoutLink || undefined;
                        calendarEventId = event.id || undefined;

                        logger.info(`Created Google Calendar event ${calendarEventId} for interview session, meetLink: ${meetLink}`);
                    }
                }
            } catch (calErr: any) {
                // Calendar failure is non-fatal — interview still goes ahead
                logger.warn(`Google Calendar event creation failed (non-fatal): ${calErr.message}`);
            }
        }

        // Create InterviewSession directly (credit check bypassed — recruiter invited)
        const session = await prisma.interviewSession.create({
            data: {
                userId: applicant.candidateId,
                type: interviewType as InterviewType,
                targetRole: job.title,
                difficulty: difficulty as Difficulty,
                status: 'PENDING',
                jobId: job.id,
                inviteType,
                ...(startTime ? { scheduledAt: startTime } : {}),
                ...(endTime ? { scheduledEndAt: endTime } : {}),
                ...(meetLink ? { meetLink } : {}),
                ...(calendarEventId ? { calendarEventId } : {}),
            },
        });

        // Pre-populate questions from aiInterviewConfig if present
        if (config?.questions && Array.isArray(config.questions) && config.questions.length > 0) {
            const questionData = config.questions.map((q: any, idx: number) => ({
                sessionId: session.id,
                questionText: q.questionText || q.question || '',
                questionType: q.type || 'technical',
                orderIndex: idx,
            }));
            await prisma.interviewQuestion.createMany({ data: questionData });
        }

        // Notify candidate
        const isAI = inviteType === 'AI';
        const notifTitle = isAI
            ? `AI Interview Invitation: ${job.title}`
            : `Live Interview Invitation: ${job.title}`;

        let defaultMessage: string;
        if (isAI) {
            defaultMessage = `${companyName} has invited you to complete an AI interview for the ${job.title} position. Click to start when ready — no scheduling needed.`;
        } else if (startTime) {
            const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const timeStr = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            defaultMessage = `${companyName} has scheduled a live interview for the ${job.title} position on ${dateStr} at ${timeStr}. ${meetLink ? `Join link: ${meetLink}` : 'The interviewer will share a meeting link shortly.'}`;
        } else {
            defaultMessage = `${companyName} has invited you to a live interview for the ${job.title} position. The recruiter will share a meeting link shortly.`;
        }

        const notifMessage = customMessage || defaultMessage;

        await prisma.notification.create({
            data: {
                userId: applicant.candidateId,
                type: 'interview_invite',
                title: notifTitle,
                message: notifMessage,
                metadata: {
                    sessionId: session.id,
                    jobId: job.id,
                    jobTitle: job.title,
                    companyName,
                    meetLink,
                    scheduledAt: startTime?.toISOString(),
                    link: `/dashboard/interviews`,
                },
            },
        });

        // Move applicant to INTERVIEWING
        await prisma.recruiterJobApplicant.update({
            where: { id: applicationId },
            data: { status: 'INTERVIEWING' },
        });

        logger.info(`Recruiter ${recruiterId} invited candidate ${applicant.candidateId} to interview for job ${jobId}, session ${session.id}, type=${inviteType}`);

        return {
            sessionId: session.id,
            inviteType,
            scheduledAt: startTime?.toISOString(),
            meetLink,
            candidateId: applicant.candidateId,
            candidateName: applicant.candidate.name,
            candidateEmail: applicant.candidate.email,
        };
    }

    /**
     * Delete job posting
     */
    async deleteJob(jobId: string, recruiterId: string) {
        await this.getJobById(jobId, recruiterId);

        await prisma.recruiterJob.delete({ where: { id: jobId } });

        logger.info(`Deleted job posting: ${jobId}`);
    }
}

export const jobService = new JobService();
