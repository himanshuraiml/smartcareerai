'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, BarChart2, Users, TrendingUp, Award, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { CandidateComparisonTable } from '@/components/meeting/analytics/CandidateComparisonTable';
import { MeetingHeatmap } from '@/components/meeting/analytics/MeetingHeatmap';
import { SkillGapRadar } from '@/components/meeting/analytics/SkillGapRadar';

interface CandidateRow {
    meetingId: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    date: string;
    hiringRecommendation: string;
    scores: { technical: number; communication: number; confidence: number; overall: number };
    recordingUrl: string | null;
    analysisStatus: string;
}

interface RecruiterDashboard {
    totalMeetings: number;
    completedAnalyses: number;
    avgScores: { technical: number; communication: number; confidence: number; overall: number };
    hiringBreakdown: Record<string, number>;
    recentMeetings: CandidateRow[];
    meetingsByDate: Record<string, number>;
}

type ActiveTab = 'overview' | 'candidates';

const HIRING_COLORS: Record<string, string> = {
    STRONG_YES: 'bg-emerald-500',
    YES: 'bg-green-500',
    MAYBE: 'bg-amber-500',
    NO: 'bg-red-500',
};

const HIRING_TEXT: Record<string, string> = {
    STRONG_YES: 'text-emerald-400',
    YES: 'text-green-400',
    MAYBE: 'text-amber-400',
    NO: 'text-red-400',
};

export default function RecruiterAnalyticsPage() {
    const [dashboard, setDashboard] = useState<RecruiterDashboard | null>(null);
    const [comparison, setComparison] = useState<CandidateRow[]>([]);
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [loading, setLoading] = useState(true);
    const [comparisonLoading, setComparisonLoading] = useState(false);

    async function loadDashboard() {
        setLoading(true);
        try {
            const res = await authFetch('/api/v1/meeting-analysis/recruiter/dashboard');
            if (res.ok) {
                const body = await res.json();
                setDashboard(body.data);
            }
        } finally {
            setLoading(false);
        }
    }

    async function loadComparison() {
        setComparisonLoading(true);
        try {
            const res = await authFetch('/api/v1/meeting-analysis/recruiter/candidates/compare');
            if (res.ok) {
                const body = await res.json();
                setComparison(body.data ?? []);
            }
        } finally {
            setComparisonLoading(false);
        }
    }

    useEffect(() => { loadDashboard(); }, []);

    useEffect(() => {
        if (activeTab === 'candidates' && comparison.length === 0) {
            loadComparison();
        }
    }, [activeTab]);

    const totalHiring = dashboard ? Object.values(dashboard.hiringBreakdown).reduce((a, b) => a + b, 0) : 0;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart2 className="h-6 w-6 text-violet-400" />
                            Interview Analytics
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            AI-powered insights from your interview sessions
                        </p>
                    </div>
                    <button
                        onClick={loadDashboard}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-lg w-fit">
                    {(['overview', 'candidates'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                                activeTab === tab
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                    </div>
                ) : !dashboard ? (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                        <BarChart2 className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm">No analytics data available yet.</p>
                    </div>
                ) : activeTab === 'overview' ? (
                    <>
                        {/* Stat cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Interviews', value: dashboard.totalMeetings, icon: <Users className="h-5 w-5 text-blue-400" /> },
                                { label: 'Analyses Done', value: dashboard.completedAnalyses, icon: <TrendingUp className="h-5 w-5 text-emerald-400" /> },
                                { label: 'Avg Overall Score', value: dashboard.avgScores.overall > 0 ? `${dashboard.avgScores.overall}/100` : '—', icon: <Award className="h-5 w-5 text-amber-400" /> },
                                { label: 'Strong Yes Rate', value: totalHiring > 0 ? `${Math.round(((dashboard.hiringBreakdown.STRONG_YES ?? 0) / totalHiring) * 100)}%` : '—', icon: <BarChart2 className="h-5 w-5 text-violet-400" /> },
                            ].map((stat, i) => (
                                <div key={i} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 flex items-center gap-3">
                                    <div className="p-2 bg-zinc-700/50 rounded-lg">{stat.icon}</div>
                                    <div>
                                        <p className="text-xs text-zinc-500">{stat.label}</p>
                                        <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Skill radar */}
                            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
                                <h3 className="font-semibold text-zinc-200 mb-4">Average Candidate Profile</h3>
                                {dashboard.avgScores.overall > 0 ? (
                                    <div className="flex justify-center">
                                        <SkillGapRadar scores={dashboard.avgScores} />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-zinc-500 text-sm">
                                        No completed analyses yet.
                                    </div>
                                )}
                            </div>

                            {/* Hiring breakdown */}
                            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
                                <h3 className="font-semibold text-zinc-200 mb-4">Hiring Decisions</h3>
                                {totalHiring > 0 ? (
                                    <div className="space-y-3">
                                        {Object.entries(dashboard.hiringBreakdown).map(([rec, count]) => (
                                            <div key={rec} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className={`font-medium ${HIRING_TEXT[rec] ?? 'text-zinc-400'}`}>
                                                        {rec.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-zinc-400">
                                                        {count} ({Math.round((count / totalHiring) * 100)}%)
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${HIRING_COLORS[rec] ?? 'bg-zinc-500'}`}
                                                        style={{ width: `${(count / totalHiring) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-zinc-500 text-sm">
                                        No analyses completed yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity heatmap */}
                        <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
                            <h3 className="font-semibold text-zinc-200 mb-4">Interview Activity</h3>
                            <MeetingHeatmap data={dashboard.meetingsByDate} />
                        </div>
                    </>
                ) : (
                    /* Candidates tab */
                    <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
                            <h3 className="font-semibold text-zinc-200">Candidate Comparison</h3>
                            <span className="text-xs text-zinc-500">
                                {comparison.length} candidate{comparison.length !== 1 ? 's' : ''} • Sorted by overall score
                            </span>
                        </div>
                        {comparisonLoading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
                            </div>
                        ) : (
                            <CandidateComparisonTable rows={comparison} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
