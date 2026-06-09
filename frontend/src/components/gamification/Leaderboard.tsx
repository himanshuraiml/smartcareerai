"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, ChevronUp, ChevronDown, Shield, Clock, HelpCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from '@/lib/auth-fetch';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    userName: string;
    userAvatar?: string;
    weeklyXp: number;
    hasShield: boolean;
}

interface LeagueInfo {
    id: string;
    tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
    weekStart: string;
    weekEnd: string;
    groupIndex: number;
}

const LEAGUE_THEMES = {
    BRONZE: { name: "Bronze League", icon: "🥉", color: "text-amber-700", border: "border-amber-700/30", bg: "from-amber-700/5 to-amber-700/10", textColor: "text-amber-900 dark:text-amber-200" },
    SILVER: { name: "Silver League", icon: "🥈", color: "text-slate-400", border: "border-slate-400/30", bg: "from-slate-400/5 to-slate-400/10", textColor: "text-slate-900 dark:text-slate-200" },
    GOLD: { name: "Gold League", icon: "🥇", color: "text-yellow-500", border: "border-yellow-500/30", bg: "from-yellow-500/5 to-yellow-500/10", textColor: "text-yellow-900 dark:text-yellow-200" },
    PLATINUM: { name: "Platinum League", icon: "💎", color: "text-sky-400", border: "border-sky-400/30", bg: "from-sky-400/5 to-sky-400/10", textColor: "text-sky-900 dark:text-sky-200" },
    DIAMOND: { name: "Diamond League", icon: "🔷", color: "text-violet-500", border: "border-violet-500/30", bg: "from-violet-500/5 to-violet-500/10", textColor: "text-violet-900 dark:text-violet-200" },
};

