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
    salaryCurrency?: string;
    experienceMin?: number;
    experienceMax?: number;
    targetInstitutionId?: string;
    pipelineSteps?: any[];
    applicationDeadline?: string; // ISO date string
}

export class JobService {
    /**
     * Create a job posting and notify matching users
     */
    async createJob(recruiterId: string, input: CreateJobInput) {
        // Validate applicationDeadline if provided
        if (input.applicationDeadline) {
            const deadline = new Date(input.applicationDeadline);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            if (isNaN(deadline.getTime()) || deadline < tomorrow) {
                throw createError('Application deadline must be at least 1 day in the future', 400, 'INVALID_DEADLINE');
            }
        }

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
                salaryCurrency: input.salaryCurrency || 'INR',
                experienceMin: input.experienceMin,
                experienceMax: input.experienceMax,
                targetInstitutionId: input.targetInstitutionId,
                pipelineSteps: input.pipelineSteps ? (input.pipelineSteps as any) : undefined,
                applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : undefined,
            },
            include: {
                recruiter: { select: { companyName: true } },
            },
        });

        logger.info(`Created job posting: ${job.id}`);

        // Auto-create AssessmentTemplate if pipeline has ANALYTICAL or BEHAVIOURAL stages
        const assessmentSteps = (input.pipelineSteps ?? []).filter(
            (s: any) => s.type === 'ANALYTICAL' || s.type === 'BEHAVIOURAL'
        );
        const hasAssessmentStep = assessmentSteps.length > 0;
        if (hasAssessmentStep) {
            // Use assessmentDeadline from the first assessment stage config if provided
            const assessmentDeadlineStr: string | undefined = assessmentSteps
                .map((s: any) => s.config?.assessmentDeadline)
                .find((d: any) => !!d);
            const assessmentDeadline = assessmentDeadlineStr ? new Date(assessmentDeadlineStr) : undefined;

            await prisma.assessmentTemplate.upsert({
                where: { jobId: job.id },
                update: {
                    ...(assessmentDeadline !== undefined ? { assessmentDeadline } : {}),
                },
                create: {
                    jobId: job.id,
                    durationMinutes: 30,
                    totalQuestions: 20,
                    difficultyDistribution: { EASY: 5, MEDIUM: 10, HARD: 5 },
                    requiredSkills: input.requiredSkills ?? [],
                    ...(assessmentDeadline !== undefined ? { assessmentDeadline } : {}),
                },
            }).catch(err => logger.error(`Failed to auto-create AssessmentTemplate for job ${job.id}:`, err));
        }

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

        const jobs = await prisma.recruiterJob.findMany({
            where,
            include: {
                _count: {
                    select: { applicants: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Map _count.applicants to _count.applications for frontend compatibility
        return jobs.map((job: any) => ({
            ...job,
            _count: {
                applications: job._count?.applicants ?? 0
            }
        }));
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
            include: {
                _count: {
                    select: { applicants: true }
                }
            }
        });

        if (!job) {
            throw createError('Job not found', 404, 'JOB_NOT_FOUND');
        }

        // Map _count.applicants to _count.applications for frontend compatibility
        const result: any = { ...job };
        result._count = {
            applications: job._count?.applicants ?? 0
        };
        return result;
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

        // Check application deadline
        if (job.applicationDeadline && new Date() > job.applicationDeadline) {
            throw createError('The application deadline for this job has passed', 410, 'APPLICATION_DEADLINE_PASSED');
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

        // ── Scheduling setup (COPILOT only) ─────────────────────────
        let meetLink: string | undefined;
        let calendarEventId: string | undefined;
        let startTime: Date | undefined;
        let endTime: Date | undefined;
        let inHouseMeetingId: string | undefined;

        if (inviteType === 'COPILOT' && scheduledAt) {
            startTime = new Date(scheduledAt);
            endTime = new Date(startTime.getTime() + (durationMinutes || 60) * 60 * 1000);
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
            },
        });

        // ── Create in-house MeetingRoom (COPILOT only) ───────────────
        // Uses the platform's own WebRTC meeting system instead of Google Meet.
        if (inviteType === 'COPILOT') {
            try {
                const mediaServiceUrl = process.env.MEDIA_SERVICE_URL || 'http://localhost:3014';
                const meetRes = await fetch(`${mediaServiceUrl}/meetings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': recruiterId,
                    },
                    body: JSON.stringify({
                        interviewId: session.id,
                        maxParticipants: 5,
                        ...(startTime ? { scheduledAt: startTime.toISOString() } : {}),
                    }),
                });

                if (meetRes.ok) {
                    const meetData = await meetRes.json() as { success: boolean; data: { id: string; meetingToken: string } };
                    inHouseMeetingId = meetData.data?.id;
                    meetLink = inHouseMeetingId ? `/dashboard/meetings/${inHouseMeetingId}` : undefined;

                    if (meetLink) {
                        await prisma.interviewSession.update({
                            where: { id: session.id },
                            data: { meetLink },
                        });
                    }
                    logger.info(`Created in-house meeting ${inHouseMeetingId} for interview session ${session.id}`);
                } else {
                    logger.warn(`Failed to create in-house meeting (${meetRes.status}): ${await meetRes.text()}`);
                }
            } catch (meetErr: any) {
                logger.warn(`In-house meeting room creation failed (non-fatal): ${meetErr.message}`);
            }
        }

        // ── Google Calendar event (COPILOT + calendar integration) ───
        // Sends a calendar invite with the PlaceNxt meeting link (no Google Meet auto-creation).
        if (inviteType === 'COPILOT' && startTime && endTime) {
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

                        const eventDescription = [
                            `Interview for: ${job.title}`,
                            `Candidate: ${applicant.candidate.name}`,
                            `Company: ${companyName}`,
                            '',
                            customMessage || '',
                            '',
                            'This interview uses the PlaceNxt AI-assisted co-pilot for real-time question suggestions and evaluation.',
                        ].join('\n');

                        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3100';
                        const fullMeetingUrl = meetLink ? `${appBaseUrl}${meetLink}` : undefined;

                        const event = await googleCalendarService.createInterviewEvent(
                            `Interview: ${job.title} — ${applicant.candidate.name}`,
                            eventDescription,
                            startTime,
                            endTime,
                            attendees,
                            fullMeetingUrl,
                        );

                        calendarEventId = event.id || undefined;
                        if (calendarEventId) {
                            await prisma.interviewSession.update({
                                where: { id: session.id },
                                data: { calendarEventId },
                            });
                        }
                        logger.info(`Created Google Calendar event ${calendarEventId} for interview session ${session.id}`);
                    }
                }
            } catch (calErr: any) {
                logger.warn(`Google Calendar event creation failed (non-fatal): ${calErr.message}`);
            }
        }


        // Auto-set inviteExpiresAt for AI async interviews (14 days)
        const inviteExpiresAt = inviteType === 'AI'
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            : undefined;

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
                ...(inviteExpiresAt ? { inviteExpiresAt } : {}),
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
            const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3100';
            const joinUrl = meetLink ? `${appBaseUrl}${meetLink}` : null;
            defaultMessage = `${companyName} has scheduled a live interview for the ${job.title} position on ${dateStr} at ${timeStr}. ${joinUrl ? `Join: ${joinUrl}` : 'The interviewer will share a meeting link shortly.'}`;
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

        // F3: Generate booking token for COPILOT invites without a pre-set time
        let bookingUrl: string | undefined;
        if (inviteType === 'COPILOT' && !startTime) {
            try {
                const { schedulingService } = await import('./scheduling.service');
                const bookingToken = await schedulingService.generateBookingToken(session.id);
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
                bookingUrl = `${frontendUrl}/schedule/${bookingToken}`;
                logger.info(`Generated booking URL for session ${session.id}: ${bookingUrl}`);
            } catch (err) {
                logger.warn('Failed to generate booking token (non-fatal):', err);
            }
        }

        logger.info(`Recruiter ${recruiterId} invited candidate ${applicant.candidateId} to interview for job ${jobId}, session ${session.id}, type=${inviteType}`);

        return {
            sessionId: session.id,
            inviteType,
            scheduledAt: startTime?.toISOString(),
            meetLink,
            bookingUrl,
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

    /**
     * F14: Get campus drives where this recruiter has been invited
     */
    async getCampusDrives(recruiterId: string) {
        const invites = await prisma.driveInvite.findMany({
            where: { recruiterId },
            include: {
                drive: {
                    include: {
                        institution: { select: { id: true, name: true, logoUrl: true } },
                        _count: { select: { jobs: true, applications: true } },
                    },
                },
            },
            orderBy: { invitedAt: 'desc' },
        });

        return invites.map((invite: any) => invite.drive);
    }

    /**
     * F14: Post a job linked to a campus drive (recruiter must be invited)
     */
    async postJobForDrive(recruiterId: string, driveId: string, input: CreateJobInput) {
        // Verify recruiter is invited to this drive
        const invite = await prisma.driveInvite.findUnique({
            where: { driveId_recruiterId: { driveId, recruiterId } },
        });
        if (!invite) {
            throw createError('You are not invited to this drive', 403, 'NOT_INVITED');
        }

        const drive = await prisma.placementDrive.findUnique({
            where: { id: driveId },
            select: { institutionId: true },
        });
        if (!drive) throw createError('Drive not found', 404, 'NOT_FOUND');

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
                salaryCurrency: input.salaryCurrency || 'INR',
                experienceMin: input.experienceMin,
                experienceMax: input.experienceMax,
                targetInstitutionId: drive.institutionId,
                applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : undefined,
                drives: { connect: { id: driveId } },
            },
            include: {
                recruiter: { select: { companyName: true } },
            },
        });

        logger.info(`Created drive job: ${job.id} for drive ${driveId}`);
        return job;
    }

    /**
     * F14: List jobs posted by this recruiter for a specific drive
     */
    async getDriveJobs(recruiterId: string, driveId: string) {
        // Verify recruiter is invited
        const invite = await prisma.driveInvite.findUnique({
            where: { driveId_recruiterId: { driveId, recruiterId } },
        });
        if (!invite) throw createError('You are not invited to this drive', 403, 'NOT_INVITED');

        return prisma.recruiterJob.findMany({
            where: {
                recruiterId,
                drives: { some: { id: driveId } },
            },
            include: {
                _count: { select: { jobApplications: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const jobService = new JobService();
