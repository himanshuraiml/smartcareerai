import { PrismaClient, ApplicationStatus } from '@prisma/client';
import crypto from 'crypto';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { webhookService } from './webhook.service';
import { predictiveService } from './predictive.service';

const prisma = new PrismaClient();

export type AtsApplicationStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'REJECTED';

export class AtsService {
    /**
     * GET /recruiter/jobs/:id — enhanced with applicant count
     */
    async getJobWithApplicantCount(jobId: string, recruiterId: string) {
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
            include: { _count: { select: { applicants: true } } },
        });

        if (!job) {
            throw createError('Job not found', 404, 'JOB_NOT_FOUND');
        }

        return {
            ...job,
            applicantCount: job._count.applicants,
        };
    }

    /**
     * GET /recruiter/jobs/:id/applicants — full applicant list with profile data
     * Joins RecruiterJobApplicant → User (from global prisma via shared)
     * NOTE: Because User lives in packages/database and RecruiterJob lives in
     *       recruiter-service/prisma, we use a raw query to cross-join.
     */
    async getJobApplicants(jobId: string, recruiterId: string) {
        // Verify recruiter owns the job
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
        });

        if (!job) throw createError('Job not found', 404, 'JOB_NOT_FOUND');

        const applicants = await prisma.recruiterJobApplicant.findMany({
            where: { jobId },
            orderBy: { appliedAt: 'desc' },
            include: {
                candidate: {
                    select: {
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        return applicants.map((a) => ({
            applicationId: a.id,
            candidateId: a.candidateId,
            name: a.candidate?.name || 'Candidate',
            email: a.candidate?.email || '',
            avatarUrl: a.candidate?.avatarUrl || null,
            status: a.status,
            appliedAt: a.appliedAt,
            resumeUrl: a.resumeUrl || null,
            coverLetter: a.coverLetter || null,
            overallScore: a.overallScore,
            aiEvaluation: a.aiEvaluation,
            notes: a.notes,
            fitScore: a.fitScore,
            dropoutRisk: a.dropoutRisk,
            acceptanceLikelihood: a.acceptanceLikelihood,
            biasFlags: a.biasFlags,
        }));
    }

    /**
     * PATCH /recruiter/applications/:applicationId/status
     */
    async updateApplicationStatus(
        applicationId: string,
        recruiterId: string,
        newStatus: AtsApplicationStatus,
    ) {
        const validStatuses: AtsApplicationStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED'];
        if (!validStatuses.includes(newStatus)) {
            throw createError(`Invalid status: ${newStatus}`, 400, 'INVALID_STATUS');
        }

        // Verify the application belongs to a job owned by this recruiter
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId },
            include: { job: { select: { recruiterId: true } } },
        });

        if (!application) {
            throw createError('Application not found', 404, 'APPLICATION_NOT_FOUND');
        }

        if (application.job.recruiterId !== recruiterId) {
            throw createError('Forbidden — this application does not belong to your job posting', 403, 'FORBIDDEN');
        }

        const updated = await prisma.recruiterJobApplicant.update({
            where: { id: applicationId },
            data: { status: newStatus },
            include: { job: true }
        });

        const recruiter = await prisma.recruiter.findUnique({
            where: { id: recruiterId }
        });

        if (recruiter && recruiter.organizationId) {
            await prisma.activityLog.create({
                data: {
                    userId: recruiter.userId,
                    type: 'PIPELINE_MOVE',
                    message: `Moved application to ${newStatus}`,
                    metadata: { jobId: updated.jobId, candidateId: updated.candidateId, from: application.status, to: newStatus }
                }
            });
            logger.info(`Logged PIPELINE_MOVE for application ${applicationId}`);

            // Dispatch Webhook to ATS Integration
            webhookService.dispatchEvent(recruiter.organizationId, 'candidate.status_changed', {
                applicationId: updated.id,
                candidateId: updated.candidateId,
                jobId: updated.jobId,
                newStatus: updated.status,
                previousStatus: application.status
            }).catch(err => logger.error(`Failed to dispatch webhook: ${err.message}`));
        }

        // Update predictive metrics async
        predictiveService.computeMetricsForApplicant(applicationId).catch(err =>
            logger.error(`Failed to compute predictive metrics for applicant ${applicationId}: ${err.message}`)
        );

        return { applicationId: updated.id, candidateId: updated.candidateId, status: updated.status };
    }

    /**
     * POST /recruiter/jobs/:id/bulk-invite
     * Creates placeholder users (if not exist) and adds them to the job pipeline.
     */
    async bulkInvite(jobId: string, recruiterId: string, candidates: { name: string, email: string }[]) {
        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            throw createError('No candidates provided', 400, 'BAD_REQUEST');
        }

        // Verify job ownership
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId }
        });

        if (!job) {
            throw createError('Job not found', 404, 'JOB_NOT_FOUND');
        }

        const results = { added: 0, skipped: 0, failed: 0 };

        for (const candidate of candidates) {
            try {
                if (!candidate.email) {
                    results.failed++;
                    continue;
                }

                const email = candidate.email.toLowerCase().trim();

                // 1. Find or create user
                let user = await prisma.user.findUnique({ where: { email } });

                if (!user) {
                    // Create placeholder user
                    user = await prisma.user.create({
                        data: {
                            email,
                            name: candidate.name || 'Candidate',
                            passwordHash: crypto.randomBytes(32).toString('hex'), // Unusable password, requires reset/magic link
                            isVerified: false,
                        }
                    });
                }

                // 2. Check if already applied/invited
                const existingApp = await prisma.recruiterJobApplicant.findFirst({
                    where: { jobId, candidateId: user.id }
                });

                if (existingApp) {
                    results.skipped++;
                    continue; // Already in pipeline
                }

                // 3. Create application
                const newApp = await prisma.recruiterJobApplicant.create({
                    data: {
                        jobId,
                        candidateId: user.id,
                        status: ApplicationStatus.APPLIED,
                        // In a real system, we might queue an email here inviting them to apply/interview
                    }
                });

                predictiveService.computeMetricsForApplicant(newApp.id).catch(err => logger.error(`Error computing metrics: ${err.message}`));

                results.added++;
            } catch (err) {
                logger.error(`Failed to bulk invite candidate ${candidate.email}:`, err);
                results.failed++;
            }
        }

        return results;
    }
}

export const atsService = new AtsService();
