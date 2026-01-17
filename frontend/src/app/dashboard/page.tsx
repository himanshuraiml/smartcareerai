'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FileText, Target, Briefcase, TrendingUp, ArrowRight,
    Zap, Award, Flame, Star
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import CareerRoadmap, { RoadmapStage, DEFAULT_ROADMAP_STAGES } from '@/components/roadmap/CareerRoadmap';
import Leaderboard from '@/components/gamification/Leaderboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface DashboardStats {
    resumeCount: number;
    atsCount: number;
    jobsApplied: number;
    avgScore: number | null;
    interviewCount?: number;
    testsTaken?: number;
}

export default function DashboardPage() {
    const { user, accessToken } = useAuthStore();
    const [greeting, setGreeting] = useState('');
    const [stats, setStats] = useState<DashboardStats>({
        resumeCount: 0,
        atsCount: 0,
        jobsApplied: 0,
        avgScore: null,
        interviewCount: 0,
        testsTaken: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!accessToken) return;

        try {
            const headers = { 'Authorization': `Bearer ${accessToken}` };

            const [resumeRes, atsRes, appRes, interviewRes, testsRes] = await Promise.all([
                fetch(`${API_URL}/resumes`, { headers }),
                fetch(`${API_URL}/scores/history`, { headers }),
                fetch(`${API_URL}/applications/stats`, { headers }),
                fetch(`${API_URL}/interviews/sessions`, { headers }),
                fetch(`${API_URL}/validation/attempts`, { headers }).catch(() => ({ ok: false, json: async () => ({ data: [] }) })),
            ]);

            const resumeData = resumeRes.ok ? await resumeRes.json() : { data: [] };
            const atsData = atsRes.ok ? await atsRes.json() : { data: [] };
            const appData = appRes.ok ? await appRes.json() : { data: { applied: 0 } };
            const interviewData = interviewRes.ok ? await interviewRes.json() : { data: [] };
            // @ts-ignore
            const testsData = testsRes.ok ? await testsRes.json() : { data: [] };

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
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

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

            // Stage 1: Profile DNA
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
            // Stage 3: Skill Synchronization (skills-tests)
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
            // Stage 4: Simulation Training (interviews)
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
            // Stage 5: Career Launchpad (jobs)
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
            // Stage 6: Career Ascension (growth)
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

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: FileText, value: stats.resumeCount, label: 'Resumes', color: 'purple' },
                    { icon: Target, value: stats.avgScore ? `${stats.avgScore}%` : '--', label: 'ATS Score', color: 'blue' },
                    { icon: Award, value: stats.testsTaken || 0, label: 'Badges', color: 'amber' },
                    { icon: Briefcase, value: stats.jobsApplied, label: 'Applications', color: 'green' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="p-4 rounded-xl glass-card"
                    >
                        <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                            <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                        </div>
                        <p className="text-2xl font-bold text-white">{loading ? '...' : stat.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content: Roadmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Career Roadmap (Main) */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-purple-400" />
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
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Pro Tip</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Complete each stage sequentially to maximize your career readiness score.
                            Verified skill badges increase your profile visibility by <span className="text-green-400 font-bold">3x</span>!
                        </p>
                    </motion.div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Quick Actions</h3>
                        {[
                            { label: 'Upload Resume', href: '/dashboard/resumes', icon: FileText },
                            { label: 'Take Skill Test', href: '/dashboard/tests', icon: Award },
                            { label: 'Practice Interview', href: '/dashboard/interviews', icon: Target },
                            { label: 'Browse Jobs', href: '/dashboard/jobs', icon: Briefcase },
                        ].map((action) => (
                            <Link
                                key={action.label}
                                href={action.href}
                                className="flex items-center justify-between p-4 rounded-xl glass-card group"
                            >
                                <div className="flex items-center gap-3">
                                    <action.icon className="w-5 h-5 text-gray-400" />
                                    <span className="text-white font-medium">{action.label}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>

                    {/* Leaderboard */}
                    <Leaderboard currentUserXp={xp} />
                </div>
            </div>
        </div>
    );
}

