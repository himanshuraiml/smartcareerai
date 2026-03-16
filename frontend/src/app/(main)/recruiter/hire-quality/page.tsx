"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { TrendingUp, Star, AlertCircle } from "lucide-react";

interface HireQualityDashboard {
    placements: Array<{
        id: string;
        candidateName: string;
        jobTitle: string;
        placedAt: string;
        fitScore: number | null;
        overallScore: number | null;
        checkIns: Array<{ dayN: number; performanceRating: number; retentionStatus: string }>;
    }>;
    modelWeights: {
        fitScore: number;
        aiScore: number;
        interviewScore: number;
        hasEnoughData: boolean;
        sampleSize: number;
    };
    avgPerformance: Record<string, number>;
    retentionRate: number | null;
    totalPlacements: number;
}

const RETENTION_COLORS: Record<string, string> = {
    RETAINED: "text-green-400",
    RESIGNED: "text-yellow-400",
    TERMINATED: "text-red-400",
};

export default function HireQualityPage() {
    const { user } = useAuthStore();
    const [data, setData] = useState<HireQualityDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [checkInForms, setCheckInForms] = useState<Record<string, { dayN: number; performanceRating: number; retentionStatus: string; notes: string }>>({});

    useEffect(() => {
        if (!user) return;
        authFetch("/recruiter/analytics/hire-quality")
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => setData(d.data))
            .finally(() => setLoading(false));
    }, [user]);

    const handleSubmitCheckIn = async (applicationId: string) => {
        const form = checkInForms[applicationId];
        if (!form) return;
        setSubmitting(applicationId);
        try {
            await authFetch(`/recruiter/applications/${applicationId}/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            // Refresh
            const res = await authFetch("/recruiter/analytics/hire-quality");
            if (res.ok) setData((await res.json()).data);
        } finally {
            setSubmitting(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin" />
        </div>
    );

    const mw = data?.modelWeights;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-green-500" />
                    Hire Quality Model
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Rate placed candidates to unlock predictive hiring intelligence
                </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Placements</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{data?.totalPlacements || 0}</p>
                </div>
                <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Retention Rate</p>
                    <p className="text-2xl font-black text-green-400 mt-1">
                        {data?.retentionRate !== null ? `${data?.retentionRate}%` : "—"}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Model Status</p>
                    <p className={`text-sm font-bold mt-1 ${mw?.hasEnoughData ? "text-green-400" : "text-yellow-400"}`}>
                        {mw?.hasEnoughData ? `Active (${mw.sampleSize} samples)` : `Needs ${5 - (mw?.sampleSize || 0)} more ratings`}
                    </p>
                </div>
            </div>

            {/* Model Weights */}
            {mw?.hasEnoughData && (
                <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Predictive Signal Weights</h2>
                    <p className="text-xs text-gray-400 mb-4">Pearson correlation between pre-hire signals and post-hire performance</p>
                    <div className="space-y-3">
                        {[
                            { label: "Fit Score", corr: mw.fitScore },
                            { label: "AI Evaluation Score", corr: mw.aiScore },
                        ].map(w => (
                            <div key={w.label}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600 dark:text-gray-400">{w.label}</span>
                                    <span className={`font-bold ${w.corr > 0.3 ? "text-green-400" : w.corr < 0 ? "text-red-400" : "text-gray-400"}`}>
                                        r = {w.corr.toFixed(2)}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${w.corr > 0 ? "bg-green-500" : "bg-red-500"}`}
                                        style={{ width: `${Math.abs(w.corr) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Avg Performance by Day */}
            {Object.keys(data?.avgPerformance || {}).length > 0 && (
                <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Avg Performance by Check-in Day</h2>
                    <div className="flex gap-6">
                        {[30, 60, 90].map(d => (
                            <div key={d} className="text-center">
                                <div className="text-3xl font-black text-blue-500">{data?.avgPerformance?.[d] ?? "—"}</div>
                                <div className="text-xs text-gray-400 mt-1">{d}-day rating</div>
                                <div className="flex gap-0.5 mt-1 justify-center">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-3 h-3 ${s <= (data?.avgPerformance?.[d] || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Placed Candidates list with check-in form */}
            <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Placed Candidates</h2>
                {!data?.placements?.length ? (
                    <div className="text-center py-10 text-gray-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No placed candidates yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.placements.map(p => {
                            const form = checkInForms[p.id] || { dayN: 90, performanceRating: 3, retentionStatus: "RETAINED", notes: "" };
                            return (
                                <div key={p.id} className="border border-gray-100 dark:border-white/5 rounded-xl p-4">
                                    <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{p.candidateName}</p>
                                            <p className="text-xs text-gray-400">{p.jobTitle} · Placed {new Date(p.placedAt).toLocaleDateString()}</p>
                                        </div>
                                        {p.checkIns.map(c => (
                                            <span key={c.dayN} className={`text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 ${RETENTION_COLORS[c.retentionStatus]}`}>
                                                {c.dayN}d: {c.performanceRating}/5
                                            </span>
                                        ))}
                                    </div>
                                    {/* Check-in form */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                        <select
                                            value={form.dayN}
                                            onChange={e => setCheckInForms(f => ({ ...f, [p.id]: { ...form, dayN: Number(e.target.value) } }))}
                                            className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300"
                                        >
                                            <option value={30}>30-day</option>
                                            <option value={60}>60-day</option>
                                            <option value={90}>90-day</option>
                                        </select>
                                        <select
                                            value={form.performanceRating}
                                            onChange={e => setCheckInForms(f => ({ ...f, [p.id]: { ...form, performanceRating: Number(e.target.value) } }))}
                                            className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300"
                                        >
                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}/5 Stars</option>)}
                                        </select>
                                        <select
                                            value={form.retentionStatus}
                                            onChange={e => setCheckInForms(f => ({ ...f, [p.id]: { ...form, retentionStatus: e.target.value } }))}
                                            className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300"
                                        >
                                            <option value="RETAINED">Retained</option>
                                            <option value="RESIGNED">Resigned</option>
                                            <option value="TERMINATED">Terminated</option>
                                        </select>
                                        <button
                                            onClick={() => handleSubmitCheckIn(p.id)}
                                            disabled={submitting === p.id}
                                            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg px-3 py-1.5 transition-colors"
                                        >
                                            {submitting === p.id ? "Saving..." : "Submit"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
