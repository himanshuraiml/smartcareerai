'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Mic, MicOff, VideoOff, Loader2,
    ChevronRight, Monitor, Camera, AlertTriangle, CheckCircle, Shield
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useVideoRecorder } from '@/hooks/useVideoRecorder';
import { useInterviewFlow } from '@/hooks/useInterviewFlow';
import { useFaceAnalysis } from '@/hooks/use-face-analysis';
import { useProctoring } from '@/hooks/useProctoring';
import { authFetch } from '@/lib/auth-fetch';

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

interface LiveAnalytics {
    progress: { current: number; total: number; answered: number };
    techAccuracy: { score: number; label: string };
    currentQuestion: { id: string; text: string; type: string; index: number } | null;
}

const normalizeUUID = (id: string | string[] | undefined): string | null => {
    if (!id || Array.isArray(id)) return null;
    const normalized = id.replace(/\s+/g, '-').toLowerCase();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(normalized) ? normalized : null;
};

const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
    }
};

const formatCountdown = (ms: number) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const QUESTION_TIME_MS = 180000;

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally'];

const AriaAvatar = () => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs>
            <radialGradient id="ariaBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a2a3a" />
                <stop offset="100%" stopColor="#0a0f14" />
            </radialGradient>
            <linearGradient id="ariaFace" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dba878" />
                <stop offset="100%" stopColor="#b07850" />
            </linearGradient>
            <linearGradient id="ariaHair" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#180700" />
                <stop offset="100%" stopColor="#2c1004" />
            </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="100" fill="url(#ariaBg)" />
        {/* Shoulders */}
        <ellipse cx="100" cy="210" rx="78" ry="26" fill="#1e3060" />
        <rect x="66" y="168" width="68" height="48" rx="22" fill="#1e3060" />
        {/* Neck */}
        <rect x="83" y="150" width="34" height="28" rx="10" fill="url(#ariaFace)" />
        {/* Face */}
        <ellipse cx="100" cy="108" rx="53" ry="58" fill="url(#ariaFace)" />
        {/* Hair */}
        <ellipse cx="100" cy="60" rx="56" ry="36" fill="url(#ariaHair)" />
        <rect x="45" y="55" width="19" height="62" rx="9" fill="url(#ariaHair)" />
        <rect x="136" y="55" width="19" height="62" rx="9" fill="url(#ariaHair)" />
        {/* Left eye */}
        <ellipse cx="80" cy="104" rx="12" ry="13" fill="white" />
        <circle cx="80" cy="105" r="9" fill="#0d9488" />
        <circle cx="81" cy="106" r="5" fill="#021f1d" />
        <circle cx="82.5" cy="102" r="2.5" fill="white" opacity="0.95" />
        {/* Right eye */}
        <ellipse cx="120" cy="104" rx="12" ry="13" fill="white" />
        <circle cx="120" cy="105" r="9" fill="#0d9488" />
        <circle cx="121" cy="106" r="5" fill="#021f1d" />
        <circle cx="122.5" cy="102" r="2.5" fill="white" opacity="0.95" />
        {/* Eyebrows */}
        <path d="M67 87 Q80 80 93 85" stroke="#2563eb" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M107 85 Q120 80 133 87" stroke="#2563eb" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {/* Nose */}
        <ellipse cx="100" cy="123" rx="6" ry="4" fill="#a07050" opacity="0.45" />
        {/* Smile */}
        <path d="M87 138 Q100 151 113 138" stroke="#9c6040" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Blush */}
        <ellipse cx="70" cy="118" rx="13" ry="8" fill="#f87171" opacity="0.18" />
        <ellipse cx="130" cy="118" rx="13" ry="8" fill="#f87171" opacity="0.18" />
        {/* Tech accent dots on ears */}
        <circle cx="47" cy="108" r="5" fill="#0d9488" opacity="0.65" />
        <circle cx="153" cy="108" r="5" fill="#0d9488" opacity="0.65" />
    </svg>
);

