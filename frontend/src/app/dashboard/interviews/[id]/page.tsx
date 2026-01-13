'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Play, Send, Loader2, CheckCircle, Clock,
    MessageSquare, Award, RefreshCw, Mic, Square, Pause, RotateCcw, Video, VideoOff
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useAudioRecorder, formatTime } from '@/hooks/useAudioRecorder';
import { useVideoRecorder, formatVideoTime } from '@/hooks/useVideoRecorder';


interface Question {
    id: string;
    questionText: string;
    questionType: string;
    userAnswer: string | null;
    score: number | null;
    feedback: string | null;
    orderIndex: number;
}

interface AudioAnalysis {
    transcription: string;
    duration: number;
    wordCount: number;
    speakingPace: { wordsPerMinute: number; rating: string; feedback: string };
    fillerWords: { fillerWords: Array<{ word: string; count: number }>; totalFillerWords: number; fillerWordPercentage: number };
    clarityScore: number;
    confidenceIndicators: { hesitationLevel: string; fillerWordImpact: string; overallConfidence: number };
    suggestions: string[];
}

interface InterviewSession {
    id: string;
    type: string;
    targetRole: string;
    difficulty: string;
    status: string;
    format?: string; // TEXT, AUDIO, VIDEO
    overallScore: number | null;
    feedback: string | null;
    startedAt: string | null;
    completedAt: string | null;
    questions: Question[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function InterviewRoomPage() {
    const { id } = useParams();
    const router = useRouter();
    const { accessToken } = useAuthStore();

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [lastFeedback, setLastFeedback] = useState<{ score: number; feedback: string } | null>(null);
    const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);

    // Audio recording hook
    const {
        isRecording,
        isPaused,
        recordingTime,
        audioBlob,
        audioUrl,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
        error: recordingError,
    } = useAudioRecorder({ maxDuration: 180 }); // 3 min max

    // Video recording hook
    const {
        isRecording: isVideoRecording,
        isPaused: isVideoPaused,
        recordingTime: videoRecordingTime,
        videoBlob,
        videoUrl,
        previewStream,
        startPreview,
        stopPreview,
        startRecording: startVideoRecording,
        stopRecording: stopVideoRecording,
        pauseRecording: pauseVideoRecording,
        resumeRecording: resumeVideoRecording,
        resetRecording: resetVideoRecording,
        error: videoRecordingError,
    } = useVideoRecorder({ maxDuration: 180 }); // 3 min max

    // Video preview ref
    const videoPreviewRef = useRef<HTMLVideoElement>(null);

    // Handle video preview stream
    useEffect(() => {
        if (videoPreviewRef.current && previewStream) {
            videoPreviewRef.current.srcObject = previewStream;
        }
    }, [previewStream]);

    // Start video preview when VIDEO format is selected
    useEffect(() => {
        if (session?.format === 'VIDEO' && session?.status === 'IN_PROGRESS') {
            startPreview();
        }
        return () => {
            stopPreview();
        };
    }, [session?.format, session?.status, startPreview, stopPreview]);

    const fetchSession = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${id}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSession(data.data);

                // Find first unanswered question
                const unansweredIndex = data.data.questions.findIndex((q: Question) => !q.userAnswer);
                if (unansweredIndex !== -1) {
                    setCurrentQuestionIndex(unansweredIndex);
                }
            }
        } catch (err) {
            console.error('Failed to fetch session:', err);
        } finally {
            setLoading(false);
        }
    }, [id, accessToken]);

    useEffect(() => {
        if (accessToken && id) {
            fetchSession();
        }
    }, [accessToken, id, fetchSession]);

    const startInterview = async () => {
        setStarting(true);
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${id}/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSession(prev => prev ? {
                    ...prev,
                    status: 'IN_PROGRESS',
                    startedAt: new Date().toISOString(),
                    questions: data.data.questions,
                } : null);
                setCurrentQuestionIndex(0);
            }
        } catch (err) {
            console.error('Failed to start interview:', err);
        } finally {
            setStarting(false);
        }
    };

    const submitAudioAnswer = async () => {
        if (!session || !audioBlob) return;

        const question = session.questions[currentQuestionIndex];
        if (!question) return;

        setSubmitting(true);
        setLastFeedback(null);
        setAudioAnalysis(null);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'answer.webm');
            formData.append('questionId', question.id);

            const response = await fetch(`${API_URL}/interviews/sessions/${id}/answer/audio`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();

                // Update question with transcribed answer and feedback
                setSession(prev => {
                    if (!prev) return null;
                    const updatedQuestions = [...prev.questions];
                    updatedQuestions[currentQuestionIndex] = {
                        ...updatedQuestions[currentQuestionIndex],
                        userAnswer: data.data.audioAnalysis?.transcription || '[Audio Answer]',
                        score: data.data.evaluation?.score,
                        feedback: data.data.evaluation?.feedback,
                    };
                    return { ...prev, questions: updatedQuestions };
                });

                setLastFeedback(data.data.evaluation);
                setAudioAnalysis(data.data.audioAnalysis);
                resetRecording();

                // Move to next question after a delay
                if (data.data.nextQuestion) {
                    setTimeout(() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                        setLastFeedback(null);
                        setAudioAnalysis(null);
                    }, 5000);
                }
            }
        } catch (err) {
            console.error('Failed to submit audio answer:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const submitVideoAnswer = async () => {
        if (!session || !videoBlob) return;

        const question = session.questions[currentQuestionIndex];
        if (!question) return;

        setSubmitting(true);
        setLastFeedback(null);

        try {
            const formData = new FormData();
            formData.append('video', videoBlob, 'answer.webm');
            formData.append('questionId', question.id);

            const response = await fetch(`${API_URL}/interviews/sessions/${id}/answer/video`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();

                // Update question with video answer
                setSession(prev => {
                    if (!prev) return null;
                    const updatedQuestions = [...prev.questions];
                    updatedQuestions[currentQuestionIndex] = {
                        ...updatedQuestions[currentQuestionIndex],
                        userAnswer: '[Video Answer]',
                        score: data.data.evaluation?.score || null,
                        feedback: data.data.evaluation?.feedback || data.data.note,
                    };
                    return { ...prev, questions: updatedQuestions };
                });

                setLastFeedback(data.data.evaluation || { score: 0, feedback: data.data.note });
                resetVideoRecording();

                // Move to next question after a delay
                if (data.data.nextQuestion) {
                    setTimeout(() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                        setLastFeedback(null);
                    }, 5000);
                }
            }
        } catch (err) {
            console.error('Failed to submit video answer:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const submitAnswer = async () => {
        if (!session || !currentAnswer.trim()) return;

        const question = session.questions[currentQuestionIndex];
        if (!question) return;

        setSubmitting(true);
        setLastFeedback(null);

        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${id}/answer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId: question.id,
                    answer: currentAnswer,
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Update question with answer and feedback
                setSession(prev => {
                    if (!prev) return null;
                    const updatedQuestions = [...prev.questions];
                    updatedQuestions[currentQuestionIndex] = {
                        ...updatedQuestions[currentQuestionIndex],
                        userAnswer: currentAnswer,
                        score: data.data.evaluation.score,
                        feedback: data.data.evaluation.feedback,
                    };
                    return { ...prev, questions: updatedQuestions };
                });

                setLastFeedback(data.data.evaluation);
                setCurrentAnswer('');

                // Move to next question after a delay
                if (data.data.nextQuestion) {
                    setTimeout(() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                        setLastFeedback(null);
                    }, 3000);
                }
            }
        } catch (err) {
            console.error('Failed to submit answer:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const completeInterview = async () => {
        setCompleting(true);
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${id}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (response.ok) {
                const data = await response.json();
                setSession(data.data.session);
            }
        } catch (err) {
            console.error('Failed to complete interview:', err);
        } finally {
            setCompleting(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Interview session not found</p>
                <Link href="/dashboard/interviews" className="text-purple-400 hover:underline mt-2 inline-block">
                    Back to Interviews
                </Link>
            </div>
        );
    }

    // Completed interview view
    if (session.status === 'COMPLETED') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/interviews" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Interview Results</h1>
                        <p className="text-gray-400">{session.type} Interview - {session.targetRole}</p>
                    </div>
                </div>

                {/* Score Card */}
                <div className="p-8 rounded-2xl glass text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                        <Award className="w-12 h-12 text-purple-400" />
                    </div>
                    <p className={`text-5xl font-bold ${getScoreColor(session.overallScore || 0)}`}>
                        {session.overallScore}%
                    </p>
                    <p className="text-gray-400 mt-2">Overall Score</p>
                </div>

                {/* Feedback */}
                {session.feedback && (
                    <div className="p-6 rounded-xl glass">
                        <h3 className="text-lg font-semibold text-white mb-3">Overall Feedback</h3>
                        <p className="text-gray-300 whitespace-pre-line">{session.feedback}</p>
                    </div>
                )}

                {/* Question Results */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Question Breakdown</h3>
                    {session.questions.map((q, index) => (
                        <div key={q.id} className="p-6 rounded-xl glass">
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-purple-400 font-medium">Q{index + 1}</span>
                                {q.score !== null && (
                                    <span className={`font-bold ${getScoreColor(q.score)}`}>
                                        {q.score}/100
                                    </span>
                                )}
                            </div>
                            <p className="text-white mb-3">{q.questionText}</p>
                            {q.userAnswer && (
                                <div className="p-3 rounded-lg bg-white/5 mb-3">
                                    <p className="text-gray-400 text-sm mb-1">Your Answer:</p>
                                    <p className="text-gray-300">{q.userAnswer}</p>
                                </div>
                            )}
                            {q.feedback && (
                                <div className="p-3 rounded-lg bg-purple-500/10">
                                    <p className="text-purple-400 text-sm mb-1">Feedback:</p>
                                    <p className="text-gray-300">{q.feedback}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <Link
                        href="/dashboard/interviews"
                        className="flex-1 text-center px-4 py-3 rounded-lg border border-white/10 text-gray-400 hover:text-white transition"
                    >
                        Back to Interviews
                    </Link>
                    <button
                        onClick={() => router.push('/dashboard/interviews')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Another Interview
                    </button>
                </div>
            </div>
        );
    }

    // Pending interview - need to start
    if (session.status === 'PENDING') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/interviews" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Ready to Start</h1>
                        <p className="text-gray-400">{session.type} Interview - {session.targetRole}</p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl glass text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
                        <Play className="w-10 h-10 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">
                        {session.type} Interview for {session.targetRole}
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Difficulty: {session.difficulty} •{' '}
                        {session.difficulty === 'EASY' ? 5 : session.difficulty === 'MEDIUM' ? 7 : 10} questions
                    </p>

                    <div className="p-4 rounded-lg bg-white/5 mb-6 text-left max-w-md mx-auto">
                        <h3 className="text-white font-medium mb-2">Tips for success:</h3>
                        <ul className="text-gray-400 text-sm space-y-1">
                            <li>• Take your time to think before answering</li>
                            <li>• Use specific examples when possible</li>
                            <li>• Structure your answers clearly</li>
                            <li>• Be honest about your experience level</li>
                        </ul>
                    </div>

                    <button
                        onClick={startInterview}
                        disabled={starting}
                        className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                        {starting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Questions...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                Start Interview
                            </span>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // In Progress - Interview room
    const currentQuestion = session.questions[currentQuestionIndex];
    const answeredCount = session.questions.filter(q => q.userAnswer).length;
    const isLastQuestion = currentQuestionIndex === session.questions.length - 1;
    const allAnswered = answeredCount === session.questions.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/interviews" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white">{session.type} Interview</h1>
                        <p className="text-gray-400 text-sm">{session.targetRole}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400">
                        Question {currentQuestionIndex + 1} of {session.questions.length}
                    </span>
                    <div className="w-32 h-2 rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{ width: `${(answeredCount / session.questions.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Question Card */}
            {currentQuestion && !currentQuestion.userAnswer && (
                <div className="p-6 rounded-2xl glass">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-purple-400 text-sm">
                            <MessageSquare className="w-4 h-4" />
                            {currentQuestion.questionType.charAt(0).toUpperCase() + currentQuestion.questionType.slice(1)} Question
                        </div>
                        {session.format && session.format !== 'TEXT' && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${session.format === 'AUDIO' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                                }`}>
                                {session.format === 'AUDIO' ? '🎤 Audio Mode' : '📹 Video Mode'}
                            </span>
                        )}
                    </div>
                    <p className="text-xl text-white mb-6">{currentQuestion.questionText}</p>

                    {/* Text Input (default or TEXT format) */}
                    {(!session.format || session.format === 'TEXT') && (
                        <>
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                rows={6}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                            />
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={submitAnswer}
                                    disabled={submitting || !currentAnswer.trim()}
                                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Evaluating...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Answer
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Audio Recording UI */}
                    {session.format === 'AUDIO' && (
                        <div className="space-y-4">
                            {/* Recording controls */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                {!isRecording && !audioBlob && (
                                    <div className="text-center">
                                        <button
                                            onClick={startRecording}
                                            className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto hover:opacity-90 transition shadow-lg shadow-blue-500/25"
                                        >
                                            <Mic className="w-8 h-8 text-white" />
                                        </button>
                                        <p className="text-gray-400 mt-4">Click to start recording your answer</p>
                                        <p className="text-gray-500 text-sm mt-1">Max 3 minutes</p>
                                    </div>
                                )}

                                {isRecording && (
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mx-auto animate-pulse">
                                            <div className="w-4 h-4 rounded-full bg-white" />
                                        </div>
                                        <p className="text-white text-2xl font-bold mt-4">{formatTime(recordingTime)}</p>
                                        <p className="text-red-400 text-sm">Recording...</p>
                                        <div className="flex justify-center gap-3 mt-4">
                                            {isPaused ? (
                                                <button
                                                    onClick={resumeRecording}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Resume
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={pauseRecording}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-white"
                                                >
                                                    <Pause className="w-4 h-4" />
                                                    Pause
                                                </button>
                                            )}
                                            <button
                                                onClick={stopRecording}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white"
                                            >
                                                <Square className="w-4 h-4" />
                                                Stop
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {audioBlob && audioUrl && (
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                            <p className="text-white font-medium">Recording Complete</p>
                                            <p className="text-gray-400 text-sm">{formatTime(recordingTime)} recorded</p>
                                        </div>
                                        <audio src={audioUrl} controls className="w-full" />
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={resetRecording}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Re-record
                                            </button>
                                            <button
                                                onClick={submitAudioAnswer}
                                                disabled={submitting}
                                                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Submit Audio
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {recordingError && (
                                    <p className="text-red-400 text-center mt-4">{recordingError}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Video Recording UI */}
                    {session.format === 'VIDEO' && (
                        <div className="space-y-4">
                            {/* Video preview/recording area */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                {/* Camera preview */}
                                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                                    {previewStream && !videoUrl ? (
                                        <video
                                            ref={videoPreviewRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : videoUrl ? (
                                        <video
                                            src={videoUrl}
                                            controls
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                                <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                                <p className="text-gray-500">Camera not started</p>
                                                <button
                                                    onClick={startPreview}
                                                    className="mt-3 px-4 py-2 rounded-lg bg-green-500 text-white text-sm"
                                                >
                                                    Enable Camera
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recording indicator */}
                                    {isVideoRecording && (
                                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/90">
                                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                            <span className="text-white text-sm font-medium">
                                                REC {formatVideoTime(videoRecordingTime)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                {!isVideoRecording && !videoBlob && previewStream && (
                                    <div className="text-center">
                                        <button
                                            onClick={startVideoRecording}
                                            className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto hover:opacity-90 transition shadow-lg shadow-green-500/25"
                                        >
                                            <Video className="w-8 h-8 text-white" />
                                        </button>
                                        <p className="text-gray-400 mt-4">Click to start recording your answer</p>
                                        <p className="text-gray-500 text-sm mt-1">Max 3 minutes</p>
                                    </div>
                                )}

                                {isVideoRecording && (
                                    <div className="flex justify-center gap-3">
                                        {isVideoPaused ? (
                                            <button
                                                onClick={resumeVideoRecording}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white"
                                            >
                                                <Play className="w-4 h-4" />
                                                Resume
                                            </button>
                                        ) : (
                                            <button
                                                onClick={pauseVideoRecording}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-white"
                                            >
                                                <Pause className="w-4 h-4" />
                                                Pause
                                            </button>
                                        )}
                                        <button
                                            onClick={stopVideoRecording}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white"
                                        >
                                            <Square className="w-4 h-4" />
                                            Stop
                                        </button>
                                    </div>
                                )}

                                {videoBlob && videoUrl && (
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                            <p className="text-white font-medium">Recording Complete</p>
                                            <p className="text-gray-400 text-sm">{formatVideoTime(videoRecordingTime)} recorded</p>
                                        </div>
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => {
                                                    resetVideoRecording();
                                                    startPreview();
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Re-record
                                            </button>
                                            <button
                                                onClick={submitVideoAnswer}
                                                disabled={submitting}
                                                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Submit Video
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {videoRecordingError && (
                                    <p className="text-red-400 text-center mt-4">{videoRecordingError}</p>
                                )}

                                {/* Coming soon notice for visual analysis */}
                                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <p className="text-yellow-400 text-sm text-center">
                                        📹 Video recording works! Visual AI analysis (eye contact, expressions, posture) coming soon.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Feedback Display */}
            {lastFeedback && (
                <div className="p-6 rounded-2xl glass border border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Answer Feedback</h3>
                        <span className={`text-2xl font-bold ${getScoreColor(lastFeedback.score)}`}>
                            {lastFeedback.score}/100
                        </span>
                    </div>
                    <p className="text-gray-300">{lastFeedback.feedback}</p>

                    {/* Audio Analysis Results */}
                    {audioAnalysis && (
                        <div className="mt-6 space-y-4">
                            <div className="border-t border-white/10 pt-4">
                                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                    <Mic className="w-4 h-4 text-blue-400" />
                                    Speech Analysis
                                </h4>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-gray-400 text-xs">Clarity Score</p>
                                        <p className={`text-xl font-bold ${audioAnalysis.clarityScore >= 80 ? 'text-green-400' :
                                            audioAnalysis.clarityScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                            {audioAnalysis.clarityScore}%
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-gray-400 text-xs">Words/Min</p>
                                        <p className="text-xl font-bold text-white">
                                            {audioAnalysis.speakingPace.wordsPerMinute}
                                        </p>
                                        <p className={`text-xs ${audioAnalysis.speakingPace.rating === 'good' ? 'text-green-400' : 'text-yellow-400'
                                            }`}>
                                            ({audioAnalysis.speakingPace.rating})
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-gray-400 text-xs">Confidence</p>
                                        <p className={`text-xl font-bold ${audioAnalysis.confidenceIndicators.overallConfidence >= 70 ? 'text-green-400' :
                                            audioAnalysis.confidenceIndicators.overallConfidence >= 50 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                            {audioAnalysis.confidenceIndicators.overallConfidence}%
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-gray-400 text-xs">Duration</p>
                                        <p className="text-xl font-bold text-white">
                                            {Math.round(audioAnalysis.duration)}s
                                        </p>
                                    </div>
                                </div>

                                {/* Filler Words */}
                                {audioAnalysis.fillerWords.totalFillerWords > 0 && (
                                    <div className="p-3 rounded-lg bg-yellow-500/10 mb-4">
                                        <p className="text-yellow-400 text-sm font-medium mb-2">
                                            Filler Words Detected ({audioAnalysis.fillerWords.totalFillerWords})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {audioAnalysis.fillerWords.fillerWords.map((f, i) => (
                                                <span key={i} className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 text-xs">
                                                    &quot;{f.word}&quot; × {f.count}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Suggestions */}
                                {audioAnalysis.suggestions.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-gray-400 text-sm font-medium">Suggestions:</p>
                                        {audioAnalysis.suggestions.map((suggestion, i) => (
                                            <p key={i} className="text-gray-300 text-sm pl-3 border-l-2 border-blue-500/50">
                                                {suggestion}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!isLastQuestion && (
                        <p className="text-purple-400 text-sm mt-4 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Moving to next question...
                        </p>
                    )}
                </div>
            )}


            {/* Complete Button */}
            {allAnswered && (
                <div className="text-center">
                    <button
                        onClick={completeInterview}
                        disabled={completing}
                        className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                        {completing ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Final Feedback...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Complete Interview
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Question Progress */}
            <div className="flex gap-2 justify-center">
                {session.questions.map((q, index) => (
                    <div
                        key={q.id}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${index === currentQuestionIndex
                            ? 'bg-purple-500 text-white'
                            : q.userAnswer
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-white/10 text-gray-400'
                            }`}
                    >
                        {q.userAnswer ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                ))}
            </div>
        </div>
    );
}
