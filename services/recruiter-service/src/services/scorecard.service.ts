import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

const SCORECARD_DIMENSIONS = [
    'Technical Skills',
    'Problem Solving',
    'Communication',
    'Cultural Fit',
    'Leadership Potential',
];

export class ScorecardService {
    /**
     * Assign one or more interviewers to an applicant for a specific stage.
     * Recruiter must own the job linked to the application.
     */
    async assignInterviewers(
        applicationId: string,
        interviewerIds: string[],
        stageName: string,
        recruiterId: string,
    ) {
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
            include: { job: { select: { title: true } } },
        });
        if (!application) throw createError('Application not found or access denied', 404);
        if (!interviewerIds.length) throw createError('At least one interviewer is required', 400);

        const created: string[] = [];
        const skipped: string[] = [];

        for (const interviewerId of interviewerIds) {
            // Verify the interviewer is a real user
            const user = await prisma.user.findUnique({ where: { id: interviewerId }, select: { id: true } });
            if (!user) { skipped.push(interviewerId); continue; }

            try {
                await prisma.interviewerAssignment.create({
                    data: { applicationId, interviewerId, stageName },
                });
                created.push(interviewerId);
            } catch (err: any) {
                if (err.code === 'P2002') {
                    skipped.push(interviewerId); // already assigned
                } else {
                    throw err;
                }
            }
        }

        logger.info(`Assigned ${created.length} interviewers to application ${applicationId}, stage: ${stageName}`);
        return { assigned: created, skipped };
    }

    /**
     * Get all scorecard submissions for an application (recruiter view).
     */
    async getApplicationScorecards(applicationId: string, recruiterId: string) {
        // Verify ownership
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
        });
        if (!application) throw createError('Application not found or access denied', 404);

        const assignments = await prisma.interviewerAssignment.findMany({
            where: { applicationId },
            include: {
                interviewer: { select: { id: true, name: true, email: true, avatarUrl: true } },
                scorecards: true,
            },
            orderBy: { assignedAt: 'asc' },
        });

        // Compute aggregates
        const allScores: number[] = [];
        const dimensionTotals: Record<string, { sum: number; count: number }> = {};

        for (const assignment of assignments) {
            for (const sc of assignment.scorecards) {
                allScores.push(sc.overallRating);
                const dims = sc.dimensions as Array<{ name: string; rating: number }>;
                for (const d of dims) {
                    if (!dimensionTotals[d.name]) dimensionTotals[d.name] = { sum: 0, count: 0 };
                    dimensionTotals[d.name].sum += d.rating;
                    dimensionTotals[d.name].count += 1;
                }
            }
        }

        const averageDimensions = Object.entries(dimensionTotals).map(([name, { sum, count }]) => ({
            name,
            avg: Math.round((sum / count) * 10) / 10,
        }));

        const overallAvg = allScores.length
            ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
            : null;

        return {
            assignments: assignments.map((a) => ({
                assignmentId: a.id,
                interviewerId: a.interviewerId,
                interviewer: a.interviewer,
                stageName: a.stageName,
                assignedAt: a.assignedAt,
                submitted: a.scorecards.length > 0,
                scorecard: a.scorecards[0] || null,
            })),
            summary: {
                totalAssigned: assignments.length,
                totalSubmitted: assignments.filter((a) => a.scorecards.length > 0).length,
                overallAvg,
                dimensionAverages: averageDimensions,
            },
        };
    }

    /**
     * Submit a scorecard for an assignment (interviewer).
     */
    async submitScorecard(
        applicationId: string,
        interviewerId: string,
        dimensions: Array<{ name: string; rating: number }>,
        notes: string | undefined,
        recommendation: string,
    ) {
        const validRecs = ['STRONG_HIRE', 'HIRE', 'MAYBE', 'NO_HIRE'];
        if (!validRecs.includes(recommendation)) {
            throw createError(`recommendation must be one of: ${validRecs.join(', ')}`, 400);
        }

        // Validate dimensions
        if (!Array.isArray(dimensions) || dimensions.length === 0) {
            throw createError('dimensions array is required', 400);
        }
        for (const d of dimensions) {
            if (!d.name || d.rating < 1 || d.rating > 5) {
                throw createError('Each dimension needs a name and rating 1-5', 400);
            }
        }

        // Find the assignment
        const assignment = await prisma.interviewerAssignment.findFirst({
            where: { applicationId, interviewerId },
            include: { scorecards: true },
        });
        if (!assignment) {
            throw createError('You are not assigned to review this application', 403);
        }
        if (assignment.scorecards.length > 0) {
            throw createError('You have already submitted a scorecard for this application', 409);
        }

        const overallRating =
            Math.round((dimensions.reduce((sum, d) => sum + d.rating, 0) / dimensions.length) * 10) / 10;

        const scorecard = await prisma.scorecardSubmission.create({
            data: {
                assignmentId: assignment.id,
                dimensions,
                overallRating,
                notes: notes || null,
                recommendation,
            },
        });

        logger.info(`Interviewer ${interviewerId} submitted scorecard for application ${applicationId}`);
        return scorecard;
    }

    /**
     * Get all pending scorecard assignments for an interviewer.
     */
    async getPendingScorecards(interviewerId: string) {
        const assignments = await prisma.interviewerAssignment.findMany({
            where: {
                interviewerId,
                scorecards: { none: {} }, // no submitted scorecard yet
            },
            include: {
                application: {
                    include: {
                        candidate: { select: { id: true, name: true, email: true, avatarUrl: true } },
                        job: { select: { id: true, title: true } },
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });

        return assignments.map((a) => ({
            assignmentId: a.id,
            applicationId: a.applicationId,
            stageName: a.stageName,
            assignedAt: a.assignedAt,
            candidate: a.application.candidate,
            job: a.application.job,
            defaultDimensions: SCORECARD_DIMENSIONS,
        }));
    }
}

export const scorecardService = new ScorecardService();
