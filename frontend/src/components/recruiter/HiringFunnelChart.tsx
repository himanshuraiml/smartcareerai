"use client";

import { motion } from "framer-motion";
import { ArrowDown, TrendingDown } from "lucide-react";

export interface FunnelStage {
    id: string;
    label: string;
    count: number;
    color: string;
    bgColor: string;
    borderColor: string;
}

const ORDERED_STAGES: { id: string; label: string; color: string; bgColor: string; borderColor: string }[] = [
    { id: "APPLIED",      label: "Applied",        color: "text-blue-600 dark:text-blue-400",    bgColor: "bg-blue-500",    borderColor: "border-blue-200 dark:border-blue-500/30" },
    { id: "SCREENING",    label: "Screening",      color: "text-amber-600 dark:text-amber-400",  bgColor: "bg-amber-500",   borderColor: "border-amber-200 dark:border-amber-500/30" },
    { id: "INTERVIEWING", label: "Interviewing",   color: "text-violet-600 dark:text-violet-400",bgColor: "bg-violet-500",  borderColor: "border-violet-200 dark:border-violet-500/30" },
    { id: "OFFER",        label: "Offer Extended", color: "text-emerald-600 dark:text-emerald-400",bgColor: "bg-emerald-500",borderColor: "border-emerald-200 dark:border-emerald-500/30" },
    { id: "PLACED",       label: "Hired / Placed", color: "text-teal-600 dark:text-teal-400",   bgColor: "bg-teal-500",    borderColor: "border-teal-200 dark:border-teal-500/30" },
];

interface Props {
    stageCounts: Record<string, number>;
}

export default function HiringFunnelChart({ stageCounts }: Props) {
    const total = stageCounts["APPLIED"] ?? Object.values(stageCounts).reduce((a, b) => a + b, 0);

    const stages: FunnelStage[] = ORDERED_STAGES.map(s => ({
        ...s,
        count: stageCounts[s.id] ?? 0,
    })).filter(s => s.count > 0 || s.id === "APPLIED");

    const rejected = stageCounts["REJECTED"] ?? 0;

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                    <TrendingDown className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No applicants yet</p>
                <p className="text-xs text-gray-400 mt-1">Pipeline data will appear once candidates apply.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {stages.map((stage, idx) => {
                const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                const prevCount = idx > 0 ? stages[idx - 1].count : null;
                const conversion = prevCount && prevCount > 0
                    ? Math.round((stage.count / prevCount) * 100)
                    : null;

                return (
                    <div key={stage.id}>
                        {/* Conversion arrow between stages */}
                        {idx > 0 && conversion !== null && (
                            <div className="flex items-center gap-2 py-1 pl-4">
                                <ArrowDown className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                <span className={`text-xs font-bold ${conversion >= 70 ? "text-emerald-500" : conversion >= 40 ? "text-amber-500" : "text-rose-500"}`}>
                                    {conversion}% passed
                                </span>
                                <span className="text-xs text-gray-400">
                                    ({stages[idx - 1].count - stage.count} dropped)
                                </span>
                            </div>
                        )}

                        {/* Stage bar */}
                        <div className={`p-3 rounded-xl border ${stage.borderColor} bg-white dark:bg-white/[0.02]`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-bold ${stage.color}`}>{stage.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${stage.color}`}>{stage.count}</span>
                                    <span className="text-xs text-gray-400">({pct}%)</span>
                                </div>
                            </div>
                            <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                                    className={`h-full rounded-full ${stage.bgColor}`}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Rejected summary */}
            {rejected > 0 && (
                <div className="mt-3 p-3 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 flex items-center justify-between">
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Rejected</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400">{rejected}</span>
                        <span className="text-xs text-gray-400">({total > 0 ? Math.round((rejected / total) * 100) : 0}% of total)</span>
                    </div>
                </div>
            )}
        </div>
    );
}
