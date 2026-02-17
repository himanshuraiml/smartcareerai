'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Clock, Play, Loader2, CheckCircle, XCircle,
    Trophy, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    options: string[];
    points: number;
    orderIndex: number;
}

interface TestData {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    durationMinutes: number;
    passingScore: number;
    skill: { id: string; name: string };
    questions: Question[];
}

interface TestResult {
    score: number;
    passed: boolean;
    passingScore: number;
    totalQuestions: number;
    correctAnswers: number;
    questionResults: Array<{
        questionId: string;
        correct: boolean;
        userAnswer: string;
        correctAnswer: string;
    }>;
    badge?: { id: string; badgeType: string; skill: { name: string } };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function TestPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();

    const [test, setTest] = useState<TestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [result, setResult] = useState<TestResult | null>(null);

    const fetchTest = useCallback(async () => {
        try {
            const response = await authFetch(`/validation/tests/${id}`);
            if (response.ok) {
                const data = await response.json();
                setTest(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch test:', err);
        } finally {
            setLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        if (user && id) {
            fetchTest();
        }
    }, [user, id, fetchTest]);

    // Timer
    useEffect(() => {
        if (!started || timeLeft <= 0 || result) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [started, timeLeft, result]);

    const startTest = async () => {
        setStarting(true);
        try {
            const response = await authFetch(`/validation/tests/${id}/start`, {
                method: 'POST'
            });
            if (response.ok) {
                setStarted(true);
                setTimeLeft((test?.durationMinutes || 15) * 60);
            }
        } catch (err) {
            console.error('Failed to start test:', err);
        } finally {
            setStarting(false);
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const response = await authFetch(`/validation/tests/${id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers })
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data.data);
            }
        } catch (err) {
            console.error('Failed to submit test:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'EXPERT': return 'from-yellow-400 to-orange-500';
            case 'ADVANCED': return 'from-indigo-400 to-pink-500';
            case 'INTERMEDIATE': return 'from-blue-400 to-cyan-500';
            case 'BEGINNER': return 'from-green-400 to-emerald-500';
            default: return 'from-gray-400 to-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (!test) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Test not found</p>
                <Link href="/dashboard/tests" className="text-indigo-400 hover:underline mt-2 inline-block">
                    Back to Tests
                </Link>
            </div>
        );
    }

    // Result view
    if (result) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                    <div className={`w-24 h-24 rounded-full ${result.passed ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center mx-auto mb-4`}>
                        {result.passed ? (
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        ) : (
                            <XCircle className="w-12 h-12 text-red-400" />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {result.passed ? 'Congratulations!' : 'Keep Practicing!'}
                    </h1>
                    <p className="text-gray-400">
                        {result.passed ? 'You passed the test!' : `You needed ${result.passingScore}% to pass`}
                    </p>
                </div>

                <div className="p-8 rounded-2xl glass text-center">
                    <p className={`text-5xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                        {result.score}%
                    </p>
                    <p className="text-gray-400 mt-2">
                        {result.correctAnswers} of {result.totalQuestions} correct
                    </p>
                </div>

                {result.badge && (
                    <div className="p-6 rounded-xl glass text-center">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getBadgeColor(result.badge.badgeType)} flex items-center justify-center mx-auto mb-3`}>
                            <Trophy className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Badge Earned!</h3>
                        <p className={`text-sm font-medium bg-gradient-to-r ${getBadgeColor(result.badge.badgeType)} bg-clip-text text-transparent`}>
                            {result.badge.badgeType} - {result.badge.skill.name}
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Question Results</h3>
                    {result.questionResults.map((qr, index) => {
                        const q = test.questions.find(q => q.id === qr.questionId);
                        return (
                            <div key={qr.questionId} className={`p-4 rounded-lg ${qr.correct ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                <div className="flex items-start gap-3">
                                    {qr.correct ? (
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-white text-sm">{q?.questionText}</p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            Your answer: <span className={qr.correct ? 'text-green-400' : 'text-red-400'}>{qr.userAnswer || 'Not answered'}</span>
                                            {!qr.correct && (
                                                <span className="text-green-400 ml-2">• Correct: {qr.correctAnswer}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-4">
                    <Link
                        href="/dashboard/tests"
                        className="flex-1 text-center px-4 py-3 rounded-lg border border-white/10 text-gray-400 hover:text-white transition"
                    >
                        Back to Tests
                    </Link>
                    <button
                        onClick={() => {
                            setResult(null);
                            setStarted(false);
                            setAnswers({});
                            setCurrentQuestion(0);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Pre-start view
    if (!started) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/tests" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{test.title}</h1>
                        <p className="text-gray-400">{test.skill.name}</p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl glass">
                    <p className="text-gray-300 mb-6">{test.description}</p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 rounded-xl bg-white/5">
                            <p className="text-2xl font-bold text-indigo-400">{test.questions.length}</p>
                            <p className="text-gray-400 text-sm">Questions</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/5">
                            <p className="text-2xl font-bold text-blue-400">{test.durationMinutes} min</p>
                            <p className="text-gray-400 text-sm">Duration</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/5">
                            <p className="text-2xl font-bold text-green-400">{test.passingScore}%</p>
                            <p className="text-gray-400 text-sm">To Pass</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-yellow-500/10 mb-6">
                        <p className="text-yellow-400 text-sm">
                            ⚠️ Once started, you cannot pause. Make sure you have {test.durationMinutes} minutes available.
                        </p>
                    </div>

                    <button
                        onClick={startTest}
                        disabled={starting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                        {starting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                        Start Test
                    </button>
                </div>
            </div>
        );
    }

    // Test in progress
    const question = test.questions[currentQuestion];
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">{test.title}</h1>
                    <p className="text-gray-400 text-sm">Question {currentQuestion + 1} of {test.questions.length}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* Progress */}
            <div className="w-full h-2 rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all"
                    style={{ width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }}
                />
            </div>

            {/* Question */}
            <div className="p-6 rounded-2xl glass">
                <p className="text-lg text-white mb-6">{question.questionText}</p>

                <div className="space-y-3">
                    {(question.options as string[]).map((option, index) => (
                        <button
                            key={index}
                            onClick={() => setAnswers({ ...answers, [question.id]: option })}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${answers[question.id] === option
                                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                                : 'border-white/10 bg-white/5 text-gray-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-white'
                                }`}
                        >
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-sm font-medium mr-3">
                                {String.fromCharCode(65 + index)}
                            </span>
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCurrentQuestion(prev => prev - 1)}
                    disabled={currentQuestion === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 transition"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                <div className="flex gap-2">
                    {test.questions.map((q, index) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestion(index)}
                            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${index === currentQuestion
                                ? 'bg-indigo-500 text-white'
                                : answers[q.id]
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-white/10 text-gray-400'
                                }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                {currentQuestion === test.questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        Submit ({answeredCount}/{test.questions.length})
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(prev => prev + 1)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}


