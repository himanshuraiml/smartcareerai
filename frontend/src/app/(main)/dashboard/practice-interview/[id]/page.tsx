'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Send, Loader2, CheckCircle, Clock,
    MessageSquare, Award, ChevronRight, ChevronLeft,
    Target, BookOpen, Sparkles, AlertTriangle, Lightbulb,
    BarChart3, Trophy, ArrowRight, Eye, EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import ReactMarkdown from 'react-markdown';

interface QuestionMetrics {
    clarity: number;
    relevance: number;
    confidence: number;
    wordCount?: number;
}

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    userAnswer: string | null;
    score: number | null;
    feedback: string | null;
    metrics: QuestionMetrics | null;
    improvedAnswer: string | null;
    bankQuestionId?: string | null;
    orderIndex: number;
}

interface PracticeSession {
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

interface EvaluationResult {
    score: number;
    feedback: string;
    keywordsMatched: string[];
    keywordsMissed: string[];
    metrics: {
        clarity: number;
        relevance: number;
        completeness: number;
        wordCount: number;
    };
    improvedAnswer: string;
}

// Normalize UUID
const normalizeUUID = (id: string | string[] | undefined): string | null => {
    if (!id || Array.isArray(id)) return null;
    const normalized = id.replace(/\s+/g, '-').toLowerCase();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(normalized) ? normalized : null;
};

export default function PracticeInterviewSessionPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const sessionId = normalizeUUID(params.id);