export default function Leaderboard() {
    const { user } = useAuthStore();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [userWeeklyXp, setUserWeeklyXp] = useState<number>(0);
    const [hasShield, setHasShield] = useState<boolean>(false);
    const [showFull, setShowFull] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>("");

    // Fetch current league info and board
    useEffect(() => {
        const fetchLeagueData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await authFetch(`/leagues/current`);
                if (!res.ok) throw new Error('Failed to fetch league');

                const data = await res.json();
                if (data.success && data.data) {
                    const { membership, rank, leaderboard: board } = data.data;
                    setLeagueInfo(membership.league);
                    setLeaderboard(board);
                    setUserRank(rank);
                    setUserWeeklyXp(membership.weeklyXp);
                    setHasShield(membership.hasShield);
                }
            } catch (err) {
                loggerError(err);
                setError('Could not load weekly league');
            } finally {
                setLoading(false);
            }
        };

        fetchLeagueData();
    }, [user]);

    // Timer countdown to reset (weekEnd)
    useEffect(() => {
        if (!leagueInfo?.weekEnd) return;

        const updateTimer = () => {
            // weekEnd is stored as a @db.Date, resetting the time portion to 00:00 UTC.
            // The actual league ends on Sunday at 18:30 UTC (Monday 00:00 IST).
            const end = new Date(leagueInfo.weekEnd).getTime() + (18 * 60 + 30) * 60 * 1000;
            const now = new Date().getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("Resetting now...");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            let timerStr = "";
            if (days > 0) timerStr += `${days}d `;
            timerStr += `${hours}h ${minutes}m`;
            setTimeLeft(timerStr);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [leagueInfo]);

    const loggerError = (err: any) => {
        console.error(err);
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <span className="text-xl">🥇</span>;
            case 2:
                return <span className="text-xl">🥈</span>;
            case 3:
                return <span className="text-xl">🥉</span>;
            default:
                return <span className="text-gray-400 font-bold text-sm">#{rank}</span>;
        }
    };

    const tier = leagueInfo?.tier || "BRONZE";
    const theme = LEAGUE_THEMES[tier];
    const displayedLeaderboard = showFull ? leaderboard : leaderboard.slice(0, 10);

    return (
        <div className="p-6 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 shadow-xl transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{theme.icon}</span>
                    <div>
                        <h3 className={`text-xl font-extrabold tracking-tight ${theme.color}`}>
                            {theme.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Weekly Competitive Group
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {timeLeft && (
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Resets in: <strong className="font-semibold text-gray-900 dark:text-white">{timeLeft}</strong></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Rules explanation box */}
            <div className="mb-6 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Weekly Rules: </span>
                    Top 10 promote to the next league tier. Bottom 5 demote. Finishing in the Top 3 awards a <span className="font-semibold text-indigo-400">Demotion Shield</span> for the next week.
                </div>
            </div>

            {/* User's Rank Highlight */}
            {userRank && !loading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${theme.bg} border ${theme.border} relative overflow-hidden shadow-sm`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                                {user?.name?.charAt(0).toUpperCase() || "Y"}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-gray-900 dark:text-white font-bold text-sm">You</p>
                                    {hasShield && <span title="Demotion Shield Active"><Shield className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" /></span>}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{userWeeklyXp.toLocaleString()} XP this week</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-3xl font-black ${theme.color}`}>#{userRank}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Current Rank</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 animate-pulse border border-dashed border-gray-100 dark:border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/5" />
                                <div>
                                    <div className="h-3.5 w-24 bg-gray-200 dark:bg-white/5 rounded mb-1.5" />
                                    <div className="h-2 w-16 bg-gray-200 dark:bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="h-4 w-12 bg-gray-200 dark:bg-white/5 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <p className="text-center text-red-400 py-6 text-sm">{error}</p>
            )}

            {/* Empty State */}
            {!loading && !error && leaderboard.length === 0 && (
                <p className="text-center text-gray-500 py-6 text-sm">No members in this league yet. Earn XP to join!</p>
            )}

            {/* Leaderboard List */}
            {!loading && !error && leaderboard.length > 0 && (
                <div className="space-y-1 relative">
                    {displayedLeaderboard.map((entry, index) => {
                        const isCurrentUser = entry.userId === user?.id;
                        const rank = entry.rank;

                        // Promotion / Demotion zones line indicators
                        const showPromoLine = rank === 10 && leaderboard.length > 10;
                        const showDemoteLine = rank === 25 && leaderboard.length > 25;

                        return (
                            <div key={entry.userId}>
                                <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
                                        isCurrentUser
                                            ? "bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 shadow-sm"
                                            : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 flex justify-center shrink-0">
                                            {getRankIcon(rank)}
                                        </div>
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-900 dark:text-white font-bold text-sm shrink-0 border border-gray-100 dark:border-white/5">
                                            {entry.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-sm font-bold ${isCurrentUser ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                                                    {entry.userName} {isCurrentUser && "(You)"}
                                                </p>
                                                {entry.hasShield && <span title="Shield Active"><Shield className="w-3 h-3 text-indigo-400 fill-indigo-400/20" /></span>}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Rank {rank}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900 dark:text-white">{entry.weeklyXp.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Weekly XP</p>
                                    </div>
                                </motion.div>

                                {/* Promotion Zone Line */}
                                {showPromoLine && (
                                    <div className="my-2 flex items-center gap-3">
                                        <div className="h-[1px] bg-green-500/30 grow"></div>
                                        <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full border border-green-500/20">
                                            Promotion Zone (Top 10)
                                        </span>
                                        <div className="h-[1px] bg-green-500/30 grow"></div>
                                    </div>
                                )}

                                {/* Demotion Zone Line */}
                                {showDemoteLine && (
                                    <div className="my-2 flex items-center gap-3">
                                        <div className="h-[1px] bg-red-500/30 grow"></div>
                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full border border-red-500/20">
                                            Demotion Zone (Bottom 5)
                                        </span>
                                        <div className="h-[1px] bg-red-500/30 grow"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {leaderboard.length > 10 && (
                        <button
                            onClick={() => setShowFull(!showFull)}
                            className="w-full mt-4 py-2.5 rounded-xl border border-gray-100 dark:border-white/5 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            {showFull ? (
                                <>Show Top 10 <ChevronUp className="w-4 h-4" /></>
                            ) : (
                                <>Show Full Board <ChevronDown className="w-4 h-4" /></>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
