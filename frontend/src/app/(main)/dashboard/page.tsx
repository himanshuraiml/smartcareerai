'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FileText, Target, Briefcase, TrendingUp, ArrowRight,
    Zap, Award, Flame, Star, Sparkles, Brain
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import CareerRoadmap, { RoadmapStage, DEFAULT_ROADMAP_STAGES } from '@/components/roadmap/CareerRoadmap';
import Leaderboard from '@/components/gamification/Leaderboard';
import PlacementReadyScore from '@/components/gamification/PlacementReadyScore';
import SkillTestSuggestion from '@/components/dashboard/SkillTestSuggestion';
import { authFetch } from '@/lib/auth-fetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface DashboardStats {
    resumeCount: number;
    atsCount: number;
    jobsApplied: number;
    avgScore: number | null;
    interviewCount?: number;
    testsTaken?: number;
    badgesEarned?: number;
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [greeting, setGreeting] = useState('');
    const [stats, setStats] = useState<DashboardStats>({
        resumeCount: 0,
        atsCount: 0,
        jobsApplied: 0,
        avgScore: null,
        interviewCount: 0,
        testsTaken: 0,
        badgesEarned: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!user) return;

        try {

            const [resumeRes, atsRes, appRes, interviewRes, testsRes, badgesRes] = await Promise.all([
                authFetch('/resumes'),
                authFetch('/scores/history'),
                authFetch('/applications/stats'),
                authFetch('/interviews/sessions'),
                authFetch('/validation/attempts').catch(() => ({ ok: false, json: async () => ({ data: [] }) } as any)),
                authFetch('/validation/badges').catch(() => ({ ok: false, json: async () => ({ data: [] }) } as any)),
            ]);

            const resumeData = resumeRes.ok ? await resumeRes.json() : { data: [] };
            const atsData = atsRes.ok ? await atsRes.json() : { data: [] };
            const appData = appRes.ok ? await appRes.json() : { data: { applied: 0 } };
            const interviewData = interviewRes.ok ? await interviewRes.json() : { data: [] };
            const testsData = testsRes.ok ? await testsRes.json() : { data: [] };
            const badgesData = badgesRes.ok ? await badgesRes.json() : { data: [] };

            const scores = atsData.data || [];
            const avgScore = scores.length > 0
                ? Math.round(scores.reduce((sum: number, s: any) => sum + s.overallScore, 0) / scores.length)
                : null;

            setStats({
                resumeCount: resumeData.data?.length || 0,
                atsCount: scores.length,
                jobsApplied: appData.data?.applied || 0,
                avgScore,
                interviewCount: interviewData.data?.length || 0,
                testsTaken: testsData.data?.length || 0,
                badgesEarned: badgesData.data?.length || 0
            });
        } catch (err) {
            // Failed to fetch stats - using default values
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        fetchStats();
    }, [fetchStats]);

    // Calculate roadmap stages based on user progress
    const roadmapStages: RoadmapStage[] = useMemo(() => {
        const hasResume = stats.resumeCount > 0;
        const hasGoodScore = stats.avgScore && stats.avgScore >= 70;
        const testCount = stats.testsTaken || 0;
        const interviewCount = stats.interviewCount || 0;
        const applicationCount = stats.jobsApplied || 0;

        const hasTests = testCount >= 1; // At least one test taken to unlock interviews
        const hasInterviews = interviewCount >= 1; // At least one interview to unlock jobs
        const hasApplied = applicationCount >= 1;

        return DEFAULT_ROADMAP_STAGES.map((stage) => {
            let status: RoadmapStage['status'] = 'locked';
            let progress = 0;

            // Stage 1: Resume Score
            if (stage.id === 'profile') {
                if (hasResume && hasGoodScore) {
                    status = 'completed';
                    progress = 100;
                } else if (hasResume) {
                    status = 'current';
                    // If resume uploaded, at least 50% progress. Then based on score.
                    progress = Math.max(50, stats.avgScore || 0);
                } else {
                    status = 'current';
                    progress = 0;
                }
            }
            // Stage 2: Skill Analysis (skills-gap)
            else if (stage.id === 'skills-gap') {
                if (hasResume) {
                    if (hasTests) {
                        status = 'completed';
                        progress = 100;
                    } else if (status === 'locked') {
                        // Previous stage is mostly done (resume uploaded)
                        status = hasGoodScore ? 'available' : 'locked';
                        if (hasResume && !hasGoodScore) status = 'current'; // Keep them in Profile
                        // Actually, strict roadmap:
                        if (status === 'available' && !hasTests) {
                            status = 'current';
                            progress = 0;
                        }
                    }
                }
                // Correction: If Profile is NOT completed, this should remain locked or dependent
                // But let's follow the existing flexible flow
                if (hasResume) {
                    // If they have resume, they can analyze skills.
                    status = hasTests ? 'completed' : 'current';
                    progress = hasTests ? 100 : 50; // 50% just for being here
                } else {
                    status = 'locked';
                }
            }
            // Stage 3: Skill Lab (skills-tests)
            else if (stage.id === 'skills-tests') {
                if (hasResume) {
                    if (testCount >= 3) {
                        status = 'completed';
                        progress = 100;
                    } else {
                        status = (testCount > 0) ? 'current' : 'available';
                        // If they are strictly working on this:
                        if (status === 'available') status = 'current';

                        // Target: 3 tests
                        progress = Math.min(100, Math.round((testCount / 3) * 100));
                    }
                } else {
                    status = 'locked';
                }
            }
            // Stage 4: Interview Arena (interviews)
            else if (stage.id === 'interviews') {
                if (testCount >= 1) {
                    if (interviewCount >= 3) {
                        status = 'completed';
                        progress = 100;
                    } else {
                        status = 'current';
                        // Target: 3 interviews
                        progress = Math.min(100, Math.round((interviewCount / 3) * 100));
                    }
                } else {
                    status = 'locked';
                }
            }
            // Stage 5: Job Board (jobs)
            else if (stage.id === 'jobs') {
                if (interviewCount >= 1 && testCount >= 1) {
                    if (applicationCount >= 5) {
                        status = 'completed';
                        progress = 100;
                    } else {
                        status = 'current';
                        // Target: 5 applications
                        progress = Math.min(100, Math.round((applicationCount / 5) * 100));
                    }
                } else {
                    status = 'locked';
                }
            }
            // Stage 6: Offer Hub (growth)
            else if (stage.id === 'growth') {
                if (applicationCount >= 1) {
                    status = 'available';
                    progress = 0;
                }
            }

            return { ...stage, status, progress };
        });
    }, [stats]);

    // Calculate XP/Level (gamification)
    const xp = useMemo(() => {
        return (
            stats.resumeCount * 100 +
            stats.atsCount * 50 +
            (stats.testsTaken || 0) * 75 +
            (stats.interviewCount || 0) * 100 +
            stats.jobsApplied * 25
        );
    }, [stats]);

    // Determine AI Recommendation
    const nextStep = useMemo(() => {
        if (stats.resumeCount === 0) return {
            title: 'Upload Your Resume',
            desc: 'Start your journey by getting an instant ATS score for your CV.',
            href: '/dashboard/resumes',
            icon: FileText,
            color: 'text-blue-400',
            gradient: 'from-blue-500/20 to-cyan-500/20',
            border: 'border-blue-500/30',
            btn: 'bg-blue-500'
        };
        if ((stats.avgScore || 0) < 70) return {
            title: 'Boost Your ATS Score',
            desc: 'Your resume needs optimization to pass recruiter screening tools.',
            href: '/dashboard/resumes',
            icon: TrendingUp,
            color: 'text-orange-400',
            gradient: 'from-orange-500/20 to-red-500/20',
            border: 'border-orange-500/30',
            btn: 'bg-orange-500'
        };
        if ((stats.testsTaken || 0) < 1) return {
            title: 'Verify Your Skills',
            desc: 'Earn your first verified badge to increase profile visibility by 3x.',
            href: '/dashboard/tests',
            icon: Award,
            color: 'text-purple-400',
            gradient: 'from-purple-500/20 to-indigo-500/20',
            border: 'border-purple-500/30',
            btn: 'bg-purple-500'
        };
        if ((stats.interviewCount || 0) < 1) return {
            title: 'Practice Interview',
            desc: 'Build confidence with an AI mock interview before the real deal.',
            href: '/dashboard/interviews',
            icon: Target,
            color: 'text-pink-400',
            gradient: 'from-pink-500/20 to-rose-500/20',
            border: 'border-pink-500/30',
            btn: 'bg-pink-500'
        };
        return {
            title: 'Apply for Jobs',
            desc: 'You are placement-ready! Browse and apply to recommended roles.',
            href: '/dashboard/jobs',
            icon: Briefcase,
            color: 'text-emerald-400',
            gradient: 'from-emerald-500/20 to-green-500/20',
            border: 'border-emerald-500/30',
            btn: 'bg-emerald-500'
        };
    }, [stats]);

    const level = Math.floor(xp / 500) + 1;
    const xpToNextLevel = 500 - (xp % 500);

    return (
        <div className="space-y-8 bg-grid min-h-screen">
            {/* Mission Control Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Explorer'}</span>! 🚀
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Welcome to your Career Mission Control
                        </p>
                    </div>

                    {/* XP Badge */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-4 p-4 rounded-2xl glass-premium"
                    >
                        <div className="xp-badge w-14 h-14 rounded-xl flex items-center justify-center">
                            <Flame className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">Level {level}</span>
                                <Star className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${((500 - xpToNextLevel) / 500) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400">{xpToNextLevel} XP to next</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Placement-Ready Score */}
            <PlacementReadyScore
                avgScore={stats.avgScore}
                badgesEarned={stats.badgesEarned || 0}
                interviewCount={stats.interviewCount || 0}
                jobsApplied={stats.jobsApplied}
                loading={loading}
            />

            {/* Main Content: Roadmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Career Roadmap (Main) */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-indigo-400" />
                            Your Career Journey
                        </h2>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                            Recommended Path
                        </span>
                    </div>
                    <CareerRoadmap stages={roadmapStages} />
                </div>

                {/* Side Panel: Tips & Quick Actions */}
                <div className="space-y-6">
                    {/* Pro Tip Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-6 rounded-2xl glass-premium border-gradient animate-float"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Pro Tip</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Complete each stage sequentially to maximize your career readiness score.
                            Verified skill badges increase your profile visibility by <span className="text-green-400 font-bold">3x</span>!
                        </p>
                    </motion.div>

                    {/* AI Recommended Action - Replaces Quick Actions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                Recommended Next Step
                            </h3>
                            <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI
                            </div>
                        </div>

                        <Link href={nextStep.href} className="block group">
                            <div className={`p-1 rounded-2xl bg-gradient-to-br ${nextStep.gradient} ${nextStep.border} border transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg`}>
                                <div className="bg-gray-900/40 backdrop-blur-xl rounded-xl p-5 h-full relative overflow-hidden">
                                    <div className="flex items-start gap-4 z-10 relative">
                                        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 ${nextStep.color}`}>
                                            <nextStep.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1 group-hover:text-white transition-colors">
                                                {nextStep.title}
                                            </h4>
                                            <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                                {nextStep.desc}
                                            </p>
                                            <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg ${nextStep.btn} text-white`}>
                                                Start Now <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Decorative background icon */}
                                    <nextStep.icon className={`absolute -bottom-4 -right-4 w-24 h-24 ${nextStep.color} opacity-5 transform -rotate-12 group-hover:scale-110 transition-transform duration-500`} />
                                </div>
                            </div>
                        </Link>

                        {/* Daily Motivation Component */}
                        <div className="hover:scale-[1.01] transition-transform duration-300">
                            <SkillTestSuggestion />
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <Leaderboard currentUserXp={xp} />
                </div>
            </div>
        </div>
    );
}