    const [session, setSession] = useState<PracticeSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | null>(null);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
    const [showIdealAnswer, setShowIdealAnswer] = useState(false);
    const [invalidId, setInvalidId] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchSession = useCallback(async () => {
        if (!sessionId) {
            setInvalidId(true);
            setLoading(false);
            return;
        }
        try {
            const response = await authFetch(`/practice-interviews/sessions/${sessionId}`);
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
    }, [sessionId]);

    useEffect(() => {
        if (user && sessionId) {
            fetchSession();
        } else if (!sessionId && params.id) {
            setInvalidId(true);
            setLoading(false);
        }
    }, [user, sessionId, params.id, fetchSession]);

    const submitAnswer = async () => {
        if (!session || !currentAnswer.trim()) return;

        const question = session.questions[currentQuestionIndex];
        if (!question) return;

        setSubmitting(true);
        setLastEvaluation(null);
        setShowIdealAnswer(false);

        try {
            const response = await authFetch(`/practice-interviews/sessions/${sessionId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: question.id,
                    answer: currentAnswer,
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Update local session state
                setSession(prev => {
                    if (!prev) return null;
                    const updatedQuestions = [...prev.questions];
                    updatedQuestions[currentQuestionIndex] = {
                        ...updatedQuestions[currentQuestionIndex],
                        userAnswer: currentAnswer,
                        score: data.data.evaluation.score,
                        feedback: data.data.evaluation.feedback,
                        improvedAnswer: data.data.evaluation.improvedAnswer,
                        metrics: {
                            clarity: data.data.evaluation.metrics.clarity,
                            relevance: data.data.evaluation.metrics.relevance,
                            confidence: data.data.evaluation.metrics.completeness,
                            wordCount: data.data.evaluation.metrics.wordCount,
                        },
                    };
                    return { ...prev, questions: updatedQuestions };
                });

                setLastEvaluation(data.data.evaluation);
                setCurrentAnswer('');
            }
        } catch (err) {
            console.error('Failed to submit answer:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const goToNextQuestion = () => {
        if (!session) return;
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < session.questions.length) {
            setCurrentQuestionIndex(nextIndex);
            setLastEvaluation(null);
            setShowIdealAnswer(false);
            textareaRef.current?.focus();
        }
    };

    const completeInterview = async () => {
        if (!sessionId) return;
        setCompleting(true);
        try {
            const response = await authFetch(`/practice-interviews/sessions/${sessionId}/complete`, {
                method: 'POST',
            });
            if (response.ok) {
                const data = await response.json();
                setSession(data.data.session);
            }
        } catch (err) {
            console.error('Failed to complete session:', err);
        } finally {
            setCompleting(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500/20 border-green-500/30';
        if (score >= 60) return 'bg-amber-500/20 border-amber-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Loading practice session...</p>
                </div>
            </div>
        );
    }

    // Invalid ID
    if (invalidId) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Invalid Session ID</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">The practice session URL appears to be malformed.</p>
                <Link href="/dashboard/practice-interview" className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition inline-block">
                    Return to Practice Interviews
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
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Session Not Found</h3>
                <Link href="/dashboard/practice-interview" className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition inline-block">
                    Return to Practice Interviews
                </Link>
            </div>
        );
    }

    // ==========================================
    // COMPLETED VIEW
    // ==========================================
    if (session.status === 'COMPLETED') {
        const avgScore = session.questions.reduce((sum, q) => sum + (q.score || 0), 0) / session.questions.length;

        return (
            <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
                    <span>›</span>
                    <Link href="/dashboard/practice-interview" className="hover:text-gray-900 dark:hover:text-white">Practice Interviews</Link>
                    <span>›</span>
                    <span className="text-gray-900 dark:text-white">{session.targetRole}</span>
                </div>

                {/* Performance Header */}
                <div className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-6 h-6 text-emerald-400" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Practice Results</h2>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">FREE</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Score Circle */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 border border-emerald-500/20 text-center">
                            <div className="w-32 h-32 mx-auto rounded-full border-8 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 mb-3">
                                <span className={`text-4xl font-bold ${getScoreColor(session.overallScore || 0)}`}>
                                    {session.overallScore || 0}
                                </span>
                            </div>
                            <p className="text-emerald-400 font-medium">
                                {(session.overallScore || 0) >= 80 ? 'Excellent!' : (session.overallScore || 0) >= 60 ? 'Good Job!' : 'Keep Practicing'}
                            </p>
                        </div>

                        {/* Feedback */}
                        <div className="lg:col-span-2">
                            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-white/5 h-full">
                                <h3 className="text-gray-900 dark:text-white font-medium mb-3">Session Feedback</h3>
                                <div className="text-gray-500 dark:text-gray-400 text-sm prose prose-sm dark:prose-invert max-w-none
                                    prose-p:my-2 prose-p:leading-relaxed
                                    prose-strong:text-gray-900 dark:prose-strong:text-white
                                    prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5
                                    prose-li:my-1
                                    prose-h2:text-base prose-h2:mt-3 prose-h2:mb-1
                                    prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1">
                                    <ReactMarkdown>
                                        {session.feedback || 'Complete the practice to receive feedback.'}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score per Question */}
                <div className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Question Scores</h2>
                    <div className="space-y-2">
                        {session.questions.map((q, i) => (
                            <div key={q.id} className="flex items-center gap-3">
                                <span className="text-gray-500 dark:text-gray-400 text-xs w-8 flex-shrink-0">Q{i + 1}</span>
                                <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                                        style={{ width: `${q.score || 0}%` }}
                                    />
                                </div>
                                <span className={`text-sm font-medium w-10 text-right ${getScoreColor(q.score || 0)}`}>
                                    {q.score || 0}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question-wise Review */}
                <div className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detailed Review</h2>

                    {/* Question Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {session.questions.map((q, i) => (
                            <button
                                key={q.id}
                                onClick={() => setSelectedQuestionIndex(i)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${i === selectedQuestionIndex
                                    ? 'bg-emerald-500 text-white'
                                    : q.userAnswer
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        : 'bg-gray-100 dark:bg-gray-800/50 text-gray-500'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    {session.questions[selectedQuestionIndex] && (
                        <div className="space-y-4">
                            {/* Question */}
                            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 font-medium">
                                        {session.questions[selectedQuestionIndex].questionType}
                                    </span>
                                    {session.questions[selectedQuestionIndex].score !== null && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getScoreBg(session.questions[selectedQuestionIndex].score || 0)} ${getScoreColor(session.questions[selectedQuestionIndex].score || 0)}`}>
                                            {session.questions[selectedQuestionIndex].score}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {session.questions[selectedQuestionIndex].questionText}
                                </p>
                            </div>

                            {/* Your Answer */}
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">Your Answer</p>
                                <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-white/5">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                        {session.questions[selectedQuestionIndex].userAnswer || 'No answer recorded'}
                                    </p>
                                </div>
                            </div>

                            {/* Ideal Answer */}
                            {session.questions[selectedQuestionIndex].improvedAnswer && (
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">Ideal Answer</p>
                                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                            {session.questions[selectedQuestionIndex].improvedAnswer}
                                        </p>
                                        <div className="mt-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                ✓ Expert-curated response
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Feedback */}
                            {session.questions[selectedQuestionIndex].feedback && (
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">Feedback</p>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                        {session.questions[selectedQuestionIndex].feedback}
                                    </p>
                                </div>
                            )}

                            {/* Metrics */}
                            {session.questions[selectedQuestionIndex].metrics && (
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Clarity', value: session.questions[selectedQuestionIndex].metrics?.clarity },
                                        { label: 'Relevance', value: session.questions[selectedQuestionIndex].metrics?.relevance },
                                        { label: 'Completeness', value: session.questions[selectedQuestionIndex].metrics?.confidence },
                                    ].map(m => (
                                        <div key={m.label} className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-white/5 text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{m.label}</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{m.value || 0}</p>
                                            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                                    style={{ width: `${m.value || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Link
                        href="/dashboard/practice-interview"
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition font-medium"
                    >
                        ← Back to Practice
                    </Link>
                    <Link
                        href="/dashboard/interviews"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:shadow-lg transition"
                    >
                        Try Mock Interview (AI-Powered) →
                    </Link>
                </div>
            </div>
        );
    }

    // ==========================================
    // IN-PROGRESS VIEW — The interview room
    // ==========================================
    const currentQuestion = session.questions[currentQuestionIndex];
    const answeredCount = session.questions.filter(q => q.userAnswer).length;
    const progress = (answeredCount / session.questions.length) * 100;
    const isCurrentAnswered = !!currentQuestion?.userAnswer;
    const isLastQuestion = currentQuestionIndex === session.questions.length - 1;
    const allAnswered = answeredCount === session.questions.length;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/practice-interview"
                        className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Practice: {session.targetRole}
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">FREE</span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {session.type} • {session.difficulty} • {answeredCount}/{session.questions.length} answered
                        </p>
                    </div>
                </div>

                {allAnswered && (
                    <button
                        onClick={completeInterview}
                        disabled={completing}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg transition flex items-center gap-2"
                    >
                        {completing ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Completing...</>
                        ) : (
                            <><CheckCircle className="w-4 h-4" /> Complete Interview</>
                        )}
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative">
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">{Math.round(progress)}% complete</span>
                    <span className="text-xs text-gray-500">{session.questions.length - answeredCount} remaining</span>
                </div>
            </div>

            {/* Question Navigation */}
            <div className="flex flex-wrap gap-2">
                {session.questions.map((q, i) => (
                    <button
                        key={q.id}
                        onClick={() => {
                            setCurrentQuestionIndex(i);
                            setLastEvaluation(null);
                            setShowIdealAnswer(false);
                            setCurrentAnswer('');
                        }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${i === currentQuestionIndex
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                            : q.userAnswer
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                            }`}
                    >
                        {q.userAnswer ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </button>
                ))}
            </div>

            {/* Current Question */}
            {currentQuestion && (
                <div className="space-y-4">
                    {/* Question Card */}
                    <div className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Question {currentQuestionIndex + 1} of {session.questions.length}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                                {currentQuestion.questionType}
                            </span>
                        </div>
                        <p className="text-lg text-gray-900 dark:text-white font-medium leading-relaxed">
                            {currentQuestion.questionText}
                        </p>
                    </div>

                    {/* Already answered — show result */}
                    {isCurrentAnswered && (
                        <div className="space-y-4">
                            {/* Score badge */}
                            <div className={`p-4 rounded-xl border ${getScoreBg(currentQuestion.score || 0)}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Award className="w-5 h-5 text-emerald-400" />
                                        <span className="text-gray-900 dark:text-white font-medium">Your Score</span>
                                    </div>
                                    <span className={`text-2xl font-bold ${getScoreColor(currentQuestion.score || 0)}`}>
                                        {currentQuestion.score || 0}%
                                    </span>
                                </div>
                            </div>

                            {/* Your answer */}
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Answer</p>
                                <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-white/5">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{currentQuestion.userAnswer}</p>
                                </div>
                            </div>

                            {/* Feedback */}
                            {currentQuestion.feedback && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                        <Lightbulb className="w-4 h-4" /> Feedback
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">{currentQuestion.feedback}</p>
                                </div>
                            )}

                            {/* Ideal Answer Toggle */}
                            {currentQuestion.improvedAnswer && (
                                <div>
                                    <button
                                        onClick={() => setShowIdealAnswer(!showIdealAnswer)}
                                        className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition mb-2"
                                    >
                                        {showIdealAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        {showIdealAnswer ? 'Hide Ideal Answer' : 'Show Ideal Answer'}
                                    </button>
                                    {showIdealAnswer && (
                                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                            <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                                {currentQuestion.improvedAnswer}
                                            </p>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 mt-2">
                                                ✓ Expert-curated response
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Next / Complete Button */}
                            <div className="flex gap-3">
                                {!isLastQuestion && (
                                    <button
                                        onClick={goToNextQuestion}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition flex items-center justify-center gap-2"
                                    >
                                        Next Question <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                                {allAnswered && (
                                    <button
                                        onClick={completeInterview}
                                        disabled={completing}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
                                    >
                                        {completing ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Completing...</>
                                        ) : (
                                            <><Trophy className="w-4 h-4" /> Complete & See Results</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Not yet answered — show answer form */}
                    {!isCurrentAnswered && (
                        <div className="space-y-4">
                            {/* Answer textarea */}
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    placeholder="Type your answer here... Be thorough and include key concepts, examples, and explanations."
                                    className="w-full min-h-[200px] p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-y transition"
                                    disabled={submitting}
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                    {currentAnswer.split(/\s+/).filter(w => w).length} words
                                </div>
                            </div>

                            {/* Submit button */}
                            <button
                                onClick={submitAnswer}
                                disabled={submitting || !currentAnswer.trim()}
                                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Submit Answer</>
                                )}
                            </button>

                            {/* Live feedback from just-submitted answer */}
                            {lastEvaluation && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className={`p-4 rounded-xl border ${getScoreBg(lastEvaluation.score)}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-gray-900 dark:text-white font-medium">Score</span>
                                            <span className={`text-2xl font-bold ${getScoreColor(lastEvaluation.score)}`}>
                                                {lastEvaluation.score}%
                                            </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">{lastEvaluation.feedback}</p>
                                    </div>

                                    {lastEvaluation.keywordsMatched.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-green-400 mb-1">✓ Keywords matched:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {lastEvaluation.keywordsMatched.map(kw => (
                                                    <span key={kw} className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {lastEvaluation.keywordsMissed.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-amber-400 mb-1">✗ Keywords to include next time:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {lastEvaluation.keywordsMissed.map(kw => (
                                                    <span key={kw} className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
