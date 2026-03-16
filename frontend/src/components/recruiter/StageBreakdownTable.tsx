"use client";

import { motion } from "framer-motion";

const STAGE_ORDER = ["APPLIED", "SCREENING", "INTERVIEWING", "OFFER", "PLACED", "REJECTED", "WITHDRAWN"];

const STAGE_META: Record<string, { label: string; color: string; bg: string }> = {
    APPLIED:      { label: "Applied",        color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-500/10" },
    SCREENING:    { label: "Screening",      color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-500/10" },
    INTERVIEWING: { label: "Interviewing",   color: "text-violet-600 dark:text-violet-400",bg: "bg-violet-100 dark:bg-violet-500/10" },
    OFFER:        { label: "Offer Extended", color: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-100 dark:bg-emerald-500/10" },
    PLACED:       { label: "Hired / Placed", color: "text-teal-600 dark:text-teal-400",   bg: "bg-teal-100 dark:bg-teal-500/10" },
    REJECTED:     { label: "Rejected",       color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-100 dark:bg-rose-500/10" },
    WITHDRAWN:    { label: "Withdrawn",      color: "text-gray-500 dark:text-gray-400",    bg: "bg-gray-100 dark:bg-gray-500/10" },
};

interface Props {
    stageCounts: Record<string, number>;
    totalApplicants: number;
}

export default function StageBreakdownTable({ stageCounts, totalApplicants }: Props) {
    const rows = STAGE_ORDER
        .filter(id => (stageCounts[id] ?? 0) > 0)
        .map((id, idx, arr) => {
            const count = stageCounts[id] ?? 0;
            const pct = totalApplicants > 0 ? Math.round((count / totalApplicants) * 100) : 0;
            // Drop-off = candidates that left this stage to rejected/withdrawn rather than advancing
            const rejected = stageCounts["REJECTED"] ?? 0;
            const meta = STAGE_META[id] ?? { label: id, color: "text-gray-500", bg: "bg-gray-100" };
            return { id, count, pct, meta };
        });

    if (rows.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-gray-400">No stage data available.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-500">Stage</th>
                        <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider text-gray-500">Candidates</th>
                        <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider text-gray-500">% of Total</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-500 min-w-[120px]">Distribution</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map((row, i) => (
                        <motion.tr
                            key={row.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white dark:bg-transparent hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                            <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${row.meta.bg} ${row.meta.color}`}>
                                    {row.meta.label}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">
                                {row.count}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <span className={`font-bold ${row.meta.color}`}>{row.pct}%</span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden w-full">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${row.pct}%` }}
                                        transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.05 }}
                                        className={`h-full rounded-full ${
                                            row.id === "REJECTED" || row.id === "WITHDRAWN"
                                                ? "bg-rose-400"
                                                : row.id === "PLACED" || row.id === "OFFER"
                                                ? "bg-emerald-500"
                                                : "bg-indigo-500"
                                        }`}
                                    />
                                </div>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2.5 text-xs font-black text-gray-500 uppercase tracking-wider">Total</td>
                        <td className="px-4 py-2.5 text-right font-black text-gray-900 dark:text-white">{totalApplicants}</td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-500">100%</td>
                        <td />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
