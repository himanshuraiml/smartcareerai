"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award, Shield, ArrowUpRight, ArrowDownRight, RefreshCw, Trophy } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface WeekResult {
    tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
    rank: number;
    weeklyXp: number;
    outcome: "PROMOTED" | "DEMOTED" | "STAYED" | "SHIELDED";
    weekStart: string;
}

const LEAGUE_NAMES = {
    BRONZE: { name: "Bronze League", icon: "🥉", color: "text-amber-700", bg: "bg-amber-500/10" },
    SILVER: { name: "Silver League", icon: "🥈", color: "text-slate-400", bg: "bg-slate-500/10" },
    GOLD: { name: "Gold League", icon: "🥇", color: "text-yellow-500", bg: "bg-yellow-500/10" },
    PLATINUM: { name: "Platinum League", icon: "💎", color: "text-sky-400", bg: "bg-sky-500/10" },
    DIAMOND: { name: "Diamond League", icon: "🔷", color: "text-violet-500", bg: "bg-violet-500/10" },
};

export default function LeagueResultModal() {
    const [result, setResult] = useState<WeekResult | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkResult = async () => {
            try {
                const res = await authFetch("/leagues/result");
                if (!res.ok) return;

                const data = await res.json();
                if (data.success && data.data) {
                    const weekResult: WeekResult = data.data;

                    // Verify if this specific week start has been acknowledged
                    const storageKey = `pn_league_reset_seen_${weekResult.weekStart}`;
                    const seen = localStorage.getItem(storageKey);

                    if (!seen) {
                        setResult(weekResult);
                        setIsOpen(true);
                        localStorage.setItem(storageKey, "1");
                    }
                }
            } catch (err) {
                console.error("Failed to check league reset results", err);
            }
        };

        checkResult();
    }, []);

    if (!isOpen || !result) return null;

    const theme = LEAGUE_NAMES[result.tier];
    const isPromo = result.outcome === "PROMOTED";
    const isDemote = result.outcome === "DEMOTED";
    const isShield = result.outcome === "SHIELDED";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 p-6 rounded-3xl shadow-2xl overflow-hidden text-center z-10"
                >
                    {/* Close button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content Logic */}
                    {isPromo && (
                        <div>
                            <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                <Trophy className="w-10 h-10 text-green-500 animate-bounce" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                League Promotion! 🎉
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                You crushed last week's competition and earned your promotion!
                            </p>

                            <div className="my-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-around">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Last Week</p>
                                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mt-1 justify-center">
                                        <span>{theme.icon}</span> {theme.name}
                                    </p>
                                </div>
                                <ArrowUpRight className="w-6 h-6 text-green-500 animate-pulse" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">New Tier</p>
                                    <p className="text-lg font-bold text-indigo-400 flex items-center gap-1 mt-1 justify-center">
                                        🚀 Promote Up!
                                    </p>
                                </div>
                            </div>

                            {result.rank <= 3 && (
                                <div className="mb-6 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center gap-2">
                                    <Shield className="w-4 h-4 text-indigo-500 fill-indigo-500/20" />
                                    <span>Top 3 finish: +1 Demotion Shield earned! 🛡️</span>
                                </div>
                            )}
                        </div>
                    )}

                    {isDemote && (
                        <div>
                            <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <ArrowDownRight className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                Demotion Warning ⚠️
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                You finished in the demotion zone last week. Don't worry, you can easily climb back up!
                            </p>

                            <div className="my-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-around">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Previous Tier</p>
                                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mt-1 justify-center">
                                        {theme.icon} {theme.name}
                                    </p>
                                </div>
                                <ArrowDownRight className="w-6 h-6 text-red-500" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">New Tier</p>
                                    <p className="text-lg font-bold text-red-400 flex items-center gap-1 mt-1 justify-center">
                                        Demoted Down
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isShield && (
                        <div>
                            <div className="mx-auto w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                                <Shield className="w-10 h-10 text-indigo-500 fill-indigo-500/20 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                Shield Protected! 🛡️
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Your demotion shield activated and saved you from falling to a lower league!
                            </p>
                            <p className="text-xs text-gray-400 border border-dashed border-indigo-500/20 p-3 rounded-xl bg-indigo-50/20 dark:bg-indigo-950/10">
                                Your shield was consumed. Work hard this week to stay in the <strong>{theme.name}</strong>!
                            </p>
                        </div>
                    )}

                    {result.outcome === "STAYED" && (
                        <div>
                            <div className="mx-auto w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                                <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin-slow" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                Week Result: Stayed 🔄
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                You finished Rank #{result.rank} in the {theme.name}. You remain in this league for another week.
                            </p>
                        </div>
                    )}

                    {/* Stats table */}
                    <div className="grid grid-cols-2 gap-4 mt-6 mb-8 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-left text-xs">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block">Final Rank:</span>
                            <strong className="text-base text-gray-900 dark:text-white font-bold">#{result.rank}</strong>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block">Weekly XP:</span>
                            <strong className="text-base text-gray-900 dark:text-white font-bold">{result.weeklyXp.toLocaleString()} XP</strong>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold hover:shadow-lg transition shadow-md"
                    >
                        Let's Go!
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
