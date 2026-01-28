'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Mic, MicOff, Video, VideoOff, Square, Loader2,
    Lightbulb, MessageSquare, ChevronRight, CheckCircle,
    Monitor, Camera, AlertTriangle, Shield, Code, Users
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

// Combined keywords for mixed interview
const MIXED_KEYWORDS = [
    // Technical
    'algorithm', 'optimization', 'architecture', 'design pattern', 'scalability',
    // HR/Behavioral
    'leadership', 'teamwork', 'conflict resolution', 'communication', 'problem solving'
];

// AI Interviewer avatars - mix of technical and HR
const AI_INTERVIEWERS = [
    { name: 'Sarah', role: 'Tech Lead', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face' },
    { name: 'Alex', role: 'Engineering Manager', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
    { name: 'Maya', role: 'VP Engineering', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' },
];

export default function MixedInterviewRoomPage() {
    const { id } = useParams();
    const router = useRouter();
    const { accessToken } = useAuthStore();

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
    const [detectedKeywords, setDetectedKeywords] = useState<Set<string>>(new Set());
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

    // Sync Metrics to UI and detect keywords
    useEffect(() => {
        if (isRecording) {
            if (speech.transcript) {
                setTranscript(speech.transcript);

                // Detect mixed keywords
                const detected = new Set<string>();
                const lowerTranscript = speech.transcript.toLowerCase();
                MIXED_KEYWORDS.forEach(keyword => {
                    if (lowerTranscript.includes(keyword)) {
                        detected.add(keyword);
                    }
                });
                setDetectedKeywords(detected);
            }

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

    const fetchHint = useCallback(async (questionId: string) => {
        setLoadingHint(true);
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${id}/hint/${questionId}`, {
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
    }, [id, accessToken]);

    const fetchAnalytics = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/interviews/sessions/${id}/analytics`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        }
    }, [id, accessToken]);

    useEffect(() => {
        if (accessToken && id) {
            fetchSession();
        }
    }, [accessToken, id, fetchSession]);

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
                setTranscript('');
                setDetectedKeywords(new Set());

                // Refresh analytics
                fetchAnalytics();

                // Move to next question after a delay
                if (data.data.nextQuestion) {
                    setTimeout(() => {
                        setCurrentQuestionIndex(prev => prev + 1);
                        setAiHint(null);
                    }, 2000);
                } else if (data.data.isComplete) {
                    // All questions answered, show completion message
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

    // Get question type badge
    const getQuestionTypeBadge = (type: string) => {
        if (type === 'technical') {
            return { label: 'Technical', color: 'bg-purple-500/20 text-purple-400', icon: Code };
        } else if (type === 'behavioral' || type === 'hr') {
            return { label: 'HR/Behavioral', color: 'bg-teal-500/20 text-teal-400', icon: Users };
        }
        return { label: 'HR + Tech', color: 'bg-blue-500/20 text-blue-400', icon: MessageSquare };
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

    const currentQuestion = session.questions[currentQuestionIndex];
    const progress = analytics?.progress || { current: currentQuestionIndex + 1, total: session.questions.length, answered: 0 };
    const questionBadge = currentQuestion ? getQuestionTypeBadge(currentQuestion.questionType) : null;

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
        <div className="min-h-screen -m-6 lg:-m-8 bg-gray-50 dark:bg-[#0a0f14]">
            {/* Proctoring Modal */}
            {showProctoringModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 max-w-xl w-full border border-white/10 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">HR + Technical Interview: {session?.targetRole}</h2>
                                <p className="text-gray-400 text-sm">Combined Technical & Behavioral Assessment</p>
                            </div>
                        </div>

                        {/* Interview Info */}
                        <div className="flex gap-3 mb-6 flex-wrap">
                            <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-white/10 text-gray-300 text-sm">
                                ⏱ 25 Minutes
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-white/10 text-gray-300 text-sm">
                                📝 {session?.questions.length || 10} Questions
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm">
                                💻 Technical
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm">
                                🎯 Behavioral
                            </div>
                        </div>

                        {/* HR + Technical Interview Focus */}
                        <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-teal-500/10 border border-purple-500/20">
                            <h3 className="text-white font-medium mb-2">HR + Technical Evaluation</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-purple-400 text-xs font-medium mb-1">Technical Skills</p>
                                    <ul className="space-y-1 text-gray-400 text-xs">
                                        <li>• Problem-solving ability</li>
                                        <li>• Technical knowledge depth</li>
                                        <li>• Code/system design thinking</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-teal-400 text-xs font-medium mb-1">Soft Skills</p>
                                    <ul className="space-y-1 text-gray-400 text-xs">
                                        <li>• Communication clarity</li>
                                        <li>• Leadership & teamwork</li>
                                        <li>• Behavioral responses</li>
                                    </ul>
                                </div>
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
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-teal-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Proceed to HR + Technical Interview
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
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/interviews" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <p className="text-xs text-gray-500">Practice / HR + Technical Interview</p>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{session.targetRole} Role</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
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

                    {/* End Session */}
                    <button
                        onClick={handleEndInterview}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
                    >
                        End Session
                    </button>
                </div>
            </header>

            <div className="flex h-[calc(100vh-80px)]">
                {/* Left side - Video Area */}
                <div className="flex-1 p-6 flex flex-col">
                    {/* Split Video View */}
                    <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
                        {/* AI Interviewer */}
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1a2530] dark:to-[#0d1318] border border-gray-200 dark:border-white/5">
                            <div ref={avatarRef} className="absolute inset-0 flex items-center justify-center">
                                {/* AI Avatar with Photo */}
                                <div className="relative">
                                    {/* Glow effect behind avatar */}
                                    <div className={`absolute -inset-4 bg-gradient-to-r from-purple-500/30 to-teal-500/30 rounded-full blur-xl ${isRecording ? 'animate-pulse' : ''}`} />

                                    {/* Animated ring when speaking */}
                                    {isRecording && (
                                        <div className="absolute -inset-2 rounded-full border-2 border-purple-400 animate-ping opacity-75" />
                                    )}

                                    {/* Avatar image */}
                                    <div className={`relative w-40 h-40 rounded-full overflow-hidden border-4 ${isRecording ? 'border-purple-400' : 'border-purple-500/50'} shadow-lg shadow-purple-500/20`}>
                                        <img
                                            src={interviewer.avatar}
                                            alt={interviewer.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Speaking indicator */}
                                    {isRecording && (
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full">
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
                                    <p className="text-xs text-purple-600 dark:text-purple-400">AI INTERVIEWER</p>
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
                                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 text-white flex items-center justify-center hover:opacity-90 transition shadow-lg shadow-purple-500/25"
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
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                Submit Answer
                            </button>
                        )}
                    </div>

                    {/* Bottom Metrics - Combined Technical + HR */}
                    <div className="grid grid-cols-4 gap-4">
                        {/* Sentiment Analysis (Technical) */}
                        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Sentiment</span>
                                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{sentiment.label}</span>
                            </div>
                            <p className={`text-xl font-bold ${sentiment.type === 'positive' || sentiment.type === 'confident' ? 'text-green-500' : sentiment.type === 'negative' ? 'text-red-500' : 'text-purple-500'}`}>
                                {sentiment.type === 'positive' || sentiment.type === 'confident' ? 'Positive' : sentiment.type === 'negative' ? 'Negative' : 'Neutral'}
                            </p>
                        </div>

                        {/* Tech Accuracy (Technical) */}
                        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Tech Score</span>
                                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{analytics?.techAccuracy?.score || 0}%</span>
                            </div>
                            <div className="flex items-end gap-1 h-8">
                                {[65, 80, 70, 90, 75].map((h, i) => (
                                    <div key={i} className="flex-1 bg-purple-500/80 rounded-t" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        </div>

                        {/* Speech Pacing (Technical) */}
                        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Speech Pace</span>
                                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">{speechPacing.label}</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{speechPacing.wpm || 135} <span className="text-xs text-gray-500">WPM</span></p>
                        </div>

                        {/* Keyword Check (HR) */}
                        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Keywords</span>
                                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">{detectedKeywords.size}/5</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {['leadership', 'algorithm'].slice(0, 2).map(kw => (
                                    <span key={kw} className={`px-1.5 py-0.5 rounded text-xs ${detectedKeywords.has(kw) ? 'bg-teal-500/20 text-teal-400' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-96 border-l border-gray-200 dark:border-white/5 p-6 flex flex-col gap-4 overflow-y-auto bg-gray-50 dark:bg-transparent">
                    {/* AI Interviewer Card */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/50">
                            <img src={interviewer.avatar} alt={interviewer.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-xs text-purple-600 dark:text-purple-400 uppercase">AI Interviewer</p>
                            <p className="text-gray-900 dark:text-white font-medium">{interviewer.name} ({interviewer.role})</p>
                        </div>
                    </div>

                    {/* Current Question */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-gray-200 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-500 dark:text-red-400 uppercase tracking-wider">Current Question</span>
                                {questionBadge && (
                                    <span className={`px-2 py-0.5 rounded text-xs ${questionBadge.color}`}>
                                        {questionBadge.label}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-500">{String(progress.current).padStart(2, '0')} / {String(progress.total).padStart(2, '0')}</span>
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
                            &quot;{currentQuestion?.questionText || 'Loading question...'}&quot;
                        </p>
                    </div>

                    {/* AI Hint */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            <span className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider font-medium">AI Hint</span>
                        </div>
                        {loadingHint ? (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Generating hint...</span>
                            </div>
                        ) : aiHint ? (
                            <div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{aiHint.hint}</p>
                                {aiHint.keyPoints && aiHint.keyPoints.length > 0 && (
                                    <ul className="mt-3 space-y-1">
                                        {aiHint.keyPoints.map((point, i) => (
                                            <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                <span className="text-amber-500 dark:text-amber-400">•</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Focus on providing specific examples from your experience.</p>
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
        </div>
    );
}
