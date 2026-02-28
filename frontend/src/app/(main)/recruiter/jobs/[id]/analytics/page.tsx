"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Users, Clock, TrendingUp, TrendingDown, Target, Brain, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-fetch";

// Placeholder for Recharts components if needed
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
    topCandidates: any[];
}

export default function JobAnalyticsPage() {
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await authFetch(`/recruiter/jobs/${jobId}/ai-interview/analytics`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Failed to fetch analytics");
                setData(json.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [jobId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href={`/recruiter/jobs/${jobId}`} className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center gap-2 mb-3 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-indigo-500" />
                        AI Interview Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Comprehensive performance metrics for your candidate pipeline.</p>
                </div>
            </div>

            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Completion Rate"
                    value={`${data.completionRate}%`}
                    subtitle={`${data.evaluated} out of ${data.totalApplicants} applicants`}
                    icon={Target}
                    color="indigo"
                />
                <MetricCard
                    title="Average AI Score"
                    value={data.avgScore !== null ? `${data.avgScore}/100` : '--'}
                    subtitle="Across all evaluated candidates"
                    icon={Brain}
                    color="emerald"
                />
                <MetricCard
                    title="Dropout Rate"
                    value={`${data.dropoutRate}%`}
                    subtitle="Did not complete interview"
                    icon={TrendingDown}
                    color="rose"
                />
                <MetricCard
                    title="Time to Shortlist"
                    value={data.timeToShortlistDays !== null ? `${data.timeToShortlistDays}d` : '--'}
                    subtitle="Avg processing time"
                    icon={Clock}
                    color="amber"
                />
            </div>

            {/* Detailed Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Skill Breakdowns */}
                <div className="lg:col-span-2 space-y-6 bg-white dark:bg-gray-800/50 rounded-3xl p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Average Skill Proficiency
                        </h2>
                        <p className="text-sm text-gray-500">Aggregate AI evaluation scores across all candidates for required skills.</p>
                    </div>

                    <div className="space-y-5 mt-8">
                        {Object.keys(data.averageSkillScores).length > 0 ? (
                            Object.entries(data.averageSkillScores).map(([skill, score]) => (
                                <div key={skill} className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-gray-700 dark:text-gray-300">{skill}</span>
                                        <span className={score >= 70 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500"}>{score}/100</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${score}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full rounded-full ${score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 text-sm">Not enough data to calculate skill averages.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pipeline Funnel */}
                <div className="space-y-6 bg-white dark:bg-gray-800/50 rounded-3xl p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            Pipeline Status
                        </h2>
                        <p className="text-sm text-gray-500">Applicant distribution.</p>
                    </div>

                    <div className="space-y-3 mt-6">
                        {Object.entries(data.stageCounts).sort((a, b) => b[1] - a[1]).map(([stage, count]) => {
                            const percentage = Math.round((count / data.totalApplicants) * 100);
                            return (
                                <div key={stage} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{stage.replace(/_/g, ' ')}</p>
                                        <p className="text-xs font-medium text-gray-500 mt-0.5">{percentage}% of total</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-gray-700">
                                        {count}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, icon: Icon, color }: any) {
    const colors = {
        indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10",
        emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
        rose: "text-rose-600 bg-rose-50 dark:bg-rose-500/10",
        amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    };

    const ColorClass = (colors as any)[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${ColorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">{title}</h3>
                <div className="text-3xl font-black text-gray-900 dark:text-white">{value}</div>
                <p className="text-sm font-medium text-gray-400 mt-2">{subtitle}</p>
            </div>
        </motion.div>
    );
}
