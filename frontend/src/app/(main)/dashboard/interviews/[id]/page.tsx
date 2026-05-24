'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Play, Send, Loader2, CheckCircle,
    MessageSquare, RefreshCw, Mic, Square, Pause, RotateCcw, Video, VideoOff, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import { useAudioRecorder, formatTime } from '@/hooks/useAudioRecorder';
import { useVideoRecorder, formatVideoTime } from '@/hooks/useVideoRecorder';
import AIDisclaimer from '@/components/ui/AIDisclaimer';


interface QuestionMetrics {
    clarity: number;
    relevance: number;
    confidence: number;
    wpm?: number;
    sentiment?: string;
}

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    userAnswer: string | null;
    score: number | null;
    feedback: string | null;
    metrics: QuestionMetrics | null;
    improvedAnswer: string | null;
    bankQuestionId?: string | null;
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
    cutoffScore?: number;
    questions: Question[];
}

// Normalize and validate UUID format
const normalizeUUID = (id: string | string[] | undefined): string | null => {
    if (!id || Array.isArray(id)) return null;
    // Replace spaces with hyphens and lowercase
    const normalized = id.replace(/\s+/g, '-').toLowerCase();
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(normalized) ? normalized : null;
};

export default function InterviewRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();

    // Normalize the session ID
    const sessionId = normalizeUUID(params.id);
    const [invalidId, setInvalidId] = useState(false);

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [lastFeedback, setLastFeedback] = useState<{ score: number; feedback: string } | null>(null);
    const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

    // Setup wizard state (used when session.status === 'PENDING')
    const [setupStep, setSetupStep] = useState(1);
    const [micStatus, setMicStatus] = useState<'idle' | 'ok' | 'error'>('idle');
    const [camStatus, setCamStatus] = useState<'idle' | 'ok' | 'error'>('idle');
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [wpm, setWpm] = useState(0);
    const [fillerCount, setFillerCount] = useState(0);
    const [isWarmupListening, setIsWarmupListening] = useState(false);
    const warmupRecognitionRef = useRef<any>(null);
    const warmupStartRef = useRef<number>(0);

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
        error: recordingError } = useAudioRecorder({ maxDuration: 180 }); // 3 min max

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
        error: videoRecordingError } = useVideoRecorder({ maxDuration: 180 }); // 3 min max

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
        if (!sessionId) {
            setInvalidId(true);
            setLoading(false);
            return;
        }
        try {
            const response = await authFetch(`/interviews/sessions/${sessionId}`);
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
    }, [sessionId, user]);

    useEffect(() => {
        if (user && sessionId) {
            fetchSession();
        } else if (!sessionId && params.id) {
            setInvalidId(true);
            setLoading(false);
        }
    }, [user, sessionId, params.id, fetchSession]);

    const checkDevices = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setMicStatus('ok');
            setCamStatus('ok');
        } catch {
            setMicStatus('error');
            setCamStatus('error');
        }
    }, []);

    useEffect(() => {
        if (session?.status === 'PENDING' && setupStep === 1) checkDevices();
    }, [session?.status, setupStep, checkDevices]);

    const startWarmup = useCallback(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        warmupStartRef.current = Date.now();
        setWpm(0);
        setFillerCount(0);
        setIsWarmupListening(true);
        rec.onresult = (event: any) => {
            let full = '';
            for (let i = 0; i < event.results.length; i++) full += event.results[i][0].transcript;
            const words = full.trim().split(/\s+/).filter(Boolean);
            const elapsed = (Date.now() - warmupStartRef.current) / 60000;
            if (elapsed > 0.05) setWpm(Math.round(words.length / elapsed));
            const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'literally'];
            setFillerCount(fillers.filter(f => full.toLowerCase().includes(f)).length);
        };
        rec.start();
        warmupRecognitionRef.current = rec;
    }, []);

    const stopWarmup = useCallback(() => {
        warmupRecognitionRef.current?.stop();
        setIsWarmupListening(false);
    }, []);

    useEffect(() => {
        if (session?.status === 'PENDING') {
            if (setupStep === 2) startWarmup();
            else stopWarmup();
        }
    }, [session?.status, setupStep, startWarmup, stopWarmup]);

    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
            warmupRecognitionRef.current?.stop();
        };
    }, []);

    const startInterview = async () => {
        if (!sessionId) return;
        setStarting(true);
        streamRef.current?.getTracks().forEach(t => t.stop());
        warmupRecognitionRef.current?.stop();
        try {
            const response = await authFetch(`/interviews/sessions/${sessionId}/start`, {
                method: 'POST'
            });
            if (response.ok) {
                // Route based on interview type
                if (session?.type === 'HR' || session?.type === 'BEHAVIORAL') {
                    router.push(`/dashboard/interviews/${sessionId}/hr-room`);
                } else if (session?.type === 'MIXED') {
                    router.push(`/dashboard/interviews/${sessionId}/mixed-room`);
                } else {
                    // TECHNICAL and other types
                    router.push(`/dashboard/interviews/${sessionId}/room`);
                }
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

            const response = await authFetch(`/interviews/sessions/${sessionId}/answer/audio`, {
                method: 'POST',
                body: formData
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
                        feedback: data.data.evaluation?.feedback
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

            const response = await authFetch(`/interviews/sessions/${sessionId}/answer/video`, {
                method: 'POST',
                body: formData
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
                        feedback: data.data.evaluation?.feedback || data.data.note
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
            const response = await authFetch(`/interviews/sessions/${sessionId}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    questionId: question.id,
                    answer: currentAnswer
                })
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
                        feedback: data.data.evaluation.feedback
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
        if (!sessionId) return;
        setCompleting(true);
        try {
            const response = await authFetch(`/interviews/sessions/${sessionId}/complete`, {
                method: 'POST'
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
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (invalidId) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Invalid Session ID</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">The interview session URL appears to be malformed or corrupted.</p>
                <Link href="/dashboard/interviews" className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition inline-block">
                    Return to Interviews
                </Link>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Session Not Found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">This interview session may have been deleted or does not exist.</p>
                <Link href="/dashboard/interviews" className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition inline-block">
                    Return to Interviews
                </Link>
            </div>
        );
    }

    // Completed interview view — Session Summary
    if (session.status === 'COMPLETED') {
        const questionsWithMetrics = session.questions.filter(q => q.metrics);
        const avgClarity = questionsWithMetrics.length > 0
            ? Math.round(questionsWithMetrics.reduce((sum, q) => sum + (q.metrics?.clarity || 0), 0) / questionsWithMetrics.length)
            : 70;
        const avgRelevance = questionsWithMetrics.length > 0
            ? Math.round(questionsWithMetrics.reduce((sum, q) => sum + (q.metrics?.relevance || 0), 0) / questionsWithMetrics.length)
            : 70;
        const avgConfidence = questionsWithMetrics.length > 0
            ? Math.round(questionsWithMetrics.reduce((sum, q) => sum + (q.metrics?.confidence || 0), 0) / questionsWithMetrics.length)
            : 70;
        const avgWpm = questionsWithMetrics.filter(q => q.metrics?.wpm).length > 0
            ? Math.round(questionsWithMetrics.reduce((sum, q) => sum + (q.metrics?.wpm || 0), 0) / questionsWithMetrics.filter(q => q.metrics?.wpm).length)
            : 0;

        const overallScore = session.overallScore
            ?? Math.round(session.questions.reduce((s, q) => s + (q.score || 0), 0) / (session.questions.length || 1));
        const commScore = Math.round(avgConfidence * 0.45 + avgClarity * 0.35 + avgRelevance * 0.2);
        const techScore = Math.round(avgRelevance * 0.45 + avgClarity * 0.35 + avgConfidence * 0.2);

        const overallVerdict = overallScore >= 80 ? 'Excellent' : overallScore >= 65 ? 'Strong' : overallScore >= 50 ? 'Good' : 'Needs Work';
        const overallVerdictColor = overallScore >= 80 ? '#10b981' : overallScore >= 65 ? '#0d9488' : overallScore >= 50 ? '#f59e0b' : '#ef4444';

        const durationMs = session.completedAt && session.startedAt
            ? new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime() : null;
        const durationStr = durationMs
            ? `${Math.floor(durationMs / 60000)} min ${Math.floor((durationMs % 60000) / 1000)} sec` : null;

        const weakAreas: string[] = [];
        session.questions.forEach(q => {
            if ((q.score || 0) < 65) {
                const area = q.questionType === 'technical' ? 'Technical Concepts'
                    : q.questionType === 'behavioral' ? 'STAR Method'
                    : q.questionType === 'hr' ? 'Self-Awareness'
                    : 'Depth & Trade-offs';
                if (!weakAreas.includes(area)) weakAreas.push(area);
            }
        });

        const MAX_BAR_H = 130;
        const barGradient = (score: number) =>
            score >= 75 ? 'linear-gradient(to top, #10b981, rgba(16,185,129,0.6))'
            : score >= 50 ? 'linear-gradient(to top, #f59e0b, rgba(245,158,11,0.6))'
            : 'linear-gradient(to top, #ef4444, rgba(239,68,68,0.55))';
        const barTextCol = (score: number) =>
            score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f87171';

        const selectedQ = session.questions[selectedQuestionIndex];

        return (
            <div style={{ background: 'radial-gradient(ellipse at 70% 0%, rgba(13,148,136,0.06) 0%, transparent 55%)', minHeight: '100vh', margin: '-24px -32px', padding: '32px', fontFamily: "'DM Sans', sans-serif", color: 'white' }}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
                    @keyframes cs4BarRise { from { height: 0; opacity: 0; } to { opacity: 1; } }
                    @keyframes cs4Count { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
                    @keyframes cs4Live { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
                    .cs4-bar { animation: cs4BarRise 0.9s cubic-bezier(0.16,1,0.3,1) forwards; }
                    .cs4-count { animation: cs4Count 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
                    .cs4-live { animation: cs4Live 1.4s ease-in-out infinite; }
                    .cs4-glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); }
                `}</style>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 32 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <Link href="/dashboard/interviews" style={{ color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, textDecoration: 'none' }}>
                                <ArrowLeft style={{ width: 14, height: 14 }} /> Interviews
                            </Link>
                            <span style={{ color: '#374151' }}>›</span>
                            <span style={{ padding: '3px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 12, fontWeight: 600, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <span className="cs4-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
                                Interview Complete
                            </span>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                                {session.targetRole} · {session.type} · {session.difficulty}
                            </span>
                        </div>
                        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 30, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>Session Summary</h1>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                            {durationStr ? `Completed in ${durationStr} · ` : ''}{session.questions.length} questions answered
                        </p>
                        <AIDisclaimer className="mt-4" />
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        <button style={{ padding: '10px 18px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'DM Sans, sans-serif' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download PDF
                        </button>
                        <button onClick={() => router.push('/dashboard/interviews')} style={{ padding: '10px 18px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 16px rgba(37,99,235,0.3)', fontFamily: 'DM Sans, sans-serif' }}>
                            <RefreshCw style={{ width: 13, height: 13 }} /> Retry Weak Questions
                        </button>
                    </div>
                </div>

                {/* ── 3-metric row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>

                    {/* Overall Score */}
                    <div className="cs4-glass" style={{ borderRadius: 22, padding: 28, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #2563eb, #0d9488)' }} />
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Overall Score</div>
                        <div className="cs4-count" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 56, fontWeight: 800, lineHeight: 1, color: 'white' }}>{overallScore}</span>
                            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)', paddingBottom: 8 }}>/100</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                <div style={{ width: `${overallScore}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #0d9488)', borderRadius: 2, transition: 'width 1.2s ease' }} />
                            </div>
                            <span style={{ fontSize: 12, color: overallVerdictColor, fontWeight: 600 }}>{overallVerdict}</span>
                        </div>
                        {session.cutoffScore && (
                            <div style={{ marginTop: 12, padding: '6px 12px', borderRadius: 8, background: overallScore >= session.cutoffScore ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${overallScore >= session.cutoffScore ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Cutoff {session.cutoffScore}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: overallScore >= session.cutoffScore ? '#10b981' : '#f87171' }}>{overallScore >= session.cutoffScore ? 'PASSED' : 'NOT PASSED'}</span>
                            </div>
                        )}
                    </div>

                    {/* Communication */}
                    <div className="cs4-glass" style={{ borderRadius: 22, padding: 28 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Communication</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
                            <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 56, fontWeight: 800, lineHeight: 1, color: 'white' }}>{commScore}</span>
                            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)', paddingBottom: 8 }}>/100</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { label: 'Speaking pace', value: avgWpm > 0 ? `✓ ${avgWpm} avg WPM` : '— not measured', good: avgWpm >= 100 && avgWpm <= 160 },
                                { label: 'Confidence', value: `${avgConfidence >= 70 ? '✓' : '↑'} ${avgConfidence}/100`, good: avgConfidence >= 70 },
                                { label: 'Clarity', value: `${avgClarity >= 70 ? '✓' : '↑'} ${avgClarity}/100`, good: avgClarity >= 70 },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
                                    <span style={{ color: row.good ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Technical Depth */}
                    <div className="cs4-glass" style={{ borderRadius: 22, padding: 28 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Technical Depth</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
                            <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 56, fontWeight: 800, lineHeight: 1, color: 'white' }}>{techScore}</span>
                            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)', paddingBottom: 8 }}>/100</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { label: 'Core concepts', value: `${avgRelevance}/100`, good: avgRelevance >= 70 },
                                { label: 'Depth & trade-offs', value: `${avgClarity}/100`, good: avgClarity >= 70 },
                                { label: 'Examples used', value: `${Math.round(avgConfidence * 0.7)}/100`, good: avgConfidence >= 65 },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
                                    <span style={{ color: row.good ? '#10b981' : row.value.startsWith('4') || row.value.startsWith('3') ? '#f87171' : '#f59e0b', fontWeight: 600 }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Main 2-col: Bar chart + Sidebar ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start', marginBottom: 24 }}>
                    <div>
                        {/* Bar chart */}
                        <div className="cs4-glass" style={{ borderRadius: 22, padding: 28, marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700 }}>Question Scores</div>
                                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                                    {([['#10b981', 'Good (≥75)'], ['#f59e0b', 'Fair (50–74)'], ['#f87171', 'Needs work']] as [string, string][]).map(([c, l]) => (
                                        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{l}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 140, padding: '0 8px' }}>
                                {session.questions.map((q, i) => {
                                    const sc = q.score || 0;
                                    const h = Math.max(4, Math.round((sc / 100) * MAX_BAR_H));
                                    return (
                                        <div key={q.id} onClick={() => setSelectedQuestionIndex(i)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 600, color: barTextCol(sc) }}>{sc}</span>
                                            <div className="cs4-bar" style={{ width: '100%', borderRadius: '6px 6px 0 0', background: barGradient(sc), height: h, animationDelay: `${i * 0.06}s`, outline: i === selectedQuestionIndex ? '1.5px solid rgba(255,255,255,0.3)' : 'none' }} />
                                            <span style={{ fontSize: 11, color: i === selectedQuestionIndex ? '#93c5fd' : 'rgba(255,255,255,0.35)', fontWeight: i === selectedQuestionIndex ? 600 : 400 }}>Q{i + 1}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>Tap any bar to review that question&apos;s feedback</div>
                        </div>

                        {/* Weak area tags */}
                        <div className="cs4-glass" style={{ borderRadius: 18, padding: 22 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Practice these next</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {(weakAreas.length > 0 ? weakAreas : ['Concrete Examples', 'Depth & Trade-offs']).map((area, i) => (
                                    <span key={area} style={{ padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500, background: i % 2 === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)', border: i % 2 === 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)', color: i % 2 === 0 ? 'rgba(239,68,68,0.9)' : '#f59e0b' }}>{area} →</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="cs4-glass" style={{ borderRadius: 18, padding: 22 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>What to study next</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.12)', ibg: 'rgba(239,68,68,0.15)', emoji: '🖥️', title: 'System Design Patterns', sub: 'Rate limiting, caching, load balancing' },
                                    { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.12)', ibg: 'rgba(245,158,11,0.15)', emoji: '⭐', title: 'STAR Method Practice', sub: 'Quantify outcomes in every answer' },
                                    { bg: 'rgba(37,99,235,0.07)', border: 'rgba(37,99,235,0.12)', ibg: 'rgba(37,99,235,0.15)', emoji: '📈', title: 'Failure Mode Analysis', sub: 'What happens when things break?' },
                                ].map(item => (
                                    <div key={item.title} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 12, cursor: 'pointer', background: item.bg, border: `1px solid ${item.border}` }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: item.ibg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{item.emoji}</div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{item.title}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Share Result</button>
                            <button onClick={() => router.push('/dashboard/interviews')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>New Interview</button>
                        </div>
                    </div>
                </div>

                {/* ── Selected Question Detail ── */}
                {selectedQ && (
                    <div className="cs4-glass" style={{ borderRadius: 22, padding: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700 }}>Q{selectedQuestionIndex + 1} Feedback</div>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)', color: '#93c5fd' }}>{selectedQ.questionType}</span>
                            <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 700, color: barTextCol(selectedQ.score || 0) }}>{selectedQ.score || 0}/100</span>
                        </div>

                        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 12, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)' }}>
                            <p style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0, lineHeight: 1.6 }}>{selectedQ.questionText}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <p style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your Answer</p>
                                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 100 }}>
                                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>{selectedQ.userAnswer || 'No answer recorded'}</p>
                                </div>
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Model Answer</p>
                                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)', minHeight: 100 }}>
                                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0 }}>
                                        {selectedQ.improvedAnswer || 'A well-structured response includes specific examples, demonstrates clear methodology, and shows awareness of best practices.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {selectedQ.feedback && (
                            <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 16 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>💡 AI Coach</p>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: 0 }}>{selectedQ.feedback}</p>
                            </div>
                        )}

                        {selectedQ.metrics && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                                {([['Clarity', selectedQ.metrics.clarity], ['Relevance', selectedQ.metrics.relevance], ['Confidence', selectedQ.metrics.confidence]] as [string, number | undefined][]).map(([label, val]) => (
                                    <div key={label} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                        <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 700, margin: 0, color: (val || 0) >= 70 ? '#10b981' : (val || 0) >= 50 ? '#f59e0b' : '#f87171' }}>{val || 0}</p>
                                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 8 }}>
                                            <div style={{ width: `${val || 0}%`, height: '100%', background: (val || 0) >= 70 ? '#10b981' : (val || 0) >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 2 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button onClick={() => setSelectedQuestionIndex(Math.max(0, selectedQuestionIndex - 1))} disabled={selectedQuestionIndex === 0} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: selectedQuestionIndex === 0 ? '#374151' : 'rgba(255,255,255,0.6)', fontSize: 13, cursor: selectedQuestionIndex === 0 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>← Previous</button>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {session.questions.map((q, i) => (
                                    <button key={i} onClick={() => setSelectedQuestionIndex(i)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: i === selectedQuestionIndex ? '#2563eb' : (q.score || 0) >= 75 ? 'rgba(16,185,129,0.2)' : (q.score || 0) >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: i === selectedQuestionIndex ? 'white' : barTextCol(q.score || 0) }}>{i + 1}</button>
                                ))}
                            </div>
                            <button onClick={() => setSelectedQuestionIndex(Math.min(session.questions.length - 1, selectedQuestionIndex + 1))} disabled={selectedQuestionIndex === session.questions.length - 1} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: selectedQuestionIndex === session.questions.length - 1 ? '#374151' : 'rgba(255,255,255,0.6)', fontSize: 13, cursor: selectedQuestionIndex === session.questions.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Next →</button>
                        </div>
                    </div>
                )}
                </div>
            </div>
        );
    }

    // Pending interview — 3-step setup wizard
    if (session.status === 'PENDING') {
        const qCount = session.questions?.length || (session.difficulty === 'EASY' ? 5 : session.difficulty === 'MEDIUM' ? 7 : 10);
        const diffColor = session.difficulty === 'EASY' ? '#10B981' : session.difficulty === 'HARD' ? '#EF4444' : '#F59E0B';
        const estMinutes = qCount * 3;

        const WARMUP_PHRASE = "I'm a full-stack developer with experience building scalable APIs and modern web applications.";
        const wpmColor = wpm === 0 ? 'rgba(255,255,255,.4)' : wpm >= 120 && wpm <= 160 ? '#2DD4BF' : '#F59E0B';
        const wpmLabel = wpm === 0 ? '—' : wpm >= 120 && wpm <= 160 ? '✓ Ideal pace' : wpm < 120 ? '↑ Speak faster' : '↓ Slow down';
        const clarityScore = wpm === 0 ? null : Math.max(50, Math.min(100, 100 - fillerCount * 8 - (wpm > 165 ? 12 : 0) - (wpm < 100 ? 15 : 0)));
        const clarityColor = clarityScore === null ? 'rgba(255,255,255,.4)' : clarityScore >= 80 ? '#2DD4BF' : '#F59E0B';
        const clarityFeedback = clarityScore === null ? 'Start speaking' : clarityScore >= 80 ? '✓ Clear' : '↑ Enunciate more';

        const MB_CLASSES = ['sw-mb1','sw-mb2','sw-mb3','sw-mb4','sw-mb5','sw-mb6','sw-mb7','sw-mb8','sw-mb9','sw-mb10','sw-mb11','sw-mb12'];

        return (
            <>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
                    @keyframes sw-mb1{0%,100%{height:5px}50%{height:26px}}
                    @keyframes sw-mb2{0%,100%{height:16px}50%{height:7px}}
                    @keyframes sw-mb3{0%,100%{height:22px}40%{height:6px}}
                    @keyframes sw-mb4{0%,100%{height:8px}60%{height:30px}}
                    @keyframes sw-mb5{0%,100%{height:18px}50%{height:6px}}
                    @keyframes sw-mb6{0%,100%{height:11px}45%{height:24px}}
                    @keyframes sw-mb7{0%,100%{height:20px}55%{height:8px}}
                    @keyframes sw-mb8{0%,100%{height:6px}50%{height:22px}}
                    @keyframes sw-mb9{0%,100%{height:14px}50%{height:28px}}
                    @keyframes sw-mb10{0%,100%{height:9px}50%{height:18px}}
                    @keyframes sw-mb11{0%,100%{height:20px}50%{height:5px}}
                    @keyframes sw-mb12{0%,100%{height:12px}50%{height:25px}}
                    .sw-mb1{animation:sw-mb1 .8s ease-in-out infinite}
                    .sw-mb2{animation:sw-mb2 .65s ease-in-out infinite .1s}
                    .sw-mb3{animation:sw-mb3 .9s ease-in-out infinite .2s}
                    .sw-mb4{animation:sw-mb4 .7s ease-in-out infinite .05s}
                    .sw-mb5{animation:sw-mb5 1s ease-in-out infinite .15s}
                    .sw-mb6{animation:sw-mb6 .75s ease-in-out infinite .25s}
                    .sw-mb7{animation:sw-mb7 .85s ease-in-out infinite .1s}
                    .sw-mb8{animation:sw-mb8 .6s ease-in-out infinite .3s}
                    .sw-mb9{animation:sw-mb9 .95s ease-in-out infinite .08s}
                    .sw-mb10{animation:sw-mb10 .78s ease-in-out infinite .18s}
                    .sw-mb11{animation:sw-mb11 .68s ease-in-out infinite .22s}
                    .sw-mb12{animation:sw-mb12 .88s ease-in-out infinite .12s}
                    @keyframes sw-live{0%,100%{opacity:1}50%{opacity:.3}}
                    .sw-live{animation:sw-live 1.4s ease-in-out infinite}
                    @keyframes sw-fadeup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
                    .sw-fadeup{animation:sw-fadeup .45s ease forwards}
                    .sw-glass{background:rgba(255,255,255,.04);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.07)}
                    .sw-sora{font-family:'Sora',sans-serif}
                    .sw-mono{font-family:'DM Mono',monospace}
                `}</style>

                <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%,rgba(37,99,235,.08) 0%,transparent 65%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'DM Sans',sans-serif", color: '#fff', margin: '-24px -32px' }}>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48, width: '100%', maxWidth: 480 }}>
                        {[{n:1,label:'Device Check'},{n:2,label:'Warm-up'},{n:3,label:'Interview Brief'}].map((s, i) => (
                            <React.Fragment key={s.n}>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: s.n < setupStep ? 'pointer' : 'default' }} onClick={() => s.n < setupStep && setSetupStep(s.n)}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: '50%',
                                        background: setupStep >= s.n ? '#2563EB' : 'rgba(255,255,255,.07)',
                                        border: setupStep >= s.n ? 'none' : '1px solid rgba(255,255,255,.12)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 700,
                                        color: setupStep >= s.n ? '#fff' : 'rgba(255,255,255,.35)',
                                        transition: 'all .3s',
                                    }} className="sw-sora">{setupStep > s.n ? '✓' : s.n}</div>
                                    <span style={{
                                        position: 'absolute', top: 42, left: '50%', transform: 'translateX(-50%)',
                                        whiteSpace: 'nowrap', fontSize: 11, fontWeight: 500,
                                        color: setupStep >= s.n ? '#3B82F6' : 'rgba(255,255,255,.25)',
                                    }}>{s.label}</span>
                                </div>
                                {i < 2 && <div style={{ flex: 1, height: 1, margin: '0 4px', background: setupStep > s.n ? '#2563EB' : 'rgba(255,255,255,.08)', transition: 'all .4s' }} />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step content */}
                    <div style={{ width: '100%', maxWidth: 640 }}>

                        {/* ── STEP 1: Device Check ── */}
                        {setupStep === 1 && (
                            <div className="sw-fadeup">
                                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                                    <h1 className="sw-sora" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Check your setup</h1>
                                    <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 15 }}>Make sure your devices are working before we start</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    {/* Mic */}
                                    <div className="sw-glass" style={{ borderRadius: 20, padding: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(13,148,136,.15)', border: '1px solid rgba(13,148,136,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>Microphone</div>
                                                <div style={{ fontSize: 11, color: micStatus === 'ok' ? '#2DD4BF' : micStatus === 'error' ? '#EF4444' : 'rgba(255,255,255,.4)' }}>
                                                    {micStatus === 'ok' ? '● Clear signal' : micStatus === 'error' ? '● Not detected' : '● Checking...'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36, padding: '0 4px' }}>
                                            {MB_CLASSES.map(cls => (
                                                <div key={cls} className={cls} style={{ width: '100%', borderRadius: 2, background: 'linear-gradient(to top,#0D9488,#2DD4BF)', minHeight: 3 }} />
                                            ))}
                                        </div>
                                        <div className="sw-mono" style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Input level: good</div>
                                    </div>

                                    {/* Camera */}
                                    <div className="sw-glass" style={{ borderRadius: 20, padding: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,.15)', border: '1px solid rgba(37,99,235,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>Camera</div>
                                                <div style={{ fontSize: 11, color: camStatus === 'ok' ? '#60A5FA' : camStatus === 'error' ? '#EF4444' : 'rgba(255,255,255,.4)' }}>
                                                    {camStatus === 'ok' ? '● Detected' : camStatus === 'error' ? '● Not detected' : '● Checking...'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ borderRadius: 12, overflow: 'hidden', background: '#1a2332', aspectRatio: '16/9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <video ref={videoRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: camStatus === 'ok' ? 1 : 0 }} autoPlay muted playsInline />
                                            {camStatus !== 'ok' && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                                            {camStatus === 'ok' && (
                                                <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,.8)', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span className="sw-live" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                                                    <span className="sw-mono">LIVE</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Lighting row */}
                                <div className="sw-glass" style={{ borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Lighting</div>
                                        <div style={{ fontSize: 12, color: 'rgba(245,158,11,.8)' }}>Move to a brighter area or face a window for best results</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                                    </div>
                                </div>

                                <button onClick={() => setSetupStep(2)} style={{ width: '100%', padding: 15, borderRadius: 14, background: 'linear-gradient(135deg,#2563EB,#1d4ed8)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} className="sw-sora">
                                    Looks good — Continue
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </button>
                            </div>
                        )}

                        {/* ── STEP 2: Warm-up ── */}
                        {setupStep === 2 && (
                            <div className="sw-fadeup">
                                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                                    <h1 className="sw-sora" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Quick warm-up</h1>
                                    <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 15 }}>Read this phrase aloud to calibrate your pacing</p>
                                </div>

                                <div className="sw-glass" style={{ borderRadius: 20, padding: 32, marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#2563EB,#0D9488)' }} />
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.35)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 20 }}>Say this phrase aloud</div>
                                    <blockquote className="sw-sora" style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.6, color: 'rgba(255,255,255,.9)', fontStyle: 'italic' }}>
                                        &ldquo;{WARMUP_PHRASE}&rdquo;
                                    </blockquote>
                                    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24 }}>
                                            {['sw-mb3','sw-mb7','sw-mb1','sw-mb5','sw-mb9','sw-mb2'].map(cls => (
                                                <div key={cls} className={cls} style={{ width: 3, borderRadius: 2, background: '#14B8A6', minHeight: 2 }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{isWarmupListening ? 'Listening...' : 'Microphone ready'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
                                    <div className="sw-glass" style={{ borderRadius: 14, padding: 16, textAlign: 'center' }}>
                                        <div className="sw-mono" style={{ fontSize: 26, fontWeight: 500, color: wpmColor }}>{wpm || '—'}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>WPM</div>
                                        <div style={{ fontSize: 10, color: wpmColor, marginTop: 2 }}>{wpm ? wpmLabel : 'Start speaking'}</div>
                                    </div>
                                    <div className="sw-glass" style={{ borderRadius: 14, padding: 16, textAlign: 'center' }}>
                                        <div className="sw-mono" style={{ fontSize: 26, fontWeight: 500, color: fillerCount === 0 ? '#2DD4BF' : '#F59E0B' }}>{fillerCount}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>Filler words</div>
                                        <div style={{ fontSize: 10, color: fillerCount === 0 ? '#2DD4BF' : '#F59E0B', marginTop: 2 }}>{fillerCount === 0 ? '✓ Clean' : '↓ Watch "um/uh"'}</div>
                                    </div>
                                    <div className="sw-glass" style={{ borderRadius: 14, padding: 16, textAlign: 'center' }}>
                                        <div className="sw-mono" style={{ fontSize: 26, fontWeight: 500, color: clarityColor }}>{clarityScore ?? '—'}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>Clarity</div>
                                        <div style={{ fontSize: 10, color: clarityColor, marginTop: 2 }}>{clarityFeedback}</div>
                                    </div>
                                </div>

                                <button onClick={() => setSetupStep(3)} style={{ width: '100%', padding: 15, borderRadius: 14, background: 'linear-gradient(135deg,#2563EB,#1d4ed8)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} className="sw-sora">
                                    Continue to Interview Brief
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </button>
                            </div>
                        )}

                        {/* ── STEP 3: Interview Brief ── */}
                        {setupStep === 3 && (
                            <div className="sw-fadeup">
                                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                    <h1 className="sw-sora" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>You&apos;re almost ready</h1>
                                    <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 15 }}>Here&apos;s what to expect in your session</p>
                                </div>

                                <div className="sw-glass" style={{ borderRadius: 20, padding: 28, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#2563EB,#0D9488)' }} />
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Role</div>
                                            <div className="sw-sora" style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{session.targetRole}</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(37,99,235,.15)', border: '1px solid rgba(37,99,235,.25)', fontSize: 12, fontWeight: 500, color: '#60A5FA' }}>
                                                    {session.type.charAt(0) + session.type.slice(1).toLowerCase()}
                                                </span>
                                                <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(13,148,136,.15)', border: '1px solid rgba(13,148,136,.25)', fontSize: 12, fontWeight: 500, color: '#2DD4BF' }}>
                                                    {qCount} Questions
                                                </span>
                                                <span style={{ padding: '5px 12px', borderRadius: 20, background: `${diffColor}18`, border: `1px solid ${diffColor}30`, fontSize: 12, fontWeight: 500, color: diffColor }}>
                                                    {session.difficulty.charAt(0) + session.difficulty.slice(1).toLowerCase()}
                                                </span>
                                                <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.6)' }}>
                                                    3 min / question
                                                </span>
                                                {session.cutoffScore && (
                                                    <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', fontSize: 12, fontWeight: 500, color: '#F59E0B' }}>
                                                        Target: {session.cutoffScore}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 4 }}>Estimated time</div>
                                            <div className="sw-mono" style={{ fontSize: 28, fontWeight: 500, color: '#60A5FA' }}>~{estMinutes}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>minutes</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderRadius: 16, padding: '18px 22px', background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.15)', display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 28 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#10B981', marginBottom: 4 }}>Coach tip</div>
                                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>Take 5–7 seconds to think before answering. Silence is natural and expected. Structure your answer as: context → what you did → result.</div>
                                    </div>
                                </div>

                                <button
                                    onClick={startInterview}
                                    disabled={starting}
                                    style={{
                                        width: '100%', padding: 16, borderRadius: 14,
                                        background: starting ? 'rgba(37,99,235,.4)' : 'linear-gradient(135deg,#2563EB,#1d4ed8)',
                                        border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
                                        cursor: starting ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        boxShadow: starting ? 'none' : '0 8px 32px rgba(37,99,235,.35)',
                                        opacity: starting ? .7 : 1, transition: 'all .3s',
                                    }} className="sw-sora"
                                >
                                    {starting ? (
                                        <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> Generating Questions...</>
                                    ) : (
                                        <><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> I&apos;m Ready — Start Interview</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </>
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
                    <Link href="/dashboard/interviews" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{session.type} Interview</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{session.targetRole}</p>
                    </div>
                </div>
                {session.cutoffScore && (
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-[10px] text-gray-500 uppercase font-black">Target</span>
                        <span className="text-lg font-black text-amber-500">{session.cutoffScore}%</span>
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400">
                        Question {currentQuestionIndex + 1} of {session.questions.length}
                    </span>
                    <div className="w-32 h-2 rounded-full bg-gray-100 dark:bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all"
                            style={{ width: `${(answeredCount / session.questions.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Question Card */}
            {currentQuestion && !currentQuestion.userAnswer && (
                <div className="p-6 rounded-2xl glass">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-indigo-400 text-sm">
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
                    <p className="text-xl text-gray-900 dark:text-white mb-6">{currentQuestion.questionText}</p>

                    {/* Text Input (default or TEXT format) */}
                    {(!session.format || session.format === 'TEXT') && (
                        <>
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                rows={6}
                                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                            />
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={submitAnswer}
                                    disabled={submitting || !currentAnswer.trim()}
                                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
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
                            <div className="p-6 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                {!isRecording && !audioBlob && (
                                    <div className="text-center">
                                        <button
                                            onClick={startRecording}
                                            className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto hover:opacity-90 transition shadow-lg shadow-blue-500/25"
                                        >
                                            <Mic className="w-8 h-8 text-white" />
                                        </button>
                                        <p className="text-gray-500 dark:text-gray-400 mt-4">Click to start recording your answer</p>
                                        <p className="text-gray-500 text-sm mt-1">Max 3 minutes</p>
                                    </div>
                                )}

                                {isRecording && (
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mx-auto animate-pulse">
                                            <div className="w-4 h-4 rounded-full bg-white" />
                                        </div>
                                        <p className="text-gray-900 dark:text-white text-2xl font-bold mt-4">{formatTime(recordingTime)}</p>
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
                                            <p className="text-gray-900 dark:text-white font-medium">Recording Complete</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">{formatTime(recordingTime)} recorded</p>
                                        </div>
                                        <audio src={audioUrl} controls className="w-full" />
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={resetRecording}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
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
                            <div className="p-6 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                {/* Camera preview */}
                                <div className="relative aspect-video bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden mb-4">
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
                                        <p className="text-gray-500 dark:text-gray-400 mt-4">Click to start recording your answer</p>
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
                                            <p className="text-gray-900 dark:text-white font-medium">Recording Complete</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">{formatVideoTime(videoRecordingTime)} recorded</p>
                                        </div>
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => {
                                                    resetVideoRecording();
                                                    startPreview();
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
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
                <div className="p-6 rounded-2xl glass border border-indigo-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Answer Feedback</h3>
                        <span className={`text-2xl font-bold ${getScoreColor(lastFeedback.score)}`}>
                            {lastFeedback.score}/100
                        </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{lastFeedback.feedback}</p>

                    {/* Audio Analysis Results */}
                    {audioAnalysis && (
                        <div className="mt-6 space-y-4">
                            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                                <h4 className="text-gray-900 dark:text-white font-medium mb-3 flex items-center gap-2">
                                    <Mic className="w-4 h-4 text-blue-400" />
                                    Speech Analysis
                                </h4>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="p-3 rounded-lg bg-white dark:bg-white/5">
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">Clarity Score</p>
                                        <p className={`text-xl font-bold ${audioAnalysis.clarityScore >= 80 ? 'text-green-400' :
                                            audioAnalysis.clarityScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                            {audioAnalysis.clarityScore}%
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white dark:bg-white/5">
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">Words/Min</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            {audioAnalysis.speakingPace.wordsPerMinute}
                                        </p>
                                        <p className={`text-xs ${audioAnalysis.speakingPace.rating === 'good' ? 'text-green-400' : 'text-yellow-400'
                                            }`}>
                                            ({audioAnalysis.speakingPace.rating})
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white dark:bg-white/5">
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">Confidence</p>
                                        <p className={`text-xl font-bold ${audioAnalysis.confidenceIndicators.overallConfidence >= 70 ? 'text-green-400' :
                                            audioAnalysis.confidenceIndicators.overallConfidence >= 50 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                            {audioAnalysis.confidenceIndicators.overallConfidence}%
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white dark:bg-white/5">
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">Duration</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
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
                                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Suggestions:</p>
                                        {audioAnalysis.suggestions.map((suggestion, i) => (
                                            <p key={i} className="text-gray-600 dark:text-gray-300 text-sm pl-3 border-l-2 border-blue-500/50">
                                                {suggestion}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!isLastQuestion && (
                        <p className="text-indigo-400 text-sm mt-4 flex items-center gap-2">
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
                            ? 'bg-indigo-500 text-white'
                            : q.userAnswer
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {q.userAnswer ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                ))}
            </div>
        </div>
    );
}


