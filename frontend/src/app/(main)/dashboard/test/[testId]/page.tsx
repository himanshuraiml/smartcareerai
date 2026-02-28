'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import {
    CheckCircle2, XCircle, Clock, AlertTriangle, CreditCard,
    ChevronLeft, ChevronRight, Loader2, Trophy, RotateCcw,
    ArrowLeft, Zap, CheckCheck
} from 'lucide-react';

interface TestQuestion { id: string; questionText: string; options: string[]; points: number; }
interface SkillTest {
    id: string; title: string; description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'; durationMinutes: number;
    passingScore: number; questionsCount: number; questions: TestQuestion[];
}
interface TestResult { score: number; passed: boolean; correctAnswers: number; totalQuestions: number; }

const DIFFICULTY_CONFIG = {
    EASY: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-400' },
    MEDIUM: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', dot: 'bg-amber-400' },
    HARD: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', dot: 'bg-rose-400' },
};

export default function TestPage({ params }: { params: Promise<{ testId: string }> }) {
    const { testId } = React.use(params);
    const router = useRouter();
    const { user } = useAuthStore();
    const [test, setTest] = useState<SkillTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentQuestionIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [insufficientCredits, setInsufficientCredits] = useState(false);

    useEffect(() => { if (user) startTestSession(); }, [user, testId]);

    useEffect(() => {
        if (test && !result && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) { clearInterval(timer); submitTest(); return 0; }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [test, result, timeLeft]);

    const startTestSession = async () => {
        try {
            const res = await authFetch(`/validation/tests/${testId}/start`, {
                method: 'POST',
                headers: { 'x-user-id': user?.id || '' }
            });
            const data = await res.json();
            if (data.success) {
                setTest({ ...data.data.test, questions: data.data.questions });
                setTimeLeft(data.data.test.durationMinutes * 60);
            } else if (res.status === 402) {
                setInsufficientCredits(true);
            } else {
                setError(data.error || 'Failed to start test');
            }
        } catch { setError('An error occurred while starting the test'); }
        finally { setLoading(false); }
    };

    const handleAnswer = (value: string) => {
        if (!test) return;
        setAnswers(prev => ({ ...prev, [test.questions[currentQuestionIndex].id]: value }));
    };

    const submitTest = async () => {
        if (!test || submitting) return;
        setSubmitting(true);
        try {
            const res = await authFetch(`/validation/tests/${testId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();
            if (data.success) setResult(data.data);
            else setError(data.error || 'Failed to submit test');
        } catch { setError('An error occurred while submitting the test'); }
        finally { setSubmitting(false); }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // ── Loading ──
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Preparing your test...</p>
        </div>
    );

    // ── Insufficient Credits ──
    if (insufficientCredits) return (
        <div className="max-w-md mx-auto mt-12">
            <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="p-8 flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Skill Test Credits</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        You've used all your Skill Test credits. Purchase more credits or upgrade your plan to continue.
                    </p>
                    <div className="w-full flex flex-col gap-2 mt-2">
                        <Link href="/dashboard/billing"
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                            <CreditCard className="w-4 h-4" /> Get Credits
                        </Link>
                        <button onClick={() => router.push('/dashboard/tests')}
                            className="w-full py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            Back to Tests
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Error ──
    if (error) return (
        <div className="max-w-md mx-auto mt-12 p-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-center">
            <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-rose-700 dark:text-rose-300">{error}</p>
            <button onClick={() => router.back()} className="mt-4 text-sm text-rose-500 hover:text-rose-400 underline">Go back</button>
        </div>
    );

    if (!test) return null;

    // ── Results Screen ──
    if (result) {
        const pct = result.score;
        const passed = result.passed;
        const scoreColor = passed ? 'text-emerald-500' : 'text-rose-500';
        const scoreBg = passed ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-pink-500';
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto mt-8 space-y-4"
            >
                {/* Result hero card */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(99,102,241,0.1)] p-8 flex flex-col items-center gap-5 text-center">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-purple-50/30 dark:from-indigo-500/5 dark:to-purple-500/5" />

                    {/* Score ring */}
                    <div className="relative w-32 h-32">
                        <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-white/5" />
                            <motion.circle
                                cx="60" cy="60" r="52" fill="none"
                                stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 52}`}
                                strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`}
                                initial={{ strokeDashoffset: `${2 * Math.PI * 52}` }}
                                animate={{ strokeDashoffset: `${2 * Math.PI * 52 * (1 - pct / 100)}` }}
                                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                            />
                            <defs>
                                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={passed ? '#10b981' : '#f43f5e'} />
                                    <stop offset="100%" stopColor={passed ? '#14b8a6' : '#ec4899'} />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-black ${scoreColor}`}>{pct}%</span>
                        </div>
                    </div>

                    <div className="relative space-y-1">
                        {passed ? (
                            <div className="flex items-center gap-2 justify-center">
                                <Trophy className="w-5 h-5 text-amber-400" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Congratulations!</h2>
                            </div>
                        ) : (
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Not Quite There</h2>
                        )}
                        <p className={`text-base font-semibold ${passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {passed ? 'You Passed! 🎉' : 'Test Failed — Keep Practicing'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {result.correctAnswers} of {result.totalQuestions} questions correct
                        </p>
                    </div>

                    {/* Stat chips */}
                    <div className="relative flex gap-3 w-full">
                        <div className="flex-1 py-3 px-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{result.correctAnswers}</p>
                            <p className="text-xs text-gray-400">Correct</p>
                        </div>
                        <div className="flex-1 py-3 px-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{result.totalQuestions - result.correctAnswers}</p>
                            <p className="text-xs text-gray-400">Incorrect</p>
                        </div>
                        <div className="flex-1 py-3 px-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                            <p className={`text-lg font-bold ${scoreColor}`}>{pct}%</p>
                            <p className="text-xs text-gray-400">Score</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="relative flex flex-col gap-2 w-full">
                        <button onClick={() => router.push('/dashboard/skills')}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Skills
                        </button>
                        {!passed && (
                            <button onClick={() => { setResult(null); setAnswers({}); setCurrentIndex(0); startTestSession(); }}
                                className="w-full py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Try Again
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── Active Test ──
    const currentQuestion = test.questions[currentQuestionIndex];
    const isFirst = currentQuestionIndex === 0;
    const isLast = currentQuestionIndex === test.questions.length - 1;
    const answeredCount = Object.keys(answers).length;
    const progressPct = (answeredCount / test.questions.length) * 100;
    const diff = DIFFICULTY_CONFIG[test.difficulty] || DIFFICULTY_CONFIG.EASY;
    const isLowTime = timeLeft < 60;

    return (
        <div className="max-w-2xl mx-auto space-y-5 py-2">

            {/* ── Header ── */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm px-6 py-5">
                <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-400/10 blur-3xl" />
                <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-500/20">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{test.title}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${diff.bg} ${diff.border} ${diff.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                                    {test.difficulty}
                                </span>
                                <span className="text-xs text-gray-400">{test.questions.length} Questions</span>
                            </div>
                        </div>
                    </div>
                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-mono text-lg font-bold transition-colors ${isLowTime
                            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white'
                        }`}>
                        <Clock className={`w-4 h-4 ${isLowTime ? 'animate-pulse' : ''}`} />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="relative mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                        <span>{answeredCount} of {test.questions.length} answered</span>
                        <span>{Math.round(progressPct)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Warning banner ── */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm">
                <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" style={{ width: '18px', height: '18px' }} />
                <p>Do not refresh the page or switch tabs. The timer will continue running.</p>
            </div>

            {/* ── Question Card ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(99,102,241,0.08)] overflow-hidden"
                >
                    {/* Question header */}
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5">
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">
                            Question {currentQuestionIndex + 1} / {test.questions.length}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                            {currentQuestion.questionText}
                        </p>
                    </div>

                    {/* Options */}
                    <div className="p-5 space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const selected = answers[currentQuestion.id] === option;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(option)}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all duration-150 ${selected
                                            ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm'
                                            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5'
                                        }`}
                                >
                                    {/* Radio ring */}
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'border-indigo-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                    </div>
                                    {/* Option label */}
                                    <span className={`text-[15px] font-medium ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'
                                        }`}>
                                        {option}
                                    </span>
                                    {/* Letter badge */}
                                    <span className={`ml-auto text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center ${selected ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer navigation */}
                    <div className="px-5 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
                        {/* Question dots */}
                        <div className="hidden sm:flex items-center gap-1.5">
                            {test.questions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`w-2 h-2 rounded-full transition-all duration-150 ${i === currentQuestionIndex
                                            ? 'w-5 bg-indigo-500'
                                            : answers[q.id]
                                                ? 'bg-indigo-300 dark:bg-indigo-500/50'
                                                : 'bg-gray-200 dark:bg-white/10'
                                        }`}
                                    title={`Q${i + 1}`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={isFirst}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            {isLast ? (
                                <button
                                    onClick={submitTest}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity shadow-sm shadow-indigo-500/20"
                                >
                                    {submitting
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                        : <><CheckCheck className="w-4 h-4" /> Submit Test</>}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentIndex(prev => Math.min(test.questions.length - 1, prev + 1))}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-indigo-500/20"
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
