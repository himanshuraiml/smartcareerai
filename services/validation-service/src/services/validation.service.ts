import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet } from '@placenxt/shared';

export class ValidationService {
    // Get all available tests (only those with real curated questions)
    async getTests(skillId?: string) {
        const cacheKey = skillId ? `validation:tests:${skillId}` : 'validation:tests';
        const cached = await cacheGet<any[]>(cacheKey);
        if (cached) return cached;

        const where: any = { isActive: true };
        if (skillId) {
            where.skillId = skillId;
        }

        const tests = await prisma.skillTest.findMany({
            where,
            include: {
                skill: {
                    select: { id: true, name: true, category: true },
                },
                _count: {
                    select: { questions: true, attempts: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Filter out tests with only generic fallback questions
        // Generic questions follow the pattern "Sample EASY/MEDIUM/HARD question N for {skill}?"
        const testsWithRealQuestions: typeof tests = [];
        for (const test of tests) {
            if (test._count.questions === 0) continue;

            const sampleQuestion = await prisma.testQuestion.findFirst({
                where: { testId: test.id },
                select: { questionText: true },
            });

            if (sampleQuestion && !sampleQuestion.questionText.startsWith('Sample ')) {
                testsWithRealQuestions.push(test);
            }
        }

        await cacheSet(cacheKey, testsWithRealQuestions, 1800); // 30 minutes
        return testsWithRealQuestions;
    }

    // Get test details (without answers for taking)
    async getTest(testId: string) {
        const cacheKey = `validation:test:${testId}`;
        const cached = await cacheGet<any>(cacheKey);
        if (cached) return cached;

        const test = await prisma.skillTest.findUnique({
            where: { id: testId },
            include: {
                skill: true,
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        questionType: true,
                        options: true,
                        points: true,
                        orderIndex: true,
                    },
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        await cacheSet(cacheKey, test, 3600); // 1 hour
        return test;
    }

    // Start a test attempt
    async startTest(userId: string, testId: string) {
        const test = await prisma.skillTest.findUnique({
            where: { id: testId, isActive: true },
            include: {
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        questionType: true,
                        options: true,
                        points: true,
                        orderIndex: true,
                    },
                    orderBy: { orderIndex: 'asc' },
                },
                skill: true,
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        // Create attempt
        const attempt = await prisma.testAttempt.create({
            data: {
                userId,
                testId,
                startedAt: new Date(),
            },
        });

        logger.info(`Started test attempt ${attempt.id} for user ${userId}`);

        return {
            attempt,
            test: {
                id: test.id,
                title: test.title,
                description: test.description,
                difficulty: test.difficulty,
                skill: test.skill,
                durationMinutes: test.durationMinutes,
                passingScore: test.passingScore,
                questionsCount: test.questionsCount,
            },
            questions: test.questions,
        };
    }

    // Submit test answers
    async submitTest(userId: string, testId: string, answers: Record<string, string>) {
        // Get the test with correct answers
        const test = await prisma.skillTest.findUnique({
            where: { id: testId },
            include: {
                questions: true,
                skill: true,
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        // Find user's latest attempt
        const attempt = await prisma.testAttempt.findFirst({
            where: {
                userId,
                testId,
                completedAt: null,
            },
            orderBy: { startedAt: 'desc' },
        });

        if (!attempt) {
            throw new Error('No active test attempt found');
        }

        // Calculate score
        let totalPoints = 0;
        let earnedPoints = 0;
        const questionResults: Array<{
            questionId: string;
            correct: boolean;
            userAnswer: string;
            correctAnswer: string;
        }> = [];

        for (const question of test.questions) {
            totalPoints += question.points;
            const userAnswer = answers[question.id] || '';
            const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

            if (isCorrect) {
                earnedPoints += question.points;
            }

            questionResults.push({
                questionId: question.id,
                correct: isCorrect,
                userAnswer,
                correctAnswer: question.correctAnswer,
            });
        }

        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passed = score >= test.passingScore;

        // Update attempt
        const updatedAttempt = await prisma.testAttempt.update({
            where: { id: attempt.id },
            data: {
                score,
                passed,
                answers,
                completedAt: new Date(),
            },
        });

        // If passed, award badge
        let badge: any = null;
        if (passed) {
            // Determine badge type based on score
            let badgeType: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'VERIFIED' = 'VERIFIED';
            if (score >= 95) badgeType = 'EXPERT';
            else if (score >= 85) badgeType = 'ADVANCED';
            else if (score >= 75) badgeType = 'INTERMEDIATE';
            else badgeType = 'BEGINNER';

            // Check if user already has a badge for this skill
            const existingBadge = await prisma.skillBadge.findFirst({
                where: { userId, skillId: test.skillId },
            });

            if (existingBadge) {
                // Upgrade badge if new score is better
                const badgeRank = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4, VERIFIED: 0 };
                if (badgeRank[badgeType] > badgeRank[existingBadge.badgeType]) {
                    badge = await prisma.skillBadge.update({
                        where: { id: existingBadge.id },
                        data: {
                            badgeType,
                            testAttemptId: attempt.id,
                            issuedAt: new Date(),
                        },
                        include: { skill: true },
                    });
                } else {
                    badge = existingBadge;
                }
            } else {
                badge = await prisma.skillBadge.create({
                    data: {
                        userId,
                        skillId: test.skillId,
                        badgeType,
                        testAttemptId: attempt.id,
                    },
                    include: { skill: true },
                });
            }

            logger.info(`Awarded ${badgeType} badge to user ${userId} for skill ${test.skill.name}`);
        }

        logger.info(`Test completed: ${score}% (${passed ? 'PASSED' : 'FAILED'})`);

        return {
            attempt: updatedAttempt,
            score,
            passed,
            passingScore: test.passingScore,
            totalQuestions: test.questions.length,
            correctAnswers: questionResults.filter(r => r.correct).length,
            questionResults,
            badge,
        };
    }

    // Get user's test attempts
    async getUserAttempts(userId: string) {
        return prisma.testAttempt.findMany({
            where: { userId },
            include: {
                test: {
                    include: {
                        skill: true,
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
        });
    }

    // Get specific attempt details
    async getAttempt(userId: string, attemptId: string) {
        const attempt = await prisma.testAttempt.findFirst({
            where: { id: attemptId, userId },
            include: {
                test: {
                    include: {
                        skill: true,
                        questions: true,
                    },
                },
                badge: true,
            },
        });

        if (!attempt) {
            throw new Error('Attempt not found');
        }

        return attempt;
    }

    // Get user's badges
    async getUserBadges(userId: string) {
        return prisma.skillBadge.findMany({
            where: { userId },
            include: {
                skill: true,
                testAttempt: {
                    select: {
                        score: true,
                        completedAt: true,
                    },
                },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }
}
