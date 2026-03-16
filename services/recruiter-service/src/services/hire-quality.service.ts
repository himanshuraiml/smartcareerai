import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ModelWeights {
    fitScore: number;
    aiScore: number;
    interviewScore: number;
    hasEnoughData: boolean;
    sampleSize: number;
}

export class HireQualityService {

    // Pearson correlation coefficient r(x, y)
    private pearsonCorrelation(xs: number[], ys: number[]): number {
        const n = xs.length;
        if (n < 2) return 0;
        const meanX = xs.reduce((a, b) => a + b, 0) / n;
        const meanY = ys.reduce((a, b) => a + b, 0) / n;
        const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0);
        const denX = Math.sqrt(xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0));
        const denY = Math.sqrt(ys.reduce((sum, y) => sum + (y - meanY) ** 2, 0));
        return (denX * denY) === 0 ? 0 : num / (denX * denY);
    }

    async submitCheckIn(applicationId: string, recruiterId: string, data: {
        dayN: number;
        performanceRating: number;
        retentionStatus: string;
        notes?: string;
    }) {
        // Verify application belongs to this recruiter
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
        });
        if (!application) throw new Error('Application not found');

        // Prevent duplicate check-in for same dayN
        const existing = await prisma.postHireCheckIn.findFirst({
            where: { applicationId, dayN: data.dayN },
        });
        if (existing) {
            return prisma.postHireCheckIn.update({
                where: { id: existing.id },
                data: { performanceRating: data.performanceRating, retentionStatus: data.retentionStatus, notes: data.notes },
            });
        }

        return prisma.postHireCheckIn.create({
            data: {
                applicationId,
                dayN: data.dayN,
                performanceRating: data.performanceRating,
                retentionStatus: data.retentionStatus,
                notes: data.notes,
                submittedBy: recruiterId,
            },
        });
    }

    async getCheckIns(applicationId: string, recruiterId: string) {
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
        });
        if (!application) throw new Error('Application not found');

        return prisma.postHireCheckIn.findMany({
            where: { applicationId },
            orderBy: { dayN: 'asc' },
        });
    }

    async getHireQualityDashboard(recruiterId: string) {
        // Get all PLACED applicants with check-ins
        const placements = await prisma.recruiterJobApplicant.findMany({
            where: { job: { recruiterId }, status: 'PLACED' },
            include: {
                candidate: { select: { name: true, email: true } },
                job: { select: { title: true } },
                postHireCheckIns: { orderBy: { dayN: 'asc' } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Compute model weights
        const modelWeights = this.computeModelWeights(placements);

        // Avg performance by dayN
        const avgPerformance: Record<number, number> = {};
        for (const dayN of [30, 60, 90]) {
            const ratings = placements
                .flatMap(p => p.postHireCheckIns)
                .filter(c => c.dayN === dayN)
                .map(c => c.performanceRating);
            if (ratings.length > 0) {
                avgPerformance[dayN] = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10;
            }
        }

        // Retention rate
        const allCheckIns = placements.flatMap(p => p.postHireCheckIns);
        const retentionRate = allCheckIns.length > 0
            ? Math.round(allCheckIns.filter(c => c.retentionStatus === 'RETAINED').length / allCheckIns.length * 100)
            : null;

        return {
            placements: placements.map(p => ({
                id: p.id,
                candidateName: p.candidate.name,
                candidateEmail: p.candidate.email,
                jobTitle: p.job.title,
                placedAt: p.updatedAt,
                fitScore: p.fitScore,
                overallScore: p.overallScore,
                checkIns: p.postHireCheckIns,
            })),
            modelWeights,
            avgPerformance,
            retentionRate,
            totalPlacements: placements.length,
        };
    }

    // F16: Get proctoring report for an application's assessment attempt
    async getProctoringReport(applicationId: string, recruiterId: string) {
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
            include: {
                candidate: { select: { name: true, email: true } },
                job: { select: { title: true } },
            },
        });
        if (!application) throw new Error('Application not found');

        // Find the candidate's assessment attempt for this job
        const attempt = await prisma.assessmentAttempt.findFirst({
            where: { studentId: application.candidateId, template: { jobId: application.jobId } },
            include: {
                proctoringLogs: { orderBy: { timestamp: 'asc' } },
            },
            orderBy: { startedAt: 'desc' },
        });

        if (!attempt) {
            return { hasAttempt: false, application: { candidateName: application.candidate.name, jobTitle: application.job.title } };
        }

        const violations = (attempt.proctoringLogs as any[]).filter(l =>
            l.eventType !== 'SNAPSHOT'
        );

        return {
            hasAttempt: true,
            application: { candidateName: application.candidate.name, jobTitle: application.job.title },
            attempt: {
                id: attempt.id,
                status: attempt.status,
                startedAt: attempt.startedAt,
                completedAt: attempt.completedAt,
                proctoringScore: (attempt as any).proctoringScore,
                snapshotCount: ((attempt as any).snapshots as any[] || []).length,
            },
            violations: violations.map(l => ({ type: l.eventType, timestamp: l.timestamp, metadata: l.metadata })),
        };
    }

    // F16: Aggregated proctoring stats for a job
    async getJobProctoringStats(jobId: string, recruiterId: string) {
        // Verify job belongs to this recruiter
        const job = await prisma.recruiterJob.findFirst({ where: { id: jobId, recruiterId } });
        if (!job) throw new Error('Job not found');

        const attempts = await prisma.assessmentAttempt.findMany({
            where: { template: { jobId } },
            include: { proctoringLogs: true },
        });

        if (attempts.length === 0) {
            return { totalAttempts: 0, avgProctoringScore: null, recruiterFlaggedCount: 0, autoFlaggedCount: 0, violationBreakdown: {} };
        }

        const scores = attempts
            .map(a => (a as any).proctoringScore as number | null)
            .filter((s): s is number => s != null);

        const avgProctoringScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
            : null;

        const recruiterFlaggedCount = attempts.filter(a => (a as any).recruiterFlagged).length;
        const autoFlaggedCount = attempts.filter(a => (a as any).proctoringScore != null && (a as any).proctoringScore < 50).length;

        const violationBreakdown: Record<string, number> = {};
        for (const attempt of attempts) {
            for (const log of attempt.proctoringLogs as any[]) {
                if (log.eventType !== 'SNAPSHOT') {
                    violationBreakdown[log.eventType] = (violationBreakdown[log.eventType] ?? 0) + 1;
                }
            }
        }

        return { totalAttempts: attempts.length, avgProctoringScore, recruiterFlaggedCount, autoFlaggedCount, violationBreakdown };
    }

    private computeModelWeights(placements: Array<{
        fitScore: number | null;
        overallScore: number | null;
        postHireCheckIns: Array<{ performanceRating: number; dayN: number }>;
    }>): ModelWeights {
        const MIN_SAMPLES = 5;

        // Build arrays for correlation
        const fitScores: number[] = [];
        const aiScores: number[] = [];
        const performanceRatings: number[] = [];

        for (const p of placements) {
            const latestCheckIn = p.postHireCheckIns.sort((a, b) => b.dayN - a.dayN)[0];
            if (!latestCheckIn) continue;
            if (p.fitScore != null) { fitScores.push(p.fitScore); }
            if (p.overallScore != null) { aiScores.push(p.overallScore); }
            performanceRatings.push(latestCheckIn.performanceRating * 20); // scale 1-5 → 20-100
        }

        const sampleSize = performanceRatings.length;
        if (sampleSize < MIN_SAMPLES) {
            return { fitScore: 0, aiScore: 0, interviewScore: 0, hasEnoughData: false, sampleSize };
        }

        const fitCorr = fitScores.length === performanceRatings.length
            ? this.pearsonCorrelation(fitScores, performanceRatings) : 0;
        const aiCorr = aiScores.length === performanceRatings.length
            ? this.pearsonCorrelation(aiScores, performanceRatings) : 0;

        return {
            fitScore: Math.round(fitCorr * 100) / 100,
            aiScore: Math.round(aiCorr * 100) / 100,
            interviewScore: 0, // Requires interview score data
            hasEnoughData: true,
            sampleSize,
        };
    }
}

export const hireQualityService = new HireQualityService();
