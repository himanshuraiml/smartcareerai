'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Video, Plus, Clock, Target, TrendingUp, ChevronRight,
    Loader2, Play, CheckCircle, XCircle, MessageSquare, Mic,
    CreditCard, AlertTriangle, Building2, ArrowRight, Bell, Bot,
    Calendar, ExternalLink, CalendarPlus
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

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
    jobId: string | null;
    inviteType: 'AI' | 'COPILOT' | null;
}

interface Invitation {
    sessionId: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    location: string;
    difficulty: string;
    type: string;
    inviteType: 'AI' | 'COPILOT';
    scheduledAt: string | null;
    scheduledEndAt: string | null;
    meetLink: string | null;
    createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function InterviewsPage() {
    const { user } = useAuthStore();
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
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
            const [sessRes, invRes] = await Promise.all([
                authFetch('/interviews/sessions'),
                authFetch('/interviews/sessions/invitations'),
            ]);
            if (sessRes.ok) {
                const data = await sessRes.json();
                setSessions(data.data || []);
            }
            if (invRes.ok) {
                const data = await invRes.json();
                setInvitations(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchSessions();
        }
    }, [user, fetchSessions]);

    const [error, setError] = useState<string | null>(null);
    const [showCreditsModal, setShowCreditsModal] = useState(false);

