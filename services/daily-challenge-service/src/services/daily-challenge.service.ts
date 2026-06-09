import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { quizGeneratorService } from './quiz-generator.service';
import { insightService } from './insight.service';

export class DailyChallengeService {
    /**
     * Get UTC midnight date object
     */
    getTodayDateUTC(): Date {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Get or create daily challenge for today, along with user's completion status.
     */
    async getDailyChallenge(userId: string) {
        const today = this.getTodayDateUTC();

        // 1. Find or create the global daily challenge for today
        let challenge = await prisma.dailyChallenge.findUnique({
            where: { date: today },
        });

        if (!challenge) {
            logger.info(`Creating new global daily challenge for date: ${today.toISOString().split('T')[0]}`);
            
            // Get an insight
            const insight = await insightService.getInsightForDate(today);

            // Select skills for quiz and sprint
            const activeSkills = await prisma.skill.findMany({
                where: { isActive: true },
                select: { id: true },
            });

            if (activeSkills.length === 0) {
                throw new AppError('No active skills found to generate challenge', 500, 'NO_ACTIVE_SKILLS');
            }

            // Randomly assign skills
            const quizSkill = activeSkills[Math.floor(Math.random() * activeSkills.length)].id;
            // Pick a different skill for the sprint if possible
            let sprintSkill = activeSkills[Math.floor(Math.random() * activeSkills.length)].id;
            if (activeSkills.length > 1 && sprintSkill === quizSkill) {
                const otherSkills = activeSkills.filter(s => s.id !== quizSkill);
                sprintSkill = otherSkills[Math.floor(Math.random() * otherSkills.length)].id;
            }

            // Get/generate questions
            const questions = await quizGeneratorService.getOrCreateQuestionsForChallenge(today, [], quizSkill);

            challenge = await prisma.dailyChallenge.create({
                data: {
                    date: today,
                    quizQuestionIds: questions.map(q => q.id),
                    quizSkillId: quizSkill,
                    insightId: insight.id,
                    sprintSkillId: sprintSkill,
                },
            });
        }

        // 2. Fetch the insight details
        const insight = challenge.insightId 
            ? await prisma.careerInsight.findUnique({ where: { id: challenge.insightId } })
            : null;

        // 3. Find or create completion status for this user
        let completion = await prisma.dailyChallengeCompletion.findUnique({
            where: {
                userId_challengeId: {
                    userId,
                    challengeId: challenge.id,
                },
            },
        });

        if (!completion) {
            completion = await prisma.dailyChallengeCompletion.create({
                data: {
                    userId,
                    challengeId: challenge.id,
                    quizCompleted: false,
                    insightRead: false,
                    sprintCompleted: false,
                    isPerfectDay: false,
                    totalXpEarned: 0,
                },
            });
        }

        // 4. Fetch the questions
        const questions = await quizGeneratorService.getOrCreateQuestionsForChallenge(
            today,
            challenge.quizQuestionIds,
            challenge.quizSkillId
        );

        // Security: Mask answers/explanations if the user has NOT completed the quiz yet
        const maskedQuestions = questions.map(q => {
            if (completion && completion.quizCompleted) {
                return q; // Keep correct answer and explanation if already completed
            }
            // Strip out answer and explanation for security during test taking
            const { correctAnswer, explanation, ...rest } = q;
            return rest;
        });

        // 5. Get skill details
        const quizSkillName = challenge.quizSkillId
            ? (await prisma.skill.findUnique({ where: { id: challenge.quizSkillId }, select: { name: true } }))?.name || ''
            : '';

        const sprintSkillName = challenge.sprintSkillId
            ? (await prisma.skill.findUnique({ where: { id: challenge.sprintSkillId }, select: { name: true } }))?.name || ''
            : '';

        return {
            challengeId: challenge.id,
            date: challenge.date,
            quiz: {
                skillId: challenge.quizSkillId,
                skillName: quizSkillName,
                completed: completion.quizCompleted,
                score: completion.quizScore,
                correct: completion.quizCorrect,
                total: completion.quizTotal,
                timeMs: completion.quizTimeMs,
                questions: maskedQuestions,
            },
            insight: insight ? {
                id: insight.id,
                title: insight.title,
                content: insight.content,
                category: insight.category,
                icon: insight.icon,
                color: insight.color,
                tags: insight.tags,
                read: completion.insightRead,
                reaction: completion.insightReaction,
            } : null,
            sprint: {
                skillId: challenge.sprintSkillId,
                skillName: sprintSkillName,
                completed: completion.sprintCompleted,
            },
            isPerfectDay: completion.isPerfectDay,
            totalXpEarned: completion.totalXpEarned,
        };
    }

    /**
     * Submit answers for today's daily quiz
     */
    async submitDailyQuiz(userId: string, challengeId: string, answers: Record<string, string>, timeMs: number) {
        const challenge = await prisma.dailyChallenge.findUnique({
            where: { id: challengeId },
        });

        if (!challenge) {
            throw new AppError('Challenge not found', 404, 'CHALLENGE_NOT_FOUND');
        }

        const completion = await prisma.dailyChallengeCompletion.findUnique({
            where: { userId_challengeId: { userId, challengeId } },
        });

        if (!completion) {
            throw new AppError('Completion record not found', 404, 'COMPLETION_NOT_FOUND');
        }

        if (completion.quizCompleted) {
            throw new AppError('Quiz already completed for today', 400, 'QUIZ_ALREADY_COMPLETED');
        }

        // Fetch full questions to check answers
        const questions = await prisma.testQuestion.findMany({
            where: { id: { in: challenge.quizQuestionIds } },
        });

        let correctCount = 0;
        const results = questions.map(q => {
            const userAnswer = answers[q.id] || '';
            const isCorrect = q.correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
            if (isCorrect) correctCount++;
            return {
                questionId: q.id,
                userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation || '',
            };
        });

        // XP Calculation:
        // +50 base XP
        // +10 XP per correct answer
        // +25 XP speed bonus (if completed under 30 seconds and got at least 80% correct)
        const baseXP = 50;
        const accuracyXP = correctCount * 10;
        const isSpeedy = timeMs <= 30000 && (correctCount / questions.length) >= 0.8;
        const speedXP = isSpeedy ? 25 : 0;
        const totalXpGranted = baseXP + accuracyXP + speedXP;

        // Update completion
        const updatedCompletion = await prisma.dailyChallengeCompletion.update({
            where: { id: completion.id },
            data: {
                quizCompleted: true,
                quizScore: Math.round((correctCount / questions.length) * 100),
                quizCorrect: correctCount,
                quizTotal: questions.length,
                quizTimeMs: timeMs,
                totalXpEarned: { increment: totalXpGranted },
            },
        });

        // Grant XP to User
        await this.addXpToUser(userId, totalXpGranted);

        // Record skill mastery progress in the background
        if (challenge.quizSkillId) {
            await this.recordQuizMasteryProgress(userId, challenge.quizSkillId, (correctCount / questions.length) * 100);
        }

        // Check for Perfect Day
        const perfectDayAwarded = await this.checkAndAwardPerfectDay(userId, challengeId);

        return {
            score: updatedCompletion.quizScore,
            correct: correctCount,
            total: questions.length,
            xpGranted: totalXpGranted,
            breakdown: {
                base: baseXP,
                accuracy: accuracyXP,
                speed: speedXP,
            },
            perfectDayAwarded,
            results,
        };
    }

    /**
     * Update skill mastery progress when a quiz is submitted
     */
    private async recordQuizMasteryProgress(userId: string, skillId: string, score: number) {
        try {
            // Find or create the skill mastery record
            let mastery = await prisma.skillMastery.findUnique({
                where: { userId_skillId: { userId, skillId } },
            });

            if (!mastery) {
                mastery = await prisma.skillMastery.create({
                    data: {
                        userId,
                        skillId,
                        level: 'BEGINNER',
                        currentLevelXp: 0,
                        requiredLevelXp: 100, // beginner requires 100
                        quizzesCompleted: 0,
                        canLevelUp: false,
                    },
                });
            }

            const xpEarned = Math.max(10, Math.round(score));
            const newXp = Math.min(mastery.requiredLevelXp, mastery.currentLevelXp + xpEarned);
            const newQuizzesCompleted = mastery.quizzesCompleted + 1;
            const currentAvg = mastery.quizAvgScore || 0;
            const newAvg = ((currentAvg * mastery.quizzesCompleted) + score) / newQuizzesCompleted;

            // Check eligibility for next level
            let eligible = false;
            const meetsXp = newXp >= mastery.requiredLevelXp;

            if (meetsXp) {
                if (mastery.level === 'BEGINNER') {
                    eligible = newAvg >= 60;
                } else if (mastery.level === 'INTERMEDIATE') {
                    eligible = newQuizzesCompleted >= 3 && newAvg >= 70;
                } else if (mastery.level === 'ADVANCED') {
                    eligible = newQuizzesCompleted >= 7 && newAvg >= 75;
                } else if (mastery.level === 'EXPERT') {
                    eligible = newQuizzesCompleted >= 10 && newAvg >= 80;
                }
            }

            await prisma.skillMastery.update({
                where: { id: mastery.id },
                data: {
                    currentLevelXp: newXp,
                    quizzesCompleted: newQuizzesCompleted,
                    quizAvgScore: Number(newAvg.toFixed(1)),
                    lastQuizAt: new Date(),
                    canLevelUp: eligible,
                },
            });
            logger.info(`Updated skill mastery for user ${userId} on skill ${skillId} due to daily quiz attempt`);
        } catch (error) {
            logger.error('Failed to update skill mastery during daily quiz submission:', error);
        }
    }

    /**
     * Record that the user read today's career insight
     */
    async readDailyInsight(userId: string, challengeId: string, reaction?: string) {
        const completion = await prisma.dailyChallengeCompletion.findUnique({
            where: { userId_challengeId: { userId, challengeId } },
        });

        if (!completion) {
            throw new AppError('Completion record not found', 404, 'COMPLETION_NOT_FOUND');
        }

        if (completion.insightRead && (!reaction || completion.insightReaction === reaction)) {
            // Already read and reacted identically, do nothing
            return { xpGranted: 0, perfectDayAwarded: false };
        }

        let xpGranted = 0;
        if (!completion.insightRead) {
            xpGranted += 15; // +15 XP for reading
        }
        if (reaction && completion.insightReaction !== reaction) {
            xpGranted += 5; // +5 XP for reacting
        }

        const updatedCompletion = await prisma.dailyChallengeCompletion.update({
            where: { id: completion.id },
            data: {
                insightRead: true,
                insightReaction: reaction || completion.insightReaction,
                totalXpEarned: { increment: xpGranted },
            },
        });

        if (xpGranted > 0) {
            await this.addXpToUser(userId, xpGranted);
        }

        const perfectDayAwarded = await this.checkAndAwardPerfectDay(userId, challengeId);

        return {
            xpGranted,
            perfectDayAwarded,
            reaction: updatedCompletion.insightReaction,
        };
    }

    /**
     * Record that the user completed the daily sprint
     */
    async completeDailySprint(userId: string, challengeId: string) {
        const completion = await prisma.dailyChallengeCompletion.findUnique({
            where: { userId_challengeId: { userId, challengeId } },
        });

        if (!completion) {
            throw new AppError('Completion record not found', 404, 'COMPLETION_NOT_FOUND');
        }

        if (completion.sprintCompleted) {
            return { xpGranted: 0, perfectDayAwarded: false };
        }

        const xpGranted = 30; // +30 XP for completing sprint

        await prisma.dailyChallengeCompletion.update({
            where: { id: completion.id },
            data: {
                sprintCompleted: true,
                totalXpEarned: { increment: xpGranted },
            },
        });

        await this.addXpToUser(userId, xpGranted);

        const perfectDayAwarded = await this.checkAndAwardPerfectDay(userId, challengeId);

        return {
            xpGranted,
            perfectDayAwarded,
        };
    }

    /**
     * Award Perfect Day bonus if all challenges are complete
     */
    private async checkAndAwardPerfectDay(userId: string, challengeId: string): Promise<boolean> {
        const completion = await prisma.dailyChallengeCompletion.findUnique({
            where: { userId_challengeId: { userId, challengeId } },
        });

        if (!completion) return false;

        // If already perfect day, do nothing
        if (completion.isPerfectDay) return false;

        // Check if all parts are completed
        const isPerfect = completion.quizCompleted && completion.insightRead && completion.sprintCompleted;

        if (isPerfect) {
            const perfectDayXP = 100; // +100 XP Perfect Day bonus

            await prisma.dailyChallengeCompletion.update({
                where: { id: completion.id },
                data: {
                    isPerfectDay: true,
                    totalXpEarned: { increment: perfectDayXP },
                },
            });

            await this.addXpToUser(userId, perfectDayXP);
            logger.info(`Perfect Day Bonus! User ${userId} completed all daily tasks and earned +100 XP.`);
            return true;
        }

        return false;
    }

    /**
     * Update user's cumulative XP in the User table
     */
    private async addXpToUser(userId: string, xpAmount: number) {
        if (xpAmount <= 0) return;
        await prisma.user.update({
            where: { id: userId },
            data: {
                xp: { increment: xpAmount },
            },
        });
        logger.info(`User ${userId} awarded +${xpAmount} XP.`);
    }
}

export const dailyChallengeService = new DailyChallengeService();
