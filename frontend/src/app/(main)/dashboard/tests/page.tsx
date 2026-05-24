'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Target, Loader2, CheckCircle2, Trophy, Zap, Star,
    ArrowRight, Lock, Sparkles, Play, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import AIDisclaimer from '@/components/ui/AIDisclaimer';

// ─── Interfaces ──────────────────────────────────────────────────────────────

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
interface SkillProgression {
    skill: { id: string; name: string; category: string };
    byDifficulty: Partial<Record<DifficultyLevel, SkillTest>>;
    nextLevel: DifficultyLevel | 'COMPLETED';
    completedLevels: Set<string>;
    currentTest?: SkillTest;
    isMissing: boolean;
}

// ─── Constants & helpers ──────────────────────────────────────────────────────

type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
const LEVELS: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];

const BADGE_CONFIG: Record<string, { gradient: string; glow: string; emoji: string }> = {
    EXPERT:       { gradient: 'from-amber-400 via-orange-400 to-red-500',   glow: 'shadow-amber-500/30',   emoji: '⚡' },
    ADVANCED:     { gradient: 'from-violet-500 via-purple-500 to-indigo-600', glow: 'shadow-purple-500/30', emoji: '🚀' },
    INTERMEDIATE: { gradient: 'from-blue-400 via-cyan-400 to-teal-500',     glow: 'shadow-blue-500/30',    emoji: '⭐' },
    BEGINNER:     { gradient: 'from-emerald-400 via-teal-400 to-cyan-500',  glow: 'shadow-emerald-500/30', emoji: '✦' },
};

const DIFF_CTA: Record<DifficultyLevel, string> = {
    EASY:   'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
    MEDIUM: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20',
    HARD:   'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
};

const DIFF_TO_BADGE: Record<DifficultyLevel, string> = {
    EASY: 'BEGINNER', MEDIUM: 'INTERMEDIATE', HARD: 'ADVANCED',
};

