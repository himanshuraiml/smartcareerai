'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authFetchJson } from '@/lib/auth-fetch';
import { Loader2, AlertCircle, ArrowLeft, Trophy, Star, Target, Zap, Clock, TrendingUp, User, CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Interfaces based on the backend Replay Details / Session schema
interface QuestionResult {
    id: string;
    questionText: string;
    userAnswer: string;
    score: number;
    feedback: string;
    metrics?: any;
    improvedAnswer?: string;
}

interface MockSessionResult {
    id: string;
    targetRole?: string;
    createdAt: string;
    status: string;
    overallScore: number;
    feedback: string; // The overall feedback given by AI
    questions: QuestionResult[];
}

export default function MockFeedbackPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MockSessionResult | null>(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                // Fetch the replay details which contains all questions, scores, and feedback
                const { data, error: fetchErr } = await authFetchJson(`/interviews/sessions/${sessionId}/replay`);
                if (fetchErr || !data) throw new Error(fetchErr || 'Failed to load feedback data');
                setResult(data as MockSessionResult);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) fetchResult();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-gray-100 dark:border-gray-700">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-80" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Feedback Unavailable</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">{error || 'Session not found or not yet completed.'}</p>
                    <button
                        onClick={() => router.push('/candidate/practice')}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
                    >
                        Return to Practice Hub
                    </button>
                </div>
            </div>
        );
    }

    // Derived Statistics
    const answeredCount = result.questions.filter(q => q.userAnswer).length;
    const isCompleted = result.status === 'COMPLETED';
    const parsedFeedback = typeof result.feedback === 'string' && result.feedback.startsWith('{')
        ? JSON.parse(result.feedback)
        : { strengths: [], weaknesses: [], overallComments: result.feedback };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/candidate/practice')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Practice Hub
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                            {result.targetRole || 'Mock Interview'}
                        </span>
                        {isCompleted ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
                                <Clock className="w-3.5 h-3.5" /> Incomplete
                            </span>
                        )}
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 mt-10">
                {/* Score Header Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* Main Score Card */}
                    <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center border border-indigo-500/30">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-bl-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-900 opacity-20 rounded-tr-full pointer-events-none"></div>

                        <Trophy className="w-12 h-12 text-yellow-300 mb-4 drop-shadow-lg" />
                        <h2 className="text-indigo-100 font-medium text-lg mb-2 uppercase tracking-wider">Overall AI Score</h2>
                        <div className="text-6xl font-extrabold tracking-tighter mb-2 drop-shadow-md">
                            {result.overallScore}<span className="text-3xl text-indigo-200/50">/100</span>
                        </div>
                        <p className="text-sm font-medium text-indigo-100/80 bg-black/20 px-4 py-1.5 rounded-full mt-2">
                            {result.overallScore >= 80 ? 'Exceptional Performance' : result.overallScore >= 60 ? 'Solid Attempt' : 'Needs Improvement'}
                        </p>
                    </div>

                    {/* Executive Summary */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-500" /> Executive Summary
                        </h3>
                        <div className="flex-1 text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none mb-6">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {parsedFeedback.overallComments || typeof result.feedback === 'string' ? result.feedback : 'No overall summary available.'}
                            </ReactMarkdown>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-auto border-t border-gray-100 dark:border-gray-800 pt-6">
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Key Strengths
                                </h4>
                                <ul className="space-y-2">
                                    {parsedFeedback.strengths?.map((s: string, i: number) => (
                                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                            <span className="text-emerald-500 mt-0.5">•</span> {s}
                                        </li>
                                    )) || <li className="text-sm text-gray-500 italic">No specific strengths captured.</li>}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Zap className="w-4 h-4 text-amber-500" /> Areas to Improve
                                </h4>
                                <ul className="space-y-2">
                                    {parsedFeedback.weaknesses?.map((w: string, i: number) => (
                                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span> {w}
                                        </li>
                                    )) || <li className="text-sm text-gray-500 italic">No specific weaknesses captured.</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question by Question Breakdown */}
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-indigo-500" /> Detailed Breakdown
                </h3>

                <div className="space-y-6">
                    {result.questions.map((q, index) => (
                        <div key={q.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col lg:flex-row">

                            {/* Left Col: Target Question & Score */}
                            <div className="lg:w-1/3 bg-gray-50 dark:bg-gray-950/50 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 flex flex-col justify-center relative">
                                <div className="absolute top-8 right-8 w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-inner border"
                                    style={{
                                        backgroundColor: q.score >= 80 ? 'rgba(16, 185, 129, 0.1)' : q.score >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: q.score >= 80 ? '#10b981' : q.score >= 50 ? '#f59e0b' : '#ef4444',
                                        borderColor: q.score >= 80 ? 'rgba(16, 185, 129, 0.2)' : q.score >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                                    }}
                                >
                                    {q.score || 0}
                                </div>
                                <span className="uppercase text-xs font-bold tracking-widest text-indigo-500 mb-3">Question {index + 1}</span>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight pr-16">
                                    {q.questionText}
                                </h4>
                            </div>

                            {/* Right Col: Your Answer & AI Feedback */}
                            <div className="lg:w-2/3 p-6 sm:p-8 flex flex-col gap-6">
                                <div>
                                    <h5 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-gray-400" /> Your Answer
                                    </h5>
                                    <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-4 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap">
                                        {q.userAnswer || <span className="italic text-gray-400">Skipped or no answer provided.</span>}
                                    </div>
                                </div>

                                {q.feedback && (
                                    <div>
                                        <h5 className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Star className="w-4 h-4 text-indigo-500" /> AI Feedback
                                        </h5>
                                        <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {q.feedback}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {q.improvedAnswer && (
                                    <div className="mt-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-5 border border-indigo-100 dark:border-indigo-500/20">
                                        <h5 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Trophy className="w-4 h-4 text-indigo-500" /> Ideal Answer Pattern
                                        </h5>
                                        <div className="text-sm text-indigo-900/80 dark:text-indigo-200 whitespace-pre-wrap font-medium">
                                            {q.improvedAnswer}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {result.questions.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No questions found for this session.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
