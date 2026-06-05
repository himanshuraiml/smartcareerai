'use client';

import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import {
    ArrowRight, FileText, Zap, Mic, Rocket,
    Check, TrendingUp, ChevronRight, Sparkles, ShieldCheck,
    Building2, Briefcase, Target, BrainCircuit, LayoutDashboard, Award,
    Cpu, Code2, Binary, Sliders, Trash2, GripVertical, Activity,
    Flame, FlaskConical, AlertCircle, Star, Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// ── Stagger animation helper ──
const EASE_CUBIC: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay, ease: EASE_CUBIC },
});

const MotionDiv = motion.div;

// ── Section label pill ──
function SectionLabel({ icon: Icon, text, color }: { icon: any; text: string; color: string }) {
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border ${color}`}>
            <Icon className="w-3.5 h-3.5" />
            {text}
        </div>
    );
}

// ── Stat card ──
function StatCard({ value, label, sub, isLight }: { value: string; label: string; sub?: string; isLight: boolean }) {
    return (
        <div className={`px-6 py-5 rounded-xl border flex flex-col gap-1 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
        }`}>
            <span className={`text-2xl font-bold tracking-tight font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</span>
            <span className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>{label}</span>
            {sub && <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>{sub}</span>}
        </div>
    );
}

export default function HomePage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const bg = isLight ? 'bg-[#F7F9FC]' : 'bg-[#050B18]';
    const cardBg = isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-500' : 'text-[#8FA5C7]';
    const borderSubtle = isLight ? 'border-slate-100' : 'border-[rgba(43,127,255,0.08)]';

    return (
        <div className={`min-h-screen overflow-hidden ${bg}`}>
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
                        description: 'AI-powered placement preparation platform helping students get hired.',
                        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1250' }
                    })
                }}
            />

            <Navbar />

            {/* ── PAGE-LEVEL ambient glow (one, not six) ── */}
            {!isLight && (
                <div
                    className="pointer-events-none fixed inset-0 z-0"
                    style={{
                        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(43,127,255,0.1) 0%, transparent 70%)',
                    }}
                />
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* ── HERO ── */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="relative pt-36 pb-24 lg:pt-52 lg:pb-32 px-4 z-10">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Left: copy */}
                    <MotionDiv
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 text-center lg:text-left"
                    >
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border ${
                            isLight
                                ? 'bg-[#2B7FFF]/6 border-[#2B7FFF]/20 text-[#1B5FD8]'
                                : 'bg-[#2B7FFF]/10 border-[#2B7FFF]/25 text-[#5BA3FF]'
                        }`}>
                            <Sparkles className="w-3.5 h-3.5" />
                            AI-Powered Career Transformation
                        </div>

                        <h1
                            className={`font-display mb-6 ${textPrimary}`}
                            style={{ fontSize: 'var(--text-hero)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em' }}
                        >
                            Skills that prove<br />
                            <span
                                style={{
                                    background: 'linear-gradient(135deg, #2B7FFF 0%, #5BA3FF 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                you're hired.
                            </span>
                        </h1>

                        <p className={`text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed ${textSecondary}`}>
                            PlaceNxt gives you validated, AI-scored proof of your talent — resume analysis, mock interviews, and skill badges — so recruiters see exactly what you can do.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-10">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#2B7FFF] text-white font-semibold text-base transition-all duration-150 hover:bg-[#1A6EEE] hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_16px_rgba(43,127,255,0.35)] flex items-center justify-center gap-2"
                            >
                                Start for free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/solutions"
                                className={`w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-base border transition-all duration-150 flex items-center justify-center gap-2 ${
                                    isLight
                                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        : 'bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08]'
                                }`}
                            >
                                See how it works
                            </Link>
                        </div>

                        {/* Trust signals */}
                        <div className={`flex items-center justify-center lg:justify-start gap-5 text-xs font-medium ${textSecondary}`}>
                            {['No credit card required', 'Free plan forever', '50,000+ students'].map((t, i) => (
                                <span key={i} className="flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    {t}
                                </span>
                            ))}
                        </div>
                    </MotionDiv>

                    {/* Right: pixel-perfect dashboard mockup */}
                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 w-full"
                    >
                        <div className={`relative w-full rounded-2xl border shadow-2xl overflow-hidden ${
                            isLight
                                ? 'bg-white border-slate-200 shadow-slate-300/30'
                                : 'bg-[#091324] border-[rgba(43,127,255,0.15)] shadow-black/60'
                        }`}>
                            {/* Window chrome */}
                            <div className={`flex items-center gap-2 px-4 py-3 border-b ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#0E1E38] border-[rgba(43,127,255,0.1)]'}`}>
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                <div className={`ml-3 flex-1 h-5 rounded-md text-[10px] font-medium flex items-center px-3 ${isLight ? 'bg-slate-200 text-slate-500' : 'bg-[#142848] text-[#4A6080]'}`}>
                                    placenxt.com/dashboard
                                </div>
                            </div>

                            <div className="flex min-h-[380px]">
                                {/* Compact sidebar */}
                                <div className={`w-14 flex flex-col items-center py-5 gap-4 border-r ${isLight ? 'bg-white border-slate-100' : 'bg-[#091324] border-[rgba(43,127,255,0.08)]'}`}>
                                    <div className="w-8 h-8 rounded-lg bg-[#2B7FFF] flex items-center justify-center">
                                        <Rocket className="w-4 h-4 text-white" />
                                    </div>
                                    {[LayoutDashboard, FileText, Zap, Mic, BrainCircuit, Briefcase].map((Icon, i) => (
                                        <div key={i} className={`p-2 rounded-lg transition-colors ${
                                            i === 0
                                                ? isLight ? 'bg-[#2B7FFF]/10 text-[#2B7FFF]' : 'bg-[#2B7FFF]/15 text-[#5BA3FF]'
                                                : isLight ? 'text-slate-300' : 'text-[#4A6080]'
                                        }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    ))}
                                </div>

                                {/* Main dashboard area */}
                                <div className="flex-1 p-5 space-y-4 overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <p className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Dashboard</p>
                                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>Welcome back, Arjun</p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${isLight ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                            <Flame className="w-3 h-3" /> 12-day streak
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'ATS Score', value: '82%', delta: '+14', color: 'text-[#2B7FFF]' },
                                            { label: 'Interviews', value: '6', delta: '2 left', color: 'text-emerald-500' },
                                            { label: 'Badges', value: '4', delta: '+1 new', color: 'text-violet-500' },
                                        ].map((s, i) => (
                                            <div key={i} className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#0E1E38] border-[rgba(43,127,255,0.1)]'}`}>
                                                <p className={`text-[9px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>{s.label}</p>
                                                <p className={`text-lg font-bold font-display mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.value}</p>
                                                <p className={`text-[9px] font-medium ${s.color}`}>{s.delta}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Score bar */}
                                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#0E1E38] border-[rgba(43,127,255,0.1)]'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className={`text-[10px] font-semibold ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>Placement Readiness</p>
                                            <span className={`text-xs font-bold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>82 / 100</span>
                                        </div>
                                        {[
                                            { label: 'Resume', val: 88 },
                                            { label: 'Interview', val: 72 },
                                            { label: 'Skills', val: 94 },
                                        ].map((bar, i) => (
                                            <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
                                                <p className={`text-[9px] w-12 flex-shrink-0 font-medium ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>{bar.label}</p>
                                                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#142848]'}`}>
                                                    <div
                                                        className="h-full rounded-full bg-[#2B7FFF]"
                                                        style={{ width: `${bar.val}%` }}
                                                    />
                                                </div>
                                                <p className={`text-[9px] w-7 text-right font-medium ${isLight ? 'text-slate-500' : 'text-[#4A6080]'}`}>{bar.val}%</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Recent activity */}
                                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#0E1E38] border-[rgba(43,127,255,0.1)]'}`}>
                                        <p className={`text-[9px] font-semibold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>Recent Activity</p>
                                        <div className="space-y-2.5">
                                            {[
                                                { action: 'Resume scanned by Infosys', time: '2m ago', icon: FileText, color: 'text-[#2B7FFF] bg-[#2B7FFF]/10' },
                                                { action: 'Mock Interview completed — 78%', time: '1h ago', icon: Mic, color: 'text-emerald-500 bg-emerald-500/10' },
                                                { action: 'Python skill badge earned', time: '3h ago', icon: Award, color: 'text-violet-500 bg-violet-500/10' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-2.5">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                                                        <item.icon className="w-3 h-3" />
                                                    </div>
                                                    <p className={`text-[10px] font-medium flex-1 leading-tight ${isLight ? 'text-slate-700' : 'text-[#8FA5C7]'}`}>{item.action}</p>
                                                    <p className={`text-[9px] flex-shrink-0 ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>{item.time}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </MotionDiv>
                </div>
            </section>

            {/* ── TRUST STRIP ── */}
            <section className="py-10 px-4 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className={`rounded-xl border px-8 py-6 ${isLight ? 'bg-white border-slate-200' : 'bg-[#091324]/70 border-[rgba(43,127,255,0.1)]'}`}>
                        <p className={`text-center text-[10px] font-semibold uppercase tracking-widest mb-5 ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>
                            Trusted by 50,000+ students from
                        </p>
                        <div className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold font-display ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>
                            {['IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'VIT', 'SRM', 'Manipal', 'DSCE'].map(name => (
                                <span key={name} className={`transition-colors hover:${isLight ? 'text-slate-700' : 'text-[#8FA5C7]'}`}>{name}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* ── FEATURE: FOR RECRUITERS ── */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="py-24 px-4 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <MotionDiv {...fadeUp()} className="flex-1">
                        <SectionLabel icon={Briefcase} text="Recruiter Intelligence" color={
                            isLight
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        } />
                        <h2
                            className={`font-display mb-6 ${textPrimary}`}
                            style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}
                        >
                            Hire on verified skills,<br />
                            <span className="text-emerald-500">not resume keywords.</span>
                        </h2>
                        <ul className="space-y-5 mb-8">
                            {[
                                { title: 'Pre-Vetted Candidate Pools', desc: 'Access students who have already passed AI-led mock interviews and technical assessments — zero cold screening.' },
                                { title: 'Objective Skill Ranking', desc: 'Our AI ranks candidates by actual skill scores, not keyword density. See who can perform on day one.' },
                                { title: '80% Reduction in Hiring Time', desc: 'Stop filtering hundreds of CVs. Let PlaceNxt surface your top three candidates automatically.' },
                            ].map((point, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold mb-0.5 ${textPrimary}`}>{point.title}</p>
                                        <p className={`text-sm leading-relaxed ${textSecondary}`}>{point.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Link href="/solutions/recruiter" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2B7FFF] hover:gap-3 transition-all duration-200">
                            See recruiter features <ArrowRight className="w-4 h-4" />
                        </Link>
                    </MotionDiv>

                    <MotionDiv {...fadeUp(0.1)} className="flex-1 w-full">
                        <div className={`rounded-2xl p-6 border shadow-lg relative overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.15)]'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#2B7FFF]" />
                                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-[#8FA5C7]'}`}>Hiring Pipeline</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-semibold ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/[0.05] text-[#4A6080]'}`}>
                                    5 Active Stages
                                </span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { id: 1, title: 'Behavioural Assessment', icon: BrainCircuit, color: 'violet' },
                                    { id: 2, title: 'Analytical Reasoning', icon: Cpu, color: 'blue' },
                                    { id: 3, title: 'Coding Test', icon: Code2, color: 'emerald' },
                                    { id: 4, title: 'Technical Interview', icon: Binary, color: 'cyan' },
                                    { id: 5, title: 'HR Interview', icon: Users, color: 'rose', actions: true },
                                ].map((stage, i) => (
                                    <MotionDiv
                                        key={stage.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                        className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                                            isLight
                                                ? 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm'
                                                : 'bg-[#0E1E38] border-[rgba(43,127,255,0.08)] hover:border-[rgba(43,127,255,0.2)]'
                                        }`}
                                    >
                                        <GripVertical className={`w-3.5 h-3.5 flex-shrink-0 ${isLight ? 'text-slate-300' : 'text-[#4A6080]/50'}`} />
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${stage.color}-500/10`}>
                                            <stage.icon className={`w-4.5 h-4.5 text-${stage.color}-500`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 ${isLight ? 'bg-slate-800 text-white' : 'bg-white/10 text-white'}`}>
                                                    {stage.id}
                                                </span>
                                                <p className={`text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{stage.title}</p>
                                            </div>
                                            <p className={`text-[9px] font-medium mt-0.5 ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>Auto-advance · AI scored</p>
                                        </div>
                                        {stage.actions && (
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Sliders className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`} />
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </div>
                                        )}
                                    </MotionDiv>
                                ))}
                            </div>
                        </div>
                    </MotionDiv>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* ── FEATURE: FOR UNIVERSITIES ── */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className={`py-24 px-4 relative z-10 ${isLight ? 'bg-[#F0F4FA]' : ''}`}>
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
                    <MotionDiv {...fadeUp()} className="flex-1">
                        <SectionLabel icon={Building2} text="Institution Analytics" color={
                            isLight
                                ? 'bg-violet-50 border-violet-200 text-violet-700'
                                : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                        } />
                        <h2
                            className={`font-display mb-6 ${textPrimary}`}
                            style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}
                        >
                            Elevate your<br />
                            <span className="text-violet-500">placement record.</span>
                        </h2>
                        <ul className="space-y-5 mb-8">
                            {[
                                { title: 'Batch-Level Analytics', desc: 'Monitor the preparation progress of every student cohort in real time — spot at-risk students before deadlines.' },
                                { title: 'Industry-Aligned Curriculum', desc: 'Bridge the gap between academia and market demand with AI-curated skill insights by sector.' },
                                { title: 'Co-Branded Placement Portal', desc: 'Give students a premium, university-branded experience — white-labeled under your institution\'s identity.' },
                            ].map((point, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400'}`}>
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold mb-0.5 ${textPrimary}`}>{point.title}</p>
                                        <p className={`text-sm leading-relaxed ${textSecondary}`}>{point.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Link href="/solutions/university" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-500 hover:gap-3 transition-all duration-200">
                            Explore institution plans <ArrowRight className="w-4 h-4" />
                        </Link>
                    </MotionDiv>

                    <MotionDiv {...fadeUp(0.1)} className="flex-[1.4] w-full">
                        <div className={`rounded-2xl p-6 border shadow-lg ${isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.15)]'}`}>
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-violet-500" />
                                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-[#8FA5C7]'}`}>Placement Dashboard</span>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                    <FlaskConical className="w-2.5 h-2.5" /> Demo data
                                </span>
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                                {[
                                    { label: 'Registered', val: '1,280', sub: '+12% this month', icon: Users, color: 'text-[#2B7FFF]', bg: 'bg-[#2B7FFF]/10' },
                                    { label: 'Placed', val: '840', sub: '65.6% rate', icon: Award, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                                    { label: 'Avg Score', val: '78/100', sub: '+5.4% up', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    { label: 'Interviews', val: '124', sub: 'Last 7 days', icon: Briefcase, color: 'text-[#2B7FFF]', bg: 'bg-[#2B7FFF]/10' },
                                    { label: 'At Risk', val: '12', sub: 'Action needed', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                                    { label: 'Offers', val: '318', sub: 'This semester', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                ].map((stat, i) => (
                                    <div key={i} className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#0E1E38] border-[rgba(43,127,255,0.08)]'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[9px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>{stat.label}</span>
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                                <stat.icon className="w-3 h-3" />
                                            </div>
                                        </div>
                                        <p className={`text-base font-bold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>{stat.val}</p>
                                        <p className={`text-[9px] font-medium mt-0.5 ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>{stat.sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Mini chart */}
                            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#0E1E38] border-[rgba(43,127,255,0.08)]'}`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="w-3.5 h-3.5 text-[#2B7FFF]" />
                                    <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>Placement Activity Trend</span>
                                </div>
                                <div className="relative h-28">
                                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 60" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#2B7FFF" stopOpacity="0.15" />
                                                <stop offset="100%" stopColor="#2B7FFF" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <motion.path
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.5, ease: 'easeOut' }}
                                            d="M0,52 C10,50 15,46 25,38 S40,28 50,22 S65,14 75,10 S90,6 100,2"
                                            fill="none"
                                            stroke="#2B7FFF"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M0,52 C10,50 15,46 25,38 S40,28 50,22 S65,14 75,10 S90,6 100,2 L100,60 L0,60Z"
                                            fill="url(#trendFill)"
                                        />
                                    </svg>
                                    <div className="absolute -bottom-1 left-0 right-0 flex justify-between">
                                        {['Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                                            <span key={m} className={`text-[8px] font-medium ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>{m}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </MotionDiv>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* ── RESULTS: DATA CARDS (replaces testimonials) ── */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="py-24 px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <MotionDiv {...fadeUp()} className="text-center mb-14">
                        <SectionLabel icon={Star} text="Real Results" color={
                            isLight
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        } />
                        <h2
                            className={`font-display mb-4 ${textPrimary}`}
                            style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}
                        >
                            Numbers that matter
                        </h2>
                        <p className={`text-base max-w-lg mx-auto ${textSecondary}`}>
                            From tier-2 colleges to top-10 companies — tracked, measured, verified.
                        </p>
                    </MotionDiv>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            {
                                label: 'ATS Score Improvement',
                                before: '42%', after: '91%',
                                delta: '+49 points',
                                desc: 'Average score jump after following PlaceNxt\'s AI resume recommendations',
                                color: 'text-[#2B7FFF]', border: 'border-[#2B7FFF]/20', bg: 'bg-[#2B7FFF]/6',
                                icon: Target,
                            },
                            {
                                label: 'Interview Pass Rate',
                                before: '28%', after: '74%',
                                delta: '2.6× improvement',
                                desc: 'Students who complete 5+ AI mock interviews clear technical rounds at 2.6× higher rates',
                                color: 'text-emerald-500', border: 'border-emerald-500/20', bg: 'bg-emerald-500/6',
                                icon: Mic,
                            },
                            {
                                label: 'Time to First Offer',
                                before: '6.2 months', after: '2.4 months',
                                delta: '61% faster',
                                desc: 'Median time from platform signup to receiving first job offer from a matched employer',
                                color: 'text-violet-500', border: 'border-violet-500/20', bg: 'bg-violet-500/6',
                                icon: Zap,
                            },
                        ].map((card, i) => (
                            <MotionDiv
                                key={card.label}
                                {...fadeUp(i * 0.08)}
                                className={`relative rounded-2xl p-6 border overflow-hidden ${
                                    isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                                }`}
                            >
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${card.bg} ${card.color} border ${card.border}`}>
                                    <card.icon className="w-5 h-5" />
                                </div>

                                <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>
                                    {card.label}
                                </p>

                                {/* Before / after */}
                                <div className="flex items-end gap-3 mb-3">
                                    <div>
                                        <p className={`text-[10px] mb-0.5 ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>Before</p>
                                        <p className={`text-lg font-bold font-display line-through ${isLight ? 'text-slate-300' : 'text-[#4A6080]'}`}>{card.before}</p>
                                    </div>
                                    <ArrowRight className={`w-4 h-4 mb-1 flex-shrink-0 ${card.color}`} />
                                    <div>
                                        <p className={`text-[10px] mb-0.5 font-medium ${card.color}`}>After</p>
                                        <p className={`text-2xl font-bold font-display ${card.color}`}>{card.after}</p>
                                    </div>
                                </div>

                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-4 ${card.bg} ${card.color} border ${card.border}`}>
                                    <TrendingUp className="w-3 h-3" /> {card.delta}
                                </div>

                                <p className={`text-xs leading-relaxed ${textSecondary}`}>{card.desc}</p>
                            </MotionDiv>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <Link href="/success-stories" className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[#4A6080] hover:text-[#8FA5C7]'}`}>
                            Read success stories <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* ── CTA ── */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="py-20 px-4 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <MotionDiv
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative overflow-hidden rounded-2xl border ${
                            isLight
                                ? 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
                                : 'bg-[#091324] border-[rgba(43,127,255,0.18)]'
                        }`}
                    >
                        {/* Subtle corner glow — dark mode only */}
                        {!isLight && (
                            <div
                                className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
                                style={{ background: 'radial-gradient(circle at top right, rgba(43,127,255,0.12) 0%, transparent 70%)' }}
                            />
                        )}

                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-0">
                            {/* Left */}
                            <div className="flex-1 p-10 md:p-14 text-center lg:text-left">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border ${
                                    isLight ? 'bg-[#2B7FFF]/6 border-[#2B7FFF]/20 text-[#1B5FD8]' : 'bg-[#2B7FFF]/10 border-[#2B7FFF]/25 text-[#5BA3FF]'
                                }`}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    8× higher placement odds
                                </div>
                                <h2
                                    className={`font-display mb-5 ${textPrimary}`}
                                    style={{ fontSize: 'var(--text-h2)', fontWeight: 700, lineHeight: 1.15 }}
                                >
                                    Turn your skills<br />into offers.
                                </h2>
                                <p className={`text-base mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed ${textSecondary}`}>
                                    Join 50,000+ students who stopped guessing and started proving their skills. Free forever, no credit card needed.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-7">
                                    <Link
                                        href="/register"
                                        className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#2B7FFF] text-white font-semibold text-base transition-all duration-150 hover:bg-[#1A6EEE] hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_16px_rgba(43,127,255,0.35)] flex items-center justify-center gap-2"
                                    >
                                        Get started free <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <div className="flex items-center gap-2 text-sm font-medium text-[#4A6080]">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        No credit card required
                                    </div>
                                </div>

                                {/* Social proof */}
                                <div className={`flex items-center gap-4 justify-center lg:justify-start text-xs ${textSecondary}`}>
                                    <div className="flex -space-x-2">
                                        {['#2B7FFF', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'].map((c, i) => (
                                            <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-[#091324] flex items-center justify-center text-white text-[9px] font-bold" style={{ background: c }}>
                                                {['A', 'P', 'M', 'R', 'S'][i]}
                                            </div>
                                        ))}
                                    </div>
                                    <span>50,000+ students placed</span>
                                </div>
                            </div>

                            {/* Right: stats column */}
                            <div className={`w-full lg:w-72 flex-shrink-0 p-10 md:p-12 space-y-4 ${isLight ? 'bg-[#F0F4FA]' : 'bg-[#0E1E38]/60'} lg:self-stretch flex flex-col justify-center`}>
                                {[
                                    { value: '82%', label: 'avg ATS score gain', icon: Target },
                                    { value: '2.6×', label: 'interview pass rate', icon: Mic },
                                    { value: '61%', label: 'faster to first offer', icon: Zap },
                                    { value: '4.8★', label: 'rated by 1,250 students', icon: Star },
                                ].map((s, i) => (
                                    <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'}`}>
                                        <div className="w-9 h-9 rounded-lg bg-[#2B7FFF]/10 flex items-center justify-center flex-shrink-0">
                                            <s.icon className="w-4 h-4 text-[#2B7FFF]" />
                                        </div>
                                        <div>
                                            <p className={`text-lg font-bold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.value}</p>
                                            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#4A6080]'}`}>{s.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </MotionDiv>
                </div>
            </section>

            <Footer />
        </div>
    );
}
