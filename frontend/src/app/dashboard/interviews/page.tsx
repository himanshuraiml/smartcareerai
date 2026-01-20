'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Video, Plus, Clock, Target, TrendingUp, ChevronRight,
    Loader2, Play, CheckCircle, XCircle, MessageSquare, Mic
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface InterviewSession {
    id: string;
    type: string;
    targetRole: string;
    difficulty: string;
    status: string;
    overallScore: number | null;
    createdAt: string;
    completedAt: string | null;
    questions: Array<{ id: string; score: number | null }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function InterviewsPage() {
    const { accessToken } = useAuthStore();
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newSession, setNewSession] = useState({
        type: 'TECHNICAL',
        targetRole: 'Software Developer',
        difficulty: 'MEDIUM',
        format: 'VIDEO', // Video-only mode for immersive interviews
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
            const response = await fetch(`${API_URL}/interviews/sessions`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSessions(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchSessions();
        }
    }, [accessToken, fetchSessions]);

    const createSession = async () => {
        setCreating(true);
        try {
            const response = await fetch(`${API_URL}/interviews/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newSession),
            });

            if (response.ok) {
                const data = await response.json();
                setShowNewModal(false);
                window.location.href = `/dashboard/interviews/${data.data.id}`;
            }
        } catch (err) {
            console.error('Failed to create session:', err);
        } finally {
            setCreating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Completed</span>;
            case 'IN_PROGRESS':
                return <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">In Progress</span>;
            case 'CANCELLED':
                return <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">Cancelled</span>;
            default:
                return <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">Pending</span>;
        }
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return 'text-gray-400';
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">AI Interviews</h1>
                    <p className="text-gray-400 mt-1">Practice with AI-powered interview simulations</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    New Interview
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl glass">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Video className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{sessions.length}</p>
                            <p className="text-gray-400 text-sm">Total Interviews</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-xl glass">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {sessions.filter(s => s.status === 'COMPLETED').length}
                            </p>
                            <p className="text-gray-400 text-sm">Completed</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-xl glass">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${getScoreColor(
                                sessions.filter(s => s.overallScore).reduce((sum, s) => sum + (s.overallScore || 0), 0) /
                                (sessions.filter(s => s.overallScore).length || 1)
                            )}`}>
                                {sessions.filter(s => s.overallScore).length > 0
                                    ? Math.round(sessions.filter(s => s.overallScore).reduce((sum, s) => sum + (s.overallScore || 0), 0) /
                                        sessions.filter(s => s.overallScore).length)
                                    : '--'}%
                            </p>
                            <p className="text-gray-400 text-sm">Avg Score</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sessions List */}
            {loading ? (
                <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading interviews...</p>
                </div>
            ) : sessions.length === 0 ? (
                <div className="p-12 rounded-2xl glass text-center">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No interviews yet</h3>
                    <p className="text-gray-400 mb-4">Start practicing with AI interview simulations</p>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition"
                    >
                        Start Your First Interview
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <Link
                            key={session.id}
                            href={`/dashboard/interviews/${session.id}`}
                            className="block p-6 rounded-xl glass hover:border-purple-500/30 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <Video className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium group-hover:text-purple-400 transition line-clamp-2 md:line-clamp-none">
                                            {session.type} Interview - {session.targetRole}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 text-sm text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Target className="w-3 h-3" />
                                                {session.difficulty}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(session.createdAt).toLocaleDateString()}
                                            </span>
                                            {session.questions.length > 0 && (
                                                <span>{session.questions.length} questions</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {session.overallScore !== null && (
                                        <span className={`text-2xl font-bold ${getScoreColor(session.overallScore)}`}>
                                            {session.overallScore}%
                                        </span>
                                    )}
                                    {getStatusBadge(session.status)}
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* New Interview Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-4">Start New Interview</h2>

                        <div className="space-y-4">
                            {/* Video Interview Mode Banner */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <Video className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Mock Interview Mode</h3>
                                        <p className="text-gray-400 text-sm">Experience a realistic video interview with AI interviewer</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Interview Type</label>
                                <select
                                    value={newSession.type}
                                    onChange={(e) => setNewSession({ ...newSession, type: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-purple-500 [&>option]:bg-gray-800 [&>option]:text-white"
                                >
                                    <option value="TECHNICAL">Technical</option>
                                    <option value="BEHAVIORAL">Behavioral</option>
                                    <option value="HR">HR</option>
                                    <option value="MIXED">Mixed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Target Role</label>
                                <select
                                    value={newSession.targetRole}
                                    onChange={(e) => setNewSession({ ...newSession, targetRole: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-purple-500 [&>option]:bg-gray-800 [&>option]:text-white"
                                >
                                    {jobRoles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Difficulty</label>
                                <select
                                    value={newSession.difficulty}
                                    onChange={(e) => setNewSession({ ...newSession, difficulty: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:border-purple-500 [&>option]:bg-gray-800 [&>option]:text-white"
                                >
                                    <option value="EASY">Easy (5 questions)</option>
                                    <option value="MEDIUM">Medium (7 questions)</option>
                                    <option value="HARD">Hard (10 questions)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowNewModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createSession}
                                disabled={creating}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                Start Interview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
