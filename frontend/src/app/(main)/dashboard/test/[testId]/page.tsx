'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import {
    CheckCircle2, XCircle, Clock, AlertTriangle, CreditCard,
    ChevronLeft, ChevronRight, Loader2, Trophy, RotateCcw,
    ArrowLeft, Zap, CheckCheck, FileQuestion, BookOpen, Target, X,
    Sparkles, Shield, TimerOff, AlertCircle
} from 'lucide-react';

interface TestQuestion {
    id: string;
    questionText: string;
    options: string[];
    points: number;
}

interface TestPreview {
    id: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    durationMinutes: number;
    passingScore: number;
    questionsCount: number;
    skill: { id: string; name: string; category: string };
}

interface SkillTest extends TestPreview {
    questions: TestQuestion[];
}

interface QuestionResult {
    questionId: string;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
    questionText: string;
    options: string[];
}

interface TestResult {
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    questionResults: QuestionResult[];
}

const DIFFICULTY_CONFIG = {
    EASY: {
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        border: 'border-emerald-200 dark:border-emerald-500/20',
        dot: 'bg-emerald-400',
        gradient: 'from-emerald-500 to-teal-500',
        light: 'bg-emerald-500/10',
    },
    MEDIUM: {
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        border: 'border-amber-200 dark:border-amber-500/20',
        dot: 'bg-amber-400',
        gradient: 'from-amber-500 to-orange-500',
        light: 'bg-amber-500/10',
    },
    HARD: {
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        border: 'border-rose-200 dark:border-rose-500/20',
        dot: 'bg-rose-400',
        gradient: 'from-rose-500 to-pink-500',
        light: 'bg-rose-500/10',
    },
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const STORAGE_KEY = (testId: string) => `test_answers_${testId}`;

export default function TestPage({ params }: { params: Promise<{ testId: string }> }) {
    const { testId } = React.use(params);
    const router = useRouter();
    const { user } = useAuthStore();

    const [phase, setPhase] = useState<'loading' | 'preview' | 'active' | 'result' | 'error'>('loading');
    const [preview, setPreview] = useState<TestPreview | null>(null);
    const [test, setTest] = useState<SkillTest | null>(null);
    const [error, setError] = useState('');
    const [cooldownHours, setCooldownHours] = useState<number | null>(null);

    const [currentQuestionIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [expandedReview, setExpandedReview] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!user) return;
        const loadPreview = async () => {
            try {
                const res = await authFetch(`/validation/tests/${testId}`);
                const data = await res.json();
                if (data.success) {
                    setPreview(data.data);
                    setPhase('preview');
                } else {
                    setError(data.error || 'Test not found');
                    setPhase('error');
                }
            } catch {
                setError('Failed to load test');
                setPhase('error');
            }
        };
        loadPreview();
    }, [user, testId]);

    const startTest = async () => {
        setPhase('loading');
        try {
            const saved = localStorage.getItem(STORAGE_KEY(testId));
            if (saved) {
                try { setAnswers(JSON.parse(saved)); } catch { /* ignore corrupt data */ }
            }
            const res = await authFetch(`/validation/tests/${testId}/start`, {
                method: 'POST',
                headers: { 'x-user-id': user?.id || '' }
            });
            const data = await res.json();
            if (data.success) {
                setTest({ ...data.data.test, questions: data.data.questions });
                setTimeLeft(data.data.test.durationMinutes * 60);
                setPhase('active');
            } else if (res.status === 402) {
                setError('CREDITS');
                setPhase('error');
            } else if (data.error?.startsWith('COOLDOWN:')) {
                setCooldownHours(parseInt(data.error.split(':')[1], 10));
                setError('COOLDOWN');
                setPhase('error');
            } else {
                setError(data.error || 'Failed to start test');
                setPhase('error');
            }
        } catch {
            setError('An error occurred while starting the test');
            setPhase('error');
        }
    };

    useEffect(() => {
        if (phase !== 'active' || !test || result) return;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setShowTimeoutModal(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase, test, result]);

    useEffect(() => {
        if (phase === 'active' && Object.keys(answers).length > 0) {
            localStorage.setItem(STORAGE_KEY(testId), JSON.stringify(answers));
        }
    }, [answers, phase, testId]);

    const handleAnswer = (value: string) => {
        if (!test) return;
        setAnswers(prev => ({ ...prev, [test.questions[currentQuestionIndex].id]: value }));
    };

    const submitTest = useCallback(async () => {
        if (!test || submitting) return;
        setShowTimeoutModal(false);
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            const res = await authFetch(`/validation/tests/${testId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.removeItem(STORAGE_KEY(testId));
                setResult(data.data);
                setPhase('result');
            } else {
                setError(data.error || 'Failed to submit test');
                setPhase('error');
            }
        } catch {
            setError('An error occurred while submitting the test');
            setPhase('error');
        } finally {
            setSubmitting(false);
        }
    }, [test, submitting, testId, user, answers]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // ── Loading ──
    if (phase === 'loading') return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5">
            <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                    <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-[22px] border-2 border-blue-500/20 animate-ping" />
            </div>
            <div className="text-center">
                <p className="text-base font-semibold text-gray-900 dark:text-white">Getting things ready...</p>
                <p className="text-sm text-gray-400 mt-1">Preparing your test environment</p>
            </div>
        </div>
    );

    // ── Error states ──
    if (phase === 'error') {
        if (error === 'CREDITS') return (
            <div className="max-w-sm mx-auto mt-16">
                <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/8 shadow-xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-rose-500 to-pink-500" />
                    <div className="p-8 flex flex-col items-center gap-5 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                            <CreditCard className="w-8 h-8 text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Credits Available</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Purchase more credits or upgrade to continue taking skill tests.</p>
                        </div>
                        <div className="w-full flex flex-col gap-2.5">
                            <Link href="/dashboard/billing" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                                <CreditCard className="w-4 h-4" /> Get Credits
                            </Link>
                            <button onClick={() => router.push('/dashboard/tests')} className="w-full py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                Back to Tests
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );

        if (error === 'COOLDOWN') return (
            <div className="max-w-sm mx-auto mt-16">
                <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/8 shadow-xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div className="p-8 flex flex-col items-center gap-5 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            <TimerOff className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cooldown Active</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Come back in <span className="font-bold text-amber-600 dark:text-amber-400">{cooldownHours} hour{cooldownHours !== 1 ? 's' : ''}</span>. Use the time to review the topic!
                            </p>
                        </div>
                        <button onClick={() => router.push('/dashboard/tests')} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
                            Browse Other Tests
                        </button>
                    </div>
                </div>
            </div>
        );

        return (
            <div className="max-w-sm mx-auto mt-16">
                <div className="rounded-3xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-8 flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                    <p className="text-base font-semibold text-rose-700 dark:text-rose-300">{error}</p>
                    <button onClick={() => router.back()} className="text-sm text-rose-500 hover:text-rose-400 underline font-medium">Go back</button>
                </div>
            </div>
        );
    }

    // ── Preview Screen ──
    if (phase === 'preview' && preview) {
        const diff = DIFFICULTY_CONFIG[preview.difficulty] || DIFFICULTY_CONFIG.EASY;
        return (
            <div className="max-w-xl mx-auto py-6 px-2 space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-medium transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="rounded-3xl overflow-hidden bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/8 shadow-2xl shadow-blue-500/5"
                >
                    {/* Hero gradient */}
                    <div className="relative overflow-hidden px-8 pt-10 pb-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
                        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />

                        <div className="relative">
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                    <FileQuestion className="w-7 h-7 text-white" />
                                </div>
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/15 backdrop-blur-sm text-white border border-white/20`}>
                                    <span className={`w-2 h-2 rounded-full bg-white`} />
                                    {preview.difficulty}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{preview.title}</h1>
                            <p className="text-blue-100 text-sm leading-relaxed">{preview.description}</p>
                        </div>
                    </div>

                    {/* Floating stats cards */}
                    <div className="grid grid-cols-3 gap-3 px-6 -mt-8 relative z-10">
                        {[
                            { icon: FileQuestion, label: 'Questions', value: preview.questionsCount, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15' },
                            { icon: Clock, label: 'Minutes', value: preview.durationMinutes, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/15' },
                            { icon: Target, label: 'To Pass', value: `${preview.passingScore}%`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15' },
                        ].map(s => (
                            <div key={s.label} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 shadow-lg shadow-black/5 p-4 flex flex-col items-center gap-1.5 text-center">
                                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                                    <s.icon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: '18px', height: '18px' }} />
                                </div>
                                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{s.value}</p>
                                <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Instructions */}
                    <div className="px-6 py-6 space-y-5">
                        <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/8 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <BookOpen className="w-3.5 h-3.5 text-white" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Before you start</h3>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'Timer starts immediately when you click Start',
                                    'Multiple choice — one best answer per question',
                                    'Navigate freely between questions before submitting',
                                    'Your answers auto-save as you go',
                                    '24-hour cooldown applies before a retake',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{i + 1}</span>
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                            <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Stay on this tab — leaving may count against your time</p>
                        </div>

                        <button
                            onClick={startTest}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/25"
                        >
                            <Zap className="w-5 h-5" />
                            Start Test — {preview.questionsCount} Questions
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!test) return null;

    // ── Results Screen ──
    if (phase === 'result' && result) {
        const pct = result.score;
        const passed = result.passed;
        const circumference = 2 * Math.PI * 52;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-xl mx-auto py-6 px-2 space-y-4"
            >
                {/* Score hero */}
                <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/8 shadow-2xl">
                    <div className={`h-1.5 ${passed ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-rose-400 to-pink-500'}`} />

                    <div className="px-6 pt-8 pb-6 flex flex-col items-center gap-6 text-center">
                        {/* Animated score ring */}
                        <div className="relative w-36 h-36">
                            <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-white/5" />
                                <motion.circle
                                    cx="60" cy="60" r="52" fill="none"
                                    stroke={passed ? '#10b981' : '#f43f5e'} strokeWidth="10" strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
                                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                    className={`text-4xl font-black ${passed ? 'text-emerald-500' : 'text-rose-500'}`}
                                >
                                    {pct}%
                                </motion.span>
                                <span className="text-xs text-gray-400 font-medium mt-0.5">score</span>
                            </div>
                        </div>

                        <div>
                            {passed ? (
                                <div className="flex items-center gap-2 justify-center mb-1">
                                    <Trophy className="w-6 h-6 text-amber-400" />
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">You Passed!</h2>
                                </div>
                            ) : (
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Not Quite There</h2>
                            )}
                            <p className={`text-sm font-semibold ${passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {passed ? 'Great work — badge earned! 🎉' : 'Keep practicing and try again'}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">{result.correctAnswers} of {result.totalQuestions} correct · Passing: {test.passingScore}%</p>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 w-full">
                            {[
                                { label: 'Correct', value: result.correctAnswers, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                                { label: 'Wrong', value: result.totalQuestions - result.correctAnswers, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                                { label: 'Score', value: `${pct}%`, color: passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', bg: 'bg-gray-50 dark:bg-white/5' },
                            ].map(s => (
                                <div key={s.label} className={`${s.bg} rounded-2xl py-3.5 px-2 text-center`}>
                                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2.5 w-full">
                            <button
                                onClick={() => setShowReview(v => !v)}
                                className={`w-full py-3.5 rounded-2xl border-2 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${showReview
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5'
                                    }`}
                            >
                                <BookOpen className="w-4 h-4" />
                                {showReview ? 'Hide' : 'Review'} Answers &amp; Explanations
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/skills')}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Skills
                            </button>
                            {!passed && (
                                <button
                                    onClick={() => { setResult(null); setAnswers({}); setCurrentIndex(0); setPhase('preview'); }}
                                    className="w-full py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" /> Try Again
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Answer Review */}
                <AnimatePresence>
                    {showReview && result.questionResults && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-3"
                        >
                            <h3 className="text-base font-bold text-gray-900 dark:text-white px-1">Answer Review</h3>
                            {result.questionResults.map((qr, idx) => (
                                <div
                                    key={qr.questionId}
                                    className={`rounded-2xl border overflow-hidden ${qr.correct
                                        ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                                        : 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20'
                                        }`}
                                >
                                    <button
                                        onClick={() => setExpandedReview(expandedReview === qr.questionId ? null : qr.questionId)}
                                        className="w-full flex items-start gap-3 p-4 text-left"
                                    >
                                        {qr.correct
                                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            : <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-400 mb-1">Q{idx + 1}</p>
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">{qr.questionText || `Question ${idx + 1}`}</p>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expandedReview === qr.questionId ? 'rotate-90' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {expandedReview === qr.questionId && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 space-y-2 border-t border-current/10">
                                                    <div className="pt-3 space-y-2 text-sm">
                                                        <p className="text-gray-600 dark:text-gray-400">
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">Your answer: </span>
                                                            <span className={qr.correct ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'}>
                                                                {qr.userAnswer || '(not answered)'}
                                                            </span>
                                                        </p>
                                                        {!qr.correct && (
                                                            <p className="text-gray-600 dark:text-gray-400">
                                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Correct: </span>
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{qr.correctAnswer}</span>
                                                            </p>
                                                        )}
                                                        {qr.explanation && (
                                                            <div className="mt-2 p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-current/10">
                                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Explanation</p>
                                                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{qr.explanation}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    // ── Active Test ──
    const currentQuestion = test.questions[currentQuestionIndex];
    const isFirst = currentQuestionIndex === 0;
    const isLast = currentQuestionIndex === test.questions.length - 1;
    const answeredCount = Object.keys(answers).length;
    const progressPct = (answeredCount / test.questions.length) * 100;
    const isLowTime = timeLeft < 60;
    const isVeryLowTime = timeLeft < 30;

    const timerBg = isVeryLowTime
        ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30'
        : isLowTime
            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
            : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10';

    return (
        <div className="max-w-2xl mx-auto py-2 space-y-4">

            {/* Timeout Modal */}
            <AnimatePresence>
                {showTimeoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="max-w-sm w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10"
                        >
                            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-amber-500" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Time&apos;s Up!</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your time has expired. Submit your answers now to see your results.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowTimeoutModal(false)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={submitTest}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                    >
                                        <CheckCheck className="w-4 h-4" /> Submit
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
                            <Zap className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">{test.title}</h1>
                            <p className="text-xs text-gray-400">{answeredCount} of {test.questions.length} answered</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono text-base font-bold transition-all duration-300 flex-shrink-0 ${timerBg}`}>
                        <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'animate-pulse' : ''}`} style={{ width: '14px', height: '14px' }} />
                        {formatTime(timeLeft)}
                    </div>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-gray-100 dark:bg-white/5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Warning */}
            {isLowTime && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${isVeryLowTime
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300'
                        }`}
                >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {isVeryLowTime ? 'Under 30 seconds — submit now!' : 'Less than a minute remaining!'}
                </motion.div>
            )}

            {!isLowTime && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Stay on this page — timer continues if you switch tabs. Answers auto-save.
                </div>
            )}

            {/* ── Question Card ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/8 shadow-lg shadow-blue-500/5 overflow-hidden"
                >
                    {/* Question header */}
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.01]">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">
                                Question {currentQuestionIndex + 1}
                            </span>
                            <span className="text-xs text-gray-300 dark:text-white/20">of {test.questions.length}</span>
                            <div className="ml-auto flex items-center gap-1">
                                {currentQuestion.id in answers ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3 h-3" /> Answered
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                        Unanswered
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className="text-[17px] font-semibold text-gray-900 dark:text-white leading-relaxed">
                            {currentQuestion.questionText}
                        </p>
                    </div>

                    {/* Options */}
                    <div className="p-5 space-y-2.5">
                        {currentQuestion.options.map((option, idx) => {
                            const selected = answers[currentQuestion.id] === option;
                            const letter = OPTION_LETTERS[idx];
                            return (
                                <motion.button
                                    key={idx}
                                    onClick={() => handleAnswer(option)}
                                    whileTap={{ scale: 0.99 }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all duration-150 ${selected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm shadow-blue-500/10'
                                        : 'border-gray-150 dark:border-white/8 bg-white dark:bg-white/[0.01] hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/40 dark:hover:bg-blue-500/5'
                                        }`}
                                    style={{ borderColor: selected ? undefined : 'rgb(229 231 235)' }}
                                >
                                    {/* Letter badge */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black transition-colors ${selected
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-white/8 text-gray-400 dark:text-gray-500'
                                        }`}>
                                        {letter}
                                    </div>
                                    <span className={`flex-1 text-[15px] font-medium leading-snug transition-colors ${selected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {option}
                                    </span>
                                    {/* Selection indicator */}
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {selected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-2 h-2 rounded-full bg-white"
                                            />
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Navigation bar */}
                    <div className="px-5 py-4 border-t border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.01]">
                        {/* Question navigator dots */}
                        <div className="flex items-center justify-center gap-1.5 mb-4 flex-wrap">
                            {test.questions.map((q, i) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = i === currentQuestionIndex;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIndex(i)}
                                        title={`Q${i + 1}${isAnswered ? ' (answered)' : ''}`}
                                        className={`transition-all duration-150 rounded-md font-bold text-[11px] flex items-center justify-center
                                            ${isCurrent
                                                ? 'w-8 h-6 bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                                : isAnswered
                                                    ? 'w-6 h-6 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30'
                                                    : 'w-6 h-6 bg-gray-100 dark:bg-white/8 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Prev / Next / Submit */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={isFirst}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>
                            <div className="flex-1 text-center text-xs text-gray-400 font-medium">
                                {answeredCount}/{test.questions.length} done
                            </div>
                            {isLast ? (
                                <button
                                    onClick={submitTest}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-blue-500/20"
                                >
                                    {submitting
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                        : <><CheckCheck className="w-4 h-4" /> Submit</>}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentIndex(prev => Math.min(test.questions.length - 1, prev + 1))}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-blue-500/20"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
