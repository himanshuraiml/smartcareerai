'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    Rocket, Map, BookOpen, Briefcase, ChevronRight,
    ArrowRight, ShieldCheck, BrainCircuit, Sparkles, TrendingUp, Users, Clock, Star
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const COPILOT_FEATURES = [
    {
        icon: Map,
        title: 'Personalised Career Roadmap',
        desc: 'PlaceNxt analyses your current skill profile, target role, and timeline to build a week-by-week action plan. Not generic advice — your specific next steps.',
        tags: ['Goal Setting', 'Timeline Planning', 'Milestone Tracking'],
        color: 'violet',
    },
    {
        icon: Briefcase,
        title: 'Smart Job Matching',
        desc: 'Go beyond keyword search. The Copilot matches jobs based on your verified skill badges, ATS score history, and application success patterns — surfacing roles you can actually get.',
        tags: ['Skill-Based Matching', 'ATS Score Filter', 'Culture Fit Score'],
        color: 'blue',
    },
    {
        icon: BookOpen,
        title: 'Curated Learning Recommendations',
        desc: 'When your skill score for a target role falls short, the Copilot recommends the exact courses, projects, and practice exercises to close the gap — ranked by recruiter value.',
        tags: ['Skill Gap Courses', 'Project Ideas', 'Ranking by ROI'],
        color: 'green',
    },
    {
        icon: Users,
        title: '1-Click Application Tracking',
        desc: 'Every application is tracked — status, ATS score used, follow-up reminders, and outcome logging. Know your pipeline health at a glance.',
        tags: ['Status Board', 'Follow-up Alerts', 'Outcome Analytics'],
        color: 'cyan',
    },
];

const COPILOT_SIGNALS = [
    { icon: BrainCircuit, label: 'Skill Profile Intelligence', desc: 'Reads your verified badges, test scores, and resume to build a real-time competency map.' },
    { icon: TrendingUp, label: 'Market Demand Tracking', desc: 'Monitors which skills are trending upward in job postings for your target role cluster.' },
    { icon: Star, label: 'Priority Recruiter Access', desc: 'Students with Copilot active get surfaced first to recruiters searching the PlaceNxt talent pool.' },
    { icon: Clock, label: 'Adaptive Timeline', desc: 'As you complete milestones faster or slower, the plan recalibrates automatically — no manual updates.' },
];

const STATS = [
    { val: '80%', label: 'Faster time to first interview' },
    { val: '4.2×', label: 'More relevant job matches vs keyword search' },
    { val: '92%', label: 'Users improve skill scores within 30 days' },
    { val: '24/7', label: 'AI available — no scheduling needed' },
];

