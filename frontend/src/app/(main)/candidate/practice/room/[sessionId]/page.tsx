'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authFetch, authFetchJson } from '@/lib/auth-fetch';
import { Loader2, AlertCircle } from 'lucide-react';

const MAX_TRANSCRIPT_CHARS = 6000;
const QUESTION_TIME_SECONDS = 180;
const THINK_TIME_SECONDS = 7;

interface InterviewSession {
    id: string;
    status: string;
    targetRole?: string;
    type?: string;
    difficulty?: string;
    questions?: any[];
}

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    orderIndex: number;
}

const ARIA_SVG = (
    <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <defs>
            <radialGradient id="arBg" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#1a2332" />
                <stop offset="100%" stopColor="#111820" />
            </radialGradient>
            <radialGradient id="arSkin" cx="50%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#2d3d55" />
                <stop offset="100%" stopColor="#1a2332" />
            </radialGradient>
        </defs>
        <circle cx="110" cy="110" r="108" fill="url(#arBg)" stroke="rgba(37,99,235,.4)" strokeWidth="1.5" />
        <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(13,148,136,.1)" strokeWidth="1" strokeDasharray="4 8" />
        <ellipse cx="110" cy="120" rx="64" ry="74" fill="url(#arSkin)" />
        <ellipse cx="110" cy="60" rx="64" ry="42" fill="#243044" />
        <rect x="46" y="60" width="128" height="28" fill="#243044" />
        <path d="M 60 52 Q 110 35 160 52" fill="#2d3d55" opacity=".6" />
        <ellipse cx="110" cy="125" rx="52" ry="62" fill="#243044" opacity=".6" />
        <ellipse cx="84" cy="108" rx="18" ry="19" fill="#111820" opacity=".8" />
        <circle cx="84" cy="109" r="11" fill="#0D9488" opacity=".9" />
        <circle cx="84" cy="109" r="6.5" fill="#0a0f14" />
        <circle cx="87.5" cy="105.5" r="3" fill="white" opacity=".65" />
        <circle cx="82" cy="112" r="1.2" fill="white" opacity=".25" />
        <ellipse cx="136" cy="108" rx="18" ry="19" fill="#111820" opacity=".8" />
        <circle cx="136" cy="109" r="11" fill="#0D9488" opacity=".9" />
        <circle cx="136" cy="109" r="6.5" fill="#0a0f14" />
        <circle cx="139.5" cy="105.5" r="3" fill="white" opacity=".65" />
        <path d="M 68 91 Q 84 83 100 88" stroke="#60A5FA" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 120 88 Q 136 83 152 91" stroke="#60A5FA" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 103 122 Q 110 138 117 122" stroke="rgba(255,255,255,.12)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 88 155 Q 110 170 132 155" stroke="#3B82F6" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 93 154 Q 110 158 127 154" stroke="rgba(37,99,235,.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="110" cy="182" rx="38" ry="12" fill="#1a2332" opacity=".7" />
        <path d="M 72 194 Q 88 186 110 188 Q 132 186 148 194 L 160 220 L 60 220 Z" fill="#1a2332" />
        <path d="M 88 188 L 110 200 L 132 188" stroke="#2563EB" strokeWidth="1.5" fill="rgba(26,35,50,.8)" />
        <circle cx="110" cy="16" r="5" fill="#2563EB" opacity=".5" />
        <circle cx="110" cy="16" r="9" fill="none" stroke="#2563EB" strokeWidth="1" opacity=".2" />
        <line x1="8" y1="110" x2="28" y2="110" stroke="#2563EB" strokeWidth="1" opacity=".25" />
        <line x1="28" y1="110" x2="28" y2="85" stroke="#2563EB" strokeWidth="1" opacity=".25" />
        <circle cx="28" cy="85" r="2.5" fill="#2563EB" opacity=".35" />
        <line x1="212" y1="110" x2="192" y2="110" stroke="#0D9488" strokeWidth="1" opacity=".25" />
        <line x1="192" y1="110" x2="192" y2="135" stroke="#0D9488" strokeWidth="1" opacity=".25" />
        <circle cx="192" cy="135" r="2.5" fill="#0D9488" opacity=".35" />
    </svg>
);

