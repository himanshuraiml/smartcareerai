'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Mic, MicOff, Video, VideoOff, Square, Loader2,
    Lightbulb, MessageSquare, ChevronRight, Monitor, Camera, AlertTriangle, CheckCircle, Shield
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useVideoRecorder, formatVideoTime } from '@/hooks/useVideoRecorder';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useFaceAnalysis } from '@/hooks/use-face-analysis';
import { useProctoring } from '@/hooks/useProctoring';


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

interface AIHint {
    hint: string;
    keyPoints: string[];
}

interface LiveAnalytics {
    progress: { current: number; total: number; answered: number };
    techAccuracy: { score: number; label: string };
    currentQuestion: { id: string; text: string; type: string; index: number } | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Normalize and validate UUID format
const normalizeUUID = (id: string | string[] | undefined): string | null => {
    if (!id || Array.isArray(id)) return null;
    // Replace spaces with hyphens and lowercase
    const normalized = id.replace(/\s+/g, '-').toLowerCase();
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(normalized) ? normalized : null;
};

// AI Interviewer avatars - Technical interviewers only (no HR)
const AI_INTERVIEWERS = [
    { name: 'Sarah', role: 'Lead Engineer', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face', gender: 'female' },
    { name: 'Alex', role: 'Tech Lead', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', gender: 'male' },
    { name: 'Priya', role: 'Senior Architect', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face', gender: 'female' },
    { name: 'James', role: 'Staff Engineer', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', gender: 'male' },
];

// Text-to-speech function
const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
    }
};

export default function InterviewRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { accessToken } = useAuthStore();

    // Normalize the session ID
    const sessionId = normalizeUUID(params.id);
    const [invalidId, setInvalidId] = useState(false);

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [aiHint, setAiHint] = useState<AIHint | null>(null);
    const [loadingHint, setLoadingHint] = useState(false);
    const [analytics, setAnalytics] = useState<LiveAnalytics | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const [sentiment, setSentiment] = useState<{ type: string; label: string }>({ type: 'neutral', label: 'Neutral' });
    const [speechPacing, setSpeechPacing] = useState<{ wpm: number; label: string }>({ wpm: 0, label: 'Ready' });
    const [isMuted, setIsMuted] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Proctoring state
    const [showProctoringModal, setShowProctoringModal] = useState(true);
    const [screenShareError, setScreenShareError] = useState<string | null>(null);
    const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);

    // Proctoring hook
    const { state: proctoringState, controls: proctoringControls, allRequirementsMet } = useProctoring();

    // Select a random AI interviewer
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
    const avatarRef = useRef<HTMLDivElement>(null);

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
    }, [isRecording]);

    // Sync Metrics to UI
    useEffect(() => {
        if (isRecording) {
            if (speech.transcript) setTranscript(speech.transcript);

            if (speech.wpm > 0) {
                setSpeechPacing({
                    wpm: speech.wpm,
                    label: speech.wpm < 110 ? 'Slow' : speech.wpm > 160 ? 'Fast' : 'Good'
                });
            }

            if (faceAnalysis.metrics.isFaceDetected) {
                setSentiment({
                    type: faceAnalysis.metrics.sentiment,
                    label: faceAnalysis.metrics.sentiment.charAt(0).toUpperCase() + faceAnalysis.metrics.sentiment.slice(1)
                });
            }
        }
    }, [speech.transcript, speech.wpm, faceAnalysis.metrics.sentiment, faceAnalysis.metrics.isFaceDetected, isRecording]);

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
    }, []);

    // Timer for recording session
    useEffect(() => {
        if (session?.startedAt && session.status === 'IN_PROGRESS') {
            const interval = setInterval(() => {
                const start = new Date(session.startedAt!);
                const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
                // Ensure timer never shows negative values
                setElapsedTime(Math.max(0, elapsed));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [session?.startedAt, session?.status]);

    const fetchSession = useCallback(async () => {
        if (!sessionId) {
            setInvalidId(true);
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${sessionId}`, {
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
    }, [sessionId, accessToken]);

    const fetchHint = useCallback(async (questionId: string) => {
        if (!sessionId) return;
        setLoadingHint(true);
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${sessionId}/hint/${questionId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAiHint(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch hint:', err);
        } finally {
            setLoadingHint(false);
        }
    }, [sessionId, accessToken]);

    const fetchAnalytics = useCallback(async () => {
        if (!sessionId) return;
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${sessionId}/analytics`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        }
    }, [sessionId, accessToken]);

    useEffect(() => {
        if (accessToken && sessionId) {
            fetchSession();
        } else if (!sessionId && params.id) {
            setInvalidId(true);
            setLoading(false);
        }
    }, [accessToken, sessionId, params.id, fetchSession]);

    // Fetch hint when question changes
    useEffect(() => {
        if (session?.questions[currentQuestionIndex] && session.status === 'IN_PROGRESS') {
            fetchHint(session.questions[currentQuestionIndex].id);
        }
    }, [currentQuestionIndex, session?.questions, session?.status, fetchHint]);

    // Poll analytics every 5 seconds
    useEffect(() => {
        if (session?.status === 'IN_PROGRESS') {
            fetchAnalytics();
            const interval = setInterval(fetchAnalytics, 5000);
            return () => clearInterval(interval);
        }
    }, [session?.status, fetchAnalytics]);

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
                sentiment: faceAnalysis.metrics.sentiment
            }));

            const response = await fetch(`${API_URL}/interviews/sessions/${sessionId}/answer/video`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();

                // Update transcript from audio analysis
                if (data.data.audioAnalysis?.transcription) {
                    setTranscript(data.data.audioAnalysis.transcription);
                }

                // Update speech pacing
                if (data.data.audioAnalysis?.wordsPerMinute) {
                    const wpm = data.data.audioAnalysis.wordsPerMinute;
                    setSpeechPacing({
                        wpm,
                        label: wpm >= 120 && wpm <= 160 ? 'Optimal' : wpm < 120 ? 'Slow' : 'Fast',
                    });
                }

                // Update sentiment based on response
                if (data.data.sentiment) {
                    setSentiment({
                        type: data.data.sentiment.sentiment,
                        label: data.data.sentiment.sentiment.charAt(0).toUpperCase() + data.data.sentiment.sentiment.slice(1),
                    });
                }

                // Update question with answer and score
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

                // Refresh analytics
                fetchAnalytics();

                // Move to next question after a delay
                if (data.data.nextQuestion) {
                    setTimeout(() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                        setAiHint(null);
                        setTranscript('');
                    }, 2000);
                } else if (data.data.isComplete) {
                    // All questions answered, show completion message
                    setTimeout(() => {
                        router.push(`/dashboard/interviews/${sessionId}`);
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
        if (!sessionId) return;
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${sessionId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (response.ok) {
                router.push(`/dashboard/interviews/${sessionId}`);
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

    // Derive current question (safe even if session is null)
    const currentQuestion = session?.questions?.[currentQuestionIndex] ?? null;
    const progress = analytics?.progress || {
        current: currentQuestionIndex + 1,
        total: session?.questions?.length || 0,
        answered: 0
    };

    // Auto-speak question when it changes (after proctoring modal closes)
    // IMPORTANT: This hook must be before any conditional returns
    useEffect(() => {
        if (!showProctoringModal && currentQuestion?.questionText) {
            speakQuestion(currentQuestion.questionText);
        }
        // Cleanup: stop speech when unmounting or question changes
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [currentQuestion?.questionText, showProctoringModal]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (invalidId) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-white font-medium mb-2">Invalid Session ID</h3>
                <p className="text-gray-400 mb-4">The interview session URL appears to be malformed or corrupted.</p>
                <Link href="/dashboard/interviews" className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition inline-block">
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
                <h3 className="text-white font-medium mb-2">Session Not Found</h3>
                <p className="text-gray-400 mb-4">This interview session may have been deleted or does not exist.</p>
                <Link href="/dashboard/interviews" className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition inline-block">
                    Return to Interviews
                </Link>
            </div>
        );
    }
    // currentQuestion and progress already calculated above

    // Handle screen share request with entire screen detection
    const handleRequestScreenShare = async () => {
        setScreenShareError(null);
        const success = await proctoringControls.requestScreenShare();
        if (!success) {
            setScreenShareError('Please select "Entire Screen" to continue. Window or tab sharing is not allowed.');
        }
    };

    // Start interview after all permissions granted
    const handleStartInterview = async () => {
        if (allRequirementsMet && agreedToGuidelines) {
            await proctoringControls.enterFullscreen();
            setShowProctoringModal(false);
        }
    };

    // Handle interview end with fullscreen exit
    const handleEndInterview = async () => {
        await proctoringControls.exitFullscreen();
        proctoringControls.stopAllStreams();
        await endSession();
    };

    return (
        <div className="min-h-screen -m-6 lg:-m-8 bg-[#0a0f14] dark:bg-[#0a0f14]" data-theme="dark">
            {/* Proctoring Modal */}
            {showProctoringModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 max-w-xl w-full border border-white/10 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Start Assessment: {session?.targetRole}</h2>
                                <p className="text-gray-400 text-sm">Complete the checklist to begin</p>
                            </div>
                        </div>

                        {/* Interview Info */}
                        <div className="flex gap-3 mb-6">
                            <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-white/10 text-gray-300 text-sm">
                                ⏱ 20 Minutes
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-white/10 text-gray-300 text-sm">
                                📝 {session?.questions.length || 10} Questions
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-white/10 text-gray-300 text-sm">
                                ⚡ 1 Attempt
                            </div>
                        </div>

                        {/* Proctoring Guidelines */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <h3 className="text-amber-400 font-medium">Important Proctoring Guidelines</h3>
                            </div>
                            <ul className="space-y-2 text-gray-300 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-500">•</span>
                                    Switching off the camera or changing tabs/windows during assessment is <strong className="text-white">not allowed</strong>.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-500">•</span>
                                    <strong className="text-white">Stay on Camera:</strong> Keep your webcam and mic on throughout the interview.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-500">•</span>
                                    <strong className="text-white">Screen Recording:</strong> Your screen will be monitored. Please close unnecessary tabs/apps.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-500">•</span>
                                    <strong className="text-white">Stay Present:</strong> Always remain visible and focused on the screen.
                                </li>
                            </ul>
                        </div>

                        {/* Permission Checklist */}
                        <div className="mb-6 p-4 rounded-xl bg-gray-800/50 border border-white/5">
                            <h3 className="text-white font-medium mb-4">System Requirements</h3>
                            <div className="space-y-3">
                                {/* Camera */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Camera className={`w-5 h-5 ${proctoringState.cameraAllowed ? 'text-green-400' : 'text-gray-400'}`} />
                                        <span className="text-gray-300">Camera Access</span>
                                    </div>
                                    {proctoringState.cameraAllowed ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <button
                                            onClick={proctoringControls.requestCamera}
                                            className="px-3 py-1 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition"
                                        >
                                            Grant
                                        </button>
                                    )}
                                </div>

                                {/* Microphone */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Mic className={`w-5 h-5 ${proctoringState.micAllowed ? 'text-green-400' : 'text-gray-400'}`} />
                                        <span className="text-gray-300">Microphone Access</span>
                                    </div>
                                    {proctoringState.micAllowed ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <button
                                            onClick={proctoringControls.requestMic}
                                            className="px-3 py-1 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition"
                                        >
                                            Grant
                                        </button>
                                    )}
                                </div>

                                {/* Screen Share */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Monitor className={`w-5 h-5 ${proctoringState.isEntireScreen ? 'text-green-400' : 'text-gray-400'}`} />
                                        <div>
                                            <span className="text-gray-300">Entire Screen Share</span>
                                            {screenShareError && (
                                                <p className="text-red-400 text-xs mt-1">{screenShareError}</p>
                                            )}
                                        </div>
                                    </div>
                                    {proctoringState.isEntireScreen ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <button
                                            onClick={handleRequestScreenShare}
                                            className="px-3 py-1 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition"
                                        >
                                            Share Screen
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Agreement Checkbox */}
                        <label className="flex items-center gap-3 mb-6 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreedToGuidelines}
                                onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
                            />
                            <span className="text-gray-300 text-sm">
                                I have read and understood all the instructions and guidelines.
                            </span>
                        </label>

                        {/* Start Button */}
                        <button
                            onClick={handleStartInterview}
                            disabled={!allRequirementsMet || !agreedToGuidelines}
                            className="w-full py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Proceed to Interview
                        </button>

                        {/* Violation Counter (if any) */}
                        {proctoringState.violations > 0 && (
                            <p className="text-red-400 text-sm mt-4 text-center">
                                ⚠️ {proctoringState.violations} violation(s) detected
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/interviews" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <p className="text-xs text-gray-500">Practice / Mock Interview</p>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{session.targetRole} Role</h1>
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-80px)]">
                {/* Left side - Video Area */}
                <div className="flex-1 p-6 flex flex-col">
                    {/* Question Overlay - Top of Video Area */}
                    <div className="mb-4 p-6 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-purple-400 uppercase tracking-wider font-medium">Current Question</span>
                            <span className="text-sm text-gray-400 font-medium">{String(progress.current).padStart(2, '0')} / {String(progress.total).padStart(2, '0')}</span>
                        </div>
                        <p className="text-white font-bold text-2xl text-center leading-relaxed">
                            "{currentQuestion?.questionText || 'Loading question...'}"
                        </p>
                    </div>

                    {/* Split Video View */}
                    <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
                        {/* AI Interviewer */}
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1a2530] dark:to-[#0d1318] border border-gray-200 dark:border-white/5">
                            <div ref={avatarRef} className="absolute inset-0 flex items-center justify-center">
                                {/* AI Avatar with Photo */}
                                <div className="relative">
                                    {/* Glow effect behind avatar */}
                                    <div className={`absolute -inset-4 bg-gradient-to-r from-teal-500/30 to-purple-500/30 rounded-full blur-xl ${isRecording ? 'animate-pulse' : ''}`} />

                                    {/* Animated ring when speaking */}
                                    {isRecording && (
                                        <div className="absolute -inset-2 rounded-full border-2 border-teal-400 animate-ping opacity-75" />
                                    )}

                                    {/* Avatar image */}
                                    <div className={`relative w-40 h-40 rounded-full overflow-hidden border-4 ${isRecording ? 'border-teal-400' : 'border-teal-500/50'} shadow-lg shadow-teal-500/20`}>
                                        <img
                                            src={interviewer.avatar}
                                            alt={interviewer.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Speaking indicator */}
                                    {isRecording && (
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-teal-500 rounded-full">
                                            <div className="w-1.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                            <div className="w-1.5 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                            <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            <div className="w-1.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
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
                                        <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500">Camera not available</p>
                                    </div>
                                </div>
                            )}
                            {isRecording && (
                                <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/90">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    <span className="text-white text-xs font-medium">
                                        REC {formatVideoTime(recordingTime)}
                                    </span>
                                </div>
                            )}
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

                        <button
                            className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 flex items-center justify-center transition"
                        >
                            <Video className="w-5 h-5" />
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
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                Submit Answer
                            </button>
                        )}
                    </div>

                    {/* Bottom Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Sentiment Analysis */}
                        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Sentiment Analysis</span>
                                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">{sentiment.label}</span>
                            </div>
                            <p className={`text-2xl font-bold ${sentiment.type === 'positive' || sentiment.type === 'confident' ? 'text-green-500 dark:text-green-400' : sentiment.type === 'negative' ? 'text-red-500 dark:text-red-400' : 'text-teal-500 dark:text-teal-400'}`}>
                                {sentiment.type === 'positive' || sentiment.type === 'confident' ? 'Positive' : sentiment.type === 'negative' ? 'Negative' : 'Neutral'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Tone is clear and assertive</p>
                        </div>

                        {/* Tech Accuracy */}
                        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Tech Accuracy</span>
                                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">{analytics?.techAccuracy?.label || 'Good'} ({analytics?.techAccuracy?.score || 0}%)</span>
                            </div>
                            <div className="flex items-end gap-1 h-12">
                                {[65, 80, 70, 90, 75].map((h, i) => (
                                    <div key={i} className="flex-1 bg-teal-500/80 rounded-t" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-teal-500" />
                                Keyword: "STAR Method" detected
                            </p>
                        </div>

                        {/* Speech Pacing */}
                        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Speech Pacing</span>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="relative w-20 h-20">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="40" cy="40" r="35" fill="none" className="stroke-gray-200 dark:stroke-[#1a2530]" strokeWidth="6" />
                                        <circle cx="40" cy="40" r="35" fill="none" stroke="#14b8a6" strokeWidth="6" strokeDasharray={`${(speechPacing.wpm / 200) * 220} 220`} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{speechPacing.wpm || 135}</p>
                                            <p className="text-[10px] text-gray-500">WPM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-teal-600 dark:text-teal-400 text-center mt-2">Optimal Pace</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-96 border-l border-gray-200 dark:border-white/5 p-6 flex flex-col gap-4 overflow-y-auto bg-gray-50 dark:bg-transparent">
                    {/* Session Controls - Timer & End Session */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            {/* Recording indicator */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-red-500 dark:text-red-400 text-sm font-medium">REC • {formatElapsedTime(elapsedTime)}</span>
                            </div>

                            {/* Mic toggle */}
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-2 rounded-lg transition ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* End Session */}
                        <button
                            onClick={handleEndInterview}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
                        >
                            End Session
                        </button>
                    </div>

                    {/* AI Hint */}
                    <div className="p-4 rounded-xl bg-[#111820] border border-amber-500/30">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-amber-400 uppercase tracking-wider font-medium">AI Hint</span>
                        </div>
                        {loadingHint ? (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Generating hint...</span>
                            </div>
                        ) : aiHint ? (
                            <div>
                                <p className="text-gray-200 text-sm">{aiHint.hint}</p>
                                {aiHint.keyPoints && aiHint.keyPoints.length > 0 && (
                                    <ul className="mt-3 space-y-1">
                                        {aiHint.keyPoints.map((point, i) => (
                                            <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                                <span className="text-amber-400">•</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">Focus on providing specific examples from your experience.</p>
                        )}
                    </div>

                    {/* Live Transcript */}
                    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                            <span className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">Live Transcript</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">
                            {transcript || (
                                <p className="text-gray-500 dark:text-gray-600 italic">
                                    {isRecording ? 'Recording... transcript will appear here.' : 'Start recording to see live transcript.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
