'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Target, ArrowRight, TrendingUp } from 'lucide-react';

export interface ATSScoreData {
    overallScore: number;
    keywordMatchPercent: number;
    formattingScore: number;
    experienceScore: number;
    educationScore: number;
    jobRole?: string;
}

interface ATSActivityRingsProps {
    score: ATSScoreData | null;
    loading?: boolean;
}

// Ring definitions – ordered outermost → innermost
const RING_DEFS = [
    {
        key: 'keywordMatchPercent' as keyof ATSScoreData,
        label: 'Keywords',
        shortLabel: 'KW',
        r: 80,
        strokeWidth: 12,
        // Magenta / pink – matches "MOVE" ring
        trackColor: 'rgba(255,45,85,0.15)',
        gradientId: 'atsGradKW',
        gradientFrom: '#FF2D55',
        gradientTo: '#FF6B9D',
        glowColor: 'rgba(255,45,85,0.5)',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        description: 'Job keyword coverage',
    },
    {
        key: 'formattingScore' as keyof ATSScoreData,
        label: 'Formatting',
        shortLabel: 'FMT',
        r: 63,
        strokeWidth: 12,
        // Lime-green – matches "EXERCISE" ring
        trackColor: 'rgba(163,230,53,0.12)',
        gradientId: 'atsGradFMT',
        gradientFrom: '#84CC16',
        gradientTo: '#4ADE80',
        glowColor: 'rgba(163,230,53,0.45)',
        textColor: 'text-lime-400',
        bgColor: 'bg-lime-500/10',
        borderColor: 'border-lime-500/20',
        description: 'Structure & ATS-readability',
    },
    {
        key: 'experienceScore' as keyof ATSScoreData,
        label: 'Experience',
        shortLabel: 'EXP',
        r: 46,
        strokeWidth: 12,
        // Cyan / sky – matches "STAND" ring
        trackColor: 'rgba(34,211,238,0.12)',
        gradientId: 'atsGradEXP',
        gradientFrom: '#22D3EE',
        gradientTo: '#38BDF8',
        glowColor: 'rgba(34,211,238,0.45)',
        textColor: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
        description: 'Work history depth',
    },
    {
        key: 'educationScore' as keyof ATSScoreData,
        label: 'Education',
        shortLabel: 'EDU',
        r: 29,
        strokeWidth: 12,
        // Violet / purple – 4th ring
        trackColor: 'rgba(167,139,250,0.12)',
        gradientId: 'atsGradEDU',
        gradientFrom: '#A78BFA',
        gradientTo: '#818CF8',
        glowColor: 'rgba(167,139,250,0.45)',
        textColor: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/20',
        description: 'Qualifications match',
    },
];

function getOverallColor(score: number): string {
    if (score >= 80) return '#4ADE80';
    if (score >= 60) return '#FACC15';
    return '#F87171';
}

function getOverallLabel(score: number): { label: string; color: string } {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400' };
    if (score >= 60) return { label: 'Good', color: 'text-yellow-400' };
    if (score >= 40) return { label: 'Fair', color: 'text-orange-400' };
    return { label: 'Needs Work', color: 'text-red-400' };
}

