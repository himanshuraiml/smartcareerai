import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';
import { runTestCases } from '../utils/piston';
import { evaluateCode } from '../utils/llm';
import type { CodeEvaluationResult } from '../utils/llm';

export interface ChallengeListItem {
    id: string;
    title: string;
    difficulty: string;
    category: string;
    tags: string[];
    languages: string[];
    userBestStatus?: string | null;
    userBestScore?: number | null;
}

export class CodingService {
    /**
     * List all active coding challenges, optionally filtered by difficulty / category.
     * Includes user's best submission status if userId provided.
     */
    async listChallenges(
        userId?: string,
        filters?: { difficulty?: string; category?: string }
    ): Promise<ChallengeListItem[]> {
        const where: any = { isActive: true };
        if (filters?.difficulty) where.difficulty = filters.difficulty.toUpperCase();
        if (filters?.category) where.category = filters.category.toLowerCase();

        const challenges = await prisma.codingChallenge.findMany({
            where,
            select: {
                id: true,
                title: true,
                difficulty: true,
                category: true,
                tags: true,
                languages: true,
                submissions: userId
                    ? {
                          where: { userId },
                          orderBy: { createdAt: 'desc' },
                          take: 1,
                          select: { status: true, score: true },
                      }
                    : false,
            },
            orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
        });

        return challenges.map((c: any) => ({
            id: c.id,
            title: c.title,
            difficulty: c.difficulty,
            category: c.category,
            tags: c.tags,
            languages: c.languages,
            userBestStatus: c.submissions?.[0]?.status ?? null,
            userBestScore: c.submissions?.[0]?.score ?? null,
        }));
    }

    /**
     * Get full challenge details (without hidden test cases) for the coding room.
     */
    async getChallenge(challengeId: string) {
        const challenge = await prisma.codingChallenge.findUnique({
            where: { id: challengeId, isActive: true },
        });

        if (!challenge) throw new Error('Challenge not found');

        // Strip hidden test cases from what we return to the client
        const testCases = (challenge.testCases as any[]).map((tc: any) => ({
            input: tc.isHidden ? '[Hidden]' : tc.input,
            expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
            isHidden: !!tc.isHidden,
        }));

        return {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            category: challenge.category,
            tags: challenge.tags,
            languages: challenge.languages,
            starterCode: challenge.starterCode,
            testCases,
            examples: challenge.examples,
            constraints: challenge.constraints,
            timeLimit: challenge.timeLimit,
            memoryLimit: challenge.memoryLimit,
        };
    }

    /**
     * Run code against visible (non-hidden) test cases only — free, no credit consumed.
     */
    async runCode(challengeId: string, language: string, code: string) {
        const challenge = await prisma.codingChallenge.findUnique({
            where: { id: challengeId, isActive: true },
            select: { testCases: true },
        });

        if (!challenge) throw new Error('Challenge not found');

        const allTestCases = challenge.testCases as Array<{
            input: string;
            expectedOutput: string;
            isHidden?: boolean;
        }>;

        // Only run visible test cases for the "Run" button
        const visibleCases = allTestCases.filter((tc) => !tc.isHidden);

        const { results, passed, total, executionTimeMs } = await runTestCases(
            language,
            code,
            visibleCases,
            false
        );

        return { results, passed, total, executionTimeMs };
    }

    /**
     * Submit code — runs ALL test cases (including hidden), does AI analysis, persists.
     * Caller must have already consumed a SKILL_TEST credit before calling this.
     */
    async submitCode(
        userId: string,
        challengeId: string,
        language: string,
        code: string
    ) {
        const challenge = await prisma.codingChallenge.findUnique({
            where: { id: challengeId, isActive: true },
        });

        if (!challenge) throw new Error('Challenge not found');

        const allTestCases = challenge.testCases as Array<{
            input: string;
            expectedOutput: string;
            isHidden?: boolean;
        }>;

        // Run ALL test cases including hidden ones
        const { results, passed, total, executionTimeMs } = await runTestCases(
            language,
            code,
            allTestCases,
            true // include hidden
        );

        // Determine submission status
        let status: string;
        const hasError = results.some((r) => r.error);
        if (hasError && passed === 0) {
            const firstError = results.find((r) => r.error)?.error || '';
            if (firstError.toLowerCase().includes('syntax') || firstError.toLowerCase().includes('compile')) {
                status = 'COMPILATION_ERROR';
            } else {
                status = 'RUNTIME_ERROR';
            }
        } else if (passed === total) {
            status = 'ACCEPTED';
        } else {
            status = 'WRONG_ANSWER';
        }

        // AI code quality analysis (async, non-blocking if it fails)
        let aiAnalysis: CodeEvaluationResult | null = null;
        try {
            const codeEval = await evaluateCode(
                challenge.description,
                language,
                code,
                {
                    passed,
                    total,
                    error: hasError ? results.find((r) => r.error)?.error : undefined,
                }
            );
            aiAnalysis = codeEval;
        } catch (err) {
            logger.warn('AI code analysis failed, continuing without it:', err);
        }

        const score = aiAnalysis?.score ?? Math.round((passed / total) * 100);

        // Persist submission
        const submission = await prisma.codingSubmission.create({
            data: {
                userId,
                challengeId,
                language,
                code,
                status,
                score,
                testsPassed: passed,
                totalTests: total,
                executionTime: executionTimeMs,
                aiAnalysis: aiAnalysis as any,
            },
        });

        // Return visible test results + hidden pass/fail summary
        const visibleResults = results.filter((r) => r.input !== '[Hidden test case]');
        const hiddenPassed = results.filter((r) => r.input === '[Hidden test case]' && r.passed).length;
        const hiddenTotal = results.filter((r) => r.input === '[Hidden test case]').length;

        return {
            submissionId: submission.id,
            status,
            score,
            testsPassed: passed,
            totalTests: total,
            visibleResults,
            hiddenSummary: { passed: hiddenPassed, total: hiddenTotal },
            executionTimeMs,
            aiAnalysis,
        };
    }

    /**
     * Get a user's submission history for a specific challenge.
     */
    async getUserSubmissions(userId: string, challengeId?: string) {
        const where: any = { userId };
        if (challengeId) where.challengeId = challengeId;

        const submissions = await prisma.codingSubmission.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                challenge: { select: { id: true, title: true, difficulty: true, category: true } },
            },
        });

        return submissions;
    }

    /**
     * Get a single submission by id (must belong to the user).
     */
    async getSubmission(submissionId: string, userId: string) {
        const submission = await prisma.codingSubmission.findFirst({
            where: { id: submissionId, userId },
            include: {
                challenge: { select: { id: true, title: true, difficulty: true } },
            },
        });

        if (!submission) throw new Error('Submission not found');
        return submission;
    }
}
