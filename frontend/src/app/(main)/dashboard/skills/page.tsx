'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, TrendingUp, BookOpen, Zap, ChevronRight,
    Loader2, AlertCircle, CheckCircle, CheckCircle2, RefreshCw,
    Award, PlayCircle, Settings, Sparkles, ArrowRight, BarChart2,
    Clock, ExternalLink, Lock
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

interface Skill { id: string; name: string; category: string; demandScore: number; }
interface UserSkill { id: string; skill: Skill; proficiencyLevel: string; isVerified: boolean; }
interface GapAnalysis {
    targetRole: string; matchPercent: number;
    matchedSkills: { required: string[]; preferred: string[] };
    missingSkills: { required: string[]; preferred: string[] };
    userSkills: Skill[];
}
interface Certification { name: string; issuer: string; level: string; url: string; description: string; }
interface TestAttempt {
    id: string; passed: boolean; score: number;
    test: { id: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; skillId: string; title: string; };
}

const PROFICIENCY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    expert: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20' },
    advanced: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
    intermediate: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
    beginner: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
};

const TABS = [
    { id: 'skills', label: 'My Skills', icon: Zap },
    { id: 'gap', label: 'Gap Analysis', icon: Target },
    { id: 'roadmap', label: 'Learning Roadmap', icon: TrendingUp },
    { id: 'certifications', label: 'Certifications', icon: Award },
] as const;

