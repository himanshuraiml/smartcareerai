import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { messageService } from './message.service';

const prisma = new PrismaClient();
const SURVEY_EXPIRY_DAYS = 7;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3100';

export class NpsSurveyService {
    /**
     * Recruiter sends NPS survey to candidate after interview.
     * Generates token, sends in-app message with survey link.
     */
    async generateSurveyToken(applicationId: string, recruiterId: string): Promise<string> {
        // Find the most recent InterviewSession for this application
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
            include: {
                candidate: { select: { id: true, name: true } },
                job: { select: { id: true, title: true } },
            },
        });
        if (!application) throw createError('Application not found or access denied', 404);

        // Find interview session for this candidate + job
        const session = await prisma.interviewSession.findFirst({
            where: { userId: application.candidateId, jobId: application.jobId },
            orderBy: { createdAt: 'desc' },
        });
        if (!session) throw createError('No interview session found for this application', 404);

        // Check if survey already submitted
        const existing = await prisma.candidateSurvey.findUnique({
            where: { interviewSessionId: session.id },
        });
        if (existing) throw createError('Survey already submitted for this session', 409);

        // Generate token
        const surveyToken = crypto.randomBytes(24).toString('hex');
        const surveyExpiry = new Date(Date.now() + SURVEY_EXPIRY_DAYS * 24 * 3600 * 1000);

        await prisma.interviewSession.update({
            where: { id: session.id },
            data: { surveyToken, surveyExpiry },
        });

        const surveyUrl = `${FRONTEND_URL}/survey/${surveyToken}`;

        // Find recruiter's user ID to send message from
        const recruiter = await prisma.recruiter.findUnique({
            where: { id: recruiterId },
            select: { userId: true },
        });

        if (recruiter) {
            const candidateName = application.candidate.name || 'there';
            const message = `Hi ${candidateName}, thank you for your interview for the ${application.job.title} position! We'd love to hear your feedback. It takes just 2 minutes: ${surveyUrl}`;
            await messageService.sendMessage(recruiter.userId, application.candidateId, message);
        }

        logger.info(`Survey token generated for session ${session.id}`);
        return surveyUrl;
    }

    /**
     * Validate token for public survey page.
     */
    async validateToken(token: string) {
        const session = await prisma.interviewSession.findUnique({
            where: { surveyToken: token },
            include: {
                user: { select: { name: true } },
                job: { select: { title: true } },
            },
        });

        if (!session) return { valid: false, reason: 'Invalid survey link' };
        if (!session.surveyExpiry || session.surveyExpiry < new Date()) {
            return { valid: false, reason: 'This survey link has expired' };
        }

        // Check if already submitted
        const existing = await prisma.candidateSurvey.findUnique({
            where: { interviewSessionId: session.id },
        });
        if (existing) return { valid: false, reason: 'You have already submitted this survey' };

        return {
            valid: true,
            candidateName: session.user.name || 'Candidate',
            jobTitle: session.job?.title || 'this position',
        };
    }

    /**
     * Submit survey response (public, no auth).
     */
    async submitSurvey(
        token: string,
        npsScore: number,
        ease: string,
        feedback: string,
    ) {
        if (typeof npsScore !== 'number' || npsScore < 1 || npsScore > 10) {
            throw createError('npsScore must be between 1 and 10', 400);
        }

        const session = await prisma.interviewSession.findUnique({
            where: { surveyToken: token },
        });
        if (!session) throw createError('Invalid survey token', 404);
        if (!session.surveyExpiry || session.surveyExpiry < new Date()) {
            throw createError('Survey link has expired', 410);
        }

        const survey = await prisma.candidateSurvey.create({
            data: {
                interviewSessionId: session.id,
                npsScore,
                responses: { ease: ease || '', feedback: feedback || '' },
            },
        });

        // Invalidate token after submission
        await prisma.interviewSession.update({
            where: { id: session.id },
            data: { surveyExpiry: new Date(0) },
        });

        logger.info(`NPS survey submitted for session ${session.id}: score ${npsScore}`);
        return survey;
    }

    /**
     * Get aggregated NPS data for a job.
     */
    async getJobNPS(jobId: string, recruiterId: string) {
        // Verify job ownership
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
        });
        if (!job) throw createError('Job not found or access denied', 404);

        const sessions = await prisma.interviewSession.findMany({
            where: { jobId },
            include: { survey: true },
        });

        const surveys = sessions
            .map((s) => s.survey)
            .filter((s): s is NonNullable<typeof s> => s !== null);

        if (surveys.length === 0) {
            return { count: 0, avgNps: null, promoters: 0, passives: 0, detractors: 0, npsIndex: null, responses: [] };
        }

        const promoters = surveys.filter((s) => s.npsScore >= 9).length;
        const passives = surveys.filter((s) => s.npsScore >= 7 && s.npsScore <= 8).length;
        const detractors = surveys.filter((s) => s.npsScore <= 6).length;
        const npsIndex = Math.round(((promoters - detractors) / surveys.length) * 100);
        const avgNps = Math.round((surveys.reduce((sum, s) => sum + s.npsScore, 0) / surveys.length) * 10) / 10;

        const responses = surveys.map((s) => ({
            npsScore: s.npsScore,
            ease: (s.responses as any)?.ease || '',
            feedback: (s.responses as any)?.feedback || '',
            submittedAt: s.submittedAt,
        }));

        return { count: surveys.length, avgNps, promoters, passives, detractors, npsIndex, responses };
    }
}

export const npsSurveyService = new NpsSurveyService();
