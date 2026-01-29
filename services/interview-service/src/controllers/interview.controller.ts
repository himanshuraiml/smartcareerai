import { Request, Response, NextFunction } from 'express';
import { InterviewService } from '../services/interview.service';
import { audioAnalysisService } from '../services/audio-analysis.service';
import { videoAnalysisService } from '../services/video-analysis.service';
import { logger } from '../utils/logger';
import { BillingClient } from '../utils/billing-client';
import { z } from 'zod';

const interviewService = new InterviewService();

const createSessionSchema = z.object({
    type: z.enum(['TECHNICAL', 'BEHAVIORAL', 'HR', 'MIXED']).default('TECHNICAL'),
    targetRole: z.string().min(1),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    format: z.enum(['TEXT', 'AUDIO', 'VIDEO']).default('TEXT'),
});

const answerSchema = z.object({
    questionId: z.string().uuid(),
    answer: z.string().min(1),
});

export class InterviewController {
    createSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Get auth header to forward to billing service
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Authorization required' });
            }

            // Consume AI_INTERVIEW credit before creating session
            try {
                await BillingClient.consumeCredit(authHeader, 'AI_INTERVIEW');
            } catch (creditError: any) {
                logger.warn(`Credit check failed for user ${userId}: ${creditError.message}`);
                return res.status(creditError.statusCode || 402).json({
                    success: false,
                    error: creditError.message || 'Insufficient credits',
                    code: creditError.code || 'INSUFFICIENT_CREDITS',
                });
            }

            const data = createSessionSchema.parse(req.body);
            const session = await interviewService.createSession(userId, data);

            res.status(201).json({ success: true, data: session });
        } catch (error) {
            logger.error('Create session error:', error);
            next(error);
        }
    };

    getUserSessions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const sessions = await interviewService.getUserSessions(userId);
            res.json({ success: true, data: sessions });
        } catch (error) {
            logger.error('Get sessions error:', error);
            next(error);
        }
    };

    getSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const session = await interviewService.getSession(id, userId);
            res.json({ success: true, data: session });
        } catch (error) {
            logger.error('Get session error:', error);
            next(error);
        }
    };

    startSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const session = await interviewService.startSession(id, userId);
            res.json({ success: true, data: session });
        } catch (error) {
            logger.error('Start session error:', error);
            next(error);
        }
    };

    submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const data = answerSchema.parse(req.body);
            const result = await interviewService.submitAnswer(id, userId, data.questionId, data.answer);

            res.json({ success: true, data: result });
        } catch (error) {
            logger.error('Submit answer error:', error);
            next(error);
        }
    };

    /**
     * Submit audio answer - transcribes and analyzes
     */
    submitAudioAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id } = req.params;
            const { questionId } = req.body;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No audio file provided' });
            }

            if (!questionId) {
                return res.status(400).json({ error: 'Question ID is required' });
            }

            logger.info(`Processing audio answer for session ${id}, question ${questionId}`);

            // Analyze the audio
            const audioAnalysis = await audioAnalysisService.analyzeAudio(
                req.file.buffer,
                req.file.originalname || 'audio.webm'
            );

            // Submit the transcribed answer
            const result = await interviewService.submitAnswer(
                id,
                userId,
                questionId,
                audioAnalysis.transcription.text
            );

            // Return combined result with audio analysis
            res.json({
                success: true,
                data: {
                    ...result,
                    audioAnalysis: {
                        transcription: audioAnalysis.transcription.text,
                        duration: audioAnalysis.transcription.duration,
                        wordCount: audioAnalysis.transcription.wordCount,
                        speakingPace: audioAnalysis.speakingPace,
                        fillerWords: audioAnalysis.fillerWordAnalysis,
                        clarityScore: audioAnalysis.clarityScore,
                        confidenceIndicators: audioAnalysis.confidenceIndicators,
                        suggestions: audioAnalysis.suggestions,
                    },
                },
            });
        } catch (error) {
            logger.error('Submit audio answer error:', error);
            next(error);
        }
    };

    /**
     * Submit video answer - extracts audio for transcription and analysis
     */
    submitVideoAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id } = req.params;
            const { questionId, transcript, metrics } = req.body;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Valid if file OR transcript provided
            if (!req.file && !transcript) {
                return res.status(400).json({ error: 'No video file or transcript provided' });
            }

            if (!questionId) {
                return res.status(400).json({ error: 'Question ID is required' });
            }

            logger.info(`Processing video answer for session ${id}, question ${questionId}`);

            let answerText = '';
            let audioMetrics: any = null;
            let visualMetrics: any = null;

            if (transcript) {
                // Client-side analysis path
                logger.info('Using client-side transcript and metrics');
                answerText = transcript;
                if (metrics) {
                    try {
                        const parsed = typeof metrics === 'string' ? JSON.parse(metrics) : metrics;
                        if (parsed) {
                            audioMetrics = {
                                wordsPerMinute: parsed.wpm || 0,
                                speakingPace: (parsed.wpm || 0) < 110 ? 'slow' : (parsed.wpm || 0) > 160 ? 'fast' : 'good',
                            };
                            visualMetrics = {
                                eyeContactScore: parsed.eyeContactScore || 0,
                                sentiment: parsed.sentiment || 'neutral',
                            };
                        }
                    } catch (e) {
                        logger.warn('Error parsing metrics', e);
                    }
                }
            } else if (req.file) {
                // Fallback server-side analysis
                logger.info('Processing video file on server');
                const audioAnalysis = await audioAnalysisService.analyzeAudio(
                    req.file.buffer,
                    req.file.originalname || 'video.webm'
                );
                answerText = audioAnalysis.transcription.text;
                audioMetrics = {
                    wordsPerMinute: audioAnalysis.transcription.wordsPerMinute,
                };
            }

            // Submit for evaluation
            const result = await interviewService.submitAnswer(
                id,
                userId,
                questionId,
                answerText,
                { ...audioMetrics, ...visualMetrics }
            );

            res.json({
                success: true,
                data: {
                    ...result,
                    audioAnalysis: {
                        transcription: answerText,
                        wordsPerMinute: audioMetrics?.wordsPerMinute || 0,
                    },
                    videoAnalysis: visualMetrics,
                    sentiment: {
                        sentiment: visualMetrics?.sentiment || 'neutral',
                        confidence: 85,
                    },
                },
            });
        } catch (error) {
            logger.error('Submit video answer error:', error);
            next(error);
        }
    };

    /**
     * Get analysis capabilities status
     */
    getAnalysisStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.json({
                success: true,
                data: {
                    textAnalysis: { available: true },
                    audioAnalysis: {
                        available: !!process.env.GROQ_API_KEY,
                        features: [
                            'Speech-to-text transcription',
                            'Filler word detection',
                            'Speaking pace analysis',
                            'Clarity scoring',
                            'Confidence indicators',
                        ],
                    },
                    videoAnalysis: {
                        available: videoAnalysisService.isAvailable(),
                        message: videoAnalysisService.getStatusMessage(),
                        comingSoon: [
                            'Eye contact detection',
                            'Facial expression analysis',
                            'Body posture assessment',
                            'Professional appearance evaluation',
                        ],
                    },
                },
            });
        } catch (error) {
            logger.error('Get analysis status error:', error);
            next(error);
        }
    };

    completeSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const result = await interviewService.completeSession(id, userId);
            res.json({ success: true, data: result });
        } catch (error) {
            logger.error('Complete session error:', error);
            next(error);
        }
    };

    /**
     * Get AI-generated hint for a question
     */
    getQuestionHint = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id, questionId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const hint = await interviewService.getQuestionHint(id, userId, questionId);
            res.json({ success: true, data: hint });
        } catch (error) {
            logger.error('Get question hint error:', error);
            next(error);
        }
    };

    /**
     * Get live analytics for interview session
     */
    getLiveAnalytics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const analytics = await interviewService.getLiveAnalytics(id, userId);
            res.json({ success: true, data: analytics });
        } catch (error) {
            logger.error('Get live analytics error:', error);
            next(error);
        }
    };
}

