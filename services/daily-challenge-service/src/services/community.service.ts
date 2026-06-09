import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { analyzeWithLLM } from '../utils/groq';
import { CommunityQuestionStatus, Difficulty, MasteryLevel } from '@prisma/client';

export class CommunityService {
    /**
     * Submit a new community question from an Expert/Master user
     */
    async submitQuestion(
        authorId: string,
        skillId: string,
        questionText: string,
        options: string[],
        correctAnswer: string,
        explanation: string,
        difficulty: Difficulty,
        tags: string[]
    ) {
        // 1. Verify user is Expert or Master in the chosen skill
        const mastery = await prisma.skillMastery.findFirst({
            where: {
                userId: authorId,
                skillId,
                level: {
                    in: [MasteryLevel.EXPERT, MasteryLevel.MASTER],
                },
            },
        });

        if (!mastery) {
            throw new AppError('Only Expert or Master users can submit questions for this skill.', 403, 'INSUFFICIENT_MASTERY');
        }

        // 2. Validate input options
        if (!options || options.length !== 4) {
            throw new AppError('A question must have exactly 4 options.', 400, 'INVALID_OPTIONS_COUNT');
        }

        if (!options.includes(correctAnswer)) {
            throw new AppError('Correct answer must match one of the options exactly.', 400, 'INVALID_CORRECT_ANSWER');
        }

        // 3. Create question in DRAFT/SUBMITTED state
        const question = await prisma.communityQuestion.create({
            data: {
                authorId,
                skillId,
                questionText,
                options,
                correctAnswer,
                explanation,
                difficulty,
                tags,
                status: CommunityQuestionStatus.SUBMITTED,
            },
        });

        logger.info(`Community question submitted by user ${authorId} on skill ${skillId}`);

        // 4. Trigger AI review asynchronously
        this.runAIReview(question.id).catch((err) => {
            logger.error(`AI Review failed for question ${question.id}:`, err);
        });

        return question;
    }

    /**
     * AI Review check using LLM to inspect options length bias, duplicates, and correct formatting
     */
    async runAIReview(questionId: string) {
        logger.info(`Running AI quality gate review on question: ${questionId}`);

        const question = await prisma.communityQuestion.findUnique({
            where: { id: questionId },
            include: { skill: true },
        });

        if (!question) return;

        await prisma.communityQuestion.update({
            where: { id: questionId },
            data: { status: CommunityQuestionStatus.AI_REVIEW },
        });

        const systemPrompt = 'You are a rigorous QA assistant auditing multiple-choice questions for technical skill tests. Return JSON only.';
        const userPrompt = `
Audit this community question for the skill "${question.skill.name}":
Question: "${question.questionText}"
Options: ${JSON.stringify(question.options)}
Correct Answer: "${question.correctAnswer}"
Explanation: "${question.explanation}"

Audit Rules:
1. Is it clear, technically correct, and free of grammatical issues?
2. Are the option lengths balanced? (Length bias warning: correct answer must not be significantly longer or shorter than the others).
3. Is it a duplicate of a trivial question?

Provide a JSON response:
{
  "isValid": true, // false if failed audit rules
  "score": 0.85,  // float quality score between 0.0 and 1.0
  "feedback": "Review feedback explaining the quality score or rejection reasons."
}
`;

        const result = await analyzeWithLLM(systemPrompt, userPrompt);
        if (!result) {
            logger.warn(`AI review returned no result for question ${questionId}`);
            return;
        }

        const score = result.score || 0.0;
        const isValid = result.isValid === true && score >= 0.5;

        const nextStatus = isValid ? CommunityQuestionStatus.PEER_REVIEW : CommunityQuestionStatus.REJECTED;

        await prisma.communityQuestion.update({
            where: { id: questionId },
            data: {
                status: nextStatus,
                aiQualityScore: score,
                aiNotes: result.feedback || 'Completed AI audit.',
            },
        });

        logger.info(`AI review completed for ${questionId}: status=${nextStatus}, score=${score}`);
    }

