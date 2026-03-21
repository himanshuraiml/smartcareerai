import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { generateQuestions, evaluateAnswer, generateFeedback, generateFollowUpQuestion, generateCopilotSuggestionsFromTranscript, generateInterviewSummary } from '../utils/llm';
import { selectQuestionsFromBank } from '../utils/question-bank';
import { AppError } from '../utils/errors';

interface CreateSessionData {
    type: 'TECHNICAL' | 'BEHAVIORAL' | 'HR' | 'MIXED';
    targetRole: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    jobId?: string;
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
                jobId: data.jobId,
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

    // Get pending recruiter-invited interview sessions (jobId set + status PENDING)
    async getInvitations(userId: string) {
        const sessions = await prisma.interviewSession.findMany({
            where: {
                userId,
                jobId: { not: null },
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        recruiter: { select: { companyName: true } },
                    },
                },
            },
        });

        const now = new Date();
        return sessions.map(s => {
            const inviteExpiresAt: Date | null = (s as any).inviteExpiresAt ?? null;
            return {
                sessionId: s.id,
                jobId: s.jobId,
                jobTitle: s.job?.title ?? s.targetRole,
                companyName: (s.job as any)?.recruiter?.companyName ?? 'Unknown Company',
                location: (s.job as any)?.location ?? '',
                difficulty: s.difficulty,
                type: s.type,
                inviteType: (s as any).inviteType ?? 'AI',
                scheduledAt: (s as any).scheduledAt ?? null,
                scheduledEndAt: (s as any).scheduledEndAt ?? null,
                meetLink: (s as any).meetLink ?? null,
                createdAt: s.createdAt,
                inviteExpiresAt,
                isExpired: inviteExpiresAt ? now > inviteExpiresAt : false,
            };
        });
    }

    // Get a specific session
    async getSession(sessionId: string, userId: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
                job: {
                    select: {
                        recruiter: {
                            select: { userId: true }
                        }
                    }
                }
            },
        });

        if (!session) {
            throw new AppError('Interview session not found', 404);
        }

        const isCandidate = session.userId === userId;
        const isRecruiter = session.job?.recruiter?.userId === userId;

        if (!isCandidate && !isRecruiter) {
            throw new AppError('Interview session not found', 404);
        }

        const { job, ...sessionData } = session;
        return sessionData;
    }

    // Get Interview Replay Details
    async getReplayDetails(sessionId: string, userId: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
            select: {
                id: true,
                isReplayAvailable: true,
                replayUrl: true,
                replayTranscriptUrl: true,
                createdAt: true,
                status: true,
                overallScore: true,
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        userAnswer: true,
                        score: true,
                        feedback: true,
                    }
                }
            }
        });

        if (!session) {
            throw new AppError('Interview session not found', 404);
        }

        return session;
    }

    // Save copilot suggestions and transcript from meeting-bot-service
    async saveCopilotData(sessionId: string, suggestions: string[], transcriptChunks: string[], summary?: string) {
        // Upsert the copilot session (transcript accumulation)
        const existing = await prisma.copilotSession.findUnique({ where: { sessionId } });
        const existingTranscript: string[] = existing ? JSON.parse(existing.transcript) : [];
        const mergedTranscript = [...existingTranscript, ...transcriptChunks];

        await prisma.copilotSession.upsert({
            where: { sessionId },
            update: {
                transcript: JSON.stringify(mergedTranscript),
                ...(summary ? { summary } : {}),
            },
            create: {
                sessionId,
                transcript: JSON.stringify(mergedTranscript),
                summary: summary || null,
            },
        });

        // Persist each suggestion as a separate record
        if (suggestions.length > 0) {
            await prisma.copilotSuggestion.createMany({
                data: suggestions.map(text => ({ sessionId, text })),
            });
        }
    }

    // Get copilot data for post-mortem view
    async getCopilotData(sessionId: string, userId: string) {
        // Verify the session belongs to this user
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
            select: { id: true },
        });

        if (!session) {
            throw new AppError('Interview session not found', 404);
        }

        const [copilotSession, suggestions] = await Promise.all([
            prisma.copilotSession.findUnique({ where: { sessionId } }),
            prisma.copilotSuggestion.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' },
            }),
        ]);

        return {
            transcript: copilotSession ? JSON.parse(copilotSession.transcript) : [],
            summary: copilotSession?.summary ? JSON.parse(copilotSession.summary) : null,
            suggestions: suggestions.map(s => ({ text: s.text, timestamp: s.timestamp })),
        };
    }

    // Generate an automated summary of a live interview based on its transcript
    async generateSessionSummary(sessionId: string) {
        const session = await prisma.interviewSession.findUnique({
            where: { id: sessionId },
            select: { id: true, targetRole: true }
        });

        if (!session) {
            throw new AppError('Interview session not found', 404);
        }

        const copilotSession = await prisma.copilotSession.findUnique({
            where: { sessionId }
        });

        if (!copilotSession || !copilotSession.transcript) {
            throw new AppError('No transcript found for generating summary', 400);
        }

        const transcriptChunks: string[] = JSON.parse(copilotSession.transcript);

        if (transcriptChunks.length === 0) {
            throw new AppError('Transcript is empty', 400);
        }

        const summary = await generateInterviewSummary(transcriptChunks, session.targetRole);

        // Save the summary
        await prisma.copilotSession.update({
            where: { sessionId },
            data: { summary }
        });

        return { summary };
    }

    // Generate real-time copilot suggestions from transcript (called by gateway socket)
    async generateCopilotSuggestions(sessionId: string, transcriptText: string): Promise<string[]> {
        return generateCopilotSuggestionsFromTranscript(transcriptText);
    }

    // Update Interview Replay Logs
    async updateReplayLogs(sessionId: string, userId: string, replayUrl: string, replayTranscriptUrl: string) {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId }
        });

        if (!session) {
            throw new AppError('Interview session not found', 404);
        }

        const updatedSession = await prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
                replayUrl,
                replayTranscriptUrl,
                isReplayAvailable: true
            }
        });

        return updatedSession;
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

        // Enforce invite expiry for AI async invites
        if (session.inviteExpiresAt && new Date() > session.inviteExpiresAt) {
            throw new AppError('This interview invitation has expired', 410);
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

        // Idempotent check: If already answered, return next question
        if (question.userAnswer) {
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
                    score: question.score,
                    feedback: question.feedback,
                    metrics: question.metrics,
                    improvedAnswer: question.improvedAnswer,
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

        // Determine if a follow-up is needed (Phase 2 Conversational AI)
        // Only do this if it's not already a follow-up question (to prevent infinite loops)
        if (!question.questionType.includes('follow-up')) {
            const followUp = await generateFollowUpQuestion(
                question.questionText,
                answer,
                session.targetRole
            );

            if (followUp.hasFollowUp && followUp.question) {
                logger.info(`Generating dynamic follow-up for session ${sessionId}, question ${questionId}`);

                // Shift subsequent questions' orderIndex down
                await prisma.interviewQuestion.updateMany({
                    where: {
                        sessionId,
                        orderIndex: { gt: question.orderIndex },
                    },
                    data: {
                        orderIndex: { increment: 1 },
                    },
                });

                // Insert the new follow-up question immediately after the current one
                await prisma.interviewQuestion.create({
                    data: {
                        sessionId,
                        questionText: followUp.question,
                        questionType: `${question.questionType}-follow-up`,
                        orderIndex: question.orderIndex + 1,
                    }
                });
            }
        }

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

        // Sync the interview score back to the job application if this was a recruiter invite
        if (session.jobId) {
            try {
                await prisma.recruiterJobApplicant.updateMany({
                    where: {
                        jobId: session.jobId,
                        candidateId: userId
                    },
                    data: {
                        overallScore: overallScore,
                        aiEvaluation: overallFeedback
                    },
                });
                logger.info(`Synced interview score ${overallScore} to application for candidate ${userId} on job ${session.jobId}`);
            } catch (err) {
                logger.error(`Failed to sync interview score to application: ${err}`);
            }
        }

        logger.info(`Completed interview session ${sessionId} with score ${overallScore} `);


        // Trigger AI Readiness Recalculation (Phase 4)
        const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3011';
        fetch(`${ADMIN_SERVICE_URL}/institution/ai/internal/calculate-readiness/${userId}`, {
            method: 'POST'
        }).catch(err => logger.error(`AI Readiness trigger failed for user ${userId}: ${err.message}`));

        // Trigger Automated Pipeline Progression (Phase 5)
        try {
            const activeApps = await prisma.recruiterJobApplicant.findMany({
                where: { candidateId: userId, status: { in: ['SCREENING', 'INTERVIEWING'] } },
                select: { id: true }
            });
            const RECRUITER_SERVICE_URL = process.env.RECRUITER_SERVICE_URL || 'http://localhost:3012';
            for (const app of activeApps) {
                fetch(`${RECRUITER_SERVICE_URL}/api/recruiter/internal/pipeline/advance/${app.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ passed: overallScore !== null && overallScore >= 50 }) // Configurable threshold
                }).catch(err => logger.error(`Pipeline progression trigger failed for app ${app.id}: ${err.message}`));
            }
        } catch (err) {
            logger.error(`Error querying active apps for pipeline progression: ${err}`);
        }


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