// Skeleton loading state
function SkeletonRings() {
    return (
        <div className="animate-pulse flex flex-col md:flex-row items-center gap-8 p-6">
            <div className="w-[200px] h-[200px] rounded-full bg-gray-100 dark:bg-white/5 flex-shrink-0" />
            <div className="flex-1 space-y-4 w-full">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/5" />
                        <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/5" />
                        <div className="w-10 h-4 rounded bg-gray-100 dark:bg-white/5" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ATSActivityRings({ score, loading }: ATSActivityRingsProps) {
    const rings = useMemo(() => {
        if (!score) return null;
        return RING_DEFS.map((def) => {
            const pct = Math.min(100, Math.max(0, (score[def.key] as number) || 0));
            const circumference = 2 * Math.PI * def.r;
            const offset = circumference * (1 - pct / 100);
            return { ...def, pct, circumference, offset };
        });
    }, [score]);

    const overallColor = score ? getOverallColor(score.overallScore) : '#6B7280';
    const overallInfo = score ? getOverallLabel(score.overallScore) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-indigo-500/10 shadow-[0_8px_30px_rgba(99,102,241,0.10),0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(99,102,241,0.12),0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden"
        >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-sm shadow-rose-500/20">
                        <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-none">ATS Score Breakdown</h3>
                        {score?.jobRole && (
                            <p className="text-[11px] text-gray-400 mt-0.5">for {score.jobRole}</p>
                        )}
                    </div>
                </div>
                {overallInfo && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 ${overallInfo.color}`}>
                        {overallInfo.label}
                    </span>
                )}
            </div>

            {/* Body */}
            {loading ? (
                <SkeletonRings />
            ) : !score ? (
                /* Empty state */
                <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                    {/* Ghost rings */}
                    <div className="relative w-[200px] h-[200px] flex-shrink-0">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                            {RING_DEFS.map((def) => (
                                <circle
                                    key={def.key}
                                    cx="100" cy="100" r={def.r}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={def.strokeWidth}
                                    strokeDasharray="4 6"
                                    strokeLinecap="round"
                                    className="text-gray-200 dark:text-white/5"
                                />
                            ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-gray-300 dark:text-gray-600">—</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">No score</span>
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <p className="text-gray-900 dark:text-white font-semibold mb-1">No ATS Score Yet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Upload your resume and run an ATS analysis to see your detailed score breakdown across all dimensions.
                        </p>
                        <Link
                            href="/dashboard/resumes"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
                        >
                            Analyze Resume <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            ) : (
                /* Main content */
                <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                    {/* SVG Rings */}
                    <div className="relative w-[200px] h-[200px] flex-shrink-0">
                        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90" style={{ overflow: 'visible' }}>
                            <defs>
                                {/* Glows */}
                                {rings!.map((ring) => (
                                    <filter key={`filter-${ring.key}`} id={`glow-${ring.key}`} x="-30%" y="-30%" width="160%" height="160%">
                                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={ring.glowColor} floodOpacity="0.9" />
                                    </filter>
                                ))}
                                {/* Gradients */}
                                {rings!.map((ring) => (
                                    <linearGradient key={ring.gradientId} id={ring.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={ring.gradientFrom} />
                                        <stop offset="100%" stopColor={ring.gradientTo} />
                                    </linearGradient>
                                ))}
                            </defs>

                            {rings!.map((ring, idx) => (
                                <g key={ring.key}>
                                    {/* Track */}
                                    <circle
                                        cx="100" cy="100" r={ring.r}
                                        fill="none"
                                        stroke={ring.trackColor}
                                        strokeWidth={ring.strokeWidth}
                                    />
                                    {/* Progress arc */}
                                    <motion.circle
                                        cx="100" cy="100" r={ring.r}
                                        fill="none"
                                        stroke={`url(#${ring.gradientId})`}
                                        strokeWidth={ring.strokeWidth}
                                        strokeLinecap="round"
                                        strokeDasharray={ring.circumference}
                                        initial={{ strokeDashoffset: ring.circumference }}
                                        animate={{ strokeDashoffset: ring.offset }}
                                        transition={{
                                            duration: 1.2,
                                            delay: 0.2 + idx * 0.15,
                                            ease: [0.34, 1.56, 0.64, 1],
                                        }}
                                        filter={ring.pct > 0 ? `url(#glow-${ring.key})` : undefined}
                                    />
                                </g>
                            ))}
                        </svg>

                        {/* Centre content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                className="text-4xl font-black tabular-nums leading-none"
                                style={{ color: overallColor }}
                            >
                                {score.overallScore}
                            </motion.span>
                            <span className="text-[11px] text-gray-400 font-medium mt-0.5">/ 100</span>
                            <span className="text-[10px] text-gray-400 mt-1">Overall</span>
                        </div>
                    </div>

                    {/* Legend / dimension list */}
                    <div className="flex-1 w-full space-y-3">
                        {rings!.map((ring, idx) => (
                            <motion.div
                                key={ring.key}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                className="flex items-center gap-3 group"
                            >
                                {/* Colour dot */}
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                                    style={{ background: `linear-gradient(135deg, ${ring.gradientFrom}, ${ring.gradientTo})` }}
                                />

                                {/* Label */}
                                <div className="flex flex-col min-w-[90px]">
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-none">{ring.label}</span>
                                    <span className="text-[10px] text-gray-400 leading-none mt-0.5">{ring.description}</span>
                                </div>

                                {/* Progress bar */}
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${ring.pct}%` }}
                                        transition={{ delay: 0.5 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
                                        className="h-full rounded-full"
                                        style={{
                                            background: `linear-gradient(90deg, ${ring.gradientFrom}, ${ring.gradientTo})`,
                                            boxShadow: ring.pct > 0 ? `0 0 6px ${ring.glowColor}` : 'none',
                                        }}
                                    />
                                </div>

                                {/* Percent */}
                                <span
                                    className="text-xs font-bold tabular-nums w-10 text-right"
                                    style={{ color: ring.gradientFrom }}
                                >
                                    {ring.pct}%
                                </span>
                            </motion.div>
                        ))}

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.85 }}
                            className="pt-2"
                        >
                            <Link
                                href="/dashboard/resumes"
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-violet-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-rose-500/15"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Improve Your Score
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
