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
    sevenDayCalendar?: Array<{
        date: string;
        label: string;
        hasActivity: boolean;
        isPerfect: boolean;
        quizDone: boolean;
        insightDone: boolean;
        sprintDone: boolean;
        isToday: boolean;
    }>;
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
            <div className="relative mb-2">
                {/* XP pill — floats above the banner's top-right corner */}
                <div className="absolute -top-3 right-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700 shadow-md shadow-indigo-500/20 border border-indigo-400/20">
                    <Zap className="w-3.5 h-3.5 text-white" />
                    <span className="text-[12px] font-bold text-white">{stats.xp.toLocaleString()} XP</span>
                    <span className="text-[10px] text-indigo-200 font-medium">· Lv {stats.level}</span>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-gray-900/60 backdrop-blur-md shadow-sm p-4">
                    {/* Subtle warm glow background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-rose-500/5 to-amber-500/5 blur-xl rounded-2xl opacity-60 pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Streak Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/30">
                                <Flame className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-base bg-gradient-to-r from-orange-600 to-rose-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-rose-400">
                                        {stats.streakCount} Day Streak
                                    </span>
                                    {!stats.rewardAvailable && (
                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30">
                                            <CheckCircle className="w-3 h-3" /> Today's reward claimed
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {stats.nextMilestoneDays === 7 ? (
                                        <span>
                                            Start a streak! Log in daily for a free{' '}
                                            <span className="font-semibold text-orange-500 dark:text-orange-400">AI Interview credit</span> on day 7.
                                        </span>
                                    ) : (
                                        <span>
                                            <span className="font-semibold text-orange-500 dark:text-orange-400">{stats.nextMilestoneDays}</span> more day
                                            {stats.nextMilestoneDays !== 1 ? 's' : ''} to earn a free{' '}
                                            <span className="font-semibold text-orange-500 dark:text-orange-400">AI Interview credit</span>!
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* 7-Day Progress Calendar */}
                        <div className="flex items-center gap-2">
                            {stats.sevenDayCalendar ? (
                                stats.sevenDayCalendar.map((dayData) => {
                                    const isCompleted = dayData.hasActivity || (dayData.isToday && !stats.rewardAvailable);
                                    const isPerfect = dayData.isPerfect;
                                    const isToday = dayData.isToday;

                                    return (
                                        <div
                                            key={dayData.date}
                                            className="flex flex-col items-center gap-1.5"
                                            title={`${dayData.label}: ${
                                                isPerfect ? 'Perfect Day achieved! ✨' : isCompleted ? 'Active!' : 'Incomplete'
                                            }`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                isToday 
                                                    ? 'text-orange-500 dark:text-orange-400' 
                                                    : isCompleted 
                                                    ? 'text-slate-700 dark:text-slate-300' 
                                                    : 'text-slate-400 dark:text-slate-600'
                                            }`}>
                                                {dayData.label}
                                            </span>
                                            
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                isPerfect
                                                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md shadow-yellow-500/25 scale-105'
                                                    : isCompleted
                                                    ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/30'
                                                    : isToday
                                                    ? 'bg-orange-50/50 dark:bg-orange-500/10 border-2 border-orange-500 dark:border-orange-400 animate-pulse'
                                                    : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5'
                                            }`}>
                                                {isPerfect ? (
                                                    <Star className="w-4 h-4 fill-white text-white" />
                                                ) : isCompleted ? (
                                                    <Flame className="w-4 h-4 fill-white text-white" />
                                                ) : isToday ? (
                                                    <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                                                ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                streakDays.map((day) => {
                                    const isCompleted = day <= (stats.streakCount % 7 || (stats.streakCount > 0 && stats.streakCount % 7 === 0 ? 7 : 0));
                                    const isToday = day === (stats.streakCount % 7 || (stats.streakCount > 0 ? 7 : 1));
                                    const isMilestone = day === 7;
                                    return (
                                        <div
                                            key={day}
                                            className="flex flex-col items-center gap-1.5"
                                            title={isMilestone ? '🎁 Day 7: Free AI Interview Credit!' : `Day ${day}`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                isToday 
                                                    ? 'text-orange-500 dark:text-orange-400' 
                                                    : isCompleted 
                                                    ? 'text-slate-700 dark:text-slate-300' 
                                                    : 'text-slate-400 dark:text-slate-600'
                                            }`}>
                                                D{day}
                                            </span>
                                            
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                isCompleted
                                                    ? isMilestone
                                                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md shadow-yellow-500/25 scale-105'
                                                        : 'bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/30'
                                                    : isToday
                                                    ? 'bg-orange-50/50 dark:bg-orange-500/10 border-2 border-orange-500 dark:border-orange-400 animate-pulse'
                                                    : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5'
                                            }`}>
                                                {isMilestone ? (
                                                    <Star className={`w-4 h-4 ${isCompleted ? 'fill-white text-white' : 'text-orange-300 dark:text-orange-500'}`} />
                                                ) : isCompleted ? (
                                                    <Flame className="w-4 h-4 fill-white text-white" />
                                                ) : isToday ? (
                                                    <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                                                ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
