'use client';

import { useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { platformSolutions } from '@/constants/solutions';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, FileText, Zap, Mic, Rocket, Gem,
    Check, Users, TrendingUp, Menu, X,
    ChevronRight, Sparkles, ShieldCheck, Building2, Briefcase, Target,
    GraduationCap, LineChart, BrainCircuit, Database, LayoutDashboard, Award,
    Cpu, Code2, Binary, Sliders, Trash2, GripVertical, AlertCircle, Activity,
    Flame, Star, Bell, Moon, FlaskConical, CheckCircle2, UserCircle2,
    Search, Layout
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
    const [activeSolution, setActiveSolution] = useState(0);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    return (
        <div className={`min-h-screen overflow-hidden landing-page ${isLight ? 'bg-[#F8FAFC]' : 'bg-[#080C16]'}`}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'PlaceNxt',
                        applicationCategory: 'EducationalApplication',
                        operatingSystem: 'Web',
                        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                        description: 'AI-powered placement preparation platform helping students get hired with resume scoring, mock interviews, and skill validation.',
                        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1250' }
                    })
                }}
            />

            {/* ── Navigation ── */}
            <Navbar />

            {/* ── Hero Section ── */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:flex-[1.6] text-center lg:text-left">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border ${isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-bold tracking-tight">AI-Powered Career Transformation</span>
                        </div>
                        <h1 className={`text-5xl lg:text-7xl font-black mb-8 leading-[1.1] ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Resumes don’t <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">predict success.</span> <br />
                            Your skills do.
                        </h1>
                        <p className={`text-lg lg:text-xl mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            Get hired based on the true skills that prove your performance. PlaceNxt gives you validated, defensible, and predictive proof of your talent, so you gain the clarity and confidence to stand out and land the career you deserve.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Link href="/register"
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                                Get Started <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/solutions"
                                className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg border transition-all flex items-center justify-center ${isLight ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                                View Solutions
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:flex-[1] w-full relative">
                        {/* ── Scaled Down Dashboard Window ── */}
                        <div className="relative w-full group overflow-visible">
                            <div className={`relative w-full rounded-[2rem] border shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[400px] lg:min-h-[500px] origin-top lg:origin-right transform lg:scale-[0.85] xl:scale-[0.75] transition-transform duration-500 hover:scale-[0.9] ${isLight ? 'bg-white border-gray-100 shadow-blue-100/50' : 'bg-[#0B0F19] border-white/10 shadow-black'}`}>

                                {/* Dashboard Grid Background */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                    style={{ backgroundImage: `radial-gradient(${isLight ? '#000' : '#fff'} 1px, transparent 1px)`, backgroundSize: '32px 32px' }}
                                />

                                {/* Compact Sidebar */}
                                <div className={`w-16 h-auto md:h-full border-r flex flex-col items-center py-6 relative z-10 ${isLight ? 'bg-white border-gray-100' : 'bg-[#0B0F19]/80 border-white/5 backdrop-blur-xl'}`}>
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-8">
                                        <Rocket className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        {[LayoutDashboard, FileText, Zap, Mic, BrainCircuit, Briefcase, Activity].map((Icon, i) => (
                                            <div key={i} className={`p-2.5 rounded-xl transition-all ${i === 0 ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-white') : (isLight ? 'text-gray-400' : 'text-gray-500')}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                                    {/* Mini Header */}
                                    <div className={`h-16 border-b flex items-center justify-between px-6 ${isLight ? 'bg-white/80 border-gray-100' : 'bg-[#0B0F19]/80 border-white/5'} backdrop-blur-sm`}>
                                        <div className="flex items-center gap-3 border-l pl-4 border-gray-100 h-8 ml-auto">
                                            <div className="text-right">
                                                <p className={`text-[10px] font-black leading-none ${isLight ? 'text-gray-900' : 'text-white'}`}>Arjun Sharma</p>
                                                <p className="text-[8px] text-gray-500 font-bold">GOLD</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-blue-600 p-0.5">
                                                <div className="w-full h-full rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                                    <Image src="https://i.pravatar.cc/150?u=arjun" alt="Arjun" width={32} height={32} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dashboard Body */}
                                    <div className="p-6 space-y-6">
                                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${isLight ? 'bg-orange-50/50 border-orange-100' : 'bg-orange-500/5'}`}>
                                            <div className="flex items-center gap-3">
                                                <Flame className="w-6 h-6 text-orange-500" />
                                                <p className={`text-xs font-black ${isLight ? 'text-orange-900' : 'text-orange-100'}`}>12 Day Streak!</p>
                                            </div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-orange-500" />)}
                                            </div>
                                        </div>

                                        <div className={`p-6 rounded-[2rem] border shadow-lg ${isLight ? 'bg-white border-gray-100' : 'bg-[#121926]'}`}>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Target className="w-4 h-4 text-blue-500" />
                                                <h4 className="text-[9px] font-black uppercase text-gray-400">Readiness Score</h4>
                                            </div>
                                            <div className="flex items-center justify-center mb-6">
                                                <div className="relative w-28 h-28 flex items-center justify-center">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="56" cy="56" r="45" fill="none" strokeWidth="10" className={isLight ? 'stroke-gray-100' : 'stroke-white/5'} />
                                                        <circle cx="56" cy="56" r="45" fill="none" strokeWidth="10" strokeLinecap="round" stroke="#3b82f6" strokeDasharray="210 1000" />
                                                    </svg>
                                                    <p className={`absolute text-2xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>82</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                {[88, 72, 94].map((v, i) => (
                                                    <div key={i} className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${v}%` }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Glow Effect */}
                            <div className="absolute -inset-4 bg-blue-500/10 blur-3xl -z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Why PlaceNxt for Recruiters ── */}
            <section className="py-24 px-4 relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            <Briefcase className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Recruiter Excellence</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black mb-6 leading-tight">
                            Hire Talent Based on <br className="hidden lg:block" />
                            <span className="text-emerald-500">Verified AI Insights</span>
                        </h2>
                        <ul className="space-y-5 mb-8">
                            {[
                                { title: 'Pre-Vetted Candidate Pools', desc: 'Access students who have already passed AI-led mock interviews and technical assessments.' },
                                { title: 'Automated Skill Ranking', desc: 'Our platform ranks candidates by objective skill scores, not just their resume keyword density.' },
                                { title: '80% Reduction in Hiring Time', desc: 'Stop screening hundreds of resumes. Let our AI tell you who to interview first.' }
                            ].map((point, index) => (
                                <li key={index} className="flex gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{point.title}</h4>
                                        <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{point.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex-1 w-full relative">
                        {/* ── High Fidelity Visual Pipeline Creation ── */}
                        <div className={`rounded-[2.5rem] p-6 md:p-8 border shadow-2xl relative overflow-hidden ${isLight ? 'bg-white border-gray-100' : 'bg-[#0B0F19] border-white/10'}`}>
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                                    <span className={`text-xs font-black uppercase tracking-[0.2em] ${isLight ? 'text-gray-900' : 'text-gray-400'}`}>Visual Pipeline</span>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-gray-400'}`}>
                                    5 Stages Active
                                </div>
                            </div>

                            {/* Pipeline Container (Dashed border) */}
                            <div className={`rounded-3xl p-4 border-2 border-dashed ${isLight ? 'border-gray-100 bg-gray-50/50' : 'border-white/5 bg-white/[0.01]'}`}>
                                <div className="space-y-3">
                                    {[
                                        { id: 1, title: 'Behavioural...', icon: BrainCircuit, color: 'purple', auto: true },
                                        { id: 2, title: 'Analytical ...', icon: Cpu, color: 'blue', auto: true },
                                        { id: 3, title: 'Coding Test', icon: Code2, color: 'emerald', auto: true },
                                        { id: 4, title: 'Technical In...', icon: Binary, color: 'cyan', auto: true },
                                        { id: 5, title: 'HR Intervie...', icon: Users, color: 'rose', auto: true, actions: true }
                                    ].map((stage, i) => (
                                        <motion.div
                                            key={stage.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${isLight
                                                ? 'bg-white border-gray-100 hover:shadow-lg'
                                                : 'bg-[#111827] border-white/5 hover:border-white/10 shadow-lg'}`}
                                        >
                                            {/* Drag Handle */}
                                            <GripVertical className={`w-4 h-4 ${isLight ? 'text-gray-300' : 'text-gray-600'}`} />

                                            {/* Icon Square */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm border ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                                                <stage.icon className={`w-6 h-6 text-${stage.color}-500`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isLight ? 'bg-gray-800 text-white' : 'bg-white/10 text-white'}`}>
                                                        {stage.id}
                                                    </div>
                                                    <h4 className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stage.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-1.5 grayscale opacity-50">
                                                    <ArrowRight className="w-3 h-3" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Auto-Advance</span>
                                                </div>
                                            </div>

                                            {/* Actions (for last item) */}
                                            {stage.actions && (
                                                <div className="flex items-center gap-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Sliders className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
                                                    <Trash2 className="w-4 h-4 text-rose-500/70" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Decorative Glow */}
                            {!isLight && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-[120px] pointer-events-none" />
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Why PlaceNxt for Universities ── */}
            <section className="py-24 px-4 bg-gradient-to-b from-transparent to-purple-500/5">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
                    <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 text-left">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 ${isLight ? 'bg-purple-50 text-purple-600' : 'bg-purple-500/10 text-purple-400'}`}>
                            <Building2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Intuitional Success</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black mb-6 leading-tight">
                            Elevate Your Institution's <br className="hidden lg:block" />
                            <span className="text-purple-500">Placement Record</span>
                        </h2>
                        <ul className="space-y-5 mb-8">
                            {[
                                { title: 'Batch Tracking & Analytics', desc: 'Monitor the preparation progress of thousands of students using aggregate dashboards.' },
                                { title: 'Industry-Aligned Curriculum', desc: 'Bridge the gap between academia and industry requirements with our targeted skill insights.' },
                                { title: 'Co-Branded Portals', desc: 'Provide students with a premium, tailored experience under your university\'s banner.' }
                            ].map((point, index) => (
                                <li key={index} className="flex gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'}`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{point.title}</h4>
                                        <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{point.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex-[1.5] w-full relative">
                        {/* ── High Fidelity Placement Analytics Dashboard ── */}
                        <div className={`rounded-[2.5rem] p-6 border shadow-2xl relative overflow-hidden flex flex-col gap-6 ${isLight ? 'bg-white border-gray-100 shadow-indigo-100' : 'bg-[#0B0F19] border-white/10'}`}>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                    { label: 'Total Registered', val: '1,280', sub: '+12% this month', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10', trend: 'up' },
                                    { label: 'Total Placed', val: '840', sub: '65% placement rate', icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: 'up' },
                                    { label: 'Interviews', val: '124', sub: 'In last 7 days', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: 'up' },
                                    { label: 'Avg AI Score', val: '78/100', sub: '+5.4% improvement', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'up' },
                                    { label: 'At-Risk Students', val: '12', sub: 'Action required', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', trend: 'down' }
                                ].map((stat, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border ${isLight ? 'bg-gray-50/50 border-gray-100' : 'bg-white/[0.02] border-white/5'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[9px] font-black uppercase tracking-wider text-gray-500`}>{stat.label}</span>
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                                <stat.icon className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className={`text-xl font-black mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{stat.val}</div>
                                        <div className="flex items-center gap-1">
                                            {stat.trend === 'up' && <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />}
                                            <span className="text-[9px] text-gray-500 font-bold">{stat.sub}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Main Content Area */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Activity Trend Chart */}
                                <div className={`flex-[2] p-6 rounded-3xl border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/5'}`}>
                                    <div className="flex items-center gap-2 mb-8">
                                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                                        <h4 className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-gray-900' : 'text-gray-400'}`}>Activity Trend</h4>
                                    </div>

                                    {/* SVG Chart Recreation */}
                                    <div className="relative h-48 w-full">
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between opacity-20">
                                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="border-t border-gray-500 w-full" />)}
                                        </div>
                                        {/* Chart Line */}
                                        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <motion.path
                                                initial={{ pathLength: 0 }}
                                                whileInView={{ pathLength: 1 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                d="M 0,80 L 10,85 L 20,70 L 30,75 L 40,60 L 50,65 L 60,40 L 70,45 L 80,30 L 90,35 L 100,10"
                                                fill="none"
                                                stroke="url(#chartGradient)"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#6366f1" />
                                                    <stop offset="100%" stopColor="#818cf8" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        {/* Labels */}
                                        <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1">
                                            {['24 Feb', '1 Mar', '6 Mar', '9 Mar'].map(d => (
                                                <span key={d} className="text-[8px] font-bold text-gray-500">{d}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className={`flex-1 p-6 rounded-3xl border flex flex-col ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/5'}`}>
                                    <div className="flex items-center gap-2 mb-6">
                                        <Activity className="w-4 h-4 text-purple-500" />
                                        <h4 className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-gray-900' : 'text-gray-400'}`}>Recent Activity</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { user: 'Siddharth M.', action: 'Cleared AI Interview', time: '2m ago' },
                                            { user: 'Rahul K.', action: 'Resume Score: 85', time: '15m ago' },
                                            { user: 'Ananya S.', action: 'New placement offer', time: '1h ago' },
                                            { user: 'Priya D.', action: 'Skill Badge earned', time: '3h ago' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'}`}>
                                                        {item.user[0]}
                                                    </div>
                                                    <div>
                                                        <p className={`text-[11px] font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.user}</p>
                                                        <p className="text-[9px] text-gray-500 font-medium">{item.action}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] text-gray-500 font-bold whitespace-nowrap">{item.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Trust Strip ── */}
            <section className="py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className={`rounded-2xl border p-8 text-center ${isLight
                        ? 'bg-white border-gray-100 shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06]'}`}>
                        <p className={`text-sm font-semibold uppercase tracking-widest mb-6 ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
                            Trusted by students from
                        </p>
                        <div className={`flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-bold ${isLight ? 'text-gray-300' : 'text-gray-600'}`}>
                            {['IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'VIT', 'SRM', 'Manipal'].map(name => (
                                <span key={name}>{name}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Smart CTA Section ── */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`relative overflow-hidden rounded-[3rem] border transition-all ${isLight ? 'bg-white border-gray-100 shadow-2xl shadow-indigo-100' : 'bg-[#080C16] border-white/10 shadow-black'}`}
                    >
                        {/* Background Effects */}
                        <div className="absolute top-0 left-0 w-full h-full">
                            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
                            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
                        </div>

                        <div className="relative z-10 flex flex-col lg:flex-row items-center">
                            {/* Left Content */}
                            <div className="flex-1 p-8 md:p-16 text-center lg:text-left">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-sm font-bold mb-6"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    8x Higher Chance of Placement
                                </motion.div>
                                <h2 className={`text-3xl md:text-5xl font-black mb-6 leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                    Ready to turn skills <br />
                                    into <span className="text-blue-500 italic">offers?</span>
                                </h2>
                                <p className={`text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Join the elite group of students who stopped guessing and started preparing. Use AI to fix your resume, ace interviews, and get recommended to top companies.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                                    <Link href="/register"
                                        className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                                        Free Preparation <ArrowRight className="w-5 h-5" />
                                    </Link>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                        No Credit Card Required
                                    </div>
                                </div>

                                <div className="flex items-center justify-center lg:justify-start -space-x-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`w-10 h-10 rounded-full border-2 ${isLight ? 'border-white bg-gray-100' : 'border-[#080C16] bg-gray-800'} overflow-hidden`}>
                                            <Image
                                                src={`https://i.pravatar.cc/150?u=${i + 10}`}
                                                alt="User"
                                                width={40}
                                                height={40}
                                            />
                                        </div>
                                    ))}
                                    <div className={`px-4 py-2 rounded-full text-xs font-bold ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-gray-400'}`}>
                                        +50k Prepared
                                    </div>
                                </div>
                            </div>

                            {/* Right Visual - Smart Feature Preview */}
                            <div className={`flex-1 w-full p-8 lg:p-16 ${isLight ? 'bg-gray-50/50' : 'bg-white/[0.02]'}`}>
                                <div className="relative">
                                    {/* Score Card */}
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        className={`p-6 rounded-[2rem] border shadow-2xl relative z-20 ${isLight ? 'bg-white border-gray-100' : 'bg-[#0B0F19] border-white/10'}`}
                                    >
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                                    <Target className="w-5 h-5 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Placement Score</p>
                                                    <h4 className={`text-xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>Advanced</h4>
                                                </div>
                                            </div>
                                            <div className="text-3xl font-black text-blue-500">88%</div>
                                        </div>

                                        <div className="space-y-4">
                                            {[
                                                { label: 'Technical Interview', val: 92, color: 'bg-blue-500' },
                                                { label: 'ATS Resume Score', val: 85, color: 'bg-indigo-500' },
                                                { label: 'Behavioral Prep', val: 78, color: 'bg-violet-500' }
                                            ].map((stat, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between text-xs font-bold mb-1">
                                                        <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>{stat.label}</span>
                                                        <span className={isLight ? 'text-gray-900' : 'text-white'}>{stat.val}%</span>
                                                    </div>
                                                    <div className={`h-1.5 w-full rounded-full ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${stat.val}%` }}
                                                            className={`h-full rounded-full ${stat.color}`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={`mt-8 pt-6 border-t ${isLight ? 'border-gray-50' : 'border-white/5'} flex items-center justify-between`}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">Interview Ready</span>
                                            </div>
                                            <button className="text-[10px] items-center flex gap-1 font-bold text-blue-500 uppercase hover:underline">
                                                View Skills <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* Floating Badges */}
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -top-6 -right-6 p-4 rounded-2xl glass-premium shadow-xl border border-white/20 z-30"
                                    >
                                        <Briefcase className="w-6 h-6 text-orange-500" />
                                    </motion.div>

                                    <motion.div
                                        animate={{ y: [0, 10, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -bottom-10 -left-6 p-4 rounded-2xl glass-premium shadow-xl border border-white/20 z-30"
                                    >
                                        <Award className="w-6 h-6 text-yellow-500" />
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
