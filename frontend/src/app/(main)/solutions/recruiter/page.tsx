'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    Briefcase, Users, LayoutDashboard, Gem,
    Rocket, TrendingUp, ArrowLeft,
    Network, BrainCircuit
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function RecruiterSolutionPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    return (
        <div className={`min-h-screen ${isLight ? 'bg-[#F8FAFC]' : 'bg-[#080C16]'}`}>
            <Navbar />

            {/* Hero Section */}
            <header className="max-w-7xl mx-auto px-4 mt-40 mb-24">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1"
                    >
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            <Briefcase className="w-3 h-3" /> For Recruiters & Companies
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Hire Better, <span className="text-emerald-500">80% Faster.</span>
                        </h1>
                        <p className={`text-lg md:text-xl leading-relaxed mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            Let our AI pre-screen, interview, and rank thousands of candidates based on proven skills, not just keywords. Only spend time with the top 1% of talent.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/register" className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-transform">
                                Start Hiring Efficiently
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 relative"
                    >
                        <div className={`aspect-video rounded-3xl border overflow-hidden relative ${isLight ? 'bg-white border-gray-100 shadow-2xl' : 'bg-white/5 border-white/10'}`}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                            {/* Abstract Kanban UI Representation */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] flex gap-4 h-[70%]">
                                {[1, 2, 3].map((col, i) => (
                                    <div key={i} className="flex-1 flex flex-col gap-3">
                                        <div className="h-6 w-full rounded bg-emerald-500/20 mb-2"></div>
                                        {[1, 2].map((card, idx) => (
                                            <div key={idx} className={`p-4 rounded-xl border backdrop-blur-md shadow-sm ${isLight ? 'bg-white/80 border-white' : 'bg-gray-900/80 border-gray-800'}`}>
                                                <div className="h-2 w-3/4 rounded bg-gray-500/10 mb-2" />
                                                <div className="flex justify-between items-center">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-500/30" />
                                                    <div className="h-4 w-10 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-500/20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Recruiter Feature Cards */}
            <section className="max-w-7xl mx-auto px-4 mb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {[
                        {
                            icon: Users,
                            title: 'Pre-Vetted Talent Pools',
                            desc: 'Access a database of candidates who have already passed rigorous AI assessments. No more sifting through unqualified applications.',
                            color: 'emerald'
                        },
                        {
                            icon: LayoutDashboard,
                            title: 'Automated Interview Workflows',
                            desc: 'Automate the entire initial screening process. AI interviews candidates at scale and provides a detailed ranking for your review.',
                            color: 'teal'
                        },
                        {
                            icon: TrendingUp,
                            title: 'Predictive Fit Scoring',
                            desc: 'Understand exactly how a candidate will perform. Our AI score aggregates technical skills, behavioral traits, and role-specific aptitude.',
                            color: 'green'
                        },
                        {
                            icon: Gem,
                            title: 'Elite Pipeline Management',
                            desc: 'Manage thousands of applicants with ease. Our intelligent Kanban board highlights top talent automatically as they progress.',
                            color: 'cyan'
                        },
                        {
                            icon: Network,
                            title: 'Multi-Source Integration',
                            desc: 'Connect PlaceNxt with your existing ATS or career portal. Sync data seamlessly across your entire HR ecosystem.',
                            color: 'blue'
                        },
                        {
                            icon: BrainCircuit,
                            title: 'Adaptive Assessment Engine',
                            desc: 'Create custom assessments tailored to your tech stack. The AI adapts question difficulty in real-time based on candidate performance.',
                            color: 'indigo'
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-10 rounded-[32px] border flex gap-8 items-start transition-all hover:bg-emerald-500/[0.02] ${isLight ? 'bg-white border-gray-100 hover:border-emerald-200' : 'bg-white/5 border-white/5 hover:border-emerald-500/20'}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-${feature.color}-500/10 text-${feature.color}-500`}>
                                <feature.icon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className={`text-2xl font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>{feature.title}</h3>
                                <p className={`leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Result CTA Section */}
            <section className="max-w-7xl mx-auto px-4 mb-32">
                <div className={`rounded-[40px] p-12 lg:p-24 border overflow-hidden relative ${isLight ? 'bg-white border-gray-200 shadow-2xl shadow-gray-200' : 'bg-[#0A0F1A] border-white/10 shadow-2xl shadow-black'}`}>
                    <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
                        <div className="flex-1">
                            <h2 className={`text-3xl md:text-5xl font-black mb-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                Quality Hire, Guaranteed.
                            </h2>
                            <p className={`text-lg mb-10 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                Our platform isn't just a tool; it's a paradigm shift in how talent is acquired. Join companies that have reduced their hiring overhead by 60%.
                            </p>
                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div>
                                    <div className="text-3xl font-black text-emerald-500 mb-1">94%</div>
                                    <div className={`text-sm font-bold uppercase tracking-widest ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Candidate Fit Accuracy</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-emerald-500 mb-1">5 Days</div>
                                    <div className={`text-sm font-bold uppercase tracking-widest ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Avg. Time to Close</div>
                                </div>
                            </div>
                            <Link href="/register" className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-emerald-600 text-white font-black text-lg hover:scale-[1.05] transition-transform shadow-xl shadow-emerald-500/20">
                                Get Started for Competitive Hiring
                                <Rocket className="w-6 h-6 " />
                            </Link>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="space-y-4">
                                {[
                                    { text: "AI screening reduced our 1st round load by 90%.", author: "HR Director, TechGiant Inc." },
                                    { text: "The quality of candidates we see now is unparalleled.", author: "CTO, Scaling Startup" }
                                ].map((quote, i) => (
                                    <div key={i} className={`p-8 rounded-3xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/5 border-white/5'}`}>
                                        <div className="text-lg italic font-medium mb-4">"{quote.text}"</div>
                                        <div className="text-sm font-bold text-emerald-500">— {quote.author}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}
