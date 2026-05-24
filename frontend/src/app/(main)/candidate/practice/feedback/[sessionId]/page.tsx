'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authFetchJson } from '@/lib/auth-fetch';
import { Loader2, AlertCircle } from 'lucide-react';
import AIDisclaimer from '@/components/ui/AIDisclaimer';

interface QuestionResult {
    id: string;
    questionText: string;
    questionType?: string;
    userAnswer: string;
    score: number;
    feedback: string;
    metrics?: any;
    improvedAnswer?: string;
    starAnalysis?: {
        situation?: { score: number };
        task?: { score: number };
        action?: { score: number };
        result?: { score: number };
    };
}

interface SessionResult {
    id: string;
    targetRole?: string;
    type?: string;
    difficulty?: string;
    createdAt: string;
    status: string;
    overallScore: number;
    feedback: string;
    questions: QuestionResult[];
}

function scoreColor(s: number) {
    if (s >= 75) return '#10B981';
    if (s >= 50) return '#F59E0B';
    return '#EF4444';
}

function ScoreRing({ score }: { score: number }) {
    const r = 34;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const color = scoreColor(score);
    return (
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ display: 'block' }}>
            <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="6" />
            <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)' }} />
        </svg>
    );
}

function StarBar({ label, score, delay }: { label: string; score: number; delay: number }) {
    const color = score >= 75 ? '#10B981' : score >= 50 ? '#3B82F6' : '#EF4444';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 90, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>{label}</div>
            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 4,
                    background: `linear-gradient(90deg,${color},${color}99)`,
                    width: `${score}%`,
                    transition: `width 1.2s cubic-bezier(.16,1,.3,1) ${delay}s`,
                }} />
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color, width: 36, textAlign: 'right' }}>{score}%</div>
            {score >= 50
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            }
        </div>
    );
}

