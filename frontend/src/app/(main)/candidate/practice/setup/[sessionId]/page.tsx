'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authFetchJson } from '@/lib/auth-fetch';
import { Loader2, AlertCircle } from 'lucide-react';

const WARMUP_PHRASE = "I'm a full-stack developer with three years of experience building scalable APIs and React applications.";

interface SessionInfo {
    id: string;
    targetRole?: string;
    type?: string;
    difficulty?: string;
    questions?: any[];
}

export default function PreInterviewSetupPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [step, setStep] = useState(1);
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [micStatus, setMicStatus] = useState<'idle' | 'ok' | 'error'>('idle');
    const [camStatus, setCamStatus] = useState<'idle' | 'ok' | 'error'>('idle');
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [wpm, setWpm] = useState(0);
    const [fillerCount, setFillerCount] = useState(0);
    const [isWarmupListening, setIsWarmupListening] = useState(false);
    const warmupRecognitionRef = useRef<any>(null);
    const warmupStartRef = useRef<number>(0);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data, error: err } = await authFetchJson(`/interviews/sessions/${sessionId}`);
                if (err || !data) throw new Error(err || 'Failed to load session');
                setSession(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        if (sessionId) fetchSession();
    }, [sessionId]);

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
        if (step === 1) checkDevices();
    }, [step, checkDevices]);

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
        if (step === 2) startWarmup();
        if (step !== 2) stopWarmup();
    }, [step, startWarmup, stopWarmup]);

    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
            warmupRecognitionRef.current?.stop();
        };
    }, []);

    const goToRoom = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        router.push(`/candidate/practice/room/${sessionId}`);
    };

    const questionCount = session?.questions?.length ?? 7;
    const diffLabel = session?.difficulty ?? 'MEDIUM';
    const typeLabel = session?.type ?? 'TECHNICAL';
    const estMinutes = questionCount * 3;

    if (loading) return (
        <div className="flex h-screen items-center justify-center" style={{ background: '#0a0f14' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2563EB' }} />
        </div>
    );

    if (error) return (
        <div className="flex h-screen items-center justify-center p-6" style={{ background: '#0a0f14' }}>
            <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-white mb-6">{error}</p>
                <button onClick={() => router.push('/candidate/practice')}
                    className="px-6 py-3 rounded-xl text-white font-semibold" style={{ background: '#2563EB' }}>
                    Back to Practice
                </button>
            </div>
        </div>
    );

    const wpmColor = wpm === 0 ? 'rgba(255,255,255,.4)' : wpm >= 120 && wpm <= 160 ? '#2DD4BF' : '#F59E0B';
    const wpmLabel = wpm === 0 ? '—' : wpm >= 120 && wpm <= 160 ? '✓ Ideal pace' : wpm < 120 ? '↑ Speak faster' : '↓ Slow down';
    const clarityScore = wpm === 0 ? null : Math.max(50, Math.min(100, 100 - fillerCount * 8 - (wpm > 165 ? 12 : 0) - (wpm < 100 ? 15 : 0)));
    const clarityColor = clarityScore === null ? 'rgba(255,255,255,.4)' : clarityScore >= 80 ? '#2DD4BF' : '#F59E0B';
    const clarityFeedback = clarityScore === null ? 'Start speaking' : clarityScore >= 80 ? '✓ Clear' : '↑ Enunciate more';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
                @keyframes mb1{0%,100%{height:5px}50%{height:26px}}
                @keyframes mb2{0%,100%{height:16px}50%{height:7px}}
                @keyframes mb3{0%,100%{height:22px}40%{height:6px}}
                @keyframes mb4{0%,100%{height:8px}60%{height:30px}}
                @keyframes mb5{0%,100%{height:18px}50%{height:6px}}
                @keyframes mb6{0%,100%{height:11px}45%{height:24px}}
                @keyframes mb7{0%,100%{height:20px}55%{height:8px}}
                @keyframes mb8{0%,100%{height:6px}50%{height:22px}}
                @keyframes mb9{0%,100%{height:14px}50%{height:28px}}
                @keyframes mb10{0%,100%{height:9px}50%{height:18px}}
                @keyframes mb11{0%,100%{height:20px}50%{height:5px}}
                @keyframes mb12{0%,100%{height:12px}50%{height:25px}}
                .smi-mb1{animation:mb1 .8s ease-in-out infinite}
                .smi-mb2{animation:mb2 .65s ease-in-out infinite .1s}
                .smi-mb3{animation:mb3 .9s ease-in-out infinite .2s}
                .smi-mb4{animation:mb4 .7s ease-in-out infinite .05s}
                .smi-mb5{animation:mb5 1s ease-in-out infinite .15s}
                .smi-mb6{animation:mb6 .75s ease-in-out infinite .25s}
                .smi-mb7{animation:mb7 .85s ease-in-out infinite .1s}
                .smi-mb8{animation:mb8 .6s ease-in-out infinite .3s}
                .smi-mb9{animation:mb9 .95s ease-in-out infinite .08s}
                .smi-mb10{animation:mb10 .78s ease-in-out infinite .18s}
                .smi-mb11{animation:mb11 .68s ease-in-out infinite .22s}
                .smi-mb12{animation:mb12 .88s ease-in-out infinite .12s}
                @keyframes livePulse{0%,100%{opacity:1}50%{opacity:.3}}
                .smi-live{animation:livePulse 1.4s ease-in-out infinite}
                @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
                .smi-fadeup{animation:fadeUp .45s ease forwards}
                .smi-glass{background:rgba(255,255,255,.04);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.07);}
                .smi-body{font-family:'DM Sans',sans-serif;}
                .smi-sora{font-family:'Sora',sans-serif;}
                .smi-mono{font-family:'DM Mono',monospace;}
            `}</style>

            <div className="smi-body min-h-screen flex flex-col" style={{ background: '#0a0f14', color: '#fff' }}>
                {/* Top nav */}
                <div style={{ background: 'rgba(10,15,20,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, background: '#2563EB', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.5" fill="none" /><circle cx="7" cy="7" r="2" fill="white" /></svg>
                    </div>
                    <span className="smi-sora" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.3px' }}>PlaceNxt</span>
                    <span style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(255,255,255,.4)' }}>Pre-Interview Setup</span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'radial-gradient(ellipse at 50% 0%,rgba(37,99,235,.07) 0%,transparent 65%)' }}>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48, width: '100%', maxWidth: 480 }}>
                        {[
                            { n: 1, label: 'Device Check' },
                            { n: 2, label: 'Warm-up' },
                            { n: 3, label: 'Interview Brief' },
                        ].map((s, i) => (
                            <React.Fragment key={s.n}>
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => s.n < step && setStep(s.n)}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: '50%',
                                        background: step >= s.n ? '#2563EB' : 'rgba(255,255,255,.07)',
                                        border: step >= s.n ? 'none' : '1px solid rgba(255,255,255,.12)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 700,
                                        color: step >= s.n ? '#fff' : 'rgba(255,255,255,.35)',
                                        transition: 'all .3s',
                                    }} className="smi-sora">{s.n}</div>
                                    <span style={{
                                        position: 'absolute', top: 42, left: '50%', transform: 'translateX(-50%)',
                                        whiteSpace: 'nowrap', fontSize: 11, fontWeight: 500,
                                        color: step >= s.n ? '#3B82F6' : 'rgba(255,255,255,.25)',
                                    }}>{s.label}</span>
                                </div>
                                {i < 2 && <div style={{ flex: 1, height: 1, margin: '0 4px', background: step > s.n ? '#2563EB' : 'rgba(255,255,255,.08)', transition: 'all .4s' }} />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step content */}
                    <div style={{ width: '100%', maxWidth: 620 }}>

                        {/* ── STEP 1: Device Check ── */}
                        {step === 1 && (
                            <div className="smi-fadeup">
                                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                                    <h1 className="smi-sora" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Check your setup</h1>
                                    <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 15 }}>Make sure your devices are working before we start</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    {/* Mic */}
                                    <div className="smi-glass" style={{ borderRadius: 20, padding: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(13,148,136,.15)', border: '1px solid rgba(13,148,136,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>Microphone</div>
                                                <div style={{ fontSize: 11, color: micStatus === 'ok' ? '#2DD4BF' : micStatus === 'error' ? '#EF4444' : 'rgba(255,255,255,.4)' }}>
                                                    {micStatus === 'ok' ? '● Clear signal' : micStatus === 'error' ? '● Not detected' : '● Checking...'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36, padding: '0 4px' }}>
                                            {['smi-mb1','smi-mb2','smi-mb3','smi-mb4','smi-mb5','smi-mb6','smi-mb7','smi-mb8','smi-mb9','smi-mb10','smi-mb11','smi-mb12'].map(cls => (
                                                <div key={cls} className={cls} style={{ width: '100%', borderRadius: 2, background: 'linear-gradient(to top,#0D9488,#2DD4BF)', minHeight: 3 }} />
                                            ))}
                                        </div>
                                        <div className="smi-mono" style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Input level: good</div>
                                    </div>

                                    {/* Camera */}
                                    <div className="smi-glass" style={{ borderRadius: 20, padding: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,.15)', border: '1px solid rgba(37,99,235,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
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
                                            {camStatus !== 'ok' && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                                            {camStatus === 'ok' && (
                                                <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,.8)', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span className="smi-live" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                                                    <span className="smi-mono">LIVE</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Lighting row */}
                                <div className="smi-glass" style={{ borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Lighting</div>
                                        <div style={{ fontSize: 12, color: 'rgba(245,158,11,.8)' }}>Face a window or bright light source for best video quality</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                                    </div>
                                </div>

                                <button onClick={() => setStep(2)} style={{ width: '100%', padding: 15, borderRadius: 14, background: 'linear-gradient(135deg,#2563EB,#1d4ed8)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} className="smi-sora">
                                    Looks good — Continue
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        )}

                        {/* ── STEP 2: Warm-up ── */}
                        {step === 2 && (
                            <div className="smi-fadeup">
                                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                                    <h1 className="smi-sora" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Quick warm-up</h1>
                                    <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 15 }}>Read this phrase aloud to calibrate your pacing</p>
                                </div>

                                <div className="smi-glass" style={{ borderRadius: 20, padding: 32, marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#2563EB,#0D9488)' }} />
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.35)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 20 }}>Say this phrase aloud</div>
                                    <blockquote className="smi-sora" style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.6, color: 'rgba(255,255,255,.9)', fontStyle: 'italic' }}>
                                        "{WARMUP_PHRASE}"
                                    </blockquote>
                                    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24 }}>
                                            {['smi-mb3','smi-mb7','smi-mb1','smi-mb5','smi-mb9','smi-mb2'].map(cls => (
                                                <div key={cls} className={cls} style={{ width: 3, borderRadius: 2, background: '#14B8A6', minHeight: 2 }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{isWarmupListening ? 'Listening...' : 'Microphone ready'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
                                    <div className="smi-glass" style={{ borderRadius: 14, padding: 16, textAlign: 'center' }}>
                                        <div className="smi-mono" style={{ fontSize: 26, fontWeight: 500, color: wpmColor }}>{wpm || '—'}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>WPM</div>
                                        <div style={{ fontSize: 10, color: wpmColor, marginTop: 2 }}>{wpm ? wpmLabel : 'Start speaking'}</div>
                                    </div>
                                    <div className="smi-glass" style={{ borderRadius: 14, padding: 16, textAlign: 'center' }}>
                                        <div className="smi-mono" style={{ fontSize: 26, fontWeight: 500, color: fillerCount === 0 ? '#2DD4BF' : '#F59E0B' }}>{fillerCount}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>Filler words</div>
                                        <div style={{ fontSize: 10, color: fillerCount === 0 ? '#2DD4BF' : '#F59E0B', marginTop: 2 }}>{fillerCount === 0 ? '✓ Clean' : `↓ Watch "um/uh"`}</div>
                                    </div>
                                    <div className="smi-glass" style={{ borderRadius: 14, padding: 16, textAlign: 'center' }}>
                                        <div className="smi-mono" style={{ fontSize: 26, fontWeight: 500, color: '#60A5FA' }}>Live</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>Clarity</div>
                                        <div style={{ fontSize: 10, color: '#60A5FA', marginTop: 2 }}>Speak clearly</div>
                                    </div>
                                </div>

                                <button onClick={() => setStep(3)} style={{ width: '100%', padding: 15, borderRadius: 14, background: 'linear-gradient(135deg,#2563EB,#1d4ed8)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} className="smi-sora">
                                    Continue to Interview Brief
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        )}

                        {/* ── STEP 3: Interview Brief ── */}
                        {step === 3 && (
                            <div className="smi-fadeup">
                                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                    <h1 className="smi-sora" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>You're almost ready</h1>
                                    <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 15 }}>Here's what to expect in your session</p>
                                </div>

                                <div className="smi-glass" style={{ borderRadius: 20, padding: 28, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#2563EB,#0D9488)' }} />
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Role</div>
                                            <div className="smi-sora" style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{session?.targetRole || 'Software Developer'}</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(37,99,235,.15)', border: '1px solid rgba(37,99,235,.25)', fontSize: 12, fontWeight: 500, color: '#60A5FA' }}>
                                                    {typeLabel.charAt(0) + typeLabel.slice(1).toLowerCase()}
                                                </span>
                                                <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(13,148,136,.15)', border: '1px solid rgba(13,148,136,.25)', fontSize: 12, fontWeight: 500, color: '#2DD4BF' }}>
                                                    {questionCount} Questions
                                                </span>
                                                <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', fontSize: 12, fontWeight: 500, color: '#F59E0B' }}>
                                                    {diffLabel.charAt(0) + diffLabel.slice(1).toLowerCase()}
                                                </span>
                                                <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.6)' }}>
                                                    3 min / question
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 4 }}>Estimated time</div>
                                            <div className="smi-mono" style={{ fontSize: 28, fontWeight: 500, color: '#60A5FA' }}>~{estMinutes}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>minutes</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tip card */}
                                <div style={{ borderRadius: 16, padding: '18px 22px', background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.15)', display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 28 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#10B981', marginBottom: 4 }}>Coach tip</div>
                                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>Take 5–7 seconds to think before answering. Silence is natural and expected. Structure your answer as: context → what you did → result.</div>
                                    </div>
                                </div>

                                <button onClick={goToRoom} style={{ width: '100%', padding: 16, borderRadius: 14, background: 'linear-gradient(135deg,#2563EB,#1d4ed8)', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 32px rgba(37,99,235,.35)' }} className="smi-sora">
                                    I'm Ready — Start Interview
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
