'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Mic, MicOff, Video as VideoIcon, VideoOff, Square, Loader2,
    Lightbulb, MessageSquare, ChevronRight, CheckCircle, Circle, X
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useVideoRecorder, formatVideoTime } from '@/hooks/useVideoRecorder';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useFaceAnalysis } from '@/hooks/use-face-analysis';

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    userAnswer: string | null;
    score: number | null;
    feedback: string | null;
    orderIndex: number;
}

interface InterviewSession {
    id: string;
    type: string;
    targetRole: string;
    difficulty: string;
    status: string;
    overallScore: number | null;
    feedback: string | null;
    startedAt: string | null;
    completedAt: string | null;
    questions: Question[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// HR/Behavioral keywords to detect
const HR_KEYWORDS = [
    'leadership', 'teamwork', 'conflict resolution', 'empathy',
    'communication', 'problem solving', 'adaptability', 'collaboration',
    'initiative', 'responsibility', 'decision making', 'time management'
];

// AI Interviewer avatars
const AI_INTERVIEWERS = [
    { name: 'Sarah', role: 'HR Manager', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' },
    { name: 'Maya', role: 'People Lead', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face' },
];

export default function HRInterviewRoomPage() {
    const { id } = useParams();
    const router = useRouter();
    const { accessToken } = useAuthStore();

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [transcript, setTranscript] = useState<string>('');
    const [detectedKeywords, setDetectedKeywords] = useState<Set<string>>(new Set());
    const [isMuted, setIsMuted] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Select HR-focused interviewer
    const [interviewer] = useState(() => AI_INTERVIEWERS[Math.floor(Math.random() * AI_INTERVIEWERS.length)]);

    // Video recording hook
    const {
        isRecording,
        recordingTime,
        videoBlob,
        previewStream,
        startPreview,
        stopPreview,
        startRecording,
        stopRecording,
        resetRecording,
    } = useVideoRecorder({ maxDuration: 180 });

    const videoPreviewRef = useRef<HTMLVideoElement>(null);

    // Client-side Analysis
    const speech = useSpeechRecognition();
    const faceAnalysis = useFaceAnalysis(videoPreviewRef);

    // Sync isRecording with Analysis
    useEffect(() => {
        if (isRecording) {
            speech.startListening();
            faceAnalysis.startAnalysis();
        } else {
            speech.stopListening();
            faceAnalysis.stopAnalysis();
        }
    }, [isRecording, speech, faceAnalysis]);

    // Sync Metrics and detect keywords
    useEffect(() => {
        if (isRecording && speech.transcript) {
            setTranscript(speech.transcript);

            // Detect HR keywords
            const detected = new Set<string>();
            const lowerTranscript = speech.transcript.toLowerCase();
            HR_KEYWORDS.forEach(keyword => {
                if (lowerTranscript.includes(keyword)) {
                    detected.add(keyword);
                }
            });
            setDetectedKeywords(detected);
        }
    }, [speech.transcript, isRecording]);

    // Handle video preview stream
    useEffect(() => {
        if (videoPreviewRef.current && previewStream) {
            videoPreviewRef.current.srcObject = previewStream;
        }
    }, [previewStream]);

    // Start preview when page loads
    useEffect(() => {
        startPreview();
        return () => stopPreview();
    }, [startPreview, stopPreview]);

    // Timer for session
    useEffect(() => {
        if (session?.startedAt && session.status === 'IN_PROGRESS') {
            const interval = setInterval(() => {
                const start = new Date(session.startedAt!);
                setElapsedTime(Math.floor((Date.now() - start.getTime()) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [session?.startedAt, session?.status]);

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

    const submitVideoAnswer = async () => {
        if (!session || !videoBlob) return;

        const question = session.questions[currentQuestionIndex];
        if (!question) return;

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('video', videoBlob, 'answer.webm');
            formData.append('questionId', question.id);
            formData.append('transcript', speech.transcript);
            formData.append('metrics', JSON.stringify({
                wpm: speech.wpm,
                eyeContactScore: faceAnalysis.metrics.eyeContactScore,
                sentiment: faceAnalysis.metrics.sentiment,
                detectedKeywords: Array.from(detectedKeywords)
            }));

            const response = await fetch(`${API_URL}/interviews/sessions/${id}/answer/video`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();

                // Update question with answer
                setSession(prev => {
                    if (!prev) return null;
                    const updatedQuestions = [...prev.questions];
                    updatedQuestions[currentQuestionIndex] = {
                        ...updatedQuestions[currentQuestionIndex],
                        userAnswer: data.data.audioAnalysis?.transcription || '[Video Answer]',
                        score: data.data.evaluation?.score || null,
                        feedback: data.data.evaluation?.feedback || null,
                    };
                    return { ...prev, questions: updatedQuestions };
                });

                resetRecording();
                speech.resetTranscript();
                setTranscript('');
                setDetectedKeywords(new Set());

                // Move to next question
                if (data.data.nextQuestion) {
                    setTimeout(() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                    }, 2000);
                } else if (data.data.isComplete) {
                    setTimeout(() => {
                        router.push(`/dashboard/interviews/${id}`);
                    }, 2000);
                }
            }
        } catch (err) {
            console.error('Failed to submit video answer:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const endSession = async () => {
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${id}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (response.ok) {
                router.push(`/dashboard/interviews/${id}`);
            }
        } catch (err) {
            console.error('Failed to end session:', err);
        }
    };

    const formatElapsedTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get tone label and color based on sentiment
    const getToneInfo = () => {
        const sentiment = faceAnalysis.metrics.sentiment;
        if (sentiment === 'confident') {
            return { label: 'Confident', position: 75, color: 'text-teal-400' };
        } else if (sentiment === 'nervous') {
            return { label: 'Timid', position: 25, color: 'text-yellow-400' };
        }
        return { label: 'Neutral', position: 50, color: 'text-gray-400' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Interview session not found</p>
                <Link href="/dashboard/interviews" className="text-teal-400 hover:underline mt-2 inline-block">
                    Back to Interviews
                </Link>
            </div>
        );
    }

    const currentQuestion = session.questions[currentQuestionIndex];
    const progress = {
        current: currentQuestionIndex + 1,
        total: session.questions.length,
        percentage: Math.round(((currentQuestionIndex + 1) / session.questions.length) * 100)
    };
    const toneInfo = getToneInfo();

    return (
        <div className="min-h-screen -m-6 lg:-m-8 bg-gray-50 dark:bg-[#0a0f14]">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/interviews" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Soft Skills & HR Scenarios</h1>
                            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-medium">
                                LIVE SESSION
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">Session #{session.id.slice(0, 8)} • Behavioral Competency Focus</p>
                    </div>
                </div>

                <button
                    onClick={endSession}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-white/20 transition"
                >
                    <X className="w-4 h-4" />
                    Exit Session
                </button>
            </header>

            <div className="flex h-[calc(100vh-80px)]">
                {/* Left side - Video Area */}
                <div className="flex-1 p-6 flex flex-col">
                    {/* Question Display */}
                    <div className="mb-4 p-6 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-teal-600 dark:text-teal-400 uppercase tracking-wider font-medium">
                                Question {progress.current} of {progress.total}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">{progress.percentage}% COMPLETE</span>
                                <div className="w-32 h-1.5 rounded-full bg-gray-200 dark:bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-teal-500 transition-all"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-900 dark:text-white text-xl font-medium leading-relaxed">
                            {currentQuestion?.questionText || 'Loading question...'}
                        </p>
                    </div>

                    {/* Video Feeds */}
                    <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
                        {/* User Camera */}
                        <div className="relative rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-900 border border-gray-200 dark:border-white/5">
                            {previewStream ? (
                                <video
                                    ref={videoPreviewRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <VideoOff className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500">Camera not available</p>
                                    </div>
                                </div>
                            )}
                            {isRecording && (
                                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    <span className="text-white text-xs font-medium">
                                        REC {formatVideoTime(recordingTime)}
                                    </span>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className="px-3 py-2 rounded-lg bg-white/80 dark:bg-black/50 backdrop-blur-sm">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">YOU</p>
                                    <p className="text-gray-900 dark:text-white font-medium">{session.targetRole} Candidate</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Interviewer */}
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1a2530] dark:to-[#0d1318] border border-gray-200 dark:border-white/5">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    {/* Glow effect */}
                                    <div className={`absolute -inset-4 bg-gradient-to-r from-teal-500/30 to-purple-500/30 rounded-full blur-xl ${isRecording ? 'animate-pulse' : ''}`} />

                                    {/* Avatar */}
                                    <div className={`relative w-40 h-40 rounded-full overflow-hidden border-4 ${isRecording ? 'border-teal-400' : 'border-teal-500/50'} shadow-lg shadow-teal-500/20`}>
                                        <img
                                            src={interviewer.avatar}
                                            alt={interviewer.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* AI Listening indicator */}
                                    {isRecording && (
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-teal-500 rounded-full">
                                            <div className="w-1.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                            <div className="w-1.5 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                            <span className="text-white text-xs font-medium ml-1">AI Listening...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className="px-3 py-2 rounded-lg bg-white/80 dark:bg-black/50 backdrop-blur-sm">
                                    <p className="text-xs text-teal-600 dark:text-teal-400">AI INTERVIEWER</p>
                                    <p className="text-gray-900 dark:text-white font-medium">{interviewer.name} ({interviewer.role})</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recording Controls */}
                    <div className="flex items-center justify-center gap-4 py-4">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'}`}
                        >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <button className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 flex items-center justify-center transition">
                            <VideoIcon className="w-5 h-5" />
                        </button>

                        <div className="w-px h-8 bg-gray-300 dark:bg-white/10" />

                        {!isRecording && !videoBlob && (
                            <button
                                onClick={startRecording}
                                className="w-14 h-14 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition shadow-lg shadow-teal-500/25"
                            >
                                <div className="w-5 h-5 rounded-full bg-white" />
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/25"
                            >
                                <Square className="w-5 h-5" />
                            </button>
                        )}

                        {videoBlob && !isRecording && (
                            <button
                                onClick={submitVideoAnswer}
                                disabled={submitting}
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                Submit Answer
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Panel - Analysis */}
                <div className="w-96 border-l border-gray-200 dark:border-white/5 p-6 flex flex-col gap-4 overflow-y-auto bg-gray-50 dark:bg-[#0d1117]">
                    {/* Tone Analysis */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Tone Analysis</span>
                            <span className={`text-xs font-medium ${toneInfo.color}`}>{toneInfo.label.toUpperCase()}</span>
                        </div>

                        {/* Tone Gauge */}
                        <div className="relative">
                            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-600 mb-2">
                                <span>TIMID</span>
                                <span>AGGRESSIVE</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-200 dark:bg-white/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-teal-500 to-red-500 opacity-30" />
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-gray-900 dark:bg-white rounded-full shadow-lg transition-all duration-300"
                                    style={{ left: `${toneInfo.position}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                            {faceAnalysis.metrics.isFaceDetected ?
                                `Your pace is steady (${speech.wpm || 0} wpm). Try to maintain this energy when discussing the resolution.` :
                                'Analyzing your tone and expression...'
                            }
                        </p>
                    </div>

                    {/* Keyword Check */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Keyword Check</span>
                            <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">{detectedKeywords.size}/{Math.min(HR_KEYWORDS.length, 5)} Detected</span>
                        </div>

                        <div className="space-y-2">
                            {['leadership', 'teamwork', 'conflict resolution', 'empathy'].map(keyword => {
                                const detected = detectedKeywords.has(keyword);
                                return (
                                    <div key={keyword} className="flex items-center gap-2">
                                        {detected ? (
                                            <CheckCircle className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                                        ) : (
                                            <Circle className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                                        )}
                                        <span className={`text-sm capitalize ${detected ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-gray-500'}`}>
                                            {keyword}
                                        </span>
                                        {detected && <span className="ml-auto text-xs text-teal-600 dark:text-teal-400">DETECTED</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* STAR Method Tip */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            <span className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider font-medium">STAR Method Tip</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                            Don't forget to emphasize the <span className="text-amber-600 dark:text-amber-400 font-medium">Result</span>. Quantify the impact of your leadership if possible.
                        </p>
                        <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                                <CheckCircle className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                                <span className="text-gray-600 dark:text-gray-400">Situation</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <CheckCircle className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                                <span className="text-gray-600 dark:text-gray-400">Task</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Circle className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                                <span className="text-gray-500">Action</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Circle className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                                <span className="text-gray-500">Result</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Transcript */}
                    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                            <span className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">Live Transcript</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {transcript || (
                                <p className="text-gray-500 dark:text-gray-600 italic">
                                    {isRecording ? 'Listening... transcript will appear here.' : 'Start recording to see live transcript.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
