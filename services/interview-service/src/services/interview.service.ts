import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { generateQuestions, evaluateAnswer, generateFeedback } from '../utils/llm';
import { selectQuestionsFromBank } from '../utils/question-bank';
import { AppError } from '../utils/errors';

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
            throw new AppError('Interview session not found', 404);
        }

        return session;
    }

    // Start the interview and generate questions
    async startSession(sessionId: string, userId: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
        });

        if (!session) {
            throw new AppError('Interview session not found', 404);
        }

        if (session.status !== 'PENDING') {
            throw new AppError('Interview has already started', 400);
        }

        const questionCount = session.difficulty === 'EASY' ? 5 : session.difficulty === 'MEDIUM' ? 7 : 10;

        // Try question bank first (zero LLM cost)
        const bankQuestions = await selectQuestionsFromBank(
            session.type,
            session.targetRole,
            session.difficulty,
            questionCount
        );

        let createdQuestions;

        if (bankQuestions.length >= questionCount) {
            // Use curated bank questions — no LLM call needed
            logger.info(`Using ${questionCount} bank questions for session ${sessionId}`);
            createdQuestions = await Promise.all(
                bankQuestions.slice(0, questionCount).map((q, index) =>
                    prisma.interviewQuestion.create({
                        data: {
                            sessionId,
                            questionText: q.questionText,
                            questionType: q.questionType.toLowerCase(),
                            orderIndex: index,
                            bankQuestionId: q.id,
                        },
                    })
                )
            );
        } else {
            // Fallback to LLM generation (backward compatible)
            logger.info(`Bank has ${bankQuestions.length}/${questionCount} questions, falling back to LLM for session ${sessionId}`);
            const questions = await generateQuestions(
                session.type,
                session.targetRole,
                session.difficulty,
                questionCount
            );

            createdQuestions = await Promise.all(
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
        }

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
    async submitAnswer(sessionId: string, userId: string, questionId: string, answer: string, metrics?: any) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId, status: 'IN_PROGRESS' },
        });

        if (!session) {
            throw new AppError('Active interview session not found', 404);
        }

        const question = await prisma.interviewQuestion.findFirst({
            where: { id: questionId, sessionId },
        });

        if (!question) {
            throw new AppError('Question not found', 404);
        }

        // Evaluate the answer using LLM (scoring + personalized feedback still needs LLM)
        const evaluation = await evaluateAnswer(
            question.questionText,
            answer,
            session.targetRole,
            session.type,
            metrics
        );

        // If question came from the bank, use the curated ideal answer instead of LLM-generated one
        if (question.bankQuestionId) {
            const bankQuestion = await prisma.interviewBankQuestion.findUnique({
                where: { id: question.bankQuestionId },
                select: { idealAnswer: true },
            });
            if (bankQuestion) {
                evaluation.improvedAnswer = bankQuestion.idealAnswer;
            }
        }

        // Update question with answer, score, metrics, and improved answer
        await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: {
                userAnswer: answer,
                score: evaluation.score,
                feedback: evaluation.feedback,
                metrics: evaluation.metrics,
                improvedAnswer: evaluation.improvedAnswer,
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
            throw new AppError('Interview session not found', 404);
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

    // Get AI hint for a specific question
    async getQuestionHint(sessionId: string, userId: string, questionId: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
        });

        if (!session) {
            throw new AppError('Interview session not found', 404);
        }

        const question = await prisma.interviewQuestion.findFirst({
            where: { id: questionId, sessionId },
        });

        if (!question) {
            throw new AppError('Question not found', 404);
        }

        // Import dynamically to avoid circular deps
        const { generateQuestionHint } = await import('../utils/llm');

        const hint = await generateQuestionHint(
            question.questionText,
            session.targetRole,
            session.type
        );

        logger.info(`Generated hint for question ${questionId}`);
        return hint;
    }

    // Get live analytics for an interview session
    async getLiveAnalytics(sessionId: string, userId: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });

        if (!session) {
            throw new AppError('Interview session not found', 404);
        }

        // Calculate analytics from answered questions
        const answeredQuestions = session.questions.filter(q => q.score !== null);
        const totalQuestions = session.questions.length;
        const currentQuestionIndex = session.questions.findIndex(q => q.userAnswer === null);

        // Calculate average score (tech accuracy)
        const avgScore = answeredQuestions.length > 0
            ? Math.round(answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length)
            : 0;

        // Get the current question if interview is in progress
        const currentQuestion = currentQuestionIndex >= 0 && currentQuestionIndex < totalQuestions
            ? session.questions[currentQuestionIndex]
            : null;

        return {
            sessionId,
            status: session.status,
            targetRole: session.targetRole,
            interviewType: session.type,
            progress: {
                current: currentQuestionIndex >= 0 ? currentQuestionIndex + 1 : totalQuestions,
                total: totalQuestions,
                answered: answeredQuestions.length,
            },
            techAccuracy: {
                score: avgScore,
                label: avgScore >= 80 ? 'Excellent' : avgScore >= 60 ? 'Good' : avgScore >= 40 ? 'Fair' : 'Needs Improvement',
            },
            currentQuestion: currentQuestion ? {
                id: currentQuestion.id,
                text: currentQuestion.questionText,
                type: currentQuestion.questionType,
                index: currentQuestionIndex,
            } : null,
            startedAt: session.startedAt,
        };
    }
}
