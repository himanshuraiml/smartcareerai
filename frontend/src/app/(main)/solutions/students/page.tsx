'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    GraduationCap, FileText, Zap, Mic,
    Target, Rocket, CheckCircle2, ArrowLeft,
    Sparkles, ShieldCheck, BrainCircuit, Gem
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function StudentSolutionPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    return (
        <div className={`min-h-screen ${isLight ? 'bg-[#F8FAFC]' : 'bg-[#080C16]'}`}>
            <Navbar />

            {/* ── Hero Section ── */}
            <header className="max-w-7xl mx-auto px-4 mt-40 mb-24">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1"
                    >
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight
                            ? 'bg-blue-50 border-blue-100 text-blue-600'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                            <GraduationCap className="w-3 h-3" /> For Students & Candidates
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Your AI-Powered Roadmap to <span className="text-blue-500">Dream Jobs.</span>
                        </h1>
                        <p className={`text-lg md:text-xl leading-relaxed mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            Stop guessing what recruiters want. PlaceNxt provides an automated, AI-guided path to guarantee placement readiness from day one.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/register" className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-transform">
                                Start Preparation Free
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
                            {/* Decorative elements */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
                                <div className="space-y-4 w-[70%]">
                                    <div className={`p-4 rounded-xl border backdrop-blur-md shadow-lg ${isLight ? 'bg-white/80 border-gray-100' : 'bg-gray-900/80 border-gray-800'}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div className="h-3 w-32 rounded bg-gray-500/20" />
                                        </div>
                                        <div className="h-2 w-full rounded bg-blue-500/30 mb-2" />
                                        <div className="h-2 w-4/5 rounded bg-gray-500/10" />
                                    </div>
                                    <div className={`p-4 rounded-xl border backdrop-blur-md shadow-lg translate-x-12 ${isLight ? 'bg-white/80 border-gray-100' : 'bg-gray-900/80 border-gray-800'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-3 w-24 rounded bg-green-500/30" />
                                                <div className="h-2 w-16 rounded bg-gray-500/10" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Detailed Feature Cards */}
            <section className="max-w-7xl mx-auto px-4 mb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        {
                            icon: FileText,
                            title: 'ATS-Proof Resume Scoring',
                            desc: 'Upload your resume and get instant feedback. Our AI analyzes keywords, formatting, and impact patterns used by top Fortune 500 ATS systems.',
                            details: ['Keyword Optimization', 'Action Verb Suggestions', 'Format Validation', 'Role-Specific Benchmarking'],
                            color: 'blue'
                        },
                        {
                            icon: Mic,
                            title: 'Hyper-Realistic Mock Interviews',
                            desc: 'Practice with our Groq-powered AI. Get realistic technical questions and behavioral scenarios with instant feedback on confidence and accuracy.',
                            details: ['Voice Analysis', 'Technical Assessment', 'Behavioral Coaching', 'Session Recordings'],
                            color: 'indigo'
                        },
                        {
                            icon: Target,
                            title: 'Verified Skill Validation',
                            desc: 'Bypass the "unqualified" filter. Take proctored assessments to earn badges that are directly visible to our elite recruiters.',
                            details: ['Proctored Coding Tests', 'Soft Skill Evaluation', 'Domain-Specific Assessments', 'Sharable Badges'],
                            color: 'cyan'
                        },
                        {
                            icon: Rocket,
                            title: 'Smart Behavioral Job Matching',
                            desc: 'Don\'t just find a job, find the right fit. Our AI matches your personality and skill profile to company cultures where you will thrive.',
                            details: ['Culture-Fit Analysis', '1-Click Applications', 'Application Tracker', 'Priority Referral Access'],
                            color: 'violet'
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-8 rounded-[32px] border transition-all hover:shadow-2xl ${isLight ? 'bg-white border-gray-100 hover:border-blue-100' : 'bg-white/5 border-white/5 hover:border-blue-500/30'}`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-${feature.color}-500/10 text-${feature.color}-500`}>
                                <feature.icon className="w-7 h-7" />
                            </div>
                            <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>{feature.title}</h3>
                            <p className={`mb-8 leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{feature.desc}</p>
                            <div className="grid grid-cols-2 gap-3">
                                {feature.details.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm font-medium">
                                        <CheckCircle2 className={`w-4 h-4 text-${feature.color}-500`} />
                                        <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Career Roadmap Section ── */}
            <section id="roadmap" className="py-24 px-4 relative overflow-hidden">
                <div className={`absolute inset-0 pointer-events-none ${isLight ? 'bg-indigo-50/50' : 'bg-indigo-500/5'}`} />

                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">
                            <span className="text-blue-500">5 Stages.</span> One Mission. Your Career.
                        </h2>
                        <p className={`text-base max-w-2xl mx-auto ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            Follow the guided path or skip ahead – the choice is yours.
                            Each stage unlocks new AI-powered tools to accelerate your placement.
                        </p>
                    </motion.div>

                    {/* Visual Roadmap */}
                    <div className="relative">
                        {/* Central Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/50 via-indigo-500/50 to-violet-500/50 -translate-x-1/2 rounded-full hidden md:block" />

                        {/* Roadmap Stages */}
                        <div className="space-y-12 md:space-y-0">
                            {roadmapStages.map((stage, index) => (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative flex flex-col md:items-center gap-6 md:gap-0 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                                >
                                    {/* Content Card */}
                                    <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                                        <div className={`p-6 rounded-2xl border transition-all group cursor-pointer text-left ${isLight ? 'bg-white border-gray-100 hover:border-blue-200' : 'bg-white/5 border-white/10 hover:border-blue-500/30'}`}>
                                            <div className={`flex items-center gap-3 mb-3 ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Stage {index + 1}
                                                </span>
                                            </div>
                                            <h3 className={`text-2xl font-bold mb-2 group-hover:text-blue-500 transition-colors ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                {stage.title}
                                            </h3>
                                            <p className={`mb-4 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{stage.description}</p>
                                            <div className={`flex flex-wrap gap-2 ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                                                {stage.tools.map((tool, i) => (
                                                    <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isLight ? 'bg-gray-50 border-gray-100 text-gray-600' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                                                        {tool}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center Node */}
                                    <div className={`absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center shadow-xl z-20 hidden md:flex`}>
                                        <stage.icon className="w-7 h-7 text-white" />
                                    </div>

                                    {/* Mobile Icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center flex-shrink-0 md:hidden`}>
                                        <stage.icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Spacer for opposite side */}
                                    <div className="flex-1 hidden md:block" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Deep Dive Section */}
            <section className="max-w-7xl mx-auto px-4 mb-32">
                <div className={`rounded-[40px] p-12 overflow-hidden relative border ${isLight ? 'bg-indigo-600 border-indigo-500 shadow-2xl' : 'bg-white/[0.02] border-white/10'}`}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                        <div className="flex-1 text-center lg:text-left">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                                Start Your Placement Journey Today.
                            </h2>
                            <p className="text-indigo-100 text-lg mb-10 max-w-xl">
                                Join 50,000+ students who fixed their resumes and aced interviews using PlaceNxt AI.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/register" className="px-8 py-4 rounded-xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                                    Create Free Account
                                </Link>
                                <div className="flex items-center gap-2 text-indigo-200 text-sm">
                                    <ShieldCheck className="w-4 h-4" /> No Credit Card Required
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: BrainCircuit, label: 'AI Engine', val: 'Groq Llama 3' },
                                    { icon: Target, label: 'Accuracy', val: '98.5%' },
                                    { icon: Zap, label: 'Speed', val: 'Real-time' },
                                    { icon: Sparkles, label: 'Success', val: '80% Boost' }
                                ].map((stat, i) => (
                                    <div key={i} className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-white">
                                        <stat.icon className="w-6 h-6 mb-3 opacity-60" />
                                        <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{stat.label}</div>
                                        <div className="text-xl font-black">{stat.val}</div>
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

const roadmapStages = [
    {
        id: 'resume',
        title: 'Resume Score',
        description: 'Upload your resume and get instant ATS scores. Know your score before HR does.',
        icon: FileText,
        tools: ['Resume Parser', 'ATS Scorer', 'Skill Extractor'],
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'skills',
        title: 'Skill Lab',
        description: 'Prove your skills with AI-powered assessments. Earn verified badges that recruiters trust.',
        icon: Zap,
        tools: ['Skill Tests', 'Gap Analysis', 'Skill Badges'],
        gradient: 'from-amber-500 to-orange-500',
    },
    {
        id: 'interviews',
        title: 'Interview Arena',
        description: 'Practice with AI interviewers for technical, behavioral, and HR rounds. Get real-time feedback.',
        icon: Mic,
        tools: ['Mock Interviews', 'Voice Analysis', 'Answer Coaching'],
        gradient: 'from-rose-500 to-pink-500',
    },
    {
        id: 'jobs',
        title: 'Job Board',
        description: 'Find and track opportunities from top sources. Every application, one dashboard.',
        icon: Rocket,
        tools: ['Job Matching', 'Application Tracker', 'Email Alerts'],
        gradient: 'from-emerald-500 to-teal-500',
    },
    {
        id: 'offers',
        title: 'Offer Hub',
        description: 'Compare offers, negotiate better, and plan your career growth with AI guidance.',
        icon: Gem,
        tools: ['Offer Analysis', 'Salary Insights', 'Growth Planner'],
        gradient: 'from-violet-500 to-purple-500',
    },
];