export default function InterviewRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();

    const sessionId = normalizeUUID(params.id);
    const [invalidId, setInvalidId] = useState(false);

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<LiveAnalytics | null>(null);
    const [sentiment, setSentiment] = useState<{ type: string; label: string }>({ type: 'neutral', label: 'Neutral' });
    const [speechPacing, setSpeechPacing] = useState<{ wpm: number; label: string }>({ wpm: 0, label: 'Ready' });
    const [isMuted, setIsMuted] = useState(false);
    const [showProctoringModal, setShowProctoringModal] = useState(true);
    const [screenShareError, setScreenShareError] = useState<string | null>(null);
    const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
    const [thinkingCountdown, setThinkingCountdown] = useState<number | null>(null);

    const { state: proctoringState, controls: proctoringControls, allRequirementsMet } = useProctoring();
    const { previewStream, startPreview, stopPreview } = useVideoRecorder({ maxDuration: 600 });
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const faceAnalysis = useFaceAnalysis(videoPreviewRef);

    const onAnswerSubmit = useCallback(async (index: number, currentTranscript: string) => {
        if (!session) return false;
        const question = session.questions[index];
        if (!question) return false;

        try {
            const response = await authFetch(`/interviews/sessions/${sessionId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: question.id,
                    answer: currentTranscript || '[No answer provided]'
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSession(prev => {
                    if (!prev) return null;
                    const updatedQs = [...prev.questions];
                    updatedQs[index] = {
                        ...updatedQs[index],
                        userAnswer: currentTranscript,
                        score: data.data.evaluation?.score || null,
                        feedback: data.data.evaluation?.feedback || null
                    };
                    return { ...prev, questions: updatedQs };
                });
                fetchAnalytics();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to submit answer:', err);
            return false;
        }
    }, [session, sessionId]);

    const handleInterviewComplete = useCallback(async () => {}, []);

    const {
        currentQuestionIndex,
        isSubmitting,
        isFinished,
        isTransitioning,
        transitionCountdown,
        timeRemainingMs,
        transcript,
        wpm,
        isListening,
        isActive: isRecording,
        startInterview: startContinuousInterview,
        advanceQuestion,
        stopInterview,
        setQuestionIndex,
    } = useInterviewFlow({
        totalQuestions: session?.questions.length || 1,
        onAnswerSubmit,
        onInterviewComplete: handleInterviewComplete,
        timeLimitMs: QUESTION_TIME_MS,
        silenceThresholdMs: 120000,
    });

    useEffect(() => { if (isFinished) endSession(); }, [isFinished]);

    useEffect(() => {
        if (isListening) faceAnalysis.startAnalysis();
        else faceAnalysis.stopAnalysis();
    }, [isListening, faceAnalysis]);

    useEffect(() => {
        if (isListening) {
            if (wpm > 0) setSpeechPacing({ wpm, label: wpm < 110 ? 'Slow' : wpm > 160 ? 'Fast' : 'Good' });
            if (faceAnalysis.metrics.isFaceDetected) {
                const s = faceAnalysis.metrics.sentiment;
                setSentiment({ type: s, label: s.charAt(0).toUpperCase() + s.slice(1) });
            }
        }
    }, [wpm, faceAnalysis.metrics.sentiment, faceAnalysis.metrics.isFaceDetected, isListening]);

    useEffect(() => {
        if (videoPreviewRef.current && previewStream) {
            videoPreviewRef.current.srcObject = previewStream;
        }
    }, [previewStream]);

    useEffect(() => { startPreview(); return () => stopPreview(); }, []);

    // Thinking time countdown: 7s buffer after each new question appears
    useEffect(() => {
        if (!isRecording || isTransitioning) return;
        setThinkingCountdown(7);
        const timer = setInterval(() => {
            setThinkingCountdown(prev => {
                if (!prev || prev <= 1) { clearInterval(timer); return null; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [currentQuestionIndex]);

    useEffect(() => {
        if (isTransitioning) setThinkingCountdown(null);
    }, [isTransitioning]);

    const fetchSession = useCallback(async () => {
        if (!sessionId) { setInvalidId(true); setLoading(false); return; }
        try {
            const response = await authFetch(`/interviews/sessions/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                setSession(data.data);
                const unansweredIndex = data.data.questions.findIndex((q: Question) => !q.userAnswer);
                if (unansweredIndex !== -1) setQuestionIndex(unansweredIndex);
            }
        } catch (err) {
            console.error('Failed to fetch session:', err);
        } finally {
            setLoading(false);
        }
    }, [sessionId, user]);

    const fetchAnalytics = useCallback(async () => {
        if (!sessionId) return;
        try {
            const response = await authFetch(`/interviews/sessions/${sessionId}/analytics`);
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data.data);
            }
        } catch { /* non-critical */ }
    }, [sessionId]);

    useEffect(() => {
        if (user && sessionId) fetchSession();
        else if (!sessionId && params.id) { setInvalidId(true); setLoading(false); }
    }, [user, sessionId, params.id, fetchSession]);

    useEffect(() => {
        if (session?.status === 'IN_PROGRESS') {
            fetchAnalytics();
            const interval = setInterval(fetchAnalytics, 5000);
            return () => clearInterval(interval);
        }
    }, [session?.status, fetchAnalytics]);

    const currentQuestion = session?.questions?.[currentQuestionIndex] ?? null;

    const endSession = async () => {
        if (!sessionId) return;
        try {
            try {
                const visionSamples = faceAnalysis.getSamples();
                await authFetch(`/interviews/sessions/${sessionId}/behavior-metrics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        visionSamples,
                        speechMetrics: { wordsPerMinute: speechPacing.wpm || undefined },
                    }),
                });
            } catch { /* non-blocking */ }

            const response = await authFetch(`/interviews/sessions/${sessionId}/complete`, { method: 'POST' });
            if (response.ok) router.push(`/dashboard/interviews/${sessionId}`);
        } catch (err) {
            console.error('Failed to end session:', err);
        }
    };

    useEffect(() => {
        if (!showProctoringModal && currentQuestion?.questionText) speakQuestion(currentQuestion.questionText);
        return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
    }, [currentQuestion?.questionText, showProctoringModal]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
    );

    if (invalidId) return (
        <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-medium mb-2">Invalid Session ID</h3>
            <p className="text-gray-400 mb-4">The interview session URL appears to be malformed.</p>
            <Link href="/dashboard/interviews" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition inline-block">
                Return to Interviews
            </Link>
        </div>
    );

    if (!session) return (
        <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-white font-medium mb-2">Session Not Found</h3>
            <p className="text-gray-400 mb-4">This interview session may have been deleted.</p>
            <Link href="/dashboard/interviews" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition inline-block">
                Return to Interviews
            </Link>
        </div>
    );

    const isLowTime = timeRemainingMs <= 30000;
    const isMidTime = timeRemainingMs <= 60000 && !isLowTime;
    const progressPct = Math.max(0, Math.min(100, (timeRemainingMs / QUESTION_TIME_MS) * 100));

    const fillerCount = transcript
        ? FILLER_WORDS.reduce((count, word) => count + (transcript.match(new RegExp(`\\b${word}\\b`, 'gi'))?.length || 0), 0)
        : 0;

    const toneLabel = sentiment.type === 'positive' || sentiment.type === 'confident' ? 'Confident'
        : sentiment.type === 'negative' ? 'Nervous' : 'Neutral';
    const toneIsGood = toneLabel === 'Confident';
    const toneIsBad = toneLabel === 'Nervous';

    const handleRequestScreenShare = async () => {
        setScreenShareError(null);
        const success = await proctoringControls.requestScreenShare();
        if (!success) setScreenShareError('Please select "Entire Screen" to continue. Window or tab sharing is not allowed.');
    };

    const handleStartInterview = async () => {
        if (allRequirementsMet && agreedToGuidelines) {
            await proctoringControls.enterFullscreen();
            setShowProctoringModal(false);
            setTimeout(() => { startContinuousInterview(); }, 1000);
        }
    };

    const handleEndInterview = async () => {
        stopInterview();
        await proctoringControls.exitFullscreen();
        proctoringControls.stopAllStreams();
        await endSession();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#0a0f14', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

                @keyframes ariaGlow {
                    0%, 100% { box-shadow: 0 0 24px rgba(13,148,136,0.45), 0 0 48px rgba(37,99,235,0.22); }
                    50% { box-shadow: 0 0 40px rgba(13,148,136,0.75), 0 0 80px rgba(37,99,235,0.38); }
                }
                @keyframes ariaNod {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-6px) rotate(-1deg); }
                    75% { transform: translateY(3px) rotate(0.5deg); }
                }
                @keyframes scanLine {
                    0% { top: 0%; opacity: 0.7; }
                    85% { opacity: 0.4; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes livePulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(0.75); }
                }
                @keyframes cursorBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes thinkPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.02); opacity: 0.8; }
                }
                @keyframes waveBar {
                    0%, 100% { transform: scaleY(0.35); }
                    50% { transform: scaleY(1); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .aria-glow { animation: ariaGlow 3.5s ease-in-out infinite; }
                .aria-nod { animation: ariaNod 5s ease-in-out infinite; }
                .live-dot { animation: livePulse 1.4s ease-in-out infinite; }
                .think-pulse { animation: thinkPulse 1.6s ease-in-out infinite; }
                .fade-up { animation: fadeUp 0.35s ease-out forwards; }
                .icon-spin { animation: spin 1s linear infinite; }

                .glass-card {
                    background: rgba(255,255,255,0.04);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 16px;
                }
                .speech-bubble {
                    background: rgba(37,99,235,0.09);
                    border: 1px solid rgba(37,99,235,0.22);
                    border-radius: 16px;
                    border-top-left-radius: 4px;
                    position: relative;
                }
                .transcript-panel {
                    background: rgba(0,0,0,0.28);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                }
                .badge-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 11px;
                    border-radius: 20px;
                    font-size: 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: #9ca3af;
                }
            `}</style>

            {/* ══ Proctoring Modal ══ */}
            {showProctoringModal && (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(8px)' }}>
                    <div style={{
                        background: '#111820', borderRadius: 20, padding: 28, maxWidth: 520, width: '100%',
                        border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>
                                    Start Interview: {session.targetRole}
                                </h2>
                                <p style={{ fontSize: 13, color: '#6b7280', margin: 0, marginTop: 3 }}>Complete the checklist to begin</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-6">
                            {[
                                `⏱ ${Math.round((session.questions.length * QUESTION_TIME_MS) / 60000)} min`,
                                `📝 ${session.questions.length} Questions`,
                                '⏳ 3 min / Q',
                            ].map(label => (
                                <div key={label} style={{
                                    padding: '6px 14px', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#d1d5db', fontSize: 13
                                }}>{label}</div>
                            ))}
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <h3 style={{ color: '#fbbf24', fontWeight: 600, fontSize: 14, margin: 0 }}>Proctoring Guidelines</h3>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    'Each question has a 3-minute countdown. Answer and click Next or wait for auto-advance.',
                                    'Switching off camera or changing tabs is not allowed.',
                                    'Keep your webcam and mic on throughout the interview.',
                                    'Your screen will be monitored. Close unnecessary tabs.',
                                ].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#9ca3af' }}>
                                        <span style={{ color: '#4b5563', flexShrink: 0 }}>•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ marginBottom: 24, padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>System Requirements</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { icon: Camera, label: 'Camera Access', met: proctoringState.cameraAllowed, onGrant: proctoringControls.requestCamera },
                                    { icon: Mic, label: 'Microphone Access', met: proctoringState.micAllowed, onGrant: proctoringControls.requestMic },
                                ].map(({ icon: Icon, label, met, onGrant }) => (
                                    <div key={label} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 14px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Icon className={`w-5 h-5 ${met ? 'text-green-400' : 'text-gray-500'}`} />
                                            <span style={{ fontSize: 14, color: '#d1d5db' }}>{label}</span>
                                        </div>
                                        {met
                                            ? <CheckCircle className="w-5 h-5 text-green-400" />
                                            : <button onClick={onGrant} style={{ padding: '4px 14px', borderRadius: 8, background: '#2563eb', color: 'white', fontSize: 13, border: 'none', cursor: 'pointer' }}>Grant</button>
                                        }
                                    </div>
                                ))}
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                    padding: '10px 14px', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <Monitor className={`w-5 h-5 mt-0.5 ${proctoringState.isEntireScreen ? 'text-green-400' : 'text-gray-500'}`} />
                                        <div>
                                            <span style={{ fontSize: 14, color: '#d1d5db' }}>Entire Screen Share</span>
                                            {screenShareError && <p style={{ fontSize: 12, color: '#f87171', margin: '4px 0 0' }}>{screenShareError}</p>}
                                        </div>
                                    </div>
                                    {proctoringState.isEntireScreen
                                        ? <CheckCircle className="w-5 h-5 text-green-400" />
                                        : <button onClick={handleRequestScreenShare} style={{ padding: '4px 14px', borderRadius: 8, background: '#2563eb', color: 'white', fontSize: 13, border: 'none', cursor: 'pointer' }}>Share</button>
                                    }
                                </div>
                            </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={agreedToGuidelines}
                                onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                                style={{ width: 18, height: 18 }}
                            />
                            <span style={{ fontSize: 13, color: '#9ca3af' }}>I have read and understood all instructions and guidelines.</span>
                        </label>

                        <button
                            onClick={handleStartInterview}
                            disabled={!allRequirementsMet || !agreedToGuidelines}
                            style={{
                                width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700,
                                background: allRequirementsMet && agreedToGuidelines ? 'linear-gradient(135deg, #0d9488, #2563eb)' : 'rgba(255,255,255,0.08)',
                                color: allRequirementsMet && agreedToGuidelines ? 'white' : '#6b7280',
                                boxShadow: allRequirementsMet && agreedToGuidelines ? '0 4px 20px rgba(13,148,136,0.3)' : 'none',
                            }}
                        >
                            Proceed to Interview →
                        </button>

                        {proctoringState.violations > 0 && (
                            <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
                                ⚠️ {proctoringState.violations} violation(s) detected
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ══ Question Transition Overlay ══ */}
            {isTransitioning && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 40,
                    background: 'rgba(10,15,20,0.94)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ textAlign: 'center', padding: '0 32px' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'rgba(13,148,136,0.15)', border: '2px solid rgba(13,148,136,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <CheckCircle style={{ width: 30, height: 30, color: '#0d9488' }} />
                        </div>
                        <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
                            Answer submitted!
                        </p>
                        <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 24px' }}>
                            {currentQuestionIndex + 1 < (session?.questions.length || 0)
                                ? `Next question in ${transitionCountdown}...`
                                : 'Finishing up...'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {session?.questions.map((_, i) => (
                                <div key={i} style={{
                                    height: 6, borderRadius: 3,
                                    width: i <= currentQuestionIndex ? 24 : 10,
                                    background: i <= currentQuestionIndex ? '#0d9488' : 'rgba(255,255,255,0.12)',
                                    transition: 'all 0.3s ease'
                                }} />
                            ))}
                        </div>
                        <p style={{ fontSize: 13, color: '#4b5563', marginTop: 12 }}>
                            Question {currentQuestionIndex + 1} of {session?.questions.length} answered
                        </p>
                    </div>
                </div>
            )}

            {/* ══ Header ══ */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', height: 56, flexShrink: 0,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(10,15,20,0.95)',
                backdropFilter: 'blur(12px)',
                zIndex: 30
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Link href="/dashboard/interviews" style={{ color: '#6b7280', display: 'flex' }}>
                        <ArrowLeft style={{ width: 20, height: 20 }} />
                    </Link>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'linear-gradient(135deg, #2563eb, #0d9488)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <span style={{ color: 'white', fontSize: 13, fontWeight: 800, fontFamily: 'Sora, sans-serif' }}>P</span>
                    </div>
                    <div>
                        <p style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>Mock Interview</p>
                        <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>{session.targetRole}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Q counter */}
                    <div style={{
                        padding: '4px 13px', borderRadius: 20,
                        background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.28)',
                        color: '#93c5fd', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500
                    }}>
                        Q {currentQuestionIndex + 1} / {session.questions.length}
                    </div>

                    {/* Timer */}
                    {isRecording && !isTransitioning && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '4px 13px', borderRadius: 20,
                            background: isLowTime ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.12)',
                            border: `1px solid ${isLowTime ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.28)'}`,
                            color: isLowTime ? '#f87171' : '#34d399',
                            fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 500
                        }}>
                            <div className="live-dot" style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: isLowTime ? '#ef4444' : '#10b981', flexShrink: 0
                            }} />
                            {formatCountdown(timeRemainingMs)}
                        </div>
                    )}

                    {/* Mute */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        style={{
                            width: 34, height: 34, borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isMuted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${isMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            color: isMuted ? '#f87171' : '#9ca3af', cursor: 'pointer'
                        }}
                    >
                        {isMuted ? <MicOff style={{ width: 16, height: 16 }} /> : <Mic style={{ width: 16, height: 16 }} />}
                    </button>

                    {/* End Session */}
                    <button
                        onClick={handleEndInterview}
                        style={{
                            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)',
                            color: '#f87171', cursor: 'pointer'
                        }}
                    >
                        End Session
                    </button>
                </div>
            </header>

            {/* ══ Main 2-column layout ══ */}
            <div style={{
                flex: 1, minHeight: 0,
                display: 'grid',
                gridTemplateColumns: '42% 58%',
                overflow: 'hidden'
            }}>

                {/* ══ LEFT: Aria (top) + Camera (bottom) ══ */}
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden'
                }}>

                    {/* Top half — Aria avatar */}
                    <div style={{
                        flex: 1, minHeight: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '16px 24px 12px',
                        background: 'radial-gradient(ellipse at 50% 45%, rgba(37,99,235,0.07) 0%, transparent 68%)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Ambient glow */}
                        <div style={{
                            position: 'absolute', width: 260, height: 260,
                            borderRadius: '50%', top: '5%', left: '50%', transform: 'translateX(-50%)',
                            background: 'radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)',
                            pointerEvents: 'none'
                        }} />

                        {/* Aria avatar with nod + glow */}
                        <div className="aria-nod" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                            <div className="aria-glow" style={{
                                borderRadius: '50%', padding: 5,
                                background: 'linear-gradient(135deg, rgba(13,148,136,0.25), rgba(37,99,235,0.25))',
                            }}>
                                <div style={{
                                    width: 180, height: 180,
                                    borderRadius: '50%', overflow: 'hidden',
                                    position: 'relative',
                                    border: '2.5px solid rgba(13,148,136,0.45)'
                                }}>
                                    <AriaAvatar />
                                    {isListening && !isTransitioning && (
                                        <div style={{
                                            position: 'absolute', left: 0, right: 0, height: 2,
                                            background: 'linear-gradient(90deg, transparent, rgba(13,148,136,0.9), transparent)',
                                            animation: 'scanLine 2.8s linear infinite',
                                            pointerEvents: 'none'
                                        }} />
                                    )}
                                </div>
                            </div>

                            {/* Wave bars when listening */}
                            {isListening && !isTransitioning ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 3,
                                    background: '#0d9488', borderRadius: 20, padding: '4px 12px',
                                    marginTop: -8
                                }}>
                                    {[0, 90, 180, 270, 360].map((delay, i) => (
                                        <div key={i} style={{
                                            width: 3, height: [7, 12, 6, 12, 7][i],
                                            background: 'white', borderRadius: 2,
                                            animation: `waveBar 0.85s ease-in-out ${delay}ms infinite`,
                                            transformOrigin: 'center'
                                        }} />
                                    ))}
                                </div>
                            ) : (
                                <div style={{ height: 28 }} />
                            )}

                            {/* Nameplate */}
                            <div style={{ textAlign: 'center', marginTop: -4 }}>
                                <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>Aria</p>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>AI Interviewer · PlaceNxt</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom half — User camera */}
                    <div style={{
                        flex: 1, minHeight: 0,
                        position: 'relative',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        background: '#050810',
                        overflow: 'hidden'
                    }}>
                        {previewStream ? (
                            <video
                                ref={videoPreviewRef}
                                autoPlay muted playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                                <VideoOff style={{ width: 28, height: 28, color: '#374151' }} />
                                <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>Camera not available</p>
                            </div>
                        )}

                        {/* LIVE badge */}
                        {isRecording && !isTransitioning && (
                            <div style={{
                                position: 'absolute', top: 10, left: 10,
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
                                borderRadius: 20, padding: '3px 9px'
                            }}>
                                <div className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                <span style={{ fontSize: 10, color: 'white', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
                            </div>
                        )}

                        {/* You label */}
                        <div style={{
                            position: 'absolute', bottom: 10, left: 0, right: 0,
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>You</span>
                        </div>
                    </div>
                </div>

                {/* ══ RIGHT: Question + Answer ══ */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: 14,
                    padding: '20px 24px 16px',
                    overflowY: 'auto'
                }}>

                    {/* Progress dots row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {session.questions.map((_, i) => (
                            <div key={i} style={{
                                height: 7, borderRadius: 4,
                                width: i === currentQuestionIndex ? 26 : 7,
                                background: i < currentQuestionIndex ? '#0d9488'
                                    : i === currentQuestionIndex ? '#2563eb'
                                    : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.3s ease'
                            }} />
                        ))}
                        <span style={{
                            marginLeft: 6, fontSize: 12, color: '#4b5563',
                            fontFamily: 'DM Mono, monospace'
                        }}>
                            {currentQuestionIndex} / {session.questions.length} answered
                        </span>
                    </div>

                    {/* Speech bubble question */}
                    <div className="speech-bubble fade-up" style={{ padding: '18px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{
                                fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                                color: '#93c5fd', textTransform: 'uppercase'
                            }}>
                                Question {currentQuestionIndex + 1}
                            </span>
                            <span style={{
                                fontSize: 11, padding: '2px 9px', borderRadius: 10,
                                background: 'rgba(37,99,235,0.18)', color: '#93c5fd',
                                border: '1px solid rgba(37,99,235,0.28)'
                            }}>
                                {currentQuestion?.questionType || 'Technical'}
                            </span>
                        </div>
                        <p style={{
                            fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600,
                            color: 'white', lineHeight: 1.65, margin: 0
                        }}>
                            {currentQuestion?.questionText || 'Loading question...'}
                        </p>
                    </div>

                    {/* Thinking time pill */}
                    {thinkingCountdown !== null && isRecording && !isTransitioning && (
                        <div className="think-pulse" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            padding: '8px 18px', borderRadius: 30,
                            background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.22)',
                            alignSelf: 'flex-start'
                        }}>
                            <span style={{ fontSize: 15 }}>💭</span>
                            <span style={{ fontSize: 14, color: '#93c5fd' }}>Take a moment to think...</span>
                            <span style={{
                                fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 700,
                                color: '#2563eb', minWidth: 22, textAlign: 'center'
                            }}>{thinkingCountdown}</span>
                        </div>
                    )}

                    {/* Transcript notepad */}
                    <div className="transcript-panel" style={{ flex: 1, minHeight: 130, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: isListening ? '#10b981' : 'rgba(255,255,255,0.15)',
                                transition: 'background 0.3s ease'
                            }} />
                            <span style={{
                                fontSize: 11, color: '#4b5563',
                                textTransform: 'uppercase', letterSpacing: '0.06em'
                            }}>
                                {isListening ? 'Listening...' : isRecording ? 'Paused' : 'Your Answer'}
                            </span>
                        </div>
                        <div style={{ flex: 1, fontSize: 15, lineHeight: 1.7, color: transcript ? '#e2e8f0' : '#374151' }}>
                            {transcript
                                ? <>{transcript}{isListening && <span style={{ animation: 'cursorBlink 1s ease-in-out infinite', color: '#2563eb' }}>|</span>}</>
                                : <span style={{ fontStyle: 'italic', color: '#374151' }}>
                                    {isRecording ? 'Speak your answer — transcript appears here...' : 'Interview will begin after the checklist is complete.'}
                                  </span>
                            }
                        </div>
                    </div>

                    {/* Coaching badges */}
                    {isRecording && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                            {/* WPM */}
                            <span className="badge-pill" style={{
                                color: wpm > 160 ? '#fbbf24' : wpm > 0 ? '#34d399' : '#6b7280'
                            }}>
                                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{wpm || '--'}</span>
                                <span style={{ color: '#4b5563' }}>WPM</span>
                                <span style={{ color: '#374151' }}>·</span>
                                <span>{wpm > 160 ? 'Fast' : wpm > 0 && wpm < 110 ? 'Slow' : wpm > 0 ? 'Good' : '—'}</span>
                            </span>

                            {/* Tone */}
                            <span className="badge-pill">
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                                    background: toneIsGood ? '#10b981' : toneIsBad ? '#ef4444' : '#6b7280'
                                }} />
                                <span>Tone:</span>
                                <span style={{
                                    fontWeight: 600,
                                    color: toneIsGood ? '#34d399' : toneIsBad ? '#f87171' : '#9ca3af'
                                }}>{toneLabel}</span>
                            </span>

                            {/* Fillers */}
                            <span className="badge-pill" style={{
                                background: fillerCount > 3 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
                                border: fillerCount > 3 ? '1px solid rgba(245,158,11,0.22)' : '1px solid rgba(255,255,255,0.08)',
                                color: fillerCount > 3 ? '#fbbf24' : '#6b7280'
                            }}>
                                {fillerCount} filler{fillerCount !== 1 ? 's' : ''}
                            </span>

                            {/* Word count */}
                            {transcript && (
                                <span className="badge-pill">
                                    {transcript.split(/\s+/).filter(Boolean).length} words
                                </span>
                            )}
                        </div>
                    )}

                    {/* CTA button */}
                    <button
                        onClick={isRecording ? advanceQuestion : undefined}
                        disabled={isSubmitting || isTransitioning || !isRecording}
                        style={{
                            padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                            fontFamily: 'Sora, sans-serif', cursor: isRecording && !isSubmitting && !isTransitioning ? 'pointer' : 'not-allowed',
                            background: isRecording
                                ? 'linear-gradient(135deg, #2563eb 0%, #0d9488 100%)'
                                : 'rgba(255,255,255,0.07)',
                            color: isRecording ? 'white' : '#4b5563',
                            border: 'none',
                            boxShadow: isRecording ? '0 4px 20px rgba(37,99,235,0.28), 0 4px 20px rgba(13,148,136,0.18)' : 'none',
                            opacity: (isSubmitting || isTransitioning) ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="icon-spin" style={{ width: 18, height: 18 }} /> Submitting answer...</>
                        ) : isTransitioning ? (
                            <><Loader2 className="icon-spin" style={{ width: 18, height: 18 }} /> Loading next question...</>
                        ) : isRecording ? (
                            <><ChevronRight style={{ width: 18, height: 18 }} /> Submit &amp; Next Question</>
                        ) : (
                            <>Waiting for interview to start...</>
                        )}
                    </button>

                    {/* Teal depleting progress bar */}
                    <div style={{
                        height: 3, borderRadius: 3,
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden', flexShrink: 0
                    }}>
                        <div style={{
                            height: '100%', borderRadius: 3,
                            width: isRecording && !isTransitioning ? `${progressPct}%` : isTransitioning ? '100%' : '100%',
                            background: isLowTime ? '#ef4444' : isMidTime ? '#f59e0b' : '#0d9488',
                            transition: isRecording && !isTransitioning ? 'width 1s linear, background 0.5s ease' : 'none'
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
