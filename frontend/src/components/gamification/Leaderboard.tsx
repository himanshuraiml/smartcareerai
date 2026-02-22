"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, ChevronUp, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from '@/lib/auth-fetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    avatarUrl?: string;
    xp: number;
    level: number;
    badges: number;
}

interface LeaderboardProps {
    currentUserXp?: number;
}

export default function Leaderboard({ currentUserXp = 0 }: LeaderboardProps) {
    const { user } = useAuthStore();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [userXp, setUserXp] = useState<number>(currentUserXp);
    const [showFull, setShowFull] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            setError(null);
            try {
                const headers: Record<string, string> = {};
                if (user) {
                }

                const res = await authFetch(`/auth/leaderboard?limit=20`, { headers });
                if (!res.ok) throw new Error('Failed to fetch');

                const data = await res.json();
                if (data.success) {
                    setLeaderboard(data.data.leaderboard);
                    if (data.data.currentUser) {
                        setUserRank(data.data.currentUser.rank);
                        setUserXp(data.data.currentUser.xp);
                    }
                }
            } catch {
                setError('Could not load leaderboard');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [user]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-5 h-5 text-yellow-400" />;
            case 2:
                return <Medal className="w-5 h-5 text-gray-300" />;
            case 3:
                return <Medal className="w-5 h-5 text-amber-600" />;
            default:
                return <span className="text-gray-400 font-bold">#{rank}</span>;
        }
    };

    const displayedLeaderboard = showFull ? leaderboard : leaderboard.slice(0, 5);

    return (
        <div className="p-6 rounded-2xl glass-card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Leaderboard
                </h3>
                <span className="text-xs text-gray-500 uppercase tracking-wider">All Time</span>
            </div>

            {/* User's Rank Highlight */}
            {userRank && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0) || "Y"}
                            </div>
                            <div>
                                <p className="text-gray-900 dark:text-white font-medium">You</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{userXp.toLocaleString()} XP</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-indigo-400">#{userRank}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Your Rank</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/5" />
                                <div>
                                    <div className="h-3 w-20 bg-white dark:bg-white/5 rounded mb-1" />
                                    <div className="h-2 w-12 bg-white dark:bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="h-4 w-10 bg-white dark:bg-white/5 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <p className="text-center text-gray-500 py-6 text-sm">{error}</p>
            )}

            {/* Empty State */}
            {!loading && !error && leaderboard.length === 0 && (
                <p className="text-center text-gray-500 py-6 text-sm">No participants yet</p>
            )}

            {/* Leaderboard List */}
            {!loading && !error && leaderboard.length > 0 && (
                <>
                    <div className="space-y-2">
                        {displayedLeaderboard.map((entry, index) => (
                            <motion.div
                                key={entry.userId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center justify-between p-3 rounded-lg transition ${entry.rank <= 3 ? "bg-white dark:bg-white/5" : "hover:bg-gray-50 dark:hover:bg-white/5"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 flex justify-center">
                                        {getRankIcon(entry.rank)}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-medium">
                                        {entry.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white font-medium text-sm">{entry.name}</p>
                                        <p className="text-xs text-gray-500">Level {entry.level}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-900 dark:text-white font-bold">{entry.xp.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">XP</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {leaderboard.length > 5 && (
                        <button
                            onClick={() => setShowFull(!showFull)}
                            className="w-full mt-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition flex items-center justify-center gap-1"
                        >
                            {showFull ? (
                                <>Show Less <ChevronUp className="w-4 h-4" /></>
                            ) : (
                                <>Show All <ChevronDown className="w-4 h-4" /></>
                            )}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}



