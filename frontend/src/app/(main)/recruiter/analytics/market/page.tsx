"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { Globe, RefreshCw, TrendingUp, Users, Briefcase, AlertCircle, Map } from "lucide-react";

function SkillsHeatMap({
    skills,
    locations,
    totalCandidates,
}: {
    skills: Array<{ skill: string; count: number }>;
    locations: Array<{ location: string; count: number }>;
    totalCandidates: number;
}) {
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

    const maxSkill = skills[0]?.count || 1;
    const maxLoc = locations[0]?.count || 1;

    // Estimated candidates: skill_share × location_share × total
    const cellValue = (skillCount: number, locCount: number) =>
        Math.round((skillCount / maxSkill) * (locCount / maxLoc) * totalCandidates * 0.6);

    const intensity = (skillCount: number, locCount: number) =>
        Math.round(((skillCount / maxSkill) * 0.6 + (locCount / maxLoc) * 0.4) * 100);

    const cellBg = (pct: number) => {
        if (pct >= 80) return 'bg-blue-600 text-white';
        if (pct >= 60) return 'bg-blue-500 text-white';
        if (pct >= 40) return 'bg-blue-400 text-white';
        if (pct >= 20) return 'bg-blue-200 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200';
        return 'bg-blue-50 text-blue-400 dark:bg-blue-900/20 dark:text-blue-400';
    };

    return (
        <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <Map className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Skills by Location Heat Map</h2>
            </div>
            <p className="text-xs text-gray-400 mb-5">Estimated candidate density per skill × city (normalized from aggregate data)</p>

            <div className="overflow-x-auto relative">
                {tooltip && (
                    <div
                        className="fixed z-50 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none"
                        style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
                    >
                        {tooltip.text}
                    </div>
                )}
                <table className="text-xs border-collapse min-w-full">
                    <thead>
                        <tr>
                            <th className="pr-3 pb-3 text-left font-medium text-gray-400 min-w-[120px]">Skill</th>
                            {locations.map((loc, li) => {
                                const label = loc.location ?? '—';
                                return (
                                    <th key={label + li} className="pb-3 px-1 font-medium text-gray-500 dark:text-gray-400 text-center min-w-[80px] max-w-[100px]">
                                        <span className="truncate block" title={label}>
                                            {label.length > 10 ? label.slice(0, 10) + '…' : label}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {skills.map(skill => (
                            <tr key={skill.skill}>
                                <td className="pr-3 py-1 font-medium text-gray-700 dark:text-gray-300 text-right">
                                    {skill.skill.length > 14 ? skill.skill.slice(0, 14) + '…' : skill.skill}
                                </td>
                                {locations.map((loc, li) => {
                                    const label = loc.location ?? '—';
                                    const pct = intensity(skill.count, loc.count);
                                    const est = cellValue(skill.count, loc.count);
                                    return (
                                        <td key={label + li} className="px-1 py-1 text-center">
                                            <div
                                                className={`mx-auto w-14 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] cursor-default transition-transform hover:scale-110 ${cellBg(pct)}`}
                                                onMouseEnter={e => setTooltip({
                                                    text: `~${est} with ${skill.skill} in ${label}`,
                                                    x: (e as React.MouseEvent).clientX,
                                                    y: (e as React.MouseEvent).clientY,
                                                })}
                                                onMouseLeave={() => setTooltip(null)}
                                            >
                                                {est > 0 ? est : '—'}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-gray-400">Low</span>
                {['bg-blue-50', 'bg-blue-200', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600'].map(c => (
                    <div key={c} className={`w-6 h-3 rounded-sm ${c}`} />
                ))}
                <span className="text-xs text-gray-400">High</span>
            </div>
        </div>
    );
}

interface MarketIntelligence {
    topSkills: Array<{ skill: string; count: number }>;
    locationHeatmap: Array<{ location: string; count: number }>;
    roleSupplyDemand: Array<{ role: string; candidates: number; jobs: number; ratio: number }>;
    salaryTrends: Array<{ role: string; min: number; median: number; max: number; currency: string }>;
    totalCandidates: number;
    totalActiveJobs: number;
    avgSkillsPerCandidate: number;
    lastUpdated: string;
}

export default function MarketIntelPage() {
    const { user } = useAuthStore();
    const [data, setData] = useState<MarketIntelligence | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        const res = await authFetch("/recruiter/analytics/market-intelligence");
        if (!res.ok) throw new Error("Failed to load market intelligence");
        const d = await res.json();
        return d.data as MarketIntelligence;
    }, []);

    useEffect(() => {
        if (!user) return;
        fetchData()
            .then(d => setData(d))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [user, fetchData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await authFetch("/recruiter/analytics/market-intelligence/refresh", { method: "POST" });
            const d = await fetchData();
            setData(d);
        } catch { }
        setRefreshing(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin" />
        </div>
    );

    if (error) return (
        <div className="p-6 bg-red-900/20 border border-red-700 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
        </div>
    );

    const topSkills = data?.topSkills?.slice(0, 20) || [];
    const maxSkillCount = topSkills[0]?.count || 1;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Globe className="w-7 h-7 text-blue-500" />
                        Market Intelligence
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        AI estimate · Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "—"}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh Intelligence
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { icon: Users, label: "Total Candidates", value: data?.totalCandidates || 0, color: "text-blue-500" },
                    { icon: Briefcase, label: "Active Jobs", value: data?.totalActiveJobs || 0, color: "text-green-500" },
                    { icon: TrendingUp, label: "Avg Skills / Candidate", value: `${data?.avgSkillsPerCandidate || 0}`, color: "text-purple-500" },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                        <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{kpi.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Top Skills */}
            <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Top In-Demand Skills</h2>
                <div className="space-y-2">
                    {topSkills.map((s, i) => (
                        <div key={s.skill} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.skill}</span>
                                    <span className="text-xs text-gray-400">{s.count} candidates</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                        style={{ width: `${(s.count / maxSkillCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Supply vs Demand */}
            {data?.roleSupplyDemand && data.roleSupplyDemand.length > 0 && (
                <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Supply vs Demand by Role</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-400 border-b border-gray-100 dark:border-white/5">
                                    <th className="text-left pb-3 font-medium">Role</th>
                                    <th className="text-right pb-3 font-medium">Candidates</th>
                                    <th className="text-right pb-3 font-medium">Jobs</th>
                                    <th className="text-right pb-3 font-medium">Ratio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {data.roleSupplyDemand.map(r => (
                                    <tr key={r.role}>
                                        <td className="py-3 text-gray-700 dark:text-gray-300 font-medium">{r.role}</td>
                                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">{r.candidates}</td>
                                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">{r.jobs}</td>
                                        <td className={`py-3 text-right font-bold ${(r.ratio || 0) > 5 ? "text-green-400" : (r.ratio || 0) < 2 ? "text-red-400" : "text-yellow-400"}`}>
                                            {(r.ratio || 0).toFixed(1)}:1
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Skills by Location Heat Map */}
            {topSkills.length > 0 && data?.locationHeatmap && data.locationHeatmap.filter(l => l.location).length > 0 && (
                <SkillsHeatMap
                    skills={topSkills.slice(0, 10)}
                    locations={data.locationHeatmap.filter(l => l.location).slice(0, 6)}
                    totalCandidates={data.totalCandidates || 1}
                />
            )}

            {/* Salary Trends */}
            {data?.salaryTrends && data.salaryTrends.length > 0 && (
                <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Salary Trends</h2>
                    <p className="text-xs text-gray-400 mb-4">AI-generated estimates based on market data</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.salaryTrends.map(t => (
                            <div key={t.role} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                                <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">{t.role}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <span>{t.currency} {(t.min / 100000).toFixed(1)}L</span>
                                    <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "60%" }} />
                                    </div>
                                    <span>{t.currency} {(t.max / 100000).toFixed(1)}L</span>
                                </div>
                                <p className="text-xs text-blue-400 mt-1">Median: {t.currency} {(t.median / 100000).toFixed(1)}L</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
