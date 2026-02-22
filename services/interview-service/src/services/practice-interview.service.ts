import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { selectQuestionsFromBank } from '../utils/question-bank';
import { evaluatePracticeAnswer, generatePracticeFeedbackSummary } from '../utils/practice-evaluator';
import { AppError } from '../utils/errors';

interface CreatePracticeSessionData {
    type: 'TECHNICAL' | 'BEHAVIORAL' | 'HR' | 'MIXED';
    targetRole: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export class PracticeInterviewService {
    /**
     * Create a free practice interview session.
     * No billing check — this is entirely free.
     * Only uses question bank (no LLM fallback).
     */
    async createSession(userId: string, data: CreatePracticeSessionData) {
        const questionCount = data.difficulty === 'EASY' ? 5 : data.difficulty === 'MEDIUM' ? 7 : 10;

        // Check question bank availability BEFORE creating the session
        const bankQuestions = await selectQuestionsFromBank(
            data.type,
            data.targetRole,
            data.difficulty,
            questionCount
        );

        if (bankQuestions.length < 3) {
            throw new AppError(
                `Not enough practice questions available for "${data.targetRole}" (${data.type}). ` +
                `Found ${bankQuestions.length}, need at least 3. Try a different role or type.`,
                400
            );
        }

        // Create session with format=TEXT and a flag indicating practice mode
        const session = await prisma.interviewSession.create({
            data: {
                userId,
                type: data.type,
                targetRole: data.targetRole,
                difficulty: data.difficulty,
                status: 'PENDING',
            },
        });

        // Immediately create questions from the bank
        const actualCount = Math.min(bankQuestions.length, questionCount);
        const createdQuestions = await Promise.all(
            bankQuestions.slice(0, actualCount).map((q, index) =>
                prisma.interviewQuestion.create({
                    data: {
                        sessionId: session.id,
                        questionText: q.questionText,
                        questionType: q.questionType.toLowerCase(),
                        orderIndex: index,
                        bankQuestionId: q.id,
                    },
                })
            )
        );

        // Update session to IN_PROGRESS
        const updatedSession = await prisma.interviewSession.update({
            where: { id: session.id },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date(),
            },
        });

        logger.info(`Created practice session ${session.id} for user ${userId} with ${actualCount} bank questions`);

        return {
            session: updatedSession,
            questions: createdQuestions.map(q => ({
                id: q.id,
                questionText: q.questionText,
                questionType: q.questionType,
                orderIndex: q.orderIndex,
            })),
            totalQuestions: actualCount,
            currentQuestionIndex: 0,
            isPractice: true,
        };
    }

    // Get all practice sessions for a user (TEXT format sessions from question bank)
    async getUserSessions(userId: string) {
        return prisma.interviewSession.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        score: true,
                        orderIndex: true,
                        bankQuestionId: true,
                    },
                },
            },
        });
    }

    // Get a specific practice session
    async getSession(sessionId: string, userId: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });

        if (!session) {
            throw new AppError('Practice session not found', 404);
        }

        return session;
    }

    /**
     * Submit an answer for a practice question.
     * Evaluation is done using keyword matching against the ideal answer — NO LLM.
     */
    async submitAnswer(sessionId: string, userId: string, questionId: string, answer: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId, status: 'IN_PROGRESS' },
        });

        if (!session) {
            throw new AppError('Active practice session not found', 404);
        }

        const question = await prisma.interviewQuestion.findFirst({
            where: { id: questionId, sessionId },
        });

        if (!question) {
            throw new AppError('Question not found', 404);
        }

        if (!question.bankQuestionId) {
            throw new AppError('Practice mode only supports question bank questions', 400);
        }

        // Get the ideal answer from the bank
        const bankQuestion = await prisma.interviewBankQuestion.findUnique({
            where: { id: question.bankQuestionId },
            select: { idealAnswer: true, questionType: true, category: true },
        });

        if (!bankQuestion) {
            throw new AppError('Bank question not found', 404);
        }

        // Evaluate using keyword matching (zero LLM cost)
        const evaluation = evaluatePracticeAnswer(
            question.questionText,
            answer,
            bankQuestion.idealAnswer,
            bankQuestion.questionType
        );

        // Update question with answer and evaluation
        await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: {
                userAnswer: answer,
                score: evaluation.score,
                feedback: evaluation.feedback,
                metrics: {
                    clarity: evaluation.metrics.clarity,
                    relevance: evaluation.metrics.relevance,
                    confidence: evaluation.metrics.completeness,
                    wordCount: evaluation.metrics.wordCount,
                },
                improvedAnswer: bankQuestion.idealAnswer,
            },
        });

        // Get next question
        const nextQuestion = await prisma.interviewQuestion.findFirst({
            where: {
                sessionId,
                userAnswer: null,
                orderIndex: { gt: question.orderIndex },
            },
            orderBy: { orderIndex: 'asc' },
        });

        return {
            evaluation: {
                score: evaluation.score,
                feedback: evaluation.feedback,
                keywordsMatched: evaluation.keywordsMatched,
                keywordsMissed: evaluation.keywordsMissed,
                metrics: evaluation.metrics,
                improvedAnswer: bankQuestion.idealAnswer,
            },
            nextQuestion: nextQuestion ? {
                id: nextQuestion.id,
                questionText: nextQuestion.questionText,
                questionType: nextQuestion.questionType,
                orderIndex: nextQuestion.orderIndex,
            } : null,
            isComplete: !nextQuestion,
        };
    }

    /**
     * Complete the practice interview and generate summary feedback.
     * No LLM — uses algorithmic feedback generation.
     */
    async completeSession(sessionId: string, userId: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                questions: true,
            },
        });

        if (!session) {
            throw new AppError('Practice session not found', 404);
        }

        // Calculate overall score
        const answeredQuestions = session.questions.filter(q => q.score !== null);
        const totalScore = answeredQuestions.reduce(
            (sum: number, q: { score: number | null }) => sum + (q.score || 0), 0
        );
        const overallScore = answeredQuestions.length > 0
            ? Math.round(totalScore / answeredQuestions.length)
            : 0;

        // Generate feedback (no LLM)
        const overallFeedback = generatePracticeFeedbackSummary(
            session.targetRole,
            session.type,
            session.questions.map(q => ({
                questionText: q.questionText,
                userAnswer: q.userAnswer,
                score: q.score,
                questionType: q.questionType,
            })),
            overallScore
        );

        // Update session
        const updatedSession = await prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                overallScore,
                feedback: overallFeedback,
                completedAt: new Date(),
            },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });

        logger.info(`Completed practice session ${sessionId} with score ${overallScore}`);

        return {
            session: updatedSession,
            overallScore,
            feedback: overallFeedback,
            isPractice: true,
            questionResults: session.questions.map((q: any) => ({
                question: q.questionText,
                answer: q.userAnswer,
                score: q.score,
                feedback: q.feedback,
                metrics: q.metrics,
                improvedAnswer: q.improvedAnswer,
            })),
        };
    }
}