export default function CandidateInterviewPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [viewState, setViewState] = useState<'loading' | 'interview' | 'completed' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const recognitionRef = useRef<any>(null);
    const [liveTranscript, setLiveTranscript] = useState('');
    const finalTranscriptRef = useRef('');
    const recordingStartTimeRef = useRef(0);

    const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME_SECONDS);
    const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [thinkTime, setThinkTime] = useState(0);
    const thinkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [showThinkTime, setShowThinkTime] = useState(false);

    const [wpm, setWpm] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [fillerCount, setFillerCount] = useState(0);

    const FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'so', 'right'];

    const startThinkTimer = useCallback(() => {
        setThinkTime(THINK_TIME_SECONDS);
        setShowThinkTime(true);
        if (thinkTimerRef.current) clearInterval(thinkTimerRef.current);
        thinkTimerRef.current = setInterval(() => {
            setThinkTime(prev => {
                if (prev <= 1) {
                    clearInterval(thinkTimerRef.current!);
                    setShowThinkTime(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        const q = questions[currentQuestionIndex];
        if (q) {
            setLiveTranscript('');
            finalTranscriptRef.current = '';
            setSubmitError(null);
            setQuestionTimeLeft(QUESTION_TIME_SECONDS);
            setWpm(0);
            setWordCount(0);
            setFillerCount(0);
            setIsRecording(false);
            startThinkTimer();
        }
    }, [currentQuestionIndex, questions, startThinkTimer]);

    useEffect(() => {
        if (viewState !== 'interview') return;
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
        questionTimerRef.current = setInterval(() => {
            setQuestionTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(questionTimerRef.current!);
                    if (recognitionRef.current) recognitionRef.current.stop();
                    setIsRecording(false);
                    submitAnswer();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
    }, [viewState, currentQuestionIndex]); // eslint-disable-line

    useEffect(() => {
        const init = async () => {
            setViewState('loading');
            try {
                const { data, error } = await authFetchJson(`/interviews/sessions/${sessionId}`);
                if (error || !data) throw new Error(error || 'Failed to load session');
                setSession(data);

                let qs = data.questions || [];
                if (!qs.length) {
                    const startRes = await authFetchJson(`/interviews/sessions/${sessionId}/start`, { method: 'POST' });
                    if (startRes.error) throw new Error(startRes.error);
                    qs = startRes.data?.questions || [];
                }

                const firstUnanswered = qs.findIndex((q: any) => !q.userAnswer);
                if (firstUnanswered === -1) {
                    setViewState('completed');
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;

                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const rec = new SpeechRecognition();
                    rec.continuous = true;
                    rec.interimResults = true;
                    rec.onresult = (event: any) => {
                        let interimTranscript = '';
                        let finalChunk = '';
                        for (let i = event.resultIndex; i < event.results.length; ++i) {
                            if (event.results[i].isFinal) finalChunk += event.results[i][0].transcript;
                            else interimTranscript += event.results[i][0].transcript;
                        }
                        if (finalChunk) {
                            const combined = (finalTranscriptRef.current + ' ' + finalChunk).trim();
                            finalTranscriptRef.current = combined.length > MAX_TRANSCRIPT_CHARS ? combined.slice(-MAX_TRANSCRIPT_CHARS) : combined;
                        }
                        const full = finalTranscriptRef.current + ' ' + interimTranscript;
                        setLiveTranscript(full);
                        const words = full.trim().split(/\s+/).filter(Boolean);
                        setWordCount(words.length);
                        const elapsed = (Date.now() - recordingStartTimeRef.current) / 60000;
                        if (elapsed > 0.05) setWpm(Math.round(words.length / elapsed));
                        const fillers = FILLERS.filter(f => full.toLowerCase().includes(f)).length;
                        setFillerCount(fillers);
                    };
                    rec.onerror = (e: any) => console.error('Speech error', e.error);
                    recognitionRef.current = rec;
                }

                setQuestions(qs);
                setCurrentQuestionIndex(firstUnanswered);
                setViewState('interview');
                startThinkTimer();
            } catch (err: any) {
                setErrorMsg(err.message);
                setViewState('error');
            }
        };
        if (sessionId) init();
    }, [sessionId]); // eslint-disable-line

    const toggleRecording = () => {
        if (!isRecording) {
            if (thinkTimerRef.current) clearInterval(thinkTimerRef.current);
            setShowThinkTime(false);
            setLiveTranscript('');
            finalTranscriptRef.current = '';
            recordingStartTimeRef.current = Date.now();
            if (recognitionRef.current) {
                try { recognitionRef.current.start(); } catch { /* already started */ }
            }
            setIsRecording(true);
        } else {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
            submitAnswer();
        }
    };

    const submitAnswer = useCallback(async () => {
        if (!session || isSubmitting) return;
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const durationMinutes = (Date.now() - recordingStartTimeRef.current) / 1000 / 60;
            const finalString = finalTranscriptRef.current.trim() || liveTranscript.trim() || '(No speech detected)';
            const wc = finalString.split(/\s+/).filter(w => w.length > 0).length;
            const currentWpm = durationMinutes > 0 ? Math.round(wc / durationMinutes) : 0;
            const currentQ = questions[currentQuestionIndex];

            const submitRes = await authFetchJson(`/interviews/sessions/${session.id}/answer/video`, {
                method: 'POST',
                body: JSON.stringify({
                    questionId: currentQ.id,
                    transcript: finalString,
                    metrics: { wpm: currentWpm, sentiment: 'focused' }
                })
            });

            if (submitRes.error) throw new Error(submitRes.error);
            if (submitRes.data?.evaluation?.isFallback) setSubmitError('AI evaluation temporarily unavailable — your answer was recorded.');

            if (submitRes.data?.isComplete) {
                await authFetch(`/interviews/sessions/${session.id}/complete`, { method: 'POST' });
                if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
                setViewState('completed');
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        } catch (err: any) {
            setSubmitError(`Failed to submit: ${err.message}. Try again.`);
        } finally {
            setIsSubmitting(false);
        }
    }, [session, isSubmitting, questions, currentQuestionIndex, liveTranscript]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const progressPct = (questionTimeLeft / QUESTION_TIME_SECONDS) * 100;

    if (viewState === 'loading') return (
        <div className="flex h-screen items-center justify-center" style={{ background: '#0a0f14' }}>
            <div style={{ textAlign: 'center' }}>
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: '#2563EB' }} />
                <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Setting up your interview session...</p>
            </div>
        </div>
    );

    if (viewState === 'error') return (
        <div className="flex h-screen items-center justify-center p-6" style={{ background: '#0a0f14' }}>
            <div style={{ textAlign: 'center', maxWidth: 400 }}>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: 'Sora, sans-serif' }}>Something went wrong</h2>
                <p style={{ color: 'rgba(255,255,255,.5)', marginBottom: 24 }}>{errorMsg}</p>
                <button onClick={() => router.push('/candidate/practice')}
                    style={{ padding: '12px 24px', borderRadius: 12, background: '#2563EB', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    Back to Practice Hub
                </button>
            </div>
        </div>
    );

    if (viewState === 'completed') return (
        <div className="flex h-screen items-center justify-center p-6" style={{ background: '#0a0f14' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 12, fontFamily: 'Sora, sans-serif' }}>Interview Complete!</h1>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', marginBottom: 32, fontFamily: 'DM Sans, sans-serif' }}>
                    Your answers have been recorded and evaluated by AI. View your detailed feedback below.
                </p>
                <button onClick={() => router.push(`/candidate/practice/feedback/${sessionId}`)}
                    style={{ padding: '14px 36px', borderRadius: 14, background: 'linear-gradient(135deg,#2563EB,#1d4ed8)', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', boxShadow: '0 8px 32px rgba(37,99,235,.35)' }}>
                    View AI Feedback →
                </button>
            </div>
        </div>
    );

    const currentQuestion = questions[currentQuestionIndex];
    const wpmColor = wpm === 0 ? 'rgba(255,255,255,.5)' : wpm >= 120 && wpm <= 160 ? '#10B981' : '#F59E0B';
    const toneLabel = fillerCount <= 1 ? 'Confident' : fillerCount <= 3 ? 'Steady' : 'Nervous';
    const toneColor = fillerCount <= 1 ? '#10B981' : fillerCount <= 3 ? '#14B8A6' : '#F59E0B';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
                @keyframes irNod{0%,80%,100%{transform:translateY(0) rotate(0deg)}84%{transform:translateY(-5px) rotate(-1.2deg)}92%{transform:translateY(2px) rotate(.5deg)}}
                @keyframes irGlow{0%,100%{box-shadow:0 0 30px rgba(37,99,235,.25),0 0 60px rgba(13,148,136,.12)}50%{box-shadow:0 0 45px rgba(37,99,235,.4),0 0 90px rgba(13,148,136,.2)}}
                @keyframes irScan{0%{top:-2px}100%{top:102%}}
                @keyframes irLive{0%,100%{opacity:1}50%{opacity:.3}}
                @keyframes irBlink{0%,100%{opacity:1}50%{opacity:0}}
                @keyframes irThinkPulse{0%,100%{background:rgba(13,148,136,.1)}50%{background:rgba(13,148,136,.22)}}
                .ir-nod{animation:irNod 5s ease-in-out infinite}
                .ir-glow{animation:irGlow 3s ease-in-out infinite}
                .ir-scan{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(13,148,136,.35),transparent);animation:irScan 4s linear infinite;pointer-events:none}
                .ir-live{animation:irLive 1.4s ease-in-out infinite}
                .ir-blink{animation:irBlink 1.1s ease-in-out infinite}
                .ir-think{animation:irThinkPulse 1s ease-in-out infinite}
                .ir-glass{background:rgba(255,255,255,.04);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.07)}
                .ir-body{font-family:'DM Sans',sans-serif}
                .ir-sora{font-family:'Sora',sans-serif}
                .ir-mono{font-family:'DM Mono',monospace}
            `}</style>

            <div className="ir-body" style={{ display: 'grid', gridTemplateColumns: '42% 58%', height: '100vh', background: '#0a0f14', overflow: 'hidden' }}>

                {/* ── LEFT: Avatar + Camera ── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, borderRight: '1px solid rgba(255,255,255,.05)', position: 'relative', gap: 24 }}>
                    {/* Grid bg */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.03) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

                    {/* Avatar */}
                    <div className="ir-nod" style={{ position: 'relative' }}>
                        <div className="ir-glow" style={{ width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                            {ARIA_SVG}
                            <div className="ir-scan" />
                        </div>
                        {/* Status pill */}
                        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                            <span className="ir-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                            <span className="ir-mono" style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>ACTIVE</span>
                        </div>
                    </div>

                    {/* Nameplate */}
                    <div style={{ textAlign: 'center' }}>
                        <div className="ir-sora" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Aria</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>AI Interviewer · PlaceNxt</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                            <div className="ir-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#14B8A6' }} />
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
                                {isRecording ? 'Listening to your answer' : showThinkTime ? 'Thinking time...' : 'Ready when you are'}
                            </span>
                        </div>
                    </div>

                    {/* Student PiP cam */}
                    <div style={{ width: 140, borderRadius: 14, overflow: 'hidden', position: 'relative', border: '2px solid rgba(255,255,255,.08)' }}>
                        <div style={{ aspectRatio: '4/3', background: '#1a2332', position: 'relative', overflow: 'hidden' }}>
                            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted playsInline />
                        </div>
                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(239,68,68,.8)', borderRadius: 4, padding: '2px 5px', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }} className="ir-mono">
                            <span className="ir-live" style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                            REC
                        </div>
                        <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,.04)', borderTop: '1px solid rgba(255,255,255,.05)', fontSize: 10, color: 'rgba(255,255,255,.4)' }}>You</div>
                    </div>
                </div>

                {/* ── RIGHT: Question + Answer ── */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '28px 32px', overflow: 'hidden' }}>

                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="ir-mono" style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(37,99,235,.15)', border: '1px solid rgba(37,99,235,.25)', fontSize: 13, fontWeight: 600, color: '#60A5FA' }}>
                                Q {currentQuestionIndex + 1} / {questions.length}
                            </span>
                            {/* Progress dots */}
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                {questions.map((_, i) => (
                                    <div key={i} style={{
                                        width: i === currentQuestionIndex ? 10 : 8,
                                        height: i === currentQuestionIndex ? 10 : 8,
                                        borderRadius: '50%',
                                        background: i < currentQuestionIndex ? '#10B981' : i === currentQuestionIndex ? '#3B82F6' : 'rgba(255,255,255,.1)',
                                        boxShadow: i === currentQuestionIndex ? '0 0 8px rgba(59,130,246,.5)' : undefined,
                                        transition: 'all .3s',
                                    }} />
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{session?.type || 'Technical'} · {session?.difficulty || 'Medium'}</div>
                            <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); router.push('/candidate/practice'); }}
                                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,.25)', background: 'rgba(239,68,68,.08)', color: 'rgba(239,68,68,.8)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                                End Session
                            </button>
                        </div>
                    </div>

                    {/* Question bubble */}
                    <div style={{ background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.18)', borderRadius: '18px 18px 18px 4px', padding: '22px 26px', marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Aria is asking</span>
                        </div>
                        <p className="ir-sora" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.6, color: 'rgba(255,255,255,.95)' }}>
                            {currentQuestion?.questionText || 'Loading question...'}
                        </p>
                    </div>

                    {/* Thinking time pill */}
                    {showThinkTime && (
                        <div className="ir-think" style={{ borderRadius: 12, padding: '10px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(13,148,136,.2)' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(13,148,136,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span className="ir-mono" style={{ fontSize: 14, fontWeight: 700, color: '#2DD4BF' }}>{thinkTime}</span>
                            </div>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>Take a moment to collect your thoughts — recording starts when you're ready</span>
                        </div>
                    )}

                    {/* Transcript / answer area */}
                    <div style={{ flex: 1, background: '#111820', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: '20px 22px', overflowY: 'auto', marginBottom: 18, position: 'relative', minHeight: 120 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.2)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Your answer</div>
                        {liveTranscript ? (
                            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,.8)' }}>
                                {liveTranscript.slice(-800)}
                                {isRecording && <span className="ir-blink" style={{ display: 'inline-block', width: 2, height: 18, background: '#3B82F6', marginLeft: 2, verticalAlign: 'text-bottom', borderRadius: 1 }} />}
                            </p>
                        ) : (
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.2)', fontStyle: 'italic' }}>
                                {isRecording ? 'Listening...' : 'Your answer will appear here as you speak.'}
                                {isRecording && <span className="ir-blink" style={{ display: 'inline-block', width: 2, height: 16, background: '#3B82F6', marginLeft: 2, verticalAlign: 'text-bottom', borderRadius: 1 }} />}
                            </p>
                        )}
                    </div>

                    {/* Submit error */}
                    {submitError && (
                        <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', color: '#F59E0B', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            {submitError}
                            <button onClick={() => setSubmitError(null)} style={{ marginLeft: 'auto', opacity: .6, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}>✕</button>
                        </div>
                    )}

                    {/* Coaching badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Live</span>
                        <div style={{ padding: '4px 10px', borderRadius: 20, background: `${wpmColor}1a`, border: `1px solid ${wpmColor}33`, fontSize: 11, fontWeight: 600, color: wpmColor, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 19V6l12-3v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="15" r="3" /></svg>
                            {wpm || '—'} WPM
                        </div>
                        <div style={{ padding: '4px 10px', borderRadius: 20, background: `${toneColor}1a`, border: `1px solid ${toneColor}33`, fontSize: 11, fontWeight: 600, color: toneColor, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                            {toneLabel} tone
                        </div>
                        {fillerCount > 0 && (
                            <div style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', fontSize: 11, fontWeight: 600, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                {fillerCount} filler{fillerCount > 1 ? 's' : ''}
                            </div>
                        )}
                        <div className="ir-mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{wordCount} words</div>
                    </div>

                    {/* CTA + progress bar */}
                    <div>
                        <button onClick={toggleRecording} disabled={isSubmitting}
                            style={{
                                width: '100%', padding: 15, borderRadius: 14, border: 'none', color: '#fff',
                                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                marginBottom: 10, transition: 'all .3s',
                                background: isSubmitting ? 'rgba(255,255,255,.08)' : isRecording
                                    ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                                    : 'linear-gradient(135deg,#2563EB,#1d4ed8)',
                                boxShadow: isRecording ? '0 6px 24px rgba(220,38,38,.3)' : '0 6px 24px rgba(37,99,235,.25)',
                                opacity: isSubmitting ? .6 : 1,
                            }} className="ir-sora">
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating your answer...</>
                            ) : isRecording ? (
                                <><span className="ir-live" style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,.8)', display: 'inline-block' }} /> Stop Recording · Submit Answer</>
                            ) : (
                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg> Start Answering</>
                            )}
                        </button>

                        {/* Depleting progress bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    background: questionTimeLeft < 30 ? 'linear-gradient(90deg,#EF4444,#f87171)' : 'linear-gradient(90deg,#0D9488,#14B8A6)',
                                    borderRadius: 2,
                                    width: `${progressPct}%`,
                                    transition: 'width 1s linear, background .3s',
                                }} />
                            </div>
                            <div className="ir-mono" style={{ fontSize: 11, color: questionTimeLeft < 30 ? '#f87171' : 'rgba(255,255,255,.3)', flexShrink: 0 }}>
                                {formatTime(questionTimeLeft)} remaining
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
