'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileQuestion, Clock, Target, Award, Loader2, ChevronRight,
    CheckCircle2, Trophy, Zap, Star, ArrowRight, BarChart2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

interface TestAttempt {
    id: string; passed: boolean; score: number;
    test: { id: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; skillId: string; title: string; };
}
interface GapAnalysis {
    targetRole: string; matchPercent: number;
    matchedSkills: { required: string[]; preferred: string[] };
    missingSkills: { required: string[]; preferred: string[] };
    userSkills: { id: string; name: string }[];
}
interface SkillTest {
    id: string; title: string; description: string; difficulty: string;
    durationMinutes: number; passingScore: number; questionsCount: number;
    skill: { id: string; name: string; category: string };
    _count: { questions: number; attempts: number };
}
interface Badge {
    id: string; badgeType: string; issuedAt: string;
    skill: { id: string; name: string };
    testAttempt?: { score: number; completedAt: string };
}

const DIFFICULTY = {
    EASY: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-400' },
    MEDIUM: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', dot: 'bg-amber-400' },
    HARD: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', dot: 'bg-rose-400' },
} as const;

const BADGE_GRADIENT: Record<string, string> = {
    EXPERT: 'from-amber-400 to-orange-500',
    ADVANCED: 'from-indigo-500 to-purple-600',
    INTERMEDIATE: 'from-blue-400 to-cyan-500',
    BEGINNER: 'from-emerald-400 to-teal-500',
};