export default function CareerCopilotPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    return (
        <div className={`min-h-screen ${isLight ? 'bg-[#F8FAFC]' : 'bg-[#080C16]'}`}>
            <Navbar />

            {/* Hero */}
            <header className="max-w-7xl mx-auto px-4 pt-40 pb-24">
                <div className="flex flex-col lg:flex-row gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1"
                    >
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight ? 'bg-violet-50 border-violet-100 text-violet-600' : 'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>
                            <Rocket className="w-3 h-3" /> AI Features · Career Copilot
                        </span>
                        <h1 className={`text-4xl md:text-6xl font-black mb-6 leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Your AI Career Coach. <span className="text-violet-500">Available 24/7.</span>
                        </h1>
                        <p className={`text-lg md:text-xl leading-relaxed mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            The Career Copilot connects your skill profile, job market data, and placement timeline into a single intelligent plan — then adapts it every time you make progress.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-600/20 hover:scale-[1.02] transition-transform">
                                Activate Copilot Free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/solutions/students" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl border font-semibold transition-all hover:scale-[1.02] ${isLight ? 'border-gray-200 text-gray-700 hover:border-violet-200' : 'border-white/10 text-gray-300 hover:border-violet-500/40'}`}>
                                All Student Tools
                            </Link>
                        </div>
                    </motion.div>

                    {/* Copilot Dashboard Mock */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="flex-1 w-full"
                    >
                        <div className={`rounded-3xl border shadow-2xl overflow-hidden ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.04] border-white/10'}`}>
                            <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'bg-violet-50/70 border-violet-100/50' : 'bg-violet-500/[0.07] border-white/[0.06]'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                                        <Rocket className="w-5 h-5 text-white" />
                                    </div>
                                    <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Career Copilot · Week 3 of 12</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">On Track</span>
                            </div>
                            <div className="p-6">
                                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Your next milestones</p>
                                <div className="space-y-3 mb-6">
                                    {[
                                        { label: 'Complete React.js Proficient test', done: true, badge: 'Badge Earned' },
                                        { label: 'Score resume for Swiggy SDE-1 JD', done: true, badge: 'Score: 81' },
                                        { label: 'Run 2 mock interviews (System Design)', done: false, badge: 'In Progress' },
                                        { label: 'Apply to 3 matched roles', done: false, badge: 'Pending' },
                                    ].map((item, i) => (
                                        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${item.done ? (isLight ? 'bg-green-50 border-green-100' : 'bg-green-500/[0.07] border-green-500/20') : (isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/[0.07]')}`}>
                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${item.done ? 'bg-green-500 border-green-500' : isLight ? 'border-gray-300' : 'border-gray-600'}`}>
                                                {item.done && <ChevronRight className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className={`flex-1 ${item.done ? (isLight ? 'text-green-800 line-through opacity-60' : 'text-green-300 line-through opacity-60') : (isLight ? 'text-gray-700' : 'text-gray-300')}`}>{item.label}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.done ? 'bg-green-500/20 text-green-600 dark:text-green-400' : isLight ? 'bg-gray-200 text-gray-500' : 'bg-white/10 text-gray-400'}`}>{item.badge}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={`p-4 rounded-xl border ${isLight ? 'bg-violet-50 border-violet-100' : 'bg-violet-500/[0.07] border-violet-500/20'}`}>
                                    <p className={`text-xs font-bold mb-1 ${isLight ? 'text-violet-700' : 'text-violet-300'}`}>Copilot suggestion</p>
                                    <p className={`text-xs ${isLight ? 'text-violet-600' : 'text-violet-400'}`}>3 new SDE-1 roles opened at Zomato, Razorpay, and Meesho that match your current profile. Apply now before the window closes.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Stats */}
            <section className={`border-y ${isLight ? 'border-gray-100 bg-white' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {STATS.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
                            <p className="text-3xl font-black text-violet-500 mb-1">{s.val}</p>
                            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-4 py-28">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className={`text-3xl md:text-5xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Four pillars of <span className="text-violet-500">career intelligence</span>
                    </h2>
                    <p className={`text-base max-w-2xl mx-auto ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        The Copilot is not a chatbot. It's a live operational system that manages your placement journey.
                    </p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {COPILOT_FEATURES.map((feature, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className={`p-8 rounded-2xl border transition-all hover:shadow-xl ${isLight ? 'bg-white border-gray-100 hover:border-violet-100' : 'bg-white/[0.03] border-white/[0.06] hover:border-violet-500/30'}`}>
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                                <feature.icon className="w-6 h-6 text-violet-500" />
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>{feature.title}</h3>
                            <p className={`text-sm leading-relaxed mb-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{feature.desc}</p>
                            <div className="flex flex-wrap gap-2">
                                {feature.tags.map(tag => (
                                    <span key={tag} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isLight ? 'bg-violet-50 border-violet-100 text-violet-600' : 'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>{tag}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Intelligence signals */}
            <section className={`py-24 px-4 ${isLight ? 'bg-violet-50/50' : 'bg-violet-500/[0.04]'}`}>
                <div className="max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
                        <h2 className={`text-3xl md:text-4xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Always-on intelligence. <span className="text-violet-500">Zero maintenance.</span>
                        </h2>
                        <p className={`text-base ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>The Copilot runs in the background so you focus on prep, not planning.</p>
                    </motion.div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {COPILOT_SIGNALS.map((signal, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className={`flex items-start gap-4 p-6 rounded-2xl border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                    <signal.icon className="w-5 h-5 text-violet-500" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{signal.label}</h4>
                                    <p className={`text-xs leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{signal.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className={`rounded-[40px] p-12 relative border text-center ${isLight ? 'bg-violet-600 border-violet-500 shadow-2xl' : 'bg-white/[0.02] border-white/10'}`}>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Your career shouldn't run on guesswork.</h2>
                    <p className="text-violet-100 text-lg mb-8 max-w-xl mx-auto">Activate the Copilot free. Get your personalised 12-week placement plan in 60 seconds.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-violet-600 font-bold hover:bg-violet-50 transition-colors shadow-lg">
                            Get My Career Plan <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2 text-violet-200 text-sm">
                            <ShieldCheck className="w-4 h-4" /> No Credit Card Required
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
