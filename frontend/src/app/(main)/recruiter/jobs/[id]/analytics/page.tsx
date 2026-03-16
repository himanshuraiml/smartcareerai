"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    BarChart3, Users, Clock, TrendingUp, TrendingDown, Target,
    Brain, AlertCircle, ArrowLeft, Award, CheckCircle, XCircle,
    UserCheck, Percent, ShieldAlert, Timer, Star
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-fetch";
import HiringFunnelChart from "@/components/recruiter/HiringFunnelChart";
import StageBreakdownTable from "@/components/recruiter/StageBreakdownTable";
import CandidateNPSPanel from "@/components/recruiter/CandidateNPSPanel";

// ── Types ──────────────────────────────────────────────────────────────────
interface AnalyticsData {
    jobId: string;
    totalApplicants: number;
    evaluated: number;
    completionRate: number;
    dropoutRate: number;
    avgScore: number | null;
    averageSkillScores: Record<string, number>;
    timeToShortlistDays: number | null;
    stageCounts: Record<string, number>;
    topCandidates: { applicationId: string; overallScore: number; status: string; recommendation: string }[];
}

interface Applicant {
    applicationId: string;
    candidateId: string;
    name: string;
    status: string;
    overallScore?: number;
    fitScore?: number;
    dropoutRisk?: string;
    acceptanceLikelihood?: number;
    biasFlags?: string[] | null;
    appliedAt: string;
}

interface JobDetail {
    id: string;
    title: string;
    location?: string;
    isActive: boolean;
}