export default function TestsPage() {
    const { user } = useAuthStore();
    const [tests, setTests] = useState<SkillTest[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [attempts, setAttempts] = useState<TestAttempt[]>([]);
    const [gapAnalysis, setGap] = useState<GapAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tests' | 'badges'>('tests');
    const selectedRole = user?.targetJobRole?.title;

    const fetchData = useCallback(async () => {
        try {
            const reqs = [
                authFetch('/validation/tests'),
                authFetch('/validation/badges'),
                authFetch('/validation/attempts'),
            ];
            if (selectedRole) reqs.push(authFetch(`/skills/gap-analysis?targetRole=${encodeURIComponent(selectedRole)}`));
            const [tR, bR, aR, gR] = await Promise.all(reqs);
            if (tR.ok) setTests((await tR.json()).data || []);
            if (bR.ok) setBadges((await bR.json()).data || []);
            if (aR.ok) setAttempts((await aR.json()).data || []);
            if (gR?.ok) setGap((await gR.json()).data);
        } catch { } finally { setLoading(false); }
    }, [user, selectedRole]);

    const getNextLevel = (skillId: string): 'EASY' | 'MEDIUM' | 'HARD' | 'COMPLETED' => {
        const passed = attempts.filter(a => a.test.skillId === skillId && a.passed);
        if (passed.some(a => a.test.difficulty === 'HARD')) return 'COMPLETED';
        if (passed.some(a => a.test.difficulty === 'MEDIUM')) return 'HARD';
        if (passed.some(a => a.test.difficulty === 'EASY')) return 'MEDIUM';
        return 'EASY';
    };

    const allDisplayed = tests.filter(t => {
        if (gapAnalysis) {
            const relevant = new Set([
                ...gapAnalysis.matchedSkills.required,
                ...gapAnalysis.matchedSkills.preferred,
                ...gapAnalysis.missingSkills.required,
                ...gapAnalysis.missingSkills.preferred,
                ...gapAnalysis.userSkills.map(s => s.name),
            ]);
            if (![...relevant].some(s => s.toLowerCase() === t.skill.name.toLowerCase())) return false;
        }
        return t.difficulty === getNextLevel(t.skill.id);
    });

    const missingSet = new Set([
        ...(gapAnalysis?.missingSkills?.required || []).map(s => s.toLowerCase()),
        ...(gapAnalysis?.missingSkills?.preferred || []).map(s => s.toLowerCase()),
    ]);
    const recommendedTests = allDisplayed.filter(t => missingSet.has(t.skill.name.toLowerCase()));
    const otherTests = allDisplayed.filter(t => !missingSet.has(t.skill.name.toLowerCase()));

    useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

    // ── Test Card ──
    const TestCard = ({ test, isRecommended = false }: { test: SkillTest; isRecommended?: boolean }) => {
        const diff = DIFFICULTY[test.difficulty as keyof typeof DIFFICULTY] || DIFFICULTY.EASY;
        return (
            <Link href={`/dashboard/test/${test.id}`}
                className="group relative flex flex-col p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/20 shadow-sm hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] transition-all duration-200 overflow-hidden"
            >
                {/* Recommended ribbon */}
                {isRecommended && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl">
                        Recommended
                    </div>
                )}
                {/* Subtle bg glow on hover */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-purple-50/0 group-hover:from-indigo-50/40 group-hover:to-purple-50/20 dark:group-hover:from-indigo-500/5 dark:group-hover:to-purple-500/5 transition-all duration-300 rounded-2xl" />

                {/* Top row */}
                <div className="relative flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                        <FileQuestion className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${diff.bg} ${diff.border} ${diff.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                        {test.difficulty}
                    </span>
                </div>

                {/* Content */}
                <div className="relative flex-1">
                    <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {test.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{test.description}</p>

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{test.durationMinutes} min
                        </span>
                        <span className="text-gray-300 dark:text-white/10">•</span>
                        <span className="flex items-center gap-1">
                            <BarChart2 className="w-3.5 h-3.5" />{test._count.questions} questions
                        </span>
                        <span className="text-gray-300 dark:text-white/10">•</span>
                        <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />{test.passingScore}% to pass
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold">
                        {test.skill.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Start Test <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                </div>
            </Link>
        );
    };

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm px-6 py-5">
                <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-400/10 blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Skill Validation</p>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Skill Tests</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Take tests to verify your skills and earn badges</p>
                    </div>
                    {selectedRole && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-50 to-indigo-50 dark:from-pink-500/10 dark:to-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 w-fit">
                            <Target className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 max-w-[160px] truncate">{selectedRole}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: FileQuestion, label: 'Available Tests', value: allDisplayed.length, iconBg: 'bg-indigo-50 dark:bg-indigo-500/10', iconColor: 'text-indigo-500', border: 'border-indigo-100 dark:border-indigo-500/20' },
                    { icon: Trophy, label: 'Badges Earned', value: badges.length, iconBg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-500', border: 'border-amber-100 dark:border-amber-500/20' },
                    { icon: Star, label: 'Expert / Advanced', value: badges.filter(b => b.badgeType === 'EXPERT' || b.badgeType === 'ADVANCED').length, iconBg: 'bg-purple-50 dark:bg-purple-500/10', iconColor: 'text-purple-500', border: 'border-purple-100 dark:border-purple-500/20' },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className={`w-12 h-12 rounded-xl ${s.iconBg} border ${s.border} flex items-center justify-center flex-shrink-0`}>
                            <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 w-fit">
                {[
                    { id: 'tests', label: 'Skill Tests', icon: Zap },
                    { id: 'badges', label: `My Badges (${badges.length})`, icon: Trophy },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-[15px] font-semibold transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                            }`}>
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div className="py-16 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-400">Loading tests...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                    >
                        {/* SKILL TESTS TAB */}
                        {activeTab === 'tests' && (
                            <div className="space-y-8">
                                {allDisplayed.length === 0 ? (
                                    <div className="py-16 flex flex-col items-center gap-3 text-center rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                            <FileQuestion className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">No tests available</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Upload a resume or set a target role to see relevant tests</p>
                                    </div>
                                ) : (
                                    <>
                                        {recommendedTests.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center">
                                                        <Target className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recommended for You</h2>
                                                    <span className="text-sm text-gray-400 font-normal">— Skills to Learn</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {recommendedTests.map(t => <TestCard key={t.id} test={t} isRecommended />)}
                                                </div>
                                            </div>
                                        )}
                                        {otherTests.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                                                        <FileQuestion className="w-3.5 h-3.5 text-indigo-500" />
                                                    </div>
                                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Tests</h2>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {otherTests.map(t => <TestCard key={t.id} test={t} />)}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* BADGES TAB */}
                        {activeTab === 'badges' && (
                            badges.length === 0 ? (
                                <div className="py-16 flex flex-col items-center gap-3 text-center rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                        <Trophy className="w-8 h-8 text-amber-400" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">No badges yet</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Complete skill tests to earn badges and get verified</p>
                                    <button onClick={() => setActiveTab('tests')} className="mt-2 flex items-center gap-1.5 text-sm text-indigo-500 font-semibold hover:text-indigo-400">
                                        Browse Tests <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {badges.map((badge, i) => {
                                        const grad = BADGE_GRADIENT[badge.badgeType] || BADGE_GRADIENT.BEGINNER;
                                        return (
                                            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                                className="group flex flex-col items-center p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/20 shadow-sm hover:shadow-[0_8px_24px_rgba(99,102,241,0.1)] transition-all duration-200 text-center"
                                            >
                                                {/* Badge icon */}
                                                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3 shadow-lg shadow-black/10`}>
                                                    <Trophy className="w-8 h-8 text-white" />
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-1">{badge.skill.name}</h4>
                                                <p className={`text-xs font-bold bg-gradient-to-r ${grad} bg-clip-text text-transparent mb-2`}>
                                                    {badge.badgeType}
                                                </p>
                                                {badge.testAttempt && (
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold mb-1">
                                                        {badge.testAttempt.score}% score
                                                    </span>
                                                )}
                                                <p className="text-[11px] text-gray-400 mt-1">
                                                    {new Date(badge.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
