import { PrismaClient, ApplicationStatus } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class PredictiveService {

    /**
     * Compute and update predictive metrics for a specific applicant.
     */
    async computeMetricsForApplicant(applicationId: string) {
        const applicant = await prisma.recruiterJobApplicant.findUnique({
            where: { id: applicationId },
            include: {
                candidate: {
                    select: {
                        userSkills: { include: { skill: true } }
                    }
                },
                job: {
                    select: {
                        title: true,
                        requiredSkills: true
                    }
                }
            }
        });

        if (!applicant) return null;

        let atsScoreVal = 0;

        // Find ATS score for this user and job
        const atsScoreRecord = await prisma.atsScore.findFirst({
            where: {
                userId: applicant.candidateId,
                jobRole: { contains: applicant.job.title, mode: 'insensitive' }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (atsScoreRecord) {
            atsScoreVal = atsScoreRecord.overallScore || 0;
        }

        const interviewScoreVal = applicant.overallScore || 0;

        // 1. Calculate Fit Score (0-100)
        // Weight: Interview 60%, ATS 40% if both exist.
        let fitScore = 0;
        if (atsScoreVal > 0 && interviewScoreVal > 0) {
            fitScore = (atsScoreVal * 0.4) + (interviewScoreVal * 0.6);
        } else if (atsScoreVal > 0) {
            fitScore = atsScoreVal;
        } else if (interviewScoreVal > 0) {
            fitScore = interviewScoreVal;
        } else {
            const candidateSkills = applicant.candidate.userSkills.map((s: any) => s.skill.name.toLowerCase());
            const requiredSkills = applicant.job.requiredSkills.map(s => s.toLowerCase());

            if (requiredSkills.length > 0) {
                const matchCount = requiredSkills.filter(req => candidateSkills.includes(req)).length;
                fitScore = Math.round((matchCount / requiredSkills.length) * 100);
            } else {
                fitScore = 50; // default baseline
            }
        }

        fitScore = Math.min(100, Math.max(0, Math.round(fitScore)));

        // 2. Calculate Dropout Risk
        // High risk if in applied status for > 14 days. Low risk if recently moved to offer.
        let dropoutRisk = 'MEDIUM';
        const daysSinceApplied = Math.floor((Date.now() - applicant.appliedAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLastUpdate = Math.floor((Date.now() - applicant.updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        if (applicant.status === ApplicationStatus.REJECTED) {
            dropoutRisk = 'N/A';
        } else if (applicant.status === ApplicationStatus.OFFER) {
            dropoutRisk = 'LOW';
        } else if (daysSinceLastUpdate > 14 || (applicant.status === ApplicationStatus.APPLIED && daysSinceApplied > 10)) {
            dropoutRisk = 'HIGH';
        } else if (daysSinceLastUpdate <= 3) {
            dropoutRisk = 'LOW';
        }

        // 3. Acceptance Likelihood
        // Base probability on fit score and how quickly they were progressed.
        let acceptanceLikelihood = 50.0;
        if (fitScore > 80) acceptanceLikelihood += 20;
        if (daysSinceApplied < 7) acceptanceLikelihood += 10;
        if (daysSinceLastUpdate > 14) acceptanceLikelihood -= 20;

        acceptanceLikelihood = Math.min(99.0, Math.max(5.0, acceptanceLikelihood));

        // Update applicant record
        const updated = await prisma.recruiterJobApplicant.update({
            where: { id: applicationId },
            data: {
                fitScore,
                dropoutRisk,
                acceptanceLikelihood
            }
        });

        logger.info(`Computed predictive metrics for applicant ${applicationId}: Fit=${fitScore}, Risk=${dropoutRisk}, AccLk=${acceptanceLikelihood}%`);
        return updated;
    }

    /**
     * Compute metrics for all active candidates in a job
     */
    async computeMetricsForJob(jobId: string) {
        const applicants = await prisma.recruiterJobApplicant.findMany({
            where: {
                jobId,
                status: { not: ApplicationStatus.REJECTED }
            },
            select: { id: true }
        });

        for (const app of applicants) {
            await this.computeMetricsForApplicant(app.id).catch(err =>
                logger.error(`Failed to compute metrics for application ${app.id}: ${err.message}`)
            );
        }

        return { computedCount: applicants.length };
    }
}

export const predictiveService = new PredictiveService();