    const createSession = async () => {
        setCreating(true);
        setError(null);
        try {
            const response = await authFetch('/interviews/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSession)
            });

            const data = await response.json();

            if (response.ok) {
                setShowNewModal(false);
                window.location.href = `/dashboard/interviews/${data.data.id}`;
            } else if (response.status === 402) {
                // Insufficient credits
                setShowNewModal(false);
                setShowCreditsModal(true);
            } else {
                setError(data.error || 'Failed to create session');
            }
        } catch (err) {
            console.error('Failed to create session:', err);
            setError('Failed to create session. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Interviews</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">AI mock practice, recruiter AI interviews, and live co-pilot sessions</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 transition whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    New Interview
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl glass">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Video className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Interviews</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-xl glass">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {sessions.filter(s => s.status === 'COMPLETED').length}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Completed</p>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Avg Score</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── AI Interview Invitations (Full AI, async) ── */}
            {invitations.filter(i => i.inviteType === 'AI').length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            AI Interview Invitations ({invitations.filter(i => i.inviteType === 'AI').length})
                        </h2>
                    </div>
                    {invitations.filter(i => i.inviteType === 'AI').map(inv => (
                        <div key={inv.sessionId} className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{inv.jobTitle}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{inv.companyName}{inv.location ? ` · ${inv.location}` : ''}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{inv.type} · {inv.difficulty} · Invited {new Date(inv.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <Link
                                href={`/dashboard/interviews/${inv.sessionId}`}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors flex-shrink-0"
                            >
                                Start <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Co-pilot Interview Invitations (live, recruiter-led) ── */}
            {invitations.filter(i => i.inviteType === 'COPILOT').length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-teal-500" />
                        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            Live Interview Invitations ({invitations.filter(i => i.inviteType === 'COPILOT').length})
                        </h2>
                    </div>
                    {invitations.filter(i => i.inviteType === 'COPILOT').map(inv => (
                        <CopilotInvitationCard key={inv.sessionId} inv={inv} />
                    ))}
                </div>
            )}

            {/* Sessions List — split: Recruiter AI Interviews + Practice Sessions */}
            {loading ? (
                <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading interviews...</p>
                </div>
            ) : sessions.length === 0 && invitations.length === 0 ? (
                <div className="p-12 rounded-2xl glass text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No interviews yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Start practicing with AI interview simulations</p>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition"
                    >
                        Start Your First Interview
                    </button>
                </div>
            ) : (
                <>
                    {/* Recruiter AI Interviews (completed/in-progress) */}
                    {sessions.filter(s => s.jobId && s.inviteType !== 'COPILOT').length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-violet-500" />
                                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Recruiter AI Interviews
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {sessions.filter(s => s.jobId && s.inviteType !== 'COPILOT').map((session) => (
                                    <SessionCard key={session.id} session={session} tag="AI" tagColor="violet" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recruiter Co-pilot Sessions (completed) */}
                    {sessions.filter(s => s.jobId && s.inviteType === 'COPILOT').length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-teal-500" />
                                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Live Interview Sessions
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {sessions.filter(s => s.jobId && s.inviteType === 'COPILOT').map((session) => (
                                    <SessionCard key={session.id} session={session} tag="Live" tagColor="teal" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Self-practice sessions */}
                    {sessions.filter(s => !s.jobId).length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-500" />
                                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                    Practice Sessions
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {sessions.filter(s => !s.jobId).map((session) => (
                                    <SessionCard key={session.id} session={session} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* New Interview Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-200 dark:border-white/10 max-h-[90vh] flex flex-col">
                        <div className="p-6 pb-0">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Start New Interview</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4">
                            {/* Video Interview Mode Banner */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-pink-500/20 border border-indigo-500/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                        <Video className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 dark:text-white font-medium">Mock Interview Mode</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Experience a realistic video interview with AI interviewer</p>
                                    </div>
                                </div>
                            </div>

                            {/* Interview Type Selection - 3 Cards */}
                            <div>
                                <label className="block text-gray-500 dark:text-gray-400 text-sm mb-3">Select Interview Type</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {/* HR + Technical (Mixed) */}
                                    <button
                                        type="button"
                                        onClick={() => setNewSession({ ...newSession, type: 'MIXED' })}
                                        className={`p-4 rounded-xl border text-left transition-all ${newSession.type === 'MIXED'
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-100 dark:bg-gray-800/50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${newSession.type === 'MIXED' ? 'bg-indigo-500/20' : 'bg-gray-200 dark:bg-gray-700'
                                                }`}>
                                                <Video className={`w-5 h-5 ${newSession.type === 'MIXED' ? 'text-indigo-400' : 'text-gray-400'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-gray-900 dark:text-white font-medium">HR + Technical</h4>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Complete interview with behavioral and technical questions</p>
                                                <span className="text-xs text-gray-500 mt-1 inline-block">~12 questions</span>
                                            </div>
                                            {newSession.type === 'MIXED' && (
                                                <CheckCircle className="w-5 h-5 text-indigo-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Technical Only */}
                                    <button
                                        type="button"
                                        onClick={() => setNewSession({ ...newSession, type: 'TECHNICAL' })}
                                        className={`p-4 rounded-xl border text-left transition-all ${newSession.type === 'TECHNICAL'
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-100 dark:bg-gray-800/50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${newSession.type === 'TECHNICAL' ? 'bg-blue-500/20' : 'bg-gray-200 dark:bg-gray-700'
                                                }`}>
                                                <Target className={`w-5 h-5 ${newSession.type === 'TECHNICAL' ? 'text-blue-400' : 'text-gray-400'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-gray-900 dark:text-white font-medium">Technical Only</h4>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Coding, system design, and technical problem-solving</p>
                                                <span className="text-xs text-gray-500 mt-1 inline-block">~8 questions</span>
                                            </div>
                                            {newSession.type === 'TECHNICAL' && (
                                                <CheckCircle className="w-5 h-5 text-blue-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* HR / Behavioral */}
                                    <button
                                        type="button"
                                        onClick={() => setNewSession({ ...newSession, type: 'BEHAVIORAL' })}
                                        className={`p-4 rounded-xl border text-left transition-all ${newSession.type === 'BEHAVIORAL'
                                            ? 'border-green-500 bg-green-500/10'
                                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-100 dark:bg-gray-800/50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${newSession.type === 'BEHAVIORAL' ? 'bg-green-500/20' : 'bg-gray-200 dark:bg-gray-700'
                                                }`}>
                                                <MessageSquare className={`w-5 h-5 ${newSession.type === 'BEHAVIORAL' ? 'text-green-400' : 'text-gray-400'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-gray-900 dark:text-white font-medium">HR / Behavioral</h4>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">STAR-based behavioral questions and soft skills</p>
                                                <span className="text-xs text-gray-500 mt-1 inline-block">~8 questions</span>
                                            </div>
                                            {newSession.type === 'BEHAVIORAL' && (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-500 dark:text-gray-400 text-sm mb-2">Target Role</label>
                                <select
                                    value={newSession.targetRole}
                                    onChange={(e) => setNewSession({ ...newSession, targetRole: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:bg-white dark:[&>option]:bg-gray-800 [&>option]:text-gray-900 dark:[&>option]:text-white"
                                >
                                    {jobRoles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-500 dark:text-gray-400 text-sm mb-2">Difficulty</label>
                                <select
                                    value={newSession.difficulty}
                                    onChange={(e) => setNewSession({ ...newSession, difficulty: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:bg-white dark:[&>option]:bg-gray-800 [&>option]:text-gray-900 dark:[&>option]:text-white"
                                >
                                    <option value="EASY">Easy (5 questions)</option>
                                    <option value="MEDIUM">Medium (7 questions)</option>
                                    <option value="HARD">Hard (10 questions)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 dark:border-white/10">
                            <button
                                onClick={() => setShowNewModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createSession}
                                disabled={creating}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                Start Interview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Insufficient Credits Modal */}
            {showCreditsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-white/10">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Interview Credits</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                You've used all your AI Interview credits. Purchase more credits or upgrade your plan to continue practicing.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreditsModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                                >
                                    Cancel
                                </button>
                                <Link
                                    href="/dashboard/billing"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 transition"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Get Credits
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
                    <XCircle className="w-5 h-5" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 hover:text-red-200">×</button>
                </div>
            )}
        </div>
    );
}

// ── Google Calendar quick-add URL ────────────────────────────────────
function buildGCalUrl(title: string, start: string, end: string, details: string, location?: string) {
    const fmt = (iso: string) =>
        new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${fmt(start)}/${fmt(end)}`,
        details,
    });
    if (location) params.set('location', location);
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── Module-level helpers ──────────────────────────────────────────────
function getStatusBadge(status: string) {
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
}

function getScoreColor(score: number | null) {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
}

// ── Reusable session card ──────────────────────────────────────────────
interface InterviewSessionForCard {
    id: string;
    type: string;
    targetRole: string;
    difficulty: string;
    status: string;
    overallScore: number | null;
    createdAt: string;
    questions: Array<{ id: string; score: number | null }>;
    jobId: string | null;
    inviteType: 'AI' | 'COPILOT' | null;
}

// ── Co-pilot invitation card ──────────────────────────────────────────
interface CopilotInvitationCardProps {
    inv: {
        sessionId: string;
        jobTitle: string;
        companyName: string;
        location: string;
        difficulty: string;
        type: string;
        scheduledAt: string | null;
        scheduledEndAt: string | null;
        meetLink: string | null;
        createdAt: string;
    };
}

function CopilotInvitationCard({ inv }: CopilotInvitationCardProps) {
    const hasSchedule = !!inv.scheduledAt;
    const isUpcoming = hasSchedule && new Date(inv.scheduledAt!) > new Date();

    const scheduledDate = inv.scheduledAt
        ? new Date(inv.scheduledAt).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })
        : null;
    const scheduledTime = inv.scheduledAt
        ? new Date(inv.scheduledAt).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
          })
        : null;
    const durationMins =
        inv.scheduledAt && inv.scheduledEndAt
            ? Math.round(
                  (new Date(inv.scheduledEndAt).getTime() - new Date(inv.scheduledAt).getTime()) / 60000,
              )
            : null;

    const gcalUrl =
        hasSchedule
            ? buildGCalUrl(
                  `Interview: ${inv.jobTitle} at ${inv.companyName}`,
                  inv.scheduledAt!,
                  inv.scheduledEndAt || new Date(new Date(inv.scheduledAt!).getTime() + 60 * 60000).toISOString(),
                  `Live interview for ${inv.jobTitle} at ${inv.companyName}.\n\nPowered by SmartCareerAI.`,
                  inv.meetLink || undefined,
              )
            : null;

    return (
        <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-500/5 border border-teal-200 dark:border-teal-500/20 space-y-3">
            {/* Top row: icon + job info + status badge */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Video className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{inv.jobTitle}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {inv.companyName}{inv.location ? ` · ${inv.location}` : ''}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            {inv.type} · {inv.difficulty} · Invited {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex-shrink-0 ${
                    isUpcoming
                        ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                    {isUpcoming ? 'Scheduled' : hasSchedule ? 'Awaiting Live Call' : 'Awaiting Live Call'}
                </span>
            </div>

            {/* Schedule info block */}
            {hasSchedule && (
                <div className="flex items-start gap-2 pl-1">
                    <Calendar className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{scheduledDate}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {scheduledTime}{durationMins ? ` · ${durationMins} min` : ''}
                        </p>
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
                {inv.meetLink && (
                    <a
                        href={inv.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-colors"
                    >
                        <Video className="w-3.5 h-3.5" />
                        Join Meeting
                        <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                )}
                {gcalUrl && (
                    <a
                        href={gcalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-500/30 text-teal-600 dark:text-teal-400 text-xs font-bold hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                    >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        Add to Google Calendar
                    </a>
                )}
                <Link
                    href={`/dashboard/interviews/${inv.sessionId}/post-mortem`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-500/30 text-teal-600 dark:text-teal-400 text-xs font-bold hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                >
                    Results
                </Link>
            </div>
        </div>
    );
}

function SessionCard({ session, tag, tagColor }: {
    session: InterviewSessionForCard;
    tag?: string;
    tagColor?: 'violet' | 'teal' | 'indigo';
}) {
    const colorMap: Record<string, string> = {
        violet: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30',
        teal: 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30',
        indigo: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    };
    const iconBg = tagColor === 'violet'
        ? 'bg-violet-500/20'
        : tagColor === 'teal' ? 'bg-teal-500/20' : 'bg-indigo-500/20';
    const iconColor = tagColor === 'violet'
        ? 'text-violet-400'
        : tagColor === 'teal' ? 'text-teal-400' : 'text-indigo-400';

    return (
        <Link
            href={`/dashboard/interviews/${session.id}`}
            className="block p-5 rounded-xl glass hover:border-indigo-500/30 transition-all group"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
                        {session.inviteType === 'COPILOT' ? (
                            <Video className={`w-5 h-5 ${iconColor}`} />
                        ) : (
                            <Bot className={`w-5 h-5 ${iconColor}`} />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-gray-900 dark:text-white font-medium group-hover:text-indigo-400 transition">
                                {session.type} Interview — {session.targetRole}
                            </h3>
                            {tag && tagColor && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorMap[tagColor]}`}>
                                    {tag}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                    <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-400 transition" />
                </div>
            </div>
        </Link>
    );
}
