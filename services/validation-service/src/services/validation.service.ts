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

        const result = { ...test, questionsCount: test.questions.length };
        await cacheSet(cacheKey, result, 3600); // 1 hour
        return result;
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

        if (test.questions.length === 0) {
            throw new Error('This test has no questions yet. Please try again later.');
        }

        // Check retake cooldown: 24 hours between attempts on the same test
        const lastAttempt = await prisma.testAttempt.findFirst({
            where: { userId, testId, completedAt: { not: null } },
            orderBy: { completedAt: 'desc' },
        });
        if (lastAttempt?.completedAt) {
            const hoursSince = (Date.now() - lastAttempt.completedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSince < 24) {
                const hoursLeft = Math.ceil(24 - hoursSince);
                throw new Error(`COOLDOWN:${hoursLeft}`);
            }
        }

        // Reuse an existing open attempt (prevents duplicate active attempts)
        const existingOpen = await prisma.testAttempt.findFirst({
            where: { userId, testId, completedAt: null },
            orderBy: { startedAt: 'desc' },
        });

        const attempt = existingOpen ?? await prisma.testAttempt.create({
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
                questionsCount: test.questions.length,
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
            explanation: string;
            questionText: string;
            options: string[];
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
                explanation: (question as any).explanation || '',
                questionText: question.questionText,
                options: question.options as string[],
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

        // Award XP to user (Base 100 XP, +150 XP if passed)
        const baseXp = 100;
        const passBonusXp = passed ? 150 : 0;
        const xpAmount = baseXp + passBonusXp;

        // 1. Update user global XP
        await prisma.user.update({
            where: { id: userId },
            data: {
                xp: { increment: xpAmount }
            }
        });

        // 2. Sync with competitive league weekly XP
        try {
            // Calculate weekStart matching the IST-aligned week range (Monday 00:00 IST / Sunday 18:30 UTC)
            const now = new Date();
            const day = now.getUTCDay();
            const hours = now.getUTCHours();
            const minutes = now.getUTCMinutes();

            let diffDays = day;
            if (day === 0 && (hours < 18 || (hours === 18 && minutes < 30))) {
                diffDays = 7;
            }

            const weekStart = new Date(now);
            weekStart.setUTCDate(now.getUTCDate() - diffDays);
            weekStart.setUTCHours(18, 30, 0, 0);

            // Find membership
            const membership = await prisma.leagueMembership.findFirst({
                where: {
                    userId,
                    league: {
                        weekStart,
                        isActive: true,
                    },
                },
            });

            if (membership) {
                await prisma.leagueMembership.update({
                    where: { id: membership.id },
                    data: {
                        weeklyXp: { increment: xpAmount },
                        daysActive: { increment: 1 },
                    },
                });
                logger.info(`Incremented weekly XP by ${xpAmount} for user ${userId} in league membership ${membership.id}`);
            } else {
                // If they don't have a membership yet, create one (assign to Bronze league)
                let league = await prisma.league.findFirst({
                    where: {
                        tier: 'BRONZE',
                        weekStart,
                        isActive: true,
                    },
                });

                if (!league) {
                    league = await prisma.league.create({
                        data: {
                            tier: 'BRONZE',
                            weekStart,
                            weekEnd: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000),
                            groupIndex: 0,
                            isActive: true,
                        },
                    });
                }

                await prisma.leagueMembership.create({
                    data: {
                        leagueId: league.id,
                        userId,
                        weeklyXp: xpAmount,
                        daysActive: 1,
                    },
                });
                logger.info(`Created Bronze league membership and credited ${xpAmount} weekly XP for user ${userId}`);
            }
        } catch (err: any) {
            logger.warn(`Failed to update league weekly XP for user ${userId}: ${err.message}`);
        }

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

        // 3. Record quiz attempt in skill mastery system (non-blocking)
        try {
            const existing = await prisma.skillMastery.findFirst({
                where: { userId, skillId: test.skillId },
            });

            const xpEarned = Math.round(score * 0.5); // up to 50 XP per test

            if (existing) {
                const newCount = existing.quizzesCompleted + 1;
                const prevAvg = existing.quizAvgScore ?? 0;
                const newAvg = prevAvg > 0
                    ? (prevAvg * existing.quizzesCompleted + score) / newCount
                    : score;
                const newLevelXp = Math.min(existing.currentLevelXp + xpEarned, existing.requiredLevelXp);
                await prisma.skillMastery.update({
                    where: { id: existing.id },
                    data: {
                        quizzesCompleted: newCount,
                        quizAvgScore: newAvg,
                        lastQuizAt: new Date(),
                        currentLevelXp: newLevelXp,
                        canLevelUp: newLevelXp >= existing.requiredLevelXp,
                    },
                });
            } else {
                await prisma.skillMastery.create({
                    data: {
                        userId,
                        skillId: test.skillId,
                        quizzesCompleted: 1,
                        quizAvgScore: score,
                        lastQuizAt: new Date(),
                        currentLevelXp: Math.min(xpEarned, 100),
                        requiredLevelXp: 100,
                        canLevelUp: xpEarned >= 100,
                    },
                });
            }
            logger.info(`Mastery updated for user ${userId}, skill ${test.skill.name}`);
        } catch (err: any) {
            logger.warn(`Failed to update skill mastery for user ${userId}: ${err.message}`);
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