export default function SkillsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const [attempts, setAttempts] = useState<TestAttempt[]>([]);
    const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('skills');
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loadingCerts, setLoadingCerts] = useState(false);

    const selectedRole = user?.targetJobRole?.title || 'Software Developer';

    const fetchUserSkills = useCallback(async () => {
        try {
            const r = await authFetch('/skills/user-skills');
            if (r.ok) setUserSkills((await r.json()).data || []);
        } catch { } finally { setLoading(false); }
    }, [user]);

    const fetchAllSkills = useCallback(async () => {
        try {
            const r = await authFetch('/skills/skills');
            if (r.ok) setAllSkills((await r.json()).data || []);
        } catch { }
    }, [user]);

    const fetchAttempts = useCallback(async () => {
        try {
            const r = await authFetch('/validation/attempts');
            if (r.ok) setAttempts((await r.json()).data || []);
        } catch { }
    }, [user]);

    const getNextTestLevel = (skillId: string): 'EASY' | 'MEDIUM' | 'HARD' | 'COMPLETED' => {
        const passed = attempts.filter(a => a.test.skillId === skillId && a.passed);
        if (passed.some(a => a.test.difficulty === 'HARD')) return 'COMPLETED';
        if (passed.some(a => a.test.difficulty === 'MEDIUM')) return 'HARD';
        if (passed.some(a => a.test.difficulty === 'EASY')) return 'MEDIUM';
        return 'EASY';
    };

    const handleTakeTest = (skillNameOrId: string, _diff?: string, isId = false) => {
        let skillId = skillNameOrId;
        if (!isId) {
            const skill = allSkills.find(s => s.name.toLowerCase() === skillNameOrId.toLowerCase());
            if (!skill) { alert(`Skill "${skillNameOrId}" not found.`); return; }
            skillId = skill.id;
        }
        const next = getNextTestLevel(skillId);
        if (next === 'COMPLETED') { alert('You have already mastered this skill!'); return; }
        router.push(`/dashboard/test/test-${skillId}-${next}`);
    };

    const fetchGapAnalysis = useCallback(async () => {
        setAnalyzing(true);
        try {
            const r = await authFetch(`/skills/gap-analysis?targetRole=${encodeURIComponent(selectedRole)}`);
            if (r.ok) setGapAnalysis((await r.json()).data);
        } catch { } finally { setAnalyzing(false); }
    }, [user, selectedRole]);

    const fetchRoadmap = useCallback(async () => {
        setAnalyzing(true);
        try {
            const r = await authFetch(`/skills/roadmap?targetRole=${encodeURIComponent(selectedRole)}&timeframe=12`);
            if (r.ok) setRoadmap((await r.json()).data);
        } catch { } finally { setAnalyzing(false); }
    }, [user, selectedRole]);

    const fetchCertifications = async () => {
        setLoadingCerts(true);
        try {
            const r = await authFetch(`/skills/certifications?targetRole=${encodeURIComponent(selectedRole)}`);
            if (r.ok) setCertifications((await r.json()).data?.certifications || []);
        } catch { } finally { setLoadingCerts(false); }
    };

    useEffect(() => {
        if (user) { fetchUserSkills(); fetchAllSkills(); fetchAttempts(); }
    }, [user, fetchUserSkills, fetchAllSkills, fetchAttempts]);

    useEffect(() => {
        if (!user) return;
        if (activeTab === 'gap') fetchGapAnalysis();
        else if (activeTab === 'roadmap') fetchRoadmap();
        else if (activeTab === 'certifications') fetchCertifications();
    }, [user, activeTab, selectedRole, fetchGapAnalysis, fetchRoadmap]);

    const getScoreColor = (score: number) =>
        score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500';
    const getScoreBg = (score: number) =>
        score >= 80 ? 'from-emerald-500 to-teal-500' : score >= 60 ? 'from-amber-400 to-orange-500' : 'from-rose-500 to-pink-500';

    const LoadingSpinner = ({ text }: { text: string }) => (
        <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
        </div>
    );

    const EmptyState = ({ icon: Icon, title, desc, cta, ctaHref }: any) => (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-1">
                <Icon className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{desc}</p>
            {cta && ctaHref && (
                <Link href={ctaHref} className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-400 font-medium">
                    {cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-400/10 blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Skill Intelligence</p>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Skills</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Analyze your skills and plan your career growth</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Target Role Badge */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                            <Target className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 max-w-[140px] truncate">{selectedRole}</span>
                        </div>
                        <Link
                            href="/dashboard/settings"
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                            title="Change target role in Settings"
                        >
                            <Settings className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
                        </Link>
                        <button
                            onClick={fetchUserSkills}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-indigo-500 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-[15px] font-semibold transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="tab-indicator"
                                className="absolute inset-0 rounded-lg border border-indigo-100 dark:border-indigo-500/20"
                                style={{ zIndex: -1 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                >

                    {/* MY SKILLS */}
                    {activeTab === 'skills' && (
                        <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                            {/* Card header */}
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-500/20">
                                        <Zap className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Skills</h2>
                                </div>
                                <span className="text-sm font-medium text-gray-400">{userSkills.length} skill{userSkills.length !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="p-6">
                                {loading ? (
                                    <LoadingSpinner text="Loading your skills..." />
                                ) : userSkills.length === 0 ? (
                                    <EmptyState
                                        icon={Zap}
                                        title="No skills yet"
                                        desc="Upload a resume to automatically extract your skills and track your progress."
                                        cta="Go to Resumes"
                                        ctaHref="/dashboard/resumes"
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {userSkills.map((us, i) => {
                                            const prof = PROFICIENCY_CONFIG[us.proficiencyLevel?.toLowerCase()] || PROFICIENCY_CONFIG.beginner;
                                            const nextLevel = getNextTestLevel(us.skill.id);
                                            return (
                                                <motion.div
                                                    key={us.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    className="group flex items-center gap-4 p-5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:bg-white dark:hover:bg-white/5 transition-all duration-200"
                                                >
                                                    <div className={`w-10 h-10 rounded-xl ${prof.bg} border ${prof.border} flex items-center justify-center flex-shrink-0`}>
                                                        <Zap className={`w-5 h-5 ${prof.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">{us.skill.name}</p>
                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${prof.bg} ${prof.border} ${prof.color}`}>
                                                                {us.proficiencyLevel}
                                                            </span>
                                                            {us.isVerified ? (
                                                                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                                                </span>
                                                            ) : nextLevel === 'COMPLETED' ? (
                                                                <span className="flex items-center gap-1 text-[11px] text-purple-500 font-medium">
                                                                    <Award className="w-3 h-3" /> Mastered
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleTakeTest(us.skill.id, undefined, true)}
                                                                    className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 transition-colors"
                                                                >
                                                                    <PlayCircle className="w-3 h-3" />
                                                                    Take {nextLevel} Test
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* GAP ANALYSIS */}
                    {activeTab === 'gap' && (
                        <div className="space-y-5">
                            {analyzing ? (
                                <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <LoadingSpinner text="Analyzing your skill gaps..." />
                                </div>
                            ) : gapAnalysis ? (
                                <>
                                    {/* Match Score Hero */}
                                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm p-6 text-center">
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/5 dark:to-purple-500/5" />
                                        <p className="relative text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Match Score</p>
                                        <div className="relative inline-flex items-baseline gap-1">
                                            <span className={`text-6xl font-black ${getScoreColor(gapAnalysis.matchPercent)}`}>
                                                {gapAnalysis.matchPercent}
                                            </span>
                                            <span className={`text-2xl font-bold ${getScoreColor(gapAnalysis.matchPercent)}`}>%</span>
                                        </div>
                                        <div className="relative mt-3 max-w-xs mx-auto h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${gapAnalysis.matchPercent}%` }}
                                                transition={{ delay: 0.2, duration: 0.8 }}
                                                className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(gapAnalysis.matchPercent)}`}
                                            />
                                        </div>
                                        <p className="relative text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            match for <span className="font-semibold text-gray-700 dark:text-gray-200">{gapAnalysis.targetRole}</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Skills You Have */}
                                        <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Skills You Have</h3>
                                            </div>
                                            <div className="p-5 flex flex-wrap gap-2">
                                                {gapAnalysis.userSkills.length === 0 ? (
                                                    <p className="text-sm text-gray-400">No skills added yet</p>
                                                ) : gapAnalysis.userSkills.map((skill, i) => {
                                                    const isRequired = gapAnalysis.matchedSkills.required.includes(skill.name);
                                                    const isPreferred = gapAnalysis.matchedSkills.preferred.includes(skill.name);
                                                    const cls = isRequired
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                        : isPreferred
                                                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                                            : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10';
                                                    return (
                                                        <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
                                                            {skill.name}
                                                        </span>
                                                    );
                                                })}
                                                {/* Legend */}
                                                <div className="w-full pt-2 flex flex-wrap gap-3 mt-1 border-t border-gray-100 dark:border-white/5">
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Required match</span>
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Preferred match</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Skills to Learn */}
                                        <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Skills to Learn</h3>
                                            </div>
                                            <div className="p-5 flex flex-wrap gap-2">
                                                {gapAnalysis.missingSkills.required.length === 0 && gapAnalysis.missingSkills.preferred.length === 0 ? (
                                                    <p className="text-sm text-emerald-500 font-medium">🎉 You have all required skills!</p>
                                                ) : (
                                                    <>
                                                        {gapAnalysis.missingSkills.required.map((skill, i) => (
                                                            <div key={i} className="group flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-xs font-medium">
                                                                <span>{skill}</span>
                                                                <span className="text-[10px] opacity-60">(Required)</span>
                                                                <button onClick={() => handleTakeTest(skill)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500" title="Take Assessment">
                                                                    <PlayCircle className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {gapAnalysis.missingSkills.preferred.map((skill, i) => (
                                                            <div key={i} className="group flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-xs font-medium">
                                                                <span>{skill}</span>
                                                                <button onClick={() => handleTakeTest(skill)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Take Assessment">
                                                                    <PlayCircle className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <EmptyState icon={Target} title="No gap analysis yet" desc="Select a target role in Settings to see your skill gaps." cta="Go to Settings" ctaHref="/dashboard/settings" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* LEARNING ROADMAP */}
                    {activeTab === 'roadmap' && (
                        <div className="space-y-5">
                            {analyzing ? (
                                <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <LoadingSpinner text="Generating your roadmap..." />
                                </div>
                            ) : roadmap?.roadmap?.length > 0 ? (
                                <>
                                    {/* Stats row */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Duration', value: roadmap.duration, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', icon: Clock },
                                            { label: 'Total Hours', value: `${roadmap.totalHours}h`, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: BookOpen },
                                            { label: 'Readiness', value: `${roadmap.readinessScore}%`, color: getScoreColor(roadmap.readinessScore), bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: BarChart2 },
                                        ].map((s) => (
                                            <div key={s.label} className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm p-4 flex flex-col items-center gap-1 text-center">
                                                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-1`}>
                                                    <s.icon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: '18px', height: '18px' }} />
                                                </div>
                                                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                                <p className="text-xs text-gray-400">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Week cards */}
                                    <div className="space-y-3">
                                        {roadmap.roadmap.map((week: any, index: number) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden"
                                            >
                                                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                                        {week.week}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{week.focus}</h3>
                                                        <p className="text-xs text-gray-400">{week.estimatedHours} hours</p>
                                                    </div>
                                                </div>
                                                <div className="p-5 space-y-3">
                                                    {/* Skill tags */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {week.skills.map((skill: string, i: number) => (
                                                            <span key={i} className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-xs font-medium">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {/* Tasks */}
                                                    <ul className="space-y-1.5">
                                                        {week.tasks.map((task: string, i: number) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                                <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                                                {task}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {/* Resources */}
                                                    {week.resources?.length > 0 && (
                                                        <div className="pt-3 border-t border-gray-100 dark:border-white/5">
                                                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">📚 Resources</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {week.resources.map((res: any, i: number) => {
                                                                    const palettes: Record<string, string> = {
                                                                        Coursera: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
                                                                        YouTube: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
                                                                        Udemy: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20',
                                                                    };
                                                                    const cls = palettes[res.platform] || 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
                                                                    return (
                                                                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                                                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border hover:scale-105 transition-transform ${cls}`}
                                                                        >
                                                                            {res.platform}: {res.name}
                                                                            <ExternalLink className="w-3 h-3 opacity-70" />
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <EmptyState icon={BookOpen} title="No roadmap available" desc="Add skills to your profile first by uploading a resume." cta="Go to Resumes" ctaHref="/dashboard/resumes" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* CERTIFICATIONS */}
                    {activeTab === 'certifications' && (
                        <div className="space-y-5">
                            <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
                                            <Award className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900 dark:text-white">Recommended Certifications</h2>
                                            <p className="text-xs text-gray-400">for {selectedRole}</p>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                        <Sparkles className="w-3 h-3" /> AI-curated
                                    </span>
                                </div>

                                <div className="p-6">
                                    {loadingCerts ? (
                                        <LoadingSpinner text="Loading certifications..." />
                                    ) : certifications.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {certifications.map((cert, index) => {
                                                const levelConfig: Record<string, string> = {
                                                    Expert: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
                                                    Professional: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
                                                    Associate: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
                                                };
                                                const lvlCls = levelConfig[cert.level] || levelConfig.Associate;
                                                return (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:bg-white dark:hover:bg-white/5 transition-all duration-200"
                                                    >
                                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                            <Award className="w-5 h-5 text-amber-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-1">{cert.name}</h3>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">{cert.issuer}</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${lvlCls}`}>{cert.level}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">{cert.description}</p>
                                                            <a href={cert.url} target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                                                            >
                                                                View Certification <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <EmptyState icon={Award} title="No certifications found" desc="Try selecting a different target role in Settings to see recommendations." cta="Change Role" ctaHref="/dashboard/settings" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