// ── Derived funnel stats ───────────────────────────────────────────────────
function computeFunnelStats(counts: Record<string, number>, total: number) {
    const offer = counts["OFFER"] ?? 0;
    const placed = counts["PLACED"] ?? 0;
    const rejected = counts["REJECTED"] ?? 0;
    const screening = counts["SCREENING"] ?? 0;
    const interviewing = counts["INTERVIEWING"] ?? 0;

    const offerRate = total > 0 ? Math.round(((offer + placed) / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
    const screeningPassRate =
        screening > 0 && total > 0
            ? Math.round((interviewing / screening) * 100)
            : null;
    const hireRate = total > 0 ? Math.round((placed / total) * 100) : 0;

    return { offerRate, rejectionRate, screeningPassRate, hireRate };
}

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
    STRONG_HIRE: { label: "Strong Hire",  color: "text-emerald-600 dark:text-emerald-400" },
    HIRE:        { label: "Hire",         color: "text-blue-600 dark:text-blue-400" },
    MAYBE:       { label: "Maybe",        color: "text-amber-600 dark:text-amber-400" },
    NO_HIRE:     { label: "No Hire",      color: "text-rose-600 dark:text-rose-400" },
};

// ── Page ──────────────────────────────────────────────────────────────────
export default function JobAnalyticsPage() {
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading]                   = useState(true);
    const [error, setError]                       = useState<string | null>(null);
    const [data, setData]                         = useState<AnalyticsData | null>(null);
    const [job, setJob]                           = useState<JobDetail | null>(null);
    const [applicants, setApplicants]             = useState<Applicant[]>([]);
    const [appsLoading, setAppsLoading]           = useState(true);
    const [seqMetrics, setSeqMetrics]             = useState<any[]>([]);
    const [proctoringStats, setProctoringStats]   = useState<any>(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Fetch AI interview analytics + job details in parallel
                const [analyticsRes, jobRes] = await Promise.all([
                    authFetch(`/recruiter/jobs/${jobId}/ai-interview/analytics`),
                    authFetch(`/recruiter/jobs/${jobId}`),
                ]);
                const analyticsJson = await analyticsRes.json();
                const jobJson       = await jobRes.json();

                if (!analyticsRes.ok) throw new Error(analyticsJson.message || "Failed to fetch analytics");
                setData(analyticsJson.data);
                if (jobJson.data) setJob(jobJson.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }

            // Fetch applicants separately (non-blocking)
            try {
                const appsRes  = await authFetch(`/recruiter/jobs/${jobId}/applicants`);
                const appsJson = await appsRes.json();
                if (appsRes.ok) setApplicants(appsJson.data || []);
            } catch {
                // silently ignore
            } finally {
                setAppsLoading(false);
            }

            // Fetch sequence metrics (non-blocking)
            try {
                const seqRes = await authFetch(`/recruiter/jobs/${jobId}/sequences/metrics`);
                const seqJson = await seqRes.json();
                if (seqRes.ok) setSeqMetrics(seqJson.data || []);
            } catch { /* silent */ }

            // F16: Fetch proctoring stats (non-blocking)
            try {
                const pRes = await authFetch(`/recruiter/jobs/${jobId}/proctoring-stats`);
                const pJson = await pRes.json();
                if (pRes.ok) setProctoringStats(pJson.data || null);
            } catch { /* silent */ }
        };
        fetchAll();
    }, [jobId]);

    // Build stage counts from full applicant list (more accurate than AI-analytics endpoint)
    const liveStageCountsFromApplicants = applicants.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
    }, {});

    const stageCounts = !appsLoading && applicants.length > 0
        ? liveStageCountsFromApplicants
        : (data?.stageCounts ?? {});

    const totalFromApplicants = applicants.length || data?.totalApplicants || 0;
    const { offerRate, rejectionRate, screeningPassRate, hireRate } = computeFunnelStats(
        stageCounts,
        totalFromApplicants
    );

    // ── Render ──
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load analytics</h3>
                <p className="text-gray-500">{error || "No data available"}</p>
                <Link href={`/recruiter/jobs/${jobId}`} className="mt-6 text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Job Space
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">

            {/* ── Header ── */}
            <div>
                <Link
                    href={`/recruiter/jobs/${jobId}`}
                    className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center gap-2 mb-3 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Pipeline
                </Link>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-indigo-500" />
                    Hiring Analytics
                </h1>
                {job && (
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{job.title}{job.location ? ` · ${job.location}` : ""}</p>
                )}
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
                    Pipeline funnel, AI interview metrics, and candidate performance.
                </p>
            </div>

            {/* ── KPI Row 1 — AI Interview metrics ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="AI Completion" value={`${data.completionRate}%`}
                    subtitle={`${data.evaluated} / ${data.totalApplicants} evaluated`}
                    icon={Target} color="indigo" />
                <MetricCard title="Avg AI Score"
                    value={data.avgScore !== null ? `${data.avgScore}/100` : "--"}
                    subtitle="Across all evaluated candidates"
                    icon={Brain} color="emerald" />
                <MetricCard title="Interview Dropout" value={`${data.dropoutRate}%`}
                    subtitle="Did not complete AI interview"
                    icon={TrendingDown} color="rose" />
                <MetricCard title="Time to Shortlist"
                    value={data.timeToShortlistDays !== null ? `${data.timeToShortlistDays}d` : "--"}
                    subtitle="Avg processing time"
                    icon={Clock} color="amber" />
            </div>

            {/* ── KPI Row 2 — Pipeline health ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total in Pipeline" value={totalFromApplicants}
                    subtitle="All-time applicants for this job"
                    icon={Users} color="indigo" />
                <MetricCard title="Offer Rate" value={`${offerRate}%`}
                    subtitle="Reached offer / placed stage"
                    icon={CheckCircle} color="emerald" />
                <MetricCard title="Rejection Rate" value={`${rejectionRate}%`}
                    subtitle="Marked as rejected"
                    icon={XCircle} color="rose" />
                <MetricCard
                    title="Screen → Interview"
                    value={screeningPassRate !== null ? `${screeningPassRate}%` : "--"}
                    subtitle="Pass rate from screening stage"
                    icon={Percent} color="amber" />
            </div>

            {/* ── Main Grid: Funnel + Skill Scores ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Hiring Funnel — 2 cols */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Hiring Funnel
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Stage-by-stage candidate flow with conversion rates.</p>
                    </div>
                    <HiringFunnelChart stageCounts={stageCounts} />
                </div>

                {/* Skill Proficiency — 3 cols */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-violet-500" />
                            Average Skill Proficiency
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">AI-evaluated skill scores aggregated across all candidates.</p>
                    </div>

                    <div className="space-y-4">
                        {Object.keys(data.averageSkillScores).length > 0 ? (
                            Object.entries(data.averageSkillScores).map(([skill, score]) => (
                                <div key={skill} className="space-y-1.5">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-gray-700 dark:text-gray-300">{skill}</span>
                                        <span className={score >= 70 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500"}>
                                            {score}/100
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${score}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full rounded-full ${
                                                score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"
                                            }`}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-gray-400 text-sm">No AI interviews completed yet.</p>
                                <p className="text-gray-400 text-xs mt-1">Skill proficiency data will appear once candidates complete AI interviews.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stage Breakdown Table ── */}
            <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                <div className="mb-5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Stage Breakdown
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Full candidate distribution across all pipeline stages.</p>
                </div>
                <StageBreakdownTable
                    stageCounts={stageCounts}
                    totalApplicants={totalFromApplicants}
                />
            </div>

            {/* ── Offer Acceptance + Time-to-Hire ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Offer Acceptance Breakdown */}
                <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            Offer Acceptance
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Breakdown of candidates who reached the offer stage.</p>
                    </div>
                    {(() => {
                        const offered = (stageCounts["OFFER"] ?? 0) + (stageCounts["PLACED"] ?? 0);
                        const placed  = stageCounts["PLACED"] ?? 0;
                        const pending = stageCounts["OFFER"] ?? 0;
                        const acceptanceRate = offered > 0 ? Math.round((placed / offered) * 100) : 0;
                        return (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    {[
                                        { label: "Offers Extended", value: offered, color: "text-indigo-600 dark:text-indigo-400" },
                                        { label: "Hired / Placed",  value: placed,  color: "text-emerald-600 dark:text-emerald-400" },
                                        { label: "Pending Accept",  value: pending, color: "text-amber-600 dark:text-amber-400" },
                                    ].map(s => (
                                        <div key={s.label} className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800">
                                            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm font-bold mb-1.5">
                                        <span className="text-gray-600 dark:text-gray-400">Acceptance Rate</span>
                                        <span className={acceptanceRate >= 70 ? "text-emerald-500" : acceptanceRate >= 40 ? "text-amber-500" : "text-rose-500"}>
                                            {acceptanceRate}%
                                        </span>
                                    </div>
                                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${acceptanceRate}%` }}
                                            transition={{ duration: 0.8 }}
                                            className={`h-full rounded-full ${acceptanceRate >= 70 ? "bg-emerald-500" : acceptanceRate >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                                        />
                                    </div>
                                    {offered === 0 && (
                                        <p className="text-xs text-gray-400 italic mt-2">No offers extended yet.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Time in Pipeline */}
                <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Timer className="w-5 h-5 text-amber-500" />
                            Time in Pipeline
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Average days since application per active stage.</p>
                    </div>
                    {applicants.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-4">No applicant data available.</p>
                    ) : (() => {
                        const ACTIVE_STAGES = ["APPLIED", "SCREENING", "INTERVIEWING", "OFFER"];
                        const stageGroups = ACTIVE_STAGES.map(stage => {
                            const group = applicants.filter(a => a.status === stage);
                            const avgDays = group.length > 0
                                ? Math.round(group.reduce((sum, a) => sum + Math.floor((Date.now() - new Date(a.appliedAt).getTime()) / 86400000), 0) / group.length)
                                : null;
                            return { stage, count: group.length, avgDays };
                        }).filter(g => g.count > 0);

                        if (stageGroups.length === 0) return <p className="text-xs text-gray-400 italic py-4">No active candidates in pipeline.</p>;

                        const maxDays = Math.max(...stageGroups.map(g => g.avgDays ?? 0), 1);
                        return (
                            <div className="space-y-3">
                                {stageGroups.map(g => (
                                    <div key={g.stage}>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-gray-600 dark:text-gray-400 capitalize">{g.stage.toLowerCase()}</span>
                                            <span className={`${(g.avgDays ?? 0) > 14 ? "text-rose-500" : (g.avgDays ?? 0) > 7 ? "text-amber-500" : "text-emerald-500"}`}>
                                                {g.avgDays}d avg · {g.count} candidate{g.count !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((g.avgDays ?? 0) / maxDays) * 100}%` }}
                                                transition={{ duration: 0.7 }}
                                                className={`h-full rounded-full ${(g.avgDays ?? 0) > 14 ? "bg-rose-400" : (g.avgDays ?? 0) > 7 ? "bg-amber-400" : "bg-emerald-400"}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[10px] text-gray-400 mt-1">🟢 &lt;7d · 🟡 7–14d · 🔴 &gt;14d since application date</p>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* ── Bias Flag Summary ── */}
            {(() => {
                const flagged = applicants.filter(a => a.biasFlags && a.biasFlags.length > 0);
                if (flagged.length === 0) return null;
                const allFlags = flagged.flatMap(a => a.biasFlags ?? []);
                const flagCounts: Record<string, number> = {};
                allFlags.forEach(f => { flagCounts[f] = (flagCounts[f] ?? 0) + 1; });
                return (
                    <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-6 border border-amber-100 dark:border-amber-500/20 shadow-sm">
                        <div className="mb-5">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-amber-500" />
                                Bias Flag Summary
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                                    {flagged.length} candidate{flagged.length > 1 ? "s" : ""}
                                </span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                AI detected potential bias signals in evaluations. Review these carefully to ensure fair hiring.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                            {Object.entries(flagCounts).map(([flag, count]) => (
                                <div key={flag} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-amber-800 dark:text-amber-400 truncate">{flag}</p>
                                        <p className="text-[10px] text-amber-600 dark:text-amber-500">{count} occurrence{count > 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {flagged.slice(0, 5).map((a, i) => (
                                <Link
                                    key={a.applicationId}
                                    href={`/recruiter/jobs/${jobId}`}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-50 transition-colors font-medium"
                                >
                                    {a.name || `Applicant #${i + 1}`}
                                </Link>
                            ))}
                            {flagged.length > 5 && (
                                <span className="text-xs px-2.5 py-1 text-gray-400">+{flagged.length - 5} more</span>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* ── Top Candidates ── */}
            {data.topCandidates && data.topCandidates.length > 0 && (
                <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-emerald-500" />
                            Top Candidates by AI Score
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Highest-scoring candidates from AI interview evaluations.</p>
                    </div>

                    <div className="space-y-3">
                        {data.topCandidates.slice(0, 8).map((c, i) => {
                            const rec = RECOMMENDATION_LABELS[c.recommendation] ?? { label: c.recommendation, color: "text-gray-500" };
                            return (
                                <motion.div
                                    key={c.applicationId}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            Application #{c.applicationId.slice(-6).toUpperCase()}
                                        </p>
                                        <p className={`text-xs font-semibold mt-0.5 ${rec.color}`}>{rec.label}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-black text-gray-900 dark:text-white">
                                            {c.overallScore}
                                            <span className="text-xs font-normal text-gray-400">/100</span>
                                        </p>
                                        <p className="text-xs text-gray-400 capitalize">{c.status.toLowerCase()}</p>
                                    </div>
                                    <Link
                                        href={`/recruiter/jobs/${jobId}`}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex-shrink-0"
                                    >
                                        View
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Candidate NPS ── */}
            <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                <div className="mb-5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        Candidate Experience (NPS)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Feedback collected from candidates who completed the interview process.</p>
                </div>
                <CandidateNPSPanel jobId={jobId} />
            </div>

            {/* ── Sequence Performance Metrics (F2) ── */}
            {seqMetrics.length > 0 && (
                <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-amber-500" />
                            Drip Sequence Performance
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Delivery rates and step-by-step stats for automated message sequences.</p>
                    </div>
                    <div className="space-y-4">
                        {seqMetrics.map((seq: any) => (
                            <div key={seq.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                                            {seq.stageTrigger}
                                        </span>
                                        <span className={`text-xs font-medium ${seq.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                            {seq.isActive ? 'Active' : 'Paused'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span><span className="font-bold text-gray-900 dark:text-white">{seq.totalSent}</span> sent</span>
                                        <span><span className="font-bold text-gray-900 dark:text-white">{seq.totalScheduled}</span> total</span>
                                        {seq.deliveryRate !== null && (
                                            <span className={`font-bold ${seq.deliveryRate >= 80 ? 'text-emerald-600' : seq.deliveryRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                {seq.deliveryRate}% delivery
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {seq.stepMetrics.length > 0 && (
                                    <div className="space-y-2">
                                        {seq.stepMetrics.map((step: any) => (
                                            <div key={step.stepIndex} className="flex items-center gap-3 text-xs">
                                                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0">
                                                    {step.stepIndex + 1}
                                                </span>
                                                <span className="flex-1 text-gray-500 truncate">{step.template}</span>
                                                <span className="text-gray-400 text-[10px]">+{step.delayHours}h</span>
                                                <span className="text-emerald-600 font-bold">{step.sent} sent</span>
                                                {step.failed > 0 && <span className="text-rose-500 font-bold">{step.failed} failed</span>}
                                                {step.pending > 0 && <span className="text-amber-500 font-bold">{step.pending} pending</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* F16: Proctoring Summary */}
            {proctoringStats && (
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 space-y-4">
                    <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-500" />
                        Proctoring Summary
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">{proctoringStats.avgScore ?? '—'}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">Avg Score</div>
                        </div>
                        <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{proctoringStats.recruiterFlaggedCount ?? 0}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">Recruiter Flagged</div>
                        </div>
                        <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{proctoringStats.autoFlaggedCount ?? 0}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">Auto Flagged</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">{proctoringStats.totalAttempts ?? 0}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">Total Attempts</div>
                        </div>
                    </div>
                    {proctoringStats.violationBreakdown && Object.keys(proctoringStats.violationBreakdown).length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Violation Breakdown</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(proctoringStats.violationBreakdown).map(([type, count]) => (
                                    <span key={type} className="text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 rounded-lg px-2.5 py-1 font-semibold">
                                        {type.replace(/_/g, ' ')}: {count as number}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Shared MetricCard ─────────────────────────────────────────────────────
function MetricCard({ title, value, subtitle, icon: Icon, color }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    color: "indigo" | "emerald" | "rose" | "amber";
}) {
    const colorMap = {
        indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
        emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
        rose:   "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
        amber:  "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">{title}</p>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
            <p className="text-xs font-medium text-gray-400 mt-1">{subtitle}</p>
        </motion.div>
    );
}
