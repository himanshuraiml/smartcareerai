'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, FileText, Award, Mic, Briefcase, ArrowRight,
    Lightbulb, TrendingUp, Sparkles, CheckCircle2, AlertCircle,
    Code, Users, Target, Rocket, BookOpen, Brain, Cpu, Globe
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
    // Day 1-5: Resume Tips
    { day: 1, category: 'Resume Tip', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', title: 'Use Action Verbs', text: 'Start bullet points with action verbs like "Led", "Developed", or "Achieved" to make an instant impact on recruiters.' },
    { day: 2, category: 'Resume Tip', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', title: 'Quantify Your Results', text: 'Recruiters love numbers! "Increased sales by 25%" is way more impactful than "Improved sales performance" every time.' },
    { day: 3, category: 'Resume Tip', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', title: 'ATS Keywords Matter', text: 'Mirror keywords from the job description in your resume to beat Applicant Tracking Systems and get noticed.' },
    { day: 4, category: 'Resume Tip', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', title: 'One-Page Rule', text: 'Keep your resume to one page unless you have 10+ years of experience. Brevity shows you can prioritize.' },
    { day: 5, category: 'Resume Tip', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', title: 'Custom Summaries Win', text: 'Tailor your professional summary for each job. Generic summaries get generic results.' },

    // Day 6-10: Interview Tips
    { day: 6, category: 'Interview Tip', icon: Mic, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20', title: 'STAR Method', text: 'Structure answers as Situation, Task, Action, Result for behavioral questions. It keeps you focused and impressive.' },
    { day: 7, category: 'Interview Tip', icon: Mic, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20', title: 'Research the Company', text: 'Know their recent news, products, and culture before the interview. It shows genuine interest and preparation.' },
    { day: 8, category: 'Interview Tip', icon: Mic, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20', title: 'Prepare Questions', text: 'Always have 2-3 thoughtful questions ready for the interviewer. It demonstrates engagement and curiosity.' },
    { day: 9, category: 'Interview Tip', icon: Mic, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20', title: 'Mock Practice', text: 'Practicing out loud improves confidence by 60% compared to mental rehearsal. Record yourself and review!' },
    { day: 10, category: 'Interview Tip', icon: Mic, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20', title: 'Body Language', text: 'Maintain eye contact, sit upright, and use hand gestures naturally. Non-verbal cues account for 55% of communication.' },

    // Day 11-15: Career Insights
    { day: 11, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', title: 'Network Actively', text: '85% of jobs are filled through networking. Connect with 2-3 new professionals in your field every week.' },
    { day: 12, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', title: 'Skill Stacking', text: 'Combining 2-3 complementary skills makes you uniquely valuable. Example: Design + Coding + Marketing.' },
    { day: 13, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', title: 'Follow-Up Matters', text: 'Sending a thank-you email within 24 hours increases your callback rate by 40%. Keep it brief and personalized.' },
    { day: 14, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', title: 'Portfolio Power', text: 'Candidates with project portfolios get 2x more interview callbacks. Showcase your work, not just words.' },
    { day: 15, category: 'Career Insight', icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', title: 'Personal Brand', text: 'A consistent LinkedIn profile with regular posts increases recruiter visibility by 5x. Be active, not just present.' },

    // Day 16-20: Tech Tips
    { day: 16, category: 'Tech Tip', icon: Code, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', title: 'GitHub Activity', text: 'Consistent GitHub contributions show passion. Even small daily commits build an impressive profile over time.' },
    { day: 17, category: 'Tech Tip', icon: Code, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', title: 'System Design', text: 'For senior roles, system design skills are crucial. Practice designing scalable systems like Twitter or Uber.' },
    { day: 18, category: 'Tech Tip', icon: Code, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', title: 'Clean Code', text: 'Write code like the next person to read it is a serial killer who knows where you live. Readability matters!' },
    { day: 19, category: 'Tech Tip', icon: Code, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', title: 'DSA Practice', text: 'Solve 2-3 LeetCode problems daily. Consistency beats cramming - aim for 100+ problems before interviews.' },
    { day: 20, category: 'Tech Tip', icon: Code, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', title: 'Read Documentation', text: 'Deep knowledge of framework docs sets you apart. Most developers only skim the surface.' },

    // Day 21-25: Soft Skills
    { day: 21, category: 'Soft Skills', icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', title: 'Active Listening', text: 'In interviews, listen fully before responding. Pausing to think shows confidence, not weakness.' },
    { day: 22, category: 'Soft Skills', icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', title: 'Storytelling', text: 'Great stories make you memorable. Frame your experiences as mini-narratives with conflict and resolution.' },
    { day: 23, category: 'Soft Skills', icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', title: 'Emotional Intelligence', text: 'Teams value EQ as much as IQ. Show self-awareness and empathy in your interactions.' },
    { day: 24, category: 'Soft Skills', icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', title: 'Conflict Resolution', text: 'Be ready to share how you handled disagreements constructively. It shows maturity and teamwork.' },
    { day: 25, category: 'Soft Skills', icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', title: 'Growth Mindset', text: 'Talk about failures as learning opportunities. Companies want people who grow from setbacks.' },

    // Day 26-31: Pro Tips
    { day: 26, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', title: 'Salary Research', text: 'Know your market value before negotiations. Use Glassdoor, levels.fyi, and LinkedIn Salary insights.' },
    { day: 27, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', title: 'Timing Matters', text: 'Apply to jobs on Monday or Tuesday mornings. Your application lands at the top of the pile.' },
    { day: 28, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', title: 'Reference Prep', text: 'Give your references a heads up and share the job description. They\'ll advocate better with context.' },
    { day: 29, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', title: 'Rejection = Data', text: 'Every rejection teaches something. Ask for feedback when possible - it\'s free coaching.' },
    { day: 30, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', title: 'Energy Management', text: 'Job searching is a marathon. Take breaks, celebrate small wins, and don\'t burn out.' },
    { day: 31, category: 'Pro Tip', icon: Rocket, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', title: 'Multiple Offers', text: 'Apply broadly to create options. Having multiple offers gives you negotiation power.' },
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
                iconColor: 'text-indigo-400',
                barGradient: 'from-indigo-500 to-violet-500',
            },
            {
                label: 'Skills',
                icon: Award,
                value: `${badgesEarned} Badges Earned`,
                status: badgesEarned >= 5 ? 'good' : badgesEarned > 0 ? 'needs-work' : 'pending',
                pct: Math.min(badgesEarned / 5, 1),
                href: '/dashboard/tests',
                cta: 'Earn Badges',
                iconColor: 'text-amber-400',
                barGradient: 'from-amber-500 to-orange-500',
            },
            {
                label: 'Interview',
                icon: Mic,
                value: interviewCount > 0 ? 'Ready for Mock' : 'Not started',
                status: interviewCount >= 3 ? 'good' : interviewCount > 0 ? 'needs-work' : 'pending',
                pct: Math.min(interviewCount / 3, 1),
                href: '/dashboard/interviews',
                cta: 'Practice Now',
                iconColor: 'text-rose-400',
                barGradient: 'from-rose-500 to-pink-500',
            },
            {
                label: 'Jobs',
                icon: Briefcase,
                value: `${jobsApplied} Applied`,
                status: jobsApplied >= 10 ? 'good' : jobsApplied > 0 ? 'needs-work' : 'pending',
                pct: Math.min(jobsApplied / 10, 1),
                href: '/dashboard/jobs',
                cta: 'Find Jobs',
                iconColor: 'text-emerald-400',
                barGradient: 'from-emerald-500 to-teal-500',
            },
        ];

        const lowest = dimensions.reduce((min, d) => (d.pct < min.pct ? d : min), dimensions[0]);

        // Get status label
        let statusLabel = 'Getting Started';
        let statusColor = 'text-gray-400';
        if (total >= 80) {
            statusLabel = 'Excellent!';
            statusColor = 'text-emerald-400';
        } else if (total >= 60) {
            statusLabel = 'Good Progress';
            statusColor = 'text-green-400';
        } else if (total >= 40) {
            statusLabel = 'On Track';
            statusColor = 'text-amber-400';
        } else if (total > 0) {
            statusLabel = 'Keep Going';
            statusColor = 'text-orange-400';
        }

        return { total, dimensions, lowest, statusLabel, statusColor };
    }, [avgScore, badgesEarned, interviewCount, jobsApplied]);

    const circumference = 2 * Math.PI * 42;
    const offset = circumference * (1 - scoreData.total / 100);

    if (loading) {
        return (
            <div className="p-6 rounded-2xl glass-premium animate-pulse">
                <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full bg-white/5" />
                    <div className="flex-1 space-y-3">
                        <div className="h-5 bg-white/5 rounded w-48" />
                        <div className="h-3 bg-white/5 rounded w-full" />
                        <div className="h-3 bg-white/5 rounded w-full" />
                        <div className="h-3 bg-white/5 rounded w-full" />
                        <div className="h-3 bg-white/5 rounded w-3/4" />
                    </div>
                </div>
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        if (status === 'good') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
        if (status === 'needs-work') return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
        return <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Placement Ready Score Card - Takes 3 columns */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-3 p-6 rounded-2xl glass-premium border border-white/10 relative overflow-hidden"
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Placement-Ready Score</h3>
                    </div>

                    <div className="flex flex-col md:flex-row items-start gap-8">
                        {/* Circular Score with better design */}
                        <div className="flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="relative w-36 h-36"
                            >
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    {/* Background circle */}
                                    <circle
                                        cx="50" cy="50" r="42"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth="10"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="50" cy="50" r="42"
                                        fill="none"
                                        stroke="url(#scoreGradientNew)"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        className="transition-all duration-1000 ease-out drop-shadow-lg"
                                    />
                                    <defs>
                                        <linearGradient id="scoreGradientNew" x1="0%" y1="0%" x2="100%" y2="100%">
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
                                        className="text-4xl font-bold text-white"
                                    >
                                        {scoreData.total}
                                    </motion.span>
                                    <span className="text-sm text-gray-500">/ 100</span>
                                </div>
                            </motion.div>

                            {/* Status Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className={`mt-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 ${scoreData.statusColor} text-sm font-medium`}
                            >
                                {scoreData.statusLabel}
                            </motion.div>
                        </div>

                        {/* Dimensions - Redesigned */}
                        <div className="flex-1 w-full space-y-4">
                            {scoreData.dimensions.map((dim, i) => (
                                <motion.div
                                    key={dim.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="group"
                                >
                                    <div className="flex items-center gap-3">
                                        <dim.icon className={`w-4 h-4 ${dim.iconColor} flex-shrink-0`} />
                                        <span className="text-sm font-medium text-white w-20">{dim.label}</span>
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.round(dim.pct * 100)}%` }}
                                                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                                                className={`h-full rounded-full bg-gradient-to-r ${dim.barGradient}`}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-[130px] justify-end">
                                            {getStatusIcon(dim.status)}
                                            <span className={`text-xs ${dim.status === 'good' ? 'text-emerald-400' : dim.status === 'needs-work' ? 'text-amber-400' : 'text-gray-500'}`}>
                                                {dim.value}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* CTA Button */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="pt-2"
                            >
                                <Link
                                    href={scoreData.lowest.href}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#cc4492] to-[#655bd4] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    {scoreData.lowest.cta} to Boost Score
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div >

            {/* Daily Insight Card - Takes 2 columns */}
            < motion.div
                initial={{ opacity: 0, x: 20 }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 p-6 rounded-2xl glass-premium border border-white/10 relative overflow-hidden flex flex-col"
            >
                {/* Background decoration */}
                < div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/5 to-orange-500/5 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <Lightbulb className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Daily Insight</h3>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Day {dailyInsight?.day || 1}</span>
                        </div>
                    </div>

                    {dailyInsight && (
                        <div className="flex-1 flex flex-col">
                            {/* Category Badge */}
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${dailyInsight.bgColor} ${dailyInsight.borderColor} border w-fit mb-4`}>
                                <dailyInsight.icon className={`w-3.5 h-3.5 ${dailyInsight.color}`} />
                                <span className={`text-xs font-medium ${dailyInsight.color}`}>{dailyInsight.category}</span>
                            </div>

                            {/* Insight Content */}
                            <div className="flex-1">
                                <h4 className="text-xl font-bold text-white mb-3">{dailyInsight.title}</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">{dailyInsight.text}</p>
                            </div>

                            {/* Quick Action */}
                            <div className="mt-6 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">New tip every day</p>
                                    <AnimatePresence mode="wait">
                                        {isLearned ? (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center gap-1.5 text-xs text-emerald-400"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="font-medium">Learned!</span>
                                            </motion.div>
                                        ) : (
                                            <motion.button
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                onClick={handleMarkAsLearned}
                                                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors group cursor-pointer"
                                            >
                                                <span>Mark as learned</span>
                                                <CheckCircle2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div >
        </div >
    );
}


