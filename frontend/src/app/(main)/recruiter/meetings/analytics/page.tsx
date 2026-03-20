"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";
import {
    Video, TrendingUp, Users, CheckCircle, Brain,
    RefreshCw, ExternalLink, AlertCircle, Loader2,
    ThumbsUp, ThumbsDown, Minus, Star, BarChart3, Calendar
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CandidateScores {
    technical: number;
    communication: number;
    confidence: number;
    overall: number;
}

interface CandidateMeetingRow {
    meetingId: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    date: string;
    hiringRecommendation: string;
    scores: CandidateScores;
    recordingUrl: string | null;
    analysisStatus: string;
}

interface RecruiterDashboard {
    totalMeetings: number;
    completedAnalyses: number;
    avgScores: CandidateScores;
    hiringBreakdown: Record<string, number>;
    recentMeetings: CandidateMeetingRow[];
    meetingsByDate: Record<string, number>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const HIRING_META: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
    STRONG_YES: { label: "Strong Hire",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30", icon: Star },
    YES:        { label: "Hire",          color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",   icon: ThumbsUp },
    MAYBE:      { label: "Maybe",         color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30", icon: Minus },
    NO:         { label: "No Hire",       color: "text-rose-600 dark:text-rose-400",   bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",   icon: ThumbsDown },
    PENDING:    { label: "Pending",       color: "text-gray-500",                      bg: "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10",          icon: Loader2 },
};

function RecommendationBadge({ rec }: { rec: string }) {
    const meta = HIRING_META[rec] ?? HIRING_META.PENDING;
    const Icon = meta.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.bg} ${meta.color}`}>
            <Icon className="w-3 h-3" />
            {meta.label}
        </span>
    );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                <span>{label}</span>
                <span>{value}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MeetingAnalyticsPage() {
    const { user } = useAuthStore();
    const [dashboard, setDashboard] = useState<RecruiterDashboard | null>(null);
    const [candidates, setCandidates] = useState<CandidateMeetingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "candidates">("overview");

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const [dashRes, cmpRes] = await Promise.all([
                authFetch("/meeting-analysis/recruiter/dashboard"),
                authFetch("/meeting-analysis/recruiter/candidates/compare"),
            ]);
            if (!dashRes.ok || !cmpRes.ok) throw new Error("Failed to load data");
            const dashData = await dashRes.json();
            const cmpData = await cmpRes.json();
            setDashboard(dashData.data);
            setCandidates(cmpData.data ?? []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="w-10 h-10 rounded-full border-t-2 border-indigo-500 animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Analytics…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 p-8">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <p className="text-gray-700 dark:text-gray-300 font-semibold">{error}</p>
                <button onClick={fetchData} className="px-5 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition">
                    Retry
                </button>
            </div>
        );
    }

    const d = dashboard!;
    const hiringOrder = ["STRONG_YES", "YES", "MAYBE", "NO"];
    const totalHiring = hiringOrder.reduce((s, k) => s + (d.hiringBreakdown[k] ?? 0), 0);

    // Last 14 days activity chart
    const today = new Date();
    const last14 = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (13 - i));
        const key = date.toISOString().slice(0, 10);
        return { key, count: d.meetingsByDate[key] ?? 0 };
    });
    const maxCount = Math.max(...last14.map(d => d.count), 1);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <Video className="w-5 h-5 text-indigo-500" />
                        </div>
                        Meeting Intelligence
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        AI analysis of all your interview meetings
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:border-indigo-300 transition-colors self-start sm:self-auto"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Meetings",       value: d.totalMeetings,        icon: Video,       color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                    { label: "AI Analyses Done",     value: d.completedAnalyses,    icon: Brain,       color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                    { label: "Avg Overall Score",    value: d.avgScores.overall,    icon: TrendingUp,  color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10" },
                    { label: "Candidates Compared",  value: candidates.length,      icon: Users,       color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-500/10" },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-5 flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
                {(["overview", "candidates"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab
                            ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                    >
                        {tab === "overview" ? "Overview" : "Candidate Comparison"}
                    </button>
                ))}
            </div>

            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Avg Scores */}
                    <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                            <BarChart3 className="w-4 h-4 text-indigo-500" /> Avg Candidate Scores
                        </h3>
                        {d.completedAnalyses === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">No completed analyses yet</p>
                        ) : (
                            <div className="space-y-4">
                                <ScoreBar label="Overall"       value={d.avgScores.overall}       color="bg-indigo-500" />
                                <ScoreBar label="Technical"     value={d.avgScores.technical}     color="bg-blue-500" />
                                <ScoreBar label="Communication" value={d.avgScores.communication} color="bg-emerald-500" />
                                <ScoreBar label="Confidence"    value={d.avgScores.confidence}    color="bg-amber-500" />
                            </div>
                        )}
                    </div>

                    {/* Hiring Breakdown */}
                    <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Hiring Decisions
                        </h3>
                        {totalHiring === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">No hiring decisions yet</p>
                        ) : (
                            <div className="space-y-3">
                                {hiringOrder.map(key => {
                                    const count = d.hiringBreakdown[key] ?? 0;
                                    const pct = totalHiring > 0 ? Math.round((count / totalHiring) * 100) : 0;
                                    const meta = HIRING_META[key];
                                    const Icon = meta.icon;
                                    return (
                                        <div key={key} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-[12px]">
                                                <span className={`flex items-center gap-1.5 font-bold ${meta.color}`}>
                                                    <Icon className="w-3.5 h-3.5" /> {meta.label}
                                                </span>
                                                <span className="font-black text-gray-700 dark:text-gray-200">{count} <span className="text-gray-400 font-medium">({pct}%)</span></span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${
                                                        key === "STRONG_YES" ? "bg-emerald-500" :
                                                        key === "YES" ? "bg-blue-500" :
                                                        key === "MAYBE" ? "bg-amber-500" : "bg-rose-500"
                                                    }`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Activity Heatmap */}
                    <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                            <Calendar className="w-4 h-4 text-blue-500" /> Activity (Last 14 Days)
                        </h3>
                        <div className="flex items-end gap-1.5 h-24">
                            {last14.map(({ key, count }) => (
                                <div key={key} className="flex-1 flex flex-col items-center gap-1" title={`${key}: ${count} meeting${count !== 1 ? "s" : ""}`}>
                                    <div
                                        className="w-full rounded-t-sm bg-indigo-500/80 transition-all duration-500"
                                        style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                            <span>14 days ago</span>
                            <span>Today</span>
                        </div>
                    </div>

                    {/* Recent Meetings */}
                    <div className="lg:col-span-3 bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest flex items-center gap-2">
                                <Video className="w-4 h-4 text-indigo-500" /> Recent Meetings
                            </h3>
                        </div>
                        {d.recentMeetings.length === 0 ? (
                            <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
                                <Video className="w-10 h-10" />
                                <p className="text-sm font-medium">No meetings yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {d.recentMeetings.map(row => (
                                    <div key={row.meetingId} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{row.candidateName}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{row.candidateEmail}</p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                                {new Date(row.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                            {row.analysisStatus === "COMPLETED" ? (
                                                <>
                                                    <RecommendationBadge rec={row.hiringRecommendation} />
                                                    <span className="text-[11px] font-black text-indigo-500 whitespace-nowrap">
                                                        {row.scores.overall}/100
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10">
                                                    {row.analysisStatus === "NONE" ? "No Analysis" : "Processing…"}
                                                </span>
                                            )}
                                            <Link
                                                href={`/dashboard/meetings/${row.meetingId}/analysis`}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                                title="View Analysis"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "candidates" && (
                <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500" /> Candidate Comparison
                        </h3>
                        <span className="text-xs text-gray-400 font-medium">{candidates.length} candidates · sorted by overall score</span>
                    </div>

                    {candidates.length === 0 ? (
                        <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                            <Brain className="w-12 h-12" />
                            <p className="text-sm font-medium text-center">No completed AI analyses yet.<br />Analyses are generated after meetings end.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/5">
                                        <th className="text-left px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
                                        <th className="text-center px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Overall</th>
                                        <th className="text-center px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Technical</th>
                                        <th className="text-center px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Comms</th>
                                        <th className="text-center px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Confidence</th>
                                        <th className="text-center px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Decision</th>
                                        <th className="text-right px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                                    {candidates.map((row, idx) => (
                                        <tr key={row.meetingId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                                                        idx === 0 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                                                        idx === 1 ? "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300" :
                                                        idx === 2 ? "bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                                                        "bg-gray-100 dark:bg-white/5 text-gray-500"
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 dark:text-white truncate">{row.candidateName}</p>
                                                        <p className="text-[11px] text-gray-400 truncate">{row.candidateEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`text-lg font-black ${row.scores.overall >= 70 ? "text-emerald-500" : row.scores.overall >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                                                    {row.scores.overall}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">/100</span>
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 hidden md:table-cell">{row.scores.technical}</td>
                                            <td className="px-4 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 hidden md:table-cell">{row.scores.communication}</td>
                                            <td className="px-4 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 hidden md:table-cell">{row.scores.confidence}</td>
                                            <td className="px-4 py-4 text-center">
                                                <RecommendationBadge rec={row.hiringRecommendation} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/recruiter/candidates/${row.candidateId}`}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                                        title="Candidate Profile"
                                                    >
                                                        <Users className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/meetings/${row.meetingId}/analysis`}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                                        title="View Full Analysis"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
