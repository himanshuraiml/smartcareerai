"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { BarChart2, Download, ShieldOff, Users, AlertCircle } from "lucide-react";

interface DiversityStats {
    genderBreakdown: { M: number; F: number; UNKNOWN: number };
    stageByGender: Record<string, { M: number; F: number; UNKNOWN: number }>;
    institutionTierBreakdown: { tier1: number; tier2: number; other: number };
    blindModeJobs: number;
    totalApplicants: number;
    eeoData: Array<{ name: string; gender: string; stage: string; institution: string }>;
}

const STAGE_LABELS: Record<string, string> = {
    APPLIED: "Applied",
    SCREENING: "Screening",
    INTERVIEWING: "Interviewing",
    OFFER: "Offer",
    PLACED: "Placed",
    REJECTED: "Rejected",
};

function pct(n: number, total: number) {
    return total === 0 ? "0" : Math.round((n / total) * 100).toString();
}

export default function DiversityPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<DiversityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        authFetch("/recruiter/analytics/diversity")
            .then(r => r.ok ? r.json() : Promise.reject("Failed to load"))
            .then(d => setStats(d.data))
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false));
    }, [user]);

    const handleExport = async () => {
        const res = await authFetch("/recruiter/analytics/diversity/export");
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "eeo-report.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin" />
        </div>
    );

    if (error) return (
        <div className="p-6 bg-red-900/20 border border-red-700 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
        </div>
    );

    const total = stats?.totalApplicants || 0;
    const gb = stats?.genderBreakdown || { M: 0, F: 0, UNKNOWN: 0 };
    const tb = stats?.institutionTierBreakdown || { tier1: 0, tier2: 0, other: 0 };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <BarChart2 className="w-7 h-7 text-blue-500" />
                        D&I Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Diversity & inclusion overview across your hiring pipeline
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export EEO CSV
                </button>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    Gender inference is estimated by AI from first names and may not be accurate. This data is for internal D&I tracking only and should not be used for decision-making.
                </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Applicants", value: total, sub: "" },
                    { label: "Female Applicants", value: `${pct(gb.F, total)}%`, sub: `${gb.F} candidates` },
                    { label: "Blind Mode Jobs", value: stats?.blindModeJobs || 0, sub: "Candidate names hidden" },
                    { label: "Tier 1 Colleges", value: `${pct(tb.tier1, total)}%`, sub: `${tb.tier1} candidates` },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{kpi.label}</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{kpi.value}</p>
                        {kpi.sub && <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Gender breakdown */}
            <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Gender Breakdown
                </h2>
                <div className="flex gap-4 flex-wrap mb-6">
                    {[
                        { label: "Male", count: gb.M, color: "bg-blue-500" },
                        { label: "Female", count: gb.F, color: "bg-pink-500" },
                        { label: "Unknown", count: gb.UNKNOWN, color: "bg-gray-500" },
                    ].map(g => (
                        <div key={g.label} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${g.color}`} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{g.label}: <strong className="text-gray-900 dark:text-white">{g.count} ({pct(g.count, total)}%)</strong></span>
                        </div>
                    ))}
                </div>

                {/* Pipeline funnel by stage and gender */}
                <div className="space-y-3">
                    {Object.entries(stats?.stageByGender || {}).map(([stage, counts]) => {
                        const stageTotal = counts.M + counts.F + counts.UNKNOWN;
                        if (stageTotal === 0) return null;
                        return (
                            <div key={stage}>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    <span className="font-medium">{STAGE_LABELS[stage] || stage}</span>
                                    <span>{stageTotal} candidates</span>
                                </div>
                                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                                    {counts.M > 0 && <div className="bg-blue-500 h-full" style={{ width: `${(counts.M / stageTotal) * 100}%` }} title={`Male: ${counts.M}`} />}
                                    {counts.F > 0 && <div className="bg-pink-500 h-full" style={{ width: `${(counts.F / stageTotal) * 100}%` }} title={`Female: ${counts.F}`} />}
                                    {counts.UNKNOWN > 0 && <div className="bg-gray-400 h-full" style={{ width: `${(counts.UNKNOWN / stageTotal) * 100}%` }} title={`Unknown: ${counts.UNKNOWN}`} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Institution Tier Breakdown */}
            <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ShieldOff className="w-5 h-5 text-purple-500" />
                    Institution Tier Breakdown
                </h2>
                <div className="space-y-3">
                    {[
                        { label: "Tier 1 (IIT, NIT, IIM, etc.)", count: tb.tier1, color: "bg-purple-500" },
                        { label: "Tier 2 (Universities & Colleges)", count: tb.tier2, color: "bg-blue-500" },
                        { label: "Other", count: tb.other, color: "bg-gray-400" },
                    ].map(t => (
                        <div key={t.label}>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>{t.label}</span>
                                <span>{t.count} ({pct(t.count, total)}%)</span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className={`${t.color} h-full rounded-full transition-all`} style={{ width: `${pct(t.count, total)}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