    /**
     * Get questions pending peer review that the current Expert+ user can vote on
     */
    async getQuestionsForReview(userId: string) {
        // Find skills where this user is Expert or Master
        const userMasteries = await prisma.skillMastery.findMany({
            where: {
                userId,
                level: { in: [MasteryLevel.EXPERT, MasteryLevel.MASTER] },
            },
            select: { skillId: true },
        });

        const skillIds = userMasteries.map((m) => m.skillId);

        if (skillIds.length === 0) return [];

        // Fetch PEER_REVIEW questions in those skills that the user hasn't authored nor voted on
        return prisma.communityQuestion.findMany({
            where: {
                skillId: { in: skillIds },
                status: CommunityQuestionStatus.PEER_REVIEW,
                authorId: { not: userId },
                votes: {
                    none: {
                        voterId: userId,
                    },
                },
            },
            include: {
                author: {
                    select: {
                        name: true,
                    },
                },
                skill: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    /**
     * Submit a vote on a community question
     */
    async submitVote(userId: string, questionId: string, isUpvote: boolean) {
        const question = await prisma.communityQuestion.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            throw new AppError('Question not found', 404, 'QUESTION_NOT_FOUND');
        }

        if (question.status !== CommunityQuestionStatus.PEER_REVIEW) {
            throw new AppError('Question is not in peer review status.', 400, 'INVALID_STATUS');
        }

        // Verify voter is Expert or Master in the question's skill
        const mastery = await prisma.skillMastery.findFirst({
            where: {
                userId,
                skillId: question.skillId,
                level: { in: [MasteryLevel.EXPERT, MasteryLevel.MASTER] },
            },
        });

        if (!mastery) {
            throw new AppError('Only Expert or Master users can vote on this question.', 403, 'INSUFFICIENT_MASTERY');
        }

        // Upsert vote
        await prisma.communityQuestionVote.upsert({
            where: {
                questionId_voterId: {
                    questionId,
                    voterId: userId,
                },
            },
            create: {
                questionId,
                voterId: userId,
                isUpvote,
            },
            update: {
                isUpvote,
            },
        });

        // Recalculate upvotes / downvotes
        const votes = await prisma.communityQuestionVote.findMany({
            where: { questionId },
        });

        const upvotes = votes.filter((v) => v.isUpvote).length;
        const downvotes = votes.filter((v) => !v.isUpvote).length;
        const peerReviewCount = votes.length;

        const updatedQuestion = await prisma.communityQuestion.update({
            where: { id: questionId },
            data: {
                upvotes,
                downvotes,
                peerReviewCount,
            },
        });

        // Auto-approve logic: upvotes >= 3, and positive vote ratio > 60%
        const upvoteRatio = upvotes / peerReviewCount;
        if (peerReviewCount >= 3 && upvoteRatio >= 0.6) {
            await this.approveQuestion(questionId, 'system');
        }

        return updatedQuestion;
    }

    /**
     * Approve a community question: convert it into a TestQuestion, award XP, send notification
     */
    async approveQuestion(questionId: string, reviewerId: string) {
        const question = await prisma.communityQuestion.findUnique({
            where: { id: questionId },
            include: { skill: true },
        });

        if (!question || question.status === CommunityQuestionStatus.APPROVED) return;

        // 1. Find or create a SkillTest to assign this question to
        let skillTest = await prisma.skillTest.findFirst({
            where: {
                skillId: question.skillId,
                difficulty: question.difficulty,
                isActive: true,
            },
        });

        if (!skillTest) {
            // Create a default test for the skill/difficulty
            skillTest = await prisma.skillTest.create({
                data: {
                    skillId: question.skillId,
                    title: `${question.skill.name} Community Practice`,
                    description: `Practice questions contributed by the community for ${question.skill.name}`,
                    difficulty: question.difficulty,
                    durationMinutes: 15,
                    passingScore: 70,
                    questionsCount: 5,
                },
            });
        }

        // Get max order index for order sorting
        const maxOrder = await prisma.testQuestion.aggregate({
            where: { testId: skillTest.id },
            _max: { orderIndex: true },
        });

        const nextOrder = (maxOrder._max.orderIndex || 0) + 1;

        // 2. Create the TestQuestion
        const testQuestion = await prisma.testQuestion.create({
            data: {
                testId: skillTest.id,
                questionText: question.questionText,
                options: question.options as any,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                orderIndex: nextOrder,
                source: 'community',
            },
        });

        // 3. Update status to APPROVED
        await prisma.communityQuestion.update({
            where: { id: questionId },
            data: {
                status: CommunityQuestionStatus.APPROVED,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                testQuestionId: testQuestion.id,
            },
        });

        // 4. Award XP to author
        if (!question.xpAwarded) {
            await prisma.user.update({
                where: { id: question.authorId },
                data: { xp: { increment: 150 } },
            });
            await prisma.communityQuestion.update({
                where: { id: questionId },
                data: { xpAwarded: true },
            });
        }

        // 5. Send Notification
        await prisma.notification.create({
            data: {
                userId: question.authorId,
                type: 'question_approved',
                title: '🎉 Question Approved!',
                message: `Your community question on "${question.skill.name}" was approved and added to the practice pool! You earned +150 XP.`,
                metadata: {
                    questionId,
                    skillName: question.skill.name,
                },
            },
        });

        logger.info(`Community question ${questionId} approved and converted to TestQuestion ${testQuestion.id}`);
    }

    /**
     * Get all submissions created by a specific user
     */
    async getUserSubmissions(userId: string) {
        return prisma.communityQuestion.findMany({
            where: { authorId: userId },
            include: {
                skill: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const communityService = new CommunityService();