const SKILL_COLORS = [
    { bg: 'bg-blue-50 dark:bg-blue-500/10',   border: 'border-blue-100 dark:border-blue-500/20',   text: 'text-blue-700 dark:text-blue-400' },
    { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-100 dark:border-violet-500/20', text: 'text-violet-700 dark:text-violet-400' },
    { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
    { bg: 'bg-amber-50 dark:bg-amber-500/10',  border: 'border-amber-100 dark:border-amber-500/20',  text: 'text-amber-700 dark:text-amber-400' },
    { bg: 'bg-rose-50 dark:bg-rose-500/10',    border: 'border-rose-100 dark:border-rose-500/20',    text: 'text-rose-700 dark:text-rose-400' },
    { bg: 'bg-cyan-50 dark:bg-cyan-500/10',    border: 'border-cyan-100 dark:border-cyan-500/20',    text: 'text-cyan-700 dark:text-cyan-400' },
];

function getSkillStyle(name: string) {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xff;
    return SKILL_COLORS[h % SKILL_COLORS.length];
}

function getSkillAbbr(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('react')) return '⚛';
    if (n.includes('typescript')) return 'TS';
    if (n.includes('javascript')) return 'JS';
    if (n.includes('node')) return 'N';
    if (n.includes('python')) return 'Py';
    if (n.includes('css')) return 'CSS';
    if (n.includes('html')) return 'HTML';
    if (n.includes('vue')) return 'Vue';
    if (n.includes('angular')) return 'Ng';
    if (n.includes('sql') || n.includes('postgres') || n.includes('mysql')) return 'SQL';
    if (n.includes('mongo')) return 'Mg';
    if (n.includes('docker')) return '🐳';
    if (n.includes('aws')) return 'AWS';
    if (n.includes('azure')) return 'Az';
    if (n.includes('swift')) return 'Sw';
    if (n.includes('kotlin')) return 'Kt';
    if (n.includes('rust')) return 'Rs';
    if (n.includes('java') && !n.includes('javascript')) return 'Jv';
    return name.split(' ').map(w => w[0] || '').join('').slice(0, 3).toUpperCase() || '?';
}

// ─── Skill track row ──────────────────────────────────────────────────────────

function SkillTrackRow({ sp }: { sp: SkillProgression }) {
    const { skill, nextLevel, completedLevels, currentTest, isMissing } = sp;
    const style = getSkillStyle(skill.name);
    const abbr  = getSkillAbbr(skill.name);
    const isCompleted = nextLevel === 'COMPLETED';

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/[0.015] transition-colors">

            {/* Skill identity */}
            <div className="flex items-center gap-3 sm:w-44 flex-shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-black flex-shrink-0 border ${style.bg} ${style.border} ${style.text}`}>
                    {abbr}
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{skill.name}</p>
                        {isMissing && (
                            <span className="px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 text-[9px] font-black uppercase tracking-wide">
                                Gap
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">{skill.category}</p>
                </div>
            </div>

            {/* Progression track */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
                {/* Circles + connector lines */}
                <div className="flex items-center">
                    {LEVELS.map((level, i) => {
                        const isDone   = completedLevels.has(level);
                        const isActive = nextLevel === level;
                        const isLocked = !isDone && !isActive;
                        return (
                            <React.Fragment key={level}>
                                {/* Node */}
                                {isDone && (
                                    <div
                                        className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                                        style={{ boxShadow: '0 2px 8px rgba(16,185,129,0.30)' }}
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                                    </div>
                                )}
                                {isActive && (
                                    <div className="relative flex-shrink-0">
                                        <motion.div
                                            className={`absolute inset-0 rounded-full ${level === 'HARD' ? 'bg-rose-400/25' : 'bg-blue-400/25'}`}
                                            animate={{ scale: [0.85, 1.75], opacity: [0.55, 0] }}
                                            transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
                                        />
                                        <div
                                            className={`relative w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-md ${level === 'HARD' ? 'bg-rose-600' : 'bg-blue-600'}`}
                                            style={{ boxShadow: level === 'HARD' ? '0 4px 12px rgba(225,29,72,0.30)' : '0 4px 12px rgba(37,99,235,0.35)' }}
                                        >
                                            <Play className="w-3.5 h-3.5 text-white fill-white" />
                                        </div>
                                    </div>
                                )}
                                {isLocked && (
                                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-3 h-3 text-gray-300 dark:text-white/20" />
                                    </div>
                                )}
                                {/* Connector line (not after last node) */}
                                {i < 2 && (
                                    <div className={`h-0.5 flex-1 ${isDone ? 'bg-emerald-300 dark:bg-emerald-500/40' : 'bg-gray-200 dark:bg-white/8'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Labels */}
                <div className="flex items-center">
                    {LEVELS.map((level, i) => {
                        const isDone   = completedLevels.has(level);
                        const isActive = nextLevel === level;
                        const cls = isDone
                            ? 'text-emerald-500'
                            : isActive
                                ? level === 'HARD' ? 'text-rose-500' : 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-300 dark:text-white/20';
                        const label = level === 'EASY' ? 'Easy' : level === 'MEDIUM' ? 'Med' : 'Hard';
                        return (
                            <React.Fragment key={level}>
                                <span className={`w-8 text-center text-[10px] font-bold uppercase tracking-wide ${cls}`}>{label}</span>
                                {i < 2 && <div className="flex-1" />}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
                {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={3} /> Mastered
                    </span>
                ) : currentTest ? (
                    <Link
                        href={`/dashboard/test/${currentTest.id}`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-md ${DIFF_CTA[nextLevel as DifficultyLevel]}`}
                    >
                        Take {nextLevel.charAt(0) + nextLevel.slice(1).toLowerCase()}
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestsPage() {
    const { user } = useAuthStore();
    const [tests, setTests]     = useState<SkillTest[]>([]);
    const [badges, setBadges]   = useState<Badge[]>([]);
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

    useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

    const getNextLevel = useCallback((skillId: string): DifficultyLevel | 'COMPLETED' => {
        const passed = attempts.filter(a => a.test.skillId === skillId && a.passed);
        if (passed.some(a => a.test.difficulty === 'HARD'))   return 'COMPLETED';
        if (passed.some(a => a.test.difficulty === 'MEDIUM')) return 'HARD';
        if (passed.some(a => a.test.difficulty === 'EASY'))   return 'MEDIUM';
        return 'EASY';
    }, [attempts]);

    // ── Derived data ──────────────────────────────────────────────────────────

    const missingSkillNames = new Set([
        ...(gapAnalysis?.missingSkills.required  || []),
        ...(gapAnalysis?.missingSkills.preferred || []),
    ].map(s => s.toLowerCase()));

    const relevantSkillNames: Set<string> | null = gapAnalysis ? new Set([
        ...gapAnalysis.matchedSkills.required,
        ...gapAnalysis.matchedSkills.preferred,
        ...gapAnalysis.missingSkills.required,
        ...gapAnalysis.missingSkills.preferred,
        ...gapAnalysis.userSkills.map(s => s.name),
    ].map(s => s.toLowerCase())) : null;

    // Group ALL tests by skill (one entry per skill, keyed by difficulty)
    const skillsMap = new Map<string, { skill: SkillTest['skill']; byDifficulty: Partial<Record<DifficultyLevel, SkillTest>> }>();
    tests.forEach(t => {
        if (relevantSkillNames && !relevantSkillNames.has(t.skill.name.toLowerCase())) return;
        if (!skillsMap.has(t.skill.id)) skillsMap.set(t.skill.id, { skill: t.skill, byDifficulty: {} });
        skillsMap.get(t.skill.id)!.byDifficulty[t.difficulty as DifficultyLevel] = t;
    });

    const skillProgressions: SkillProgression[] = Array.from(skillsMap.values()).map(({ skill, byDifficulty }) => {
        const nextLevel      = getNextLevel(skill.id);
        const passedForSkill = attempts.filter(a => a.test.skillId === skill.id && a.passed);
        const completedLevels = new Set(passedForSkill.map(a => a.test.difficulty));
        const currentTest     = nextLevel !== 'COMPLETED' ? byDifficulty[nextLevel] : undefined;
        return { skill, byDifficulty, nextLevel, completedLevels, currentTest, isMissing: missingSkillNames.has(skill.name.toLowerCase()) };
    });

    // Featured test = first recommended (gap-fill) skill that has a test ready
    const featuredTest: SkillTest | null = selectedRole
        ? (skillProgressions.find(sp => sp.isMissing && sp.currentTest)?.currentTest ?? null)
        : null;

    // Donut ring
    const validatedCount  = skillProgressions.filter(sp => sp.completedLevels.size > 0).length;
    const totalSkillCount = skillProgressions.length || 1;
    const ringRadius      = 38;
    const ringCirc        = 2 * Math.PI * ringRadius;
    const ringDash        = ringCirc * (validatedCount / totalSkillCount);

    // Locked badges (next badge the user can earn per skill)
    const earnedBadgeKeys = new Set(badges.map(b => `${b.skill.id}::${b.badgeType}`));
    const lockedBadges = skillProgressions
        .filter(sp => sp.nextLevel !== 'COMPLETED')
        .map(sp => {
            const badgeType = DIFF_TO_BADGE[sp.nextLevel as DifficultyLevel];
            if (!badgeType || earnedBadgeKeys.has(`${sp.skill.id}::${badgeType}`)) return null;
            return {
                skill: sp.skill,
                badgeType,
                requirement: `Pass ${sp.nextLevel.charAt(0) + sp.nextLevel.slice(1).toLowerCase()} test first`,
            };
        })
        .filter((b): b is NonNullable<typeof b> => b !== null);

    const advancedCount = badges.filter(b => b.badgeType === 'EXPERT' || b.badgeType === 'ADVANCED').length;

    // ── Loading ───────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Loading your tests...</p>
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">

            {/* ═══ 1. HEADER ═══ */}
            <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                <div className="px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">

                    {/* Left: title + pills + role chip */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.18em] mb-2">Skill Validation</p>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1 leading-tight">Skill Tests</h1>
                        <p className="text-sm text-gray-400 mb-4">Prove what you know. Earn verifiable badges.</p>
                        <AIDisclaimer className="mb-5" />

                        {/* Stat pills */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-[11px] font-bold">
                                <Zap className="w-3 h-3" />
                                {totalSkillCount} Skill{totalSkillCount !== 1 ? 's' : ''} to Test
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
                                <Trophy className="w-3 h-3" />
                                {badges.length} Badge{badges.length !== 1 ? 's' : ''} Earned
                            </span>
                            {advancedCount > 0 && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 text-[11px] font-bold">
                                    <Star className="w-3 h-3" />
                                    {advancedCount} Advanced+
                                </span>
                            )}
                        </div>

                        {/* Target role */}
                        {selectedRole ? (
                            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                <Target className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                <span className="text-[11px] text-indigo-400 font-medium">Target role</span>
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 max-w-[200px] truncate">{selectedRole}</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8">
                                <Target className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-400">Set a target role to see personalized tests</span>
                            </div>
                        )}
                    </div>

                    {/* Right: animated progress ring */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <div className="relative w-28 h-28">
                            <svg viewBox="0 0 100 100" className="w-28 h-28" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="50" cy="50" r={ringRadius} fill="none" stroke="currentColor"
                                    strokeWidth="9" className="text-gray-100 dark:text-white/5" />
                                <motion.circle
                                    cx="50" cy="50" r={ringRadius} fill="none"
                                    stroke="#2563EB" strokeWidth="9" strokeLinecap="round"
                                    strokeDasharray={ringCirc}
                                    initial={{ strokeDashoffset: ringCirc }}
                                    animate={{ strokeDashoffset: ringCirc - ringDash }}
                                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                                    {validatedCount}/{skillProgressions.length || '—'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium mt-0.5">skills</span>
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">skills validated</p>
                    </div>
                </div>
            </div>

            {/* ═══ 2. TABS ═══ */}
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 w-fit">
                {([
                    { id: 'tests',  label: 'Skill Tests', icon: TrendingUp, count: skillProgressions.length },
                    { id: 'badges', label: 'My Badges',   icon: Trophy,     count: badges.length },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                            activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white'
                        }`}
                    >
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        {tab.label}
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ═══ 3. TAB CONTENT ═══ */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                >

                    {/* ── TESTS TAB ── */}
                    {activeTab === 'tests' && (
                        <div className="space-y-5">

                            {/* Featured recommended test — only when target role is set */}
                            {featuredTest && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative bg-white dark:bg-white/[0.02] rounded-2xl shadow-sm overflow-hidden border border-amber-200 dark:border-amber-500/30 border-l-4 border-l-amber-400"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-500/5 pointer-events-none" />
                                    <div className="relative px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                                                    <Sparkles className="w-2.5 h-2.5" /> Next Up For You
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase">
                                                    {featuredTest.difficulty}
                                                </span>
                                                <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8 text-gray-400 text-[10px] font-medium">
                                                    Fills skill gap for {selectedRole}
                                                </span>
                                            </div>

                                            {(() => {
                                                const s = getSkillStyle(featuredTest.skill.name);
                                                return (
                                                    <div className="flex items-center gap-2.5 mb-2">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black flex-shrink-0 border ${s.bg} ${s.border} ${s.text}`}>
                                                            {getSkillAbbr(featuredTest.skill.name)}
                                                        </div>
                                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                                            {featuredTest.skill.name} · {featuredTest.skill.category}
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1.5 leading-snug">{featuredTest.title}</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed line-clamp-2">{featuredTest.description}</p>

                                            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />{featuredTest._count.questions} questions</span>
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{featuredTest.durationMinutes} min</span>
                                                <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" />Pass at {featuredTest.passingScore}%</span>
                                            </div>
                                        </div>

                                        {/* CTA */}
                                        <div className="flex-shrink-0 flex flex-col items-center gap-2 w-full sm:w-auto">
                                            <Link
                                                href={`/dashboard/test/${featuredTest.id}`}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                                                style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)', boxShadow: '0 8px 24px rgba(245,158,11,0.30)' }}
                                            >
                                                Start Test <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <p className="text-[11px] text-gray-400 text-center">
                                                Earns you the {featuredTest.skill.name} {DIFF_TO_BADGE[featuredTest.difficulty as DifficultyLevel] ?? ''} badge
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Skill progression tracks */}
                            {skillProgressions.length === 0 ? (
                                <div className="py-20 flex flex-col items-center gap-4 text-center rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/8 shadow-sm">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                        <Zap className="w-7 h-7 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">No tests yet</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                                            Upload a resume or set a target role to get personalised skill tests
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Your Progression</h2>
                                    </div>
                                    <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                                        {/* Legend */}
                                        <div className="flex items-center gap-5 px-6 py-3 border-b border-gray-50 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.01]">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex-shrink-0" /> Completed
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                                                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 flex-shrink-0" /> Current
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                                                <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 dark:border-white/15 flex-shrink-0" /> Locked
                                            </span>
                                        </div>
                                        {skillProgressions.map((sp, i) => (
                                            <motion.div
                                                key={sp.skill.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                            >
                                                <SkillTrackRow sp={sp} />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── BADGES TAB ── */}
                    {activeTab === 'badges' && (
                        <div className="space-y-8">

                            {/* Earned badges */}
                            {badges.length > 0 ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-4 px-1">
                                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">
                                            Earned Badges · {badges.length}
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {badges.map((badge, i) => {
                                            const cfg = BADGE_CONFIG[badge.badgeType] || BADGE_CONFIG.BEGINNER;
                                            return (
                                                <motion.div
                                                    key={badge.id}
                                                    initial={{ opacity: 0, scale: 0.92 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 200 }}
                                                    className="group bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm p-5 flex flex-col items-center text-center hover:shadow-xl hover:border-transparent transition-all duration-200"
                                                >
                                                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center mb-4 shadow-lg ${cfg.glow} group-hover:scale-105 transition-transform duration-200`}>
                                                        <span className="text-2xl">{cfg.emoji}</span>
                                                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 flex items-center justify-center shadow-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white mb-0.5">{badge.skill.name}</p>
                                                    <p className={`text-xs font-bold bg-gradient-to-r ${cfg.gradient} bg-clip-text text-transparent mb-2.5`}>
                                                        {badge.badgeType}
                                                    </p>
                                                    {badge.testAttempt && (
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mb-1.5">
                                                            {badge.testAttempt.score}% score
                                                        </span>
                                                    )}
                                                    <p className="text-[11px] text-gray-400">
                                                        {new Date(badge.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-16 flex flex-col items-center gap-4 text-center rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/8 shadow-sm">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                        <Trophy className="w-7 h-7 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">No badges yet</h3>
                                        <p className="text-sm text-gray-400 mt-1">Pass skill tests to earn verified badges</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('tests')}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-md"
                                    >
                                        Take a Test <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Locked badges */}
                            {lockedBadges.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4 px-1">
                                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">
                                            Still to Unlock · {lockedBadges.length} remaining
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {lockedBadges.map((lb, i) => {
                                            const cfg = BADGE_CONFIG[lb.badgeType] || BADGE_CONFIG.BEGINNER;
                                            return (
                                                <motion.div
                                                    key={`${lb.skill.id}-${lb.badgeType}`}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0.45 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    className="bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm p-4 flex flex-col items-center text-center"
                                                    style={{ filter: 'grayscale(1)' }}
                                                >
                                                    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center mb-3 overflow-hidden`}>
                                                        <span className="text-xl">{cfg.emoji}</span>
                                                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
                                                            <Lock className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                    <p className="text-xs font-black text-gray-600 dark:text-gray-400 mb-0.5 truncate w-full">{lb.skill.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 mb-1">{lb.badgeType}</p>
                                                    <p className="text-[10px] text-gray-400 leading-tight">{lb.requirement}</p>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
