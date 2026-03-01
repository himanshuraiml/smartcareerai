'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Star, Gift, X, CheckCircle } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface EngagementStats {
    streakCount: number;
    xp: number;
    level: number;
    xpToNextLevel: number;
    xpInCurrentLevel: number;
    rewardAvailable: boolean;
    nextMilestoneDays: number;
    lastLoginAt: string | null;
}

interface RewardResult {
    streakCount: number;
    xp: number;
    rewardGranted: boolean;
    xpGranted?: number;
    milestoneReached: boolean;
    milestoneDetails?: { days: number; creditType: string; amount: number } | null;
    nextMilestone?: number;
}

export default function StreakBanner() {
    const [stats, setStats] = useState<EngagementStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [rewardResult, setRewardResult] = useState<RewardResult | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        fetchStats();
        // Auto-claim daily login reward when component mounts
        triggerDailyLogin();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await authFetch('/engagement/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.data);
            }
        } catch { } finally {
            setLoading(false);
        }
    };

    const triggerDailyLogin = async () => {
        try {
            const res = await authFetch('/engagement/daily-login', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                const result: RewardResult = data.data;
                setRewardResult(result);
                if (result.rewardGranted) {
                    setStats(prev => prev ? { ...prev, streakCount: result.streakCount, xp: result.xp, rewardAvailable: false } : prev);
                }
            }
        } catch { }
    };

    if (loading || !stats) return null;

    const streakDays = [1, 2, 3, 4, 5, 6, 7];
    const day7Reward = stats.nextMilestoneDays === 7 ? stats.streakCount === 0 : false;

    return (
        <>
            {/* Reward Popup */}
            <AnimatePresence>
                {rewardResult?.rewardGranted && !dismissed && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-6 right-6 z-[100] max-w-sm w-full"
                    >
                        <div className={`relative rounded-2xl p-5 shadow-2xl border ${rewardResult.milestoneReached
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400/50 text-white'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white'
                            }`}>
                            <button
                                onClick={() => setDismissed(true)}
                                className="absolute top-3 right-3 opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {rewardResult.milestoneReached ? (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                            <Gift className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base">🎉 Streak Milestone!</p>
                                            <p className="text-sm opacity-90">{rewardResult.milestoneDetails?.days}-day streak achieved!</p>
                                        </div>
                                    </div>
                                    <p className="text-sm mt-2 font-medium">
                                        +1 FREE AI Interview Credit added to your balance!
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                            <Flame className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base">Daily Reward Claimed! 🔥</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {rewardResult.streakCount}-day streak active
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                            <Zap className="w-4 h-4" /> +{rewardResult.xpGranted} XP earned
                                        </span>
                                        {rewardResult.nextMilestone && rewardResult.nextMilestone < 7 && (
                                            <span className="text-xs text-gray-400">
                                                · {rewardResult.nextMilestone} days to free credit
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Streak Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border border-orange-100 dark:border-orange-500/20 p-4 mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Streak Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/30">
                            <Flame className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-orange-700 dark:text-orange-300 text-base">
                                    {stats.streakCount} Day Streak
                                </span>
                                {!stats.rewardAvailable && (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                                        <CheckCircle className="w-3 h-3" /> Today's reward claimed
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-orange-500/70 dark:text-orange-400/70 mt-0.5">
                                {stats.nextMilestoneDays === 7
                                    ? 'Start a streak! Log in daily for a free AI Interview credit on day 7.'
                                    : `${stats.nextMilestoneDays} more day${stats.nextMilestoneDays !== 1 ? 's' : ''} to earn a free AI Interview credit!`}
                            </p>
                        </div>
                    </div>

                    {/* 7-Day Progress Dots */}
                    <div className="flex items-center gap-1.5">
                        {streakDays.map((day) => {
                            const isCompleted = day <= (stats.streakCount % 7 || (stats.streakCount > 0 && stats.streakCount % 7 === 0 ? 7 : 0));
                            const isToday = day === (stats.streakCount % 7 || (stats.streakCount > 0 ? 7 : 1));
                            const isMilestone = day === 7;
                            return (
                                <div
                                    key={day}
                                    className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${isMilestone ? 'w-8 h-8' : 'w-7 h-7'
                                        } ${isCompleted
                                            ? isMilestone
                                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-amber-500/40'
                                                : 'bg-gradient-to-br from-orange-400 to-rose-500'
                                            : 'bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20'
                                        } ${isToday && !isCompleted ? 'ring-2 ring-orange-400 ring-offset-1 dark:ring-offset-gray-950' : ''}`}
                                    title={isMilestone ? '🎁 Day 7: Free AI Interview Credit!' : `Day ${day}`}
                                >
                                    {isMilestone ? (
                                        <Star className={`w-3.5 h-3.5 ${isCompleted ? 'text-white' : 'text-orange-300 dark:text-orange-500'}`} />
                                    ) : (
                                        <span className={`text-[11px] font-bold ${isCompleted ? 'text-white' : 'text-orange-400 dark:text-orange-500'}`}>
                                            {day}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* XP/Level */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-orange-100 dark:border-orange-500/10 flex-shrink-0">
                        <Zap className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-white">Lvl {stats.level}</p>
                            <div className="flex items-center gap-1">
                                <div className="w-16 h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(stats.xpInCurrentLevel / 500) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-gray-400">{stats.xpToNextLevel} XP</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