export default function MockFeedbackPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SessionResult | null>(null);
    const [selectedQ, setSelectedQ] = useState(0);
    const [evalTab, setEvalTab] = useState<1 | 2 | 3>(1);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const { data, error: fetchErr } = await authFetchJson(`/interviews/sessions/${sessionId}/replay`);
                if (fetchErr || !data) throw new Error(fetchErr || 'Failed to load feedback data');
                setResult(data as SessionResult);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (sessionId) fetchResult();
    }, [sessionId]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f14' }}>
            <Loader2 style={{ width: 40, height: 40, color: '#2563EB' }} className="animate-spin" />
        </div>
    );

    if (error || !result) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f14', padding: 24 }}>
            <div style={{ textAlign: 'center', maxWidth: 400 }}>
                <AlertCircle style={{ width: 48, height: 48, color: '#EF4444', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: 'Sora, sans-serif' }}>Feedback Unavailable</h2>
                <p style={{ color: 'rgba(255,255,255,.5)', marginBottom: 24 }}>{error || 'Session not found or not yet completed.'}</p>
                <button onClick={() => router.push('/candidate/practice')}
                    style={{ padding: '12px 28px', borderRadius: 12, background: '#2563EB', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Return to Practice Hub
                </button>
            </div>
        </div>
    );

    const questions = result.questions || [];
    const overallScore = result.overallScore || Math.round(questions.reduce((s, q) => s + (q.score || 0), 0) / (questions.length || 1));
    const parsedFeedback = (() => {
        try {
            if (typeof result.feedback === 'string' && result.feedback.trim().startsWith('{')) {
                return JSON.parse(result.feedback);
            }
        } catch { /* ok */ }
        return { overallComments: result.feedback, strengths: [], weaknesses: [] };
    })();

    const currentQ = questions[selectedQ];
    const isBehavioral = result.type === 'BEHAVIORAL' || result.type === 'HR' || (currentQ?.questionType || '').toLowerCase().includes('behavioral');
    const hasStar = isBehavioral && currentQ?.starAnalysis;
    const starData = currentQ?.starAnalysis;

    const weakAreas: string[] = parsedFeedback.weaknesses?.slice(0, 4) || [];
    const strengths: string[] = parsedFeedback.strengths?.slice(0, 3) || [];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
                @keyframes fbLive{0%,100%{opacity:1}50%{opacity:.3}}
                @keyframes fbBarRise{from{height:0}to{height:var(--h)}}
                @keyframes fbCountUp{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
                .fb-live{animation:fbLive 1.4s ease-in-out infinite}
                .fb-bar-rise{animation:fbBarRise .9s cubic-bezier(.16,1,.3,1) forwards}
                .fb-count{animation:fbCountUp .7s cubic-bezier(.16,1,.3,1) forwards}
                .fb-glass{background:rgba(255,255,255,.04);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.07)}
                .fb-body{font-family:'DM Sans',sans-serif}
                .fb-sora{font-family:'Sora',sans-serif}
                .fb-mono{font-family:'DM Mono',monospace}
                .fb-eval-tab{padding:9px 20px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.5);font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:.2s;}
                .fb-eval-tab.active{background:rgba(37,99,235,.15);border-color:rgba(37,99,235,.4);color:#60A5FA}
                .fb-q-bar{cursor:pointer;transition:.2s;}
                .fb-q-bar:hover{opacity:.85}
                ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:2px}
            `}</style>

            <div className="fb-body" style={{ minHeight: '100vh', background: '#0a0f14', color: '#fff' }}>
                {/* ── TOP NAV ── */}
                <div style={{ background: 'rgba(10,15,20,.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 30 }}>
                    <button onClick={() => router.push('/candidate/practice')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, transition: '.2s' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                        Back to Practice
                    </button>
                    <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.1)' }} />
                    <span className="fb-sora" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>{result.targetRole || 'Mock Interview'}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', fontSize: 11, fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
                        <span className="fb-live" style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        Interview Complete
                    </span>
                </div>

                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 80px' }}>

                    {/* ── HEADER ── */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 32 }}>
                        <div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>
                                {result.targetRole} · {result.type || 'Technical'} · {result.difficulty || 'Medium'}
                            </div>
                            <h1 className="fb-sora" style={{ fontSize: 30, fontWeight: 800, marginBottom: 4 }}>Session Summary</h1>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>{questions.length} questions answered</p>
                            <AIDisclaimer className="mt-4" />
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => router.push('/candidate/practice')}
                                style={{ padding: '10px 18px', borderRadius: 11, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.65)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.54" /></svg>
                                New Interview
                            </button>
                        </div>
                    </div>

                    {/* ── TOP METRICS ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                        {/* Overall */}
                        <div className="fb-glass" style={{ borderRadius: 22, padding: 28, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#2563EB,#0D9488)' }} />
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Overall Score</div>
                            <div className="fb-count" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
                                <span className="fb-mono fb-sora" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, color: scoreColor(overallScore) }}>{overallScore}</span>
                                <span style={{ fontSize: 20, color: 'rgba(255,255,255,.25)', paddingBottom: 8 }}>/100</span>
                            </div>
                            <div style={{ padding: '6px 14px', borderRadius: 20, display: 'inline-block', fontSize: 12, fontWeight: 600, background: `${scoreColor(overallScore)}18`, border: `1px solid ${scoreColor(overallScore)}30`, color: scoreColor(overallScore) }}>
                                {overallScore >= 80 ? 'Exceptional' : overallScore >= 65 ? 'Solid performance' : overallScore >= 50 ? 'Needs improvement' : 'Keep practicing'}
                            </div>
                        </div>

                        {/* Strengths */}
                        <div className="fb-glass" style={{ borderRadius: 22, padding: 28, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#10B981,#14B8A6)' }} />
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Key Strengths</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {strengths.length ? strengths.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}>{s}</p>
                                    </div>
                                )) : (
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', fontStyle: 'italic' }}>Complete the session to see strengths</p>
                                )}
                            </div>
                        </div>

                        {/* Weak areas */}
                        <div className="fb-glass" style={{ borderRadius: 22, padding: 28, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#F59E0B,#F97316)' }} />
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Weak Areas</div>
                            {weakAreas.length ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {weakAreas.map((area, i) => (
                                        <span key={i} style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', fontSize: 12, fontWeight: 500, color: '#F59E0B', lineHeight: 1.4 }}>
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', fontStyle: 'italic' }}>No specific weak areas flagged</p>
                            )}
                        </div>
                    </div>

                    {/* ── Q SCORE BAR CHART ── */}
                    {questions.length > 0 && (
                        <div className="fb-glass" style={{ borderRadius: 22, padding: 28, marginBottom: 28 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 24 }}>Question Scores — click to review</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
                                {questions.map((q, i) => {
                                    const s = q.score || 0;
                                    const col = scoreColor(s);
                                    const barH = Math.max(8, (s / 100) * 96);
                                    return (
                                        <div key={q.id} className="fb-q-bar" onClick={() => { setSelectedQ(i); setEvalTab(1); document.getElementById('eval-panel')?.scrollIntoView({ behavior: 'smooth' }); }}
                                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                            <span className="fb-mono" style={{ fontSize: 11, color: col, fontWeight: 600 }}>{s}</span>
                                            <div style={{ width: '100%', borderRadius: 6, background: `${col}22`, border: `1px solid ${col}33`, height: barH, transition: '.3s', position: 'relative', overflow: 'hidden' }}>
                                                <div className="fb-bar-rise" style={{ '--h': `${barH}px`, position: 'absolute', bottom: 0, left: 0, right: 0, background: `linear-gradient(to top,${col},${col}88)`, borderRadius: 6 } as React.CSSProperties} />
                                                {i === selectedQ && <div style={{ position: 'absolute', inset: 0, border: `2px solid ${col}`, borderRadius: 6 }} />}
                                            </div>
                                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'DM Mono, monospace' }}>Q{i + 1}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── OVERALL FEEDBACK ── */}
                    {parsedFeedback.overallComments && (
                        <div className="fb-glass" style={{ borderRadius: 20, padding: 24, marginBottom: 28 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>AI Coach Summary</div>
                            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,.75)' }}>{parsedFeedback.overallComments}</p>
                        </div>
                    )}

                    {/* ── PER-QUESTION EVALUATION ── */}
                    {currentQ && (
                        <div id="eval-panel">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                        Question {selectedQ + 1} of {questions.length}
                                    </div>
                                    <h2 className="fb-sora" style={{ fontSize: 18, fontWeight: 700, maxWidth: 600 }}>{currentQ.questionText}</h2>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => selectedQ > 0 && setSelectedQ(selectedQ - 1)}
                                        disabled={selectedQ === 0}
                                        style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: 'rgba(255,255,255,.5)', fontSize: 13, cursor: selectedQ === 0 ? 'not-allowed' : 'pointer', opacity: selectedQ === 0 ? .4 : 1 }}>
                                        ← Prev
                                    </button>
                                    <button onClick={() => selectedQ < questions.length - 1 && setSelectedQ(selectedQ + 1)}
                                        disabled={selectedQ === questions.length - 1}
                                        style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: selectedQ === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: selectedQ === questions.length - 1 ? .4 : 1 }}>
                                        Next →
                                    </button>
                                </div>
                            </div>

                            {/* Sub-tabs */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                                {([['① Score', 1], ['② Coaching', 2], ['③ Compare', 3]] as [string, 1 | 2 | 3][]).map(([label, tab]) => (
                                    <button key={tab} className={`fb-eval-tab${evalTab === tab ? ' active' : ''}`} onClick={() => setEvalTab(tab)}>{label}</button>
                                ))}
                            </div>

                            {/* ── TAB 1: Score ── */}
                            {evalTab === 1 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, alignItems: 'start' }}>
                                    <div className="fb-glass" style={{ borderRadius: 24, padding: 40, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${scoreColor(currentQ.score || 0)},#2563EB)` }} />
                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 24 }}>Your Score</div>
                                        <div className="fb-count" style={{ marginBottom: 8 }}>
                                            <span className="fb-mono fb-sora" style={{ fontSize: 80, fontWeight: 800, lineHeight: 1, color: scoreColor(currentQ.score || 0) }}>{currentQ.score || 0}</span>
                                            <span style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,.25)' }}>/100</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                            <ScoreRing score={currentQ.score || 0} />
                                        </div>
                                        <div style={{ padding: '8px 20px', borderRadius: 20, display: 'inline-block', marginBottom: 20, background: `${scoreColor(currentQ.score || 0)}15`, border: `1px solid ${scoreColor(currentQ.score || 0)}30` }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(currentQ.score || 0) }}>
                                                {(currentQ.score || 0) >= 80 ? 'Strong answer' : (currentQ.score || 0) >= 60 ? 'Good foundation' : (currentQ.score || 0) >= 40 ? 'Needs depth' : 'Keep practicing'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {currentQ.feedback && (
                                            <div className="fb-glass" style={{ borderRadius: 20, padding: 24 }}>
                                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 14 }}>Aria's take</div>
                                                <p className="fb-sora" style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.65, color: 'rgba(255,255,255,.85)' }}>
                                                    "{currentQ.feedback}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 2: Coaching ── */}
                            {evalTab === 2 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    {/* Did well */}
                                    <div className="fb-glass" style={{ borderRadius: 20, padding: 28 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                            </div>
                                            <span className="fb-sora" style={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}>What you did well</span>
                                        </div>
                                        {currentQ.feedback ? (
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, fontSize: 11, color: '#10B981', fontWeight: 700 }}>1</div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Answer recorded</div>
                                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>{currentQ.feedback}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', fontStyle: 'italic' }}>No specific strengths captured for this question.</p>
                                        )}
                                    </div>

                                    {/* Add next time */}
                                    <div className="fb-glass" style={{ borderRadius: 20, padding: 28 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                                            </div>
                                            <span className="fb-sora" style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>Add next time</span>
                                        </div>
                                        {currentQ.improvedAnswer ? (
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>→</div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Improved answer pattern</div>
                                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>{currentQ.improvedAnswer.slice(0, 300)}{currentQ.improvedAnswer.length > 300 ? '...' : ''}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', fontStyle: 'italic' }}>No specific improvements flagged — review the model answer in the Compare tab.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 3: Compare ── */}
                            {evalTab === 3 && (
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                        {/* Your answer */}
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Your answer</div>
                                            <div style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: 20, fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,.65)', minHeight: 120 }}>
                                                {currentQ.userAnswer || <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,.25)' }}>No answer provided</span>}
                                            </div>
                                        </div>
                                        {/* Model answer */}
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(37,99,235,.8)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Model answer</div>
                                            <div style={{ background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.15)', borderRadius: 16, padding: 20, fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,.75)', minHeight: 120 }}>
                                                {currentQ.improvedAnswer || <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,.25)' }}>Model answer not available</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* STAR bars */}
                                    {hasStar && starData && (
                                        <div className="fb-glass" style={{ borderRadius: 20, padding: 24 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.08em' }}>STAR Structure (Behavioral)</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                <StarBar label="Situation" score={starData.situation?.score ?? 0} delay={0} />
                                                <StarBar label="Task" score={starData.task?.score ?? 0} delay={0.15} />
                                                <StarBar label="Action" score={starData.action?.score ?? 0} delay={0.3} />
                                                <StarBar label="Result" score={starData.result?.score ?? 0} delay={0.45} />
                                            </div>
                                            {(starData.result?.score ?? 0) < 50 && (
                                                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.15)', fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.5 }}>
                                                    💡 End with a measurable result: <em>"As a result, we reduced latency by 40% and handled 3× the traffic."</em>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
