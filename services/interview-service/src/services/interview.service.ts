import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { generateQuestions, evaluateAnswer, generateFeedback } from '../utils/llm';

interface CreateSessionData {
    type: 'TECHNICAL' | 'BEHAVIORAL' | 'HR' | 'MIXED';
    targetRole: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export class InterviewService {
    // Create a new interview session
    async createSession(userId: string, data: CreateSessionData) {
        const session = await prisma.interviewSession.create({
            data: {
                userId,
                type: data.type,
                targetRole: data.targetRole,
                difficulty: data.difficulty,
                status: 'PENDING',
            },
        });

        logger.info(`Created interview session ${session.id} for user ${userId}`);
        return session;
    }

    // Get all sessions for a user
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
                    },
                },
            },
        });
    }

    // Get a specific session
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
            throw new Error('Interview session not found');
        }

        return session;
    }

    // Start the interview and generate questions
    async startSession(sessionId: string, userId: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
        });

        if (!session) {
            throw new Error('Interview session not found');
        }

        if (session.status !== 'PENDING') {
            throw new Error('Interview has already started');
        }

        // Generate questions using LLM
        const questionCount = session.difficulty === 'EASY' ? 5 : session.difficulty === 'MEDIUM' ? 7 : 10;
        const questions = await generateQuestions(
            session.type,
            session.targetRole,
            session.difficulty,
            questionCount
        );

        // Create questions in database
        const createdQuestions = await Promise.all(
            questions.map((q, index) =>
                prisma.interviewQuestion.create({
                    data: {
                        sessionId,
                        questionText: q.question,
                        questionType: q.type,
                        orderIndex: index,
                    },
                })
            )
        );

        // Update session status
        await prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date(),
            },
        });

        return {
            session: { ...session, status: 'IN_PROGRESS', startedAt: new Date() },
            questions: createdQuestions.map(q => ({
                id: q.id,
                questionText: q.questionText,
                questionType: q.questionType,
                orderIndex: q.orderIndex,
            })),
            currentQuestionIndex: 0,
        };
    }

    // Submit an answer to a question
    async submitAnswer(sessionId: string, userId: string, questionId: string, answer: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId, status: 'IN_PROGRESS' },
        });

        if (!session) {
            throw new Error('Active interview session not found');
        }

        const question = await prisma.interviewQuestion.findFirst({
            where: { id: questionId, sessionId },
        });

        if (!question) {
            throw new Error('Question not found');
        }

        // Evaluate the answer using LLM
        const evaluation = await evaluateAnswer(
            question.questionText,
            answer,
            session.targetRole,
            session.type
        );

        // Update question with answer and score
        await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: {
                userAnswer: answer,
                score: evaluation.score,
                feedback: evaluation.feedback,
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
            evaluation,
            nextQuestion: nextQuestion ? {
                id: nextQuestion.id,
                questionText: nextQuestion.questionText,
                questionType: nextQuestion.questionType,
                orderIndex: nextQuestion.orderIndex,
            } : null,
            isComplete: !nextQuestion,
        };
    }

    // Complete the interview and generate final feedback
    async completeSession(sessionId: string, userId: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                questions: true,
            },
        });

        if (!session) {
            throw new Error('Interview session not found');
        }

        // Calculate overall score
        const answeredQuestions = session.questions.filter(q => q.score !== null);
        const totalScore = answeredQuestions.reduce((sum: number, q: { score: number | null }) => sum + (q.score || 0), 0);
        const overallScore = answeredQuestions.length > 0
            ? Math.round(totalScore / answeredQuestions.length)
            : 0;

        // Generate overall feedback using LLM
        const overallFeedback = await generateFeedback(
            session.targetRole,
            session.type,
            session.questions,
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

        logger.info(`Completed interview session ${sessionId} with score ${overallScore}`);

        return {
            session: updatedSession,
            overallScore,
            feedback: overallFeedback,
            questionResults: session.questions.map((q: { questionText: string; userAnswer: string | null; score: number | null; feedback: string | null }) => ({
                question: q.questionText,
                answer: q.userAnswer,
                score: q.score,
                feedback: q.feedback,
            })),
        };
    }
}
