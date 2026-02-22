'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, FileText, Award, Mic, Briefcase, ArrowRight,
    Lightbulb, TrendingUp, Sparkles, CheckCircle2, AlertCircle,
    Code, Users, Rocket
} from 'lucide-react';

interface PlacementReadyScoreProps {
    avgScore: number | null;
    badgesEarned: number;
    interviewCount: number;
    jobsApplied: number;
    loading?: boolean;
}

// 31 unique daily insights - one for each day of the month
const DAILY_INSIGHTS = [
    { day: 1, category: 'Resume Tip', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-500/10', borderColor: 'border-blue-100 dark:border-blue-500/20', accentColor: 'bg-blue-500', title: 'Use Action Verbs', text: 'Start bullet points with action verbs like "Led", "Developed", or "Achieved" to make an instant impact on recruiters.' },
    { day: 2, category: 'Resume Tip', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-500/10', borderColor: 'border-blue-100 dark:border-blue-500/20', accentColor: 'bg-blue-500', title: 'Quantify Your Results', text: 'Recruiters love numbers! "Increased sales by 25%" is way more impactful than "Improved sales performance" every time.' },
    { day: 3, category: 'Resume Tip', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-500/10', borderColor: 'border-blue-100 dark:border-blue-500/20', accentColor: 'bg-blue-500', title: 'ATS Keywords Matter', text: 'Mirror keywords from the job description in your resume to beat Applicant Tracking Systems and get noticed.' },
    { day: 4, category: 'Resume Tip', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-500/10', borderColor: 'border-blue-100 dark:border-blue-500/20', accentColor: 'bg-blue-500', title: 'One-Page Rule', text: 'Keep your resume to one page unless you have 10+ years of experience. Brevity shows you can prioritize.' },
    { day: 5, category: 'Resume Tip', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-500/10', borderColor: 'border-blue-100 dark:border-blue-500/20', accentColor: 'bg-blue-500', title: 'Custom Summaries Win', text: 'Tailor your professional summary for each job. Generic summaries get generic results.' },
    { day: 6, category: 'Interview Tip', icon: Mic, color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-500/10', borderColor: 'border-rose-100 dark:border-rose-500/20', accentColor: 'bg-rose-500', title: 'STAR Method', text: 'Structure answers as Situation, Task, Action, Result for behavioral questions. It keeps you focused and impressive.' },
    { day: 7, category: 'Interview Tip', icon: Mic, color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-500/10', borderColor: 'border-rose-100 dark:border-rose-500/20', accentColor: 'bg-rose-500', title: 'Research the Company', text: 'Know their recent news, products, and culture before the interview. It shows genuine interest and preparation.' },
    { day: 8, category: 'Interview Tip', icon: Mic, color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-500/10', borderColor: 'border-rose-100 dark:border-rose-500/20', accentColor: 'bg-rose-500', title: 'Prepare Questions', text: 'Always have 2-3 thoughtful questions ready for the interviewer. It demonstrates engagement and curiosity.' },
    { day: 9, category: 'Interview Tip', icon: Mic, color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-500/10', borderColor: 'border-rose-100 dark:border-rose-500/20', accentColor: 'bg-rose-500', title: 'Mock Practice', text: 'Practicing out loud improves confidence by 60% compared to mental rehearsal. Record yourself and review!' },
    { day: 10, category: 'Interview Tip', icon: Mic, color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-500/10', borderColor: 'border-rose-100 dark:border-rose-500/20', accentColor: 'bg-rose-500', title: 'Body Language', text: 'Maintain eye contact, sit upright, and use hand gestures naturally. Non-verbal cues account for 55% of communication.' },
    { day: 11, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-100 dark:border-emerald-500/20', accentColor: 'bg-emerald-500', title: 'Network Actively', text: '85% of jobs are filled through networking. Connect with 2-3 new professionals in your field every week.' },
    { day: 12, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-100 dark:border-emerald-500/20', accentColor: 'bg-emerald-500', title: 'Skill Stacking', text: 'Combining 2-3 complementary skills makes you uniquely valuable. Example: Design + Coding + Marketing.' },
    { day: 13, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-100 dark:border-emerald-500/20', accentColor: 'bg-emerald-500', title: 'Follow-Up Matters', text: 'Sending a thank-you email within 24 hours increases your callback rate by 40%. Keep it brief and personalized.' },
    { day: 14, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-100 dark:border-emerald-500/20', accentColor: 'bg-emerald-500', title: 'Portfolio Power', text: 'Candidates with project portfolios get 2x more interview callbacks. Showcase your work, not just words.' },
    { day: 15, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-100 dark:border-emerald-500/20', accentColor: 'bg-emerald-500', title: 'Personal Brand', text: 'A consistent LinkedIn profile with regular posts increases recruiter visibility by 5x. Be active, not just present.' },
    { day: 16, category: 'Tech Tip', icon: Code, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-100 dark:border-purple-500/20', accentColor: 'bg-purple-500', title: 'GitHub Activity', text: 'Consistent GitHub contributions show passion. Even small daily commits build an impressive profile over time.' },
    { day: 17, category: 'Tech Tip', icon: Code, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-100 dark:border-purple-500/20', accentColor: 'bg-purple-500', title: 'System Design', text: 'For senior roles, system design skills are crucial. Practice designing scalable systems like Twitter or Uber.' },
    { day: 18, category: 'Tech Tip', icon: Code, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-100 dark:border-purple-500/20', accentColor: 'bg-purple-500', title: 'Clean Code', text: 'Write code like the next person to read it is a serial killer who knows where you live. Readability matters!' },
    { day: 19, category: 'Tech Tip', icon: Code, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-100 dark:border-purple-500/20', accentColor: 'bg-purple-500', title: 'DSA Practice', text: 'Solve 2-3 LeetCode problems daily. Consistency beats cramming - aim for 100+ problems before interviews.' },
    { day: 20, category: 'Tech Tip', icon: Code, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-100 dark:border-purple-500/20', accentColor: 'bg-purple-500', title: 'Read Documentation', text: 'Deep knowledge of framework docs sets you apart. Most developers only skim the surface.' },
    { day: 21, category: 'Soft Skills', icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-500/10', borderColor: 'border-amber-100 dark:border-amber-500/20', accentColor: 'bg-amber-500', title: 'Active Listening', text: 'In interviews, listen fully before responding. Pausing to think shows confidence, not weakness.' },
    { day: 22, category: 'Soft Skills', icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-500/10', borderColor: 'border-amber-100 dark:border-amber-500/20', accentColor: 'bg-amber-500', title: 'Storytelling', text: 'Great stories make you memorable. Frame your experiences as mini-narratives with conflict and resolution.' },
    { day: 23, category: 'Soft Skills', icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-500/10', borderColor: 'border-amber-100 dark:border-amber-500/20', accentColor: 'bg-amber-500', title: 'Emotional Intelligence', text: 'Teams value EQ as much as IQ. Show self-awareness and empathy in your interactions.' },
    { day: 24, category: 'Soft Skills', icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-500/10', borderColor: 'border-amber-100 dark:border-amber-500/20', accentColor: 'bg-amber-500', title: 'Conflict Resolution', text: 'Be ready to share how you handled disagreements constructively. It shows maturity and teamwork.' },
    { day: 25, category: 'Soft Skills', icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-500/10', borderColor: 'border-amber-100 dark:border-amber-500/20', accentColor: 'bg-amber-500', title: 'Growth Mindset', text: 'Talk about failures as learning opportunities. Companies want people who grow from setbacks.' },
    { day: 26, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', borderColor: 'border-cyan-100 dark:border-cyan-500/20', accentColor: 'bg-cyan-500', title: 'Salary Research', text: 'Know your market value before negotiations. Use Glassdoor, levels.fyi, and LinkedIn Salary insights.' },
    { day: 27, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', borderColor: 'border-cyan-100 dark:border-cyan-500/20', accentColor: 'bg-cyan-500', title: 'Timing Matters', text: 'Apply to jobs on Monday or Tuesday mornings. Your application lands at the top of the pile.' },
    { day: 28, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', borderColor: 'border-cyan-100 dark:border-cyan-500/20', accentColor: 'bg-cyan-500', title: 'Reference Prep', text: "Give your references a heads up and share the job description. They'll advocate better with context." },
    { day: 29, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', borderColor: 'border-cyan-100 dark:border-cyan-500/20', accentColor: 'bg-cyan-500', title: 'Rejection = Data', text: "Every rejection teaches something. Ask for feedback when possible - it's free coaching." },
    { day: 30, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', borderColor: 'border-cyan-100 dark:border-cyan-500/20', accentColor: 'bg-cyan-500', title: 'Energy Management', text: "Job searching is a marathon. Take breaks, celebrate small wins, and don't burn out." },
    { day: 31, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', borderColor: 'border-cyan-100 dark:border-cyan-500/20', accentColor: 'bg-cyan-500', title: 'Multiple Offers', text: 'Apply broadly to create options. Having multiple offers gives you negotiation power.' },
];

export default function PlacementReadyScore({
    avgScore,
    badgesEarned,
    interviewCount,
    jobsApplied,
    loading,
}: PlacementReadyScoreProps) {
    const [dailyInsight] = useState<typeof DAILY_INSIGHTS[0]>(() => {
        const dayOfMonth = new Date().getDate();
        return DAILY_INSIGHTS.find(i => i.day === dayOfMonth) || DAILY_INSIGHTS[0];
    });
    const [isLearned, setIsLearned] = useState(() => {
        if (typeof window === 'undefined') return false;
        const today = new Date();
        const monthYear = `${today.getMonth()}-${today.getFullYear()}`;
        const learnedKey = `insight-learned-${monthYear}-${today.getDate()}`;
        return localStorage.getItem(learnedKey) === 'true';
    });

    const handleMarkAsLearned = () => {
        const today = new Date();
        const dayOfMonth = today.getDate();
        const monthYear = `${today.getMonth()}-${today.getFullYear()}`;
        const learnedKey = `insight-learned-${monthYear}-${dayOfMonth}`;
        localStorage.setItem(learnedKey, 'true');
        setIsLearned(true);
    };

    const scoreData = useMemo(() => {
        const resumeScore = avgScore ? (avgScore / 100) * 35 : 0;
        const skillsScore = Math.min(badgesEarned / 5, 1) * 25;
        const interviewScore = Math.min(interviewCount / 3, 1) * 25;
        const jobsScore = Math.min(jobsApplied / 10, 1) * 15;
        const total = Math.round(resumeScore + skillsScore + interviewScore + jobsScore);

        const dimensions = [
            {
                label: 'Resume',
                icon: FileText,
                value: avgScore ? `${avgScore}/100` : 'Not scanned',
                status: avgScore ? (avgScore >= 70 ? 'good' : 'needs-work') : 'pending',
                pct: avgScore ? avgScore / 100 : 0,
                href: '/dashboard/resumes',
                cta: 'Scan Resume',
                iconColor: 'text-indigo-500',
                barGradient: 'from-indigo-500 to-violet-500',
                bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
            },
            {
                label: 'Skills',
                icon: Award,
                value: `${badgesEarned} Badges`,
                status: badgesEarned >= 5 ? 'good' : badgesEarned > 0 ? 'needs-work' : 'pending',
                pct: Math.min(badgesEarned / 5, 1),
                href: '/dashboard/tests',
                cta: 'Earn Badges',
                iconColor: 'text-amber-500',
                barGradient: 'from-amber-400 to-orange-500',
                bgColor: 'bg-amber-50 dark:bg-amber-500/10',
            },
            {
                label: 'Interview',
                icon: Mic,
                value: interviewCount > 0 ? `${interviewCount} done` : 'Not started',
                status: interviewCount >= 3 ? 'good' : interviewCount > 0 ? 'needs-work' : 'pending',
                pct: Math.min(interviewCount / 3, 1),
                href: '/dashboard/interviews',
                cta: 'Practice Now',
                iconColor: 'text-rose-500',
                barGradient: 'from-rose-500 to-pink-500',
                bgColor: 'bg-rose-50 dark:bg-rose-500/10',
            },
            {
                label: 'Jobs',
                icon: Briefcase,
                value: `${jobsApplied} Applied`,
                status: jobsApplied >= 10 ? 'good' : jobsApplied > 0 ? 'needs-work' : 'pending',
                pct: Math.min(jobsApplied / 10, 1),
                href: '/dashboard/jobs',
                cta: 'Find Jobs',
                iconColor: 'text-emerald-500',
                barGradient: 'from-emerald-500 to-teal-500',
                bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
            },
        ];

        const lowest = dimensions.reduce((min, d) => (d.pct < min.pct ? d : min), dimensions[0]);

        let statusLabel = 'Getting Started';
        let statusColor = 'text-gray-400';
        let statusBg = 'bg-gray-50 dark:bg-white/5';
        if (total >= 80) { statusLabel = 'Excellent!'; statusColor = 'text-emerald-600 dark:text-emerald-400'; statusBg = 'bg-emerald-50 dark:bg-emerald-500/10'; }
        else if (total >= 60) { statusLabel = 'Good Progress'; statusColor = 'text-green-600 dark:text-green-400'; statusBg = 'bg-green-50 dark:bg-green-500/10'; }
        else if (total >= 40) { statusLabel = 'On Track'; statusColor = 'text-amber-600 dark:text-amber-400'; statusBg = 'bg-amber-50 dark:bg-amber-500/10'; }
        else if (total > 0) { statusLabel = 'Keep Going'; statusColor = 'text-orange-600 dark:text-orange-400'; statusBg = 'bg-orange-50 dark:bg-orange-500/10'; }

        return { total, dimensions, lowest, statusLabel, statusColor, statusBg };
    }, [avgScore, badgesEarned, interviewCount, jobsApplied]);

    const circumference = 2 * Math.PI * 42;
    const offset = circumference * (1 - scoreData.total / 100);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 animate-pulse">
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-white/5" />
                        <div className="flex-1 space-y-3">
                            <div className="h-5 bg-gray-100 dark:bg-white/5 rounded w-48" />
                            <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full" />
                            <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full" />
                            <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 animate-pulse h-48" />
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        if (status === 'good') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
        if (status === 'needs-work') return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
        return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Placement Ready Score Card - 3 cols */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-indigo-500/10 shadow-[0_8px_30px_rgba(99,102,241,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(99,102,241,0.15),0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden hover:shadow-[0_16px_40px_rgba(99,102,241,0.18),0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300"
            >
                {/* Card Header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-500/20">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Placement-Ready Score</h3>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scoreData.statusBg} ${scoreData.statusColor}`}>
                        {scoreData.statusLabel}
                    </span>
                </div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Circular Score */}
                        <div className="flex flex-col items-center flex-shrink-0">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="relative w-32 h-32"
                            >
                                {/* Pulsing ring when score > 0 */}
                                {scoreData.total > 0 && (
                                    <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20 animate-ping" style={{ animationDuration: '3s' }} />
                                )}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    {/* Track */}
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="9" className="text-gray-100 dark:text-white/5" />
                                    {/* Progress */}
                                    <circle
                                        cx="50" cy="50" r="42"
                                        fill="none"
                                        stroke="url(#scoreGrad)"
                                        strokeWidth="9"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        className="transition-all duration-1000 ease-out drop-shadow-sm"
                                    />
                                    <defs>
                                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#6366F1" />
                                            <stop offset="50%" stopColor="#A855F7" />
                                            <stop offset="100%" stopColor="#22C55E" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums"
                                    >
                                        {scoreData.total}
                                    </motion.span>
                                    <span className="text-xs text-gray-400">/ 100</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Dimensions */}
                        <div className="flex-1 w-full space-y-3.5">
                            {scoreData.dimensions.map((dim, i) => (
                                <motion.div
                                    key={dim.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.08 }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg ${dim.bgColor} flex items-center justify-center flex-shrink-0`}>
                                            <dim.icon className={`w-3.5 h-3.5 ${dim.iconColor}`} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-16">{dim.label}</span>
                                        <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.round(dim.pct * 100)}%` }}
                                                transition={{ delay: 0.5 + i * 0.08, duration: 0.7 }}
                                                className={`h-full rounded-full bg-gradient-to-r ${dim.barGradient}`}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 min-w-[90px] justify-end">
                                            {getStatusIcon(dim.status)}
                                            <span className={`text-[11px] font-medium tabular-nums ${dim.status === 'good' ? 'text-emerald-600 dark:text-emerald-400' : dim.status === 'needs-work' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                                                {dim.value}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.85 }}
                                className="pt-1"
                            >
                                <Link
                                    href={scoreData.lowest.href}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#cc4492] to-[#655bd4] text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/15"
                                >
                                    {scoreData.lowest.cta} to Boost Score
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Daily Insight Card - 2 cols */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="lg:col-span-2 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden flex flex-col"
            >
                {/* Colored top accent strip */}
                {dailyInsight && (
                    <div className={`h-1 w-full ${dailyInsight.accentColor}`} />
                )}

                <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
                                <Lightbulb className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Daily Insight</h3>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Day {dailyInsight?.day || 1}</span>
                        </div>
                    </div>

                    {dailyInsight && (
                        <div className="flex-1 flex flex-col">
                            {/* Category badge */}
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${dailyInsight.bgColor} ${dailyInsight.borderColor} border w-fit mb-3`}>
                                <dailyInsight.icon className={`w-3.5 h-3.5 ${dailyInsight.color}`} />
                                <span className={`text-xs font-semibold ${dailyInsight.color}`}>{dailyInsight.category}</span>
                            </div>

                            {/* Content */}
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{dailyInsight.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">{dailyInsight.text}</p>

                            {/* Footer */}
                            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <p className="text-xs text-gray-400">New tip every day</p>
                                <AnimatePresence mode="wait">
                                    {isLearned ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Learned!</span>
                                        </motion.div>
                                    ) : (
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onClick={handleMarkAsLearned}
                                            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 transition-colors font-medium cursor-pointer group"
                                        >
                                            <span>Mark as learned</span>
                                            <CheckCircle2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
