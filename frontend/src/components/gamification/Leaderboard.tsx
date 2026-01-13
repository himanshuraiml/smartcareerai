"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, ChevronUp, ChevronDown, User } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

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

// Mock data for now - would come from backend
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, userId: "1", name: "Priya S.", xp: 4520, level: 10, badges: 12 },
    { rank: 2, userId: "2", name: "Arjun K.", xp: 4210, level: 9, badges: 10 },
    { rank: 3, userId: "3", name: "Sneha R.", xp: 3890, level: 8, badges: 9 },
    { rank: 4, userId: "4", name: "Rahul M.", xp: 3450, level: 7, badges: 8 },
    { rank: 5, userId: "5", name: "Ananya P.", xp: 3120, level: 7, badges: 7 },
    { rank: 6, userId: "6", name: "Vikram T.", xp: 2890, level: 6, badges: 6 },
    { rank: 7, userId: "7", name: "Meera J.", xp: 2540, level: 6, badges: 5 },
    { rank: 8, userId: "8", name: "Karthik N.", xp: 2210, level: 5, badges: 5 },
    { rank: 9, userId: "9", name: "Divya S.", xp: 1980, level: 4, badges: 4 },
    { rank: 10, userId: "10", name: "Arun V.", xp: 1750, level: 4, badges: 3 },
];

interface LeaderboardProps {
    currentUserXp?: number;
}

export default function Leaderboard({ currentUserXp = 0 }: LeaderboardProps) {
    const { user } = useAuthStore();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [showFull, setShowFull] = useState(false);

    useEffect(() => {
        // Calculate user's mock rank
        const rank = MOCK_LEADERBOARD.findIndex(e => e.xp < currentUserXp) + 1;
        setUserRank(rank > 0 ? rank : MOCK_LEADERBOARD.length + 1);
    }, [currentUserXp]);

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
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Leaderboard
                </h3>
                <span className="text-xs text-gray-500 uppercase tracking-wider">This Week</span>
            </div>

            {/* User's Rank Highlight */}
            {userRank && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0) || "Y"}
                            </div>
                            <div>
                                <p className="text-white font-medium">You</p>
                                <p className="text-xs text-gray-400">{currentUserXp.toLocaleString()} XP</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-purple-400">#{userRank}</p>
                            <p className="text-xs text-gray-400">Your Rank</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Leaderboard List */}
            <div className="space-y-2">
                {displayedLeaderboard.map((entry, index) => (
                    <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg transition ${entry.rank <= 3 ? "bg-white/5" : "hover:bg-white/5"
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
                                <p className="text-white font-medium text-sm">{entry.name}</p>
                                <p className="text-xs text-gray-500">Level {entry.level}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-bold">{entry.xp.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">XP</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Show More/Less */}
            <button
                onClick={() => setShowFull(!showFull)}
                className="w-full mt-4 py-2 text-center text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-1"
            >
                {showFull ? (
                    <>Show Less <ChevronUp className="w-4 h-4" /></>
                ) : (
                    <>Show All <ChevronDown className="w-4 h-4" /></>
                )}
            </button>
        </div>
    );
}
