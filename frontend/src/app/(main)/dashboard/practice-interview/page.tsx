'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    MessageSquare, Plus, Clock, Target, TrendingUp, ChevronRight,
    Loader2, CheckCircle, XCircle, Sparkles, Zap, BookOpen, ArrowRight,
    Search, Filter
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

interface PracticeSession {
    id: string;
    type: string;
    targetRole: string;
    difficulty: string;
    status: string;
    overallScore: number | null;
    createdAt: string;
    completedAt: string | null;
    questions: Array<{ id: string; score: number | null; bankQuestionId: string | null }>;
}

export default function PracticeInterviewPage() {
    const { user } = useAuthStore();
    const [sessions, setSessions] = useState<PracticeSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newSession, setNewSession] = useState({
        type: 'TECHNICAL' as 'TECHNICAL' | 'BEHAVIORAL' | 'HR' | 'MIXED',
        targetRole: 'Software Developer',
        difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    });

    const jobRoles = [
        'Software Developer', 'Frontend Developer', 'Backend Developer',
        'Full Stack Developer', 'Data Scientist', 'Data Analyst',
        'Machine Learning Engineer', 'DevOps Engineer', 'Cloud Engineer',
        'Product Manager', 'Project Manager', 'UI/UX Designer',
        'Mobile Developer', 'QA Engineer', 'Cybersecurity Analyst',
    ];

    const fetchSessions = useCallback(async () => {
        try {
            const response = await authFetch('/practice-interviews/sessions');
            if (response.ok) {
                const data = await response.json();
                // Filter to sessions that have bankQuestionIds (practice sessions)
                const practiceSessions = (data.data || []).filter((s: PracticeSession) =>
                    s.questions?.some(q => q.bankQuestionId)
                );
                setSessions(practiceSessions);
            }
        } catch (err) {
            console.error('Failed to fetch practice sessions:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchSessions();
        }
    }, [user, fetchSessions]);

    const createSession = async () => {
        setCreating(true);
        setError(null);
        try {
            const response = await authFetch('/practice-interviews/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSession),
            });

            const data = await response.json();

            if (response.ok) {
                setShowNewModal(false);
                window.location.href = `/dashboard/practice-interview/${data.data.session.id}`;
            } else {
                setError(data.error || 'Failed to create practice session');
            }
        } catch (err) {
            console.error('Failed to create practice session:', err);
            setError('Failed to create session. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">Completed</span>;
            case 'IN_PROGRESS':
                return <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">In Progress</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">Pending</span>;
        }
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return 'text-gray-400';
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'HARD': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    // Stats
    const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;
    const avgScore = completedCount > 0
        ? Math.round(sessions
            .filter(s => s.status === 'COMPLETED' && s.overallScore)
            .reduce((sum, s) => sum + (s.overallScore || 0), 0) / completedCount)
        : 0;
    const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions?.length || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                            <MessageSquare className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Practice Interviews</h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 uppercase tracking-wider">
                            Free
                        </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                        Practice with real interview questions from our expert-curated question bank. No credits required.
                    </p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" />
                    Start Practice
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl glass border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <BookOpen className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Sessions Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
                </div>
                <div className="p-5 rounded-2xl glass border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-teal-500/10">
                            <Target className="w-5 h-5 text-teal-400" />
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Average Score</span>
                    </div>
                    <p className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>
                        {avgScore > 0 ? `${avgScore}%` : '—'}
                    </p>
                </div>
                <div className="p-5 rounded-2xl glass border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10">
                            <Zap className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Questions Practiced</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalQuestions}</p>
                </div>
            </div>

            {/* How it works */}
            {sessions.length === 0 && !loading && (
                <div className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        How Practice Interviews Work
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <span className="text-emerald-400 font-bold">1</span>
                            </div>
                            <h4 className="text-gray-900 dark:text-white font-medium mb-1">Choose your path</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Select your target role, interview type, and difficulty level</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                                <span className="text-teal-400 font-bold">2</span>
                            </div>
                            <h4 className="text-gray-900 dark:text-white font-medium mb-1">Answer questions</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Type your answers to curated questions from our expert bank</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                <span className="text-cyan-400 font-bold">3</span>
                            </div>
                            <h4 className="text-gray-900 dark:text-white font-medium mb-1">Get instant feedback</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Compare your answer against ideal responses and see your score</p>
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                        >
                            Start Your First Practice
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
            )}

            {/* Session List */}
            {!loading && sessions.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Practice Sessions</h2>
                    {sessions.map(session => (
                        <Link
                            key={session.id}
                            href={`/dashboard/practice-interview/${session.id}`}
                            className="block p-5 rounded-2xl glass border border-gray-200 dark:border-white/5 hover:border-emerald-500/30 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-gray-900 dark:text-white font-medium truncate">
                                            {session.targetRole}
                                        </h3>
                                        {getStatusBadge(session.status)}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(session.difficulty)}`}>
                                            {session.difficulty}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {session.type}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(session.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Target className="w-3.5 h-3.5" />
                                            {session.questions?.length || 0} questions
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-4">
                                    {session.overallScore !== null && (
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getScoreColor(session.overallScore)}`}>
                                                {session.overallScore}%
                                            </p>
                                            <p className="text-xs text-gray-500">Score</p>
                                        </div>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Upsell Banner */}
            {sessions.length >= 2 && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 border border-indigo-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-900 dark:text-white font-bold mb-1">Ready for the real thing?</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Try our AI-powered Mock Interviews with audio/video mode for personalized feedback from AI.
                            </p>
                        </div>
                        <Link
                            href="/dashboard/interviews"
                            className="flex-shrink-0 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm font-medium"
                        >
                            Try Mock Interviews →
                        </Link>
                    </div>
                </div>
            )}

            {/* New Practice Modal */}
            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Practice Interview</h2>
                                <p className="text-sm text-emerald-400 font-medium mt-1 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Free — No credits required
                                </p>
                            </div>
                            <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Interview Type */}
                        <div className="mb-5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Interview Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'TECHNICAL', label: 'Technical', icon: '💻', desc: 'Coding & system design' },
                                    { value: 'BEHAVIORAL', label: 'Behavioral', icon: '🧠', desc: 'STAR method questions' },
                                    { value: 'HR', label: 'HR', icon: '🤝', desc: 'General HR questions' },
                                    { value: 'MIXED', label: 'Mixed', icon: '🎯', desc: 'All-round prep' },
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setNewSession({ ...newSession, type: type.value as any })}
                                        className={`p-3 rounded-xl border text-left transition-all ${newSession.type === type.value
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-gray-800/50'
                                            }`}
                                    >
                                        <span className="text-lg">{type.icon}</span>
                                        <p className="font-medium text-gray-900 dark:text-white text-sm mt-1">{type.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{type.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Role */}
                        <div className="mb-5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Target Role</label>
                            <select
                                value={newSession.targetRole}
                                onChange={(e) => setNewSession({ ...newSession, targetRole: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                {jobRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        {/* Difficulty */}
                        <div className="mb-6">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Difficulty</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'EASY', label: 'Easy', desc: '5 questions', color: 'emerald' },
                                    { value: 'MEDIUM', label: 'Medium', desc: '7 questions', color: 'amber' },
                                    { value: 'HARD', label: 'Hard', desc: '10 questions', color: 'red' },
                                ].map(diff => (
                                    <button
                                        key={diff.value}
                                        type="button"
                                        onClick={() => setNewSession({ ...newSession, difficulty: diff.value as any })}
                                        className={`p-3 rounded-xl border text-center transition-all ${newSession.difficulty === diff.value
                                            ? `border-${diff.color}-500 bg-${diff.color}-500/10`
                                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-gray-800/50'
                                            }`}
                                    >
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{diff.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{diff.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="mb-5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm">
                            <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">Text-based practice</p>
                                    <p className="text-xs opacity-75 mt-0.5">
                                        Type your answers and get instant feedback compared to expert-curated ideal responses.
                                        For AI-powered audio/video interviews, try our Mock Interview feature.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNewModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createSession}
                                disabled={creating}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        Start Practice
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
