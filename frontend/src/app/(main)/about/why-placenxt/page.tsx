'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
    Cpu, 
    CheckCircle, 
    XCircle, 
    Users, 
    GraduationCap, 
    Briefcase, 
    ShieldCheck, 
    Award, 
    ArrowRight,
    Star,
    Sparkles,
    BarChart3
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useTheme } from '@/providers/ThemeProvider';

const PILLARS = [
    {
        id: 'students',
        icon: GraduationCap,
        title: 'For Students',
        subtitle: 'Land your dream role, faster.',
        color: 'from-blue-500 to-indigo-600',
        badge: 'Bridge the Skill Gap',
        features: [
            { title: 'AI ATS Scorer', desc: 'Instantly score and optimize your resume against specific job descriptions before applying.' },
            { title: 'Interactive Mock Interviews', desc: 'Practice with a real-time conversational AI interviewer trained on exact role competencies.' },
            { title: 'Verified Skill Badges', desc: 'Pass standard assessments to earn credentials that companies trust unconditionally.' }
        ]
    },
    {
        id: 'recruiters',
        icon: Briefcase,
        title: 'For Recruiters',
        subtitle: 'Hire pre-vetted, elite talent.',
        color: 'from-violet-500 to-fuchsia-600',
        badge: 'Zero-Screening Recalls',
        features: [
            { title: 'Direct-to-Vetted Pools', desc: 'Skip the stack of unverified resumes. Access candidates with certified skill badges.' },
            { title: 'Automated AI Screenings', desc: 'Let our conversational agent conduct initial video/chat screenings, scoring behavioral and technical fit.' },
            { title: 'Visual Kanban Pipelines', desc: 'Track, manage, and communicate with candidates seamlessly through an intuitive CRM.' }
        ]
    },
    {
        id: 'universities',
        icon: Users,
        title: 'For Universities',
        subtitle: 'Supercharge batch placement rates.',
        color: 'from-emerald-500 to-teal-600',
        badge: 'Placement Cell Operating System',
        features: [
            { title: 'Real-time Cohort Analytics', desc: 'Monitor the preparation, resume health, and test scores of the entire batch in a single dashboard.' },
            { title: 'Automated Outreach', desc: 'Invite partner recruiters to browse pre-verified candidate lists automatically.' },
            { title: 'Vetting Standardizations', desc: 'Administer internal institutional tests using the same assessment engine trusted by recruiters.' }
        ]
    }
];

const COMPARISON = [
    {
        metric: 'Resume Credibility',
        traditional: 'Self-declared, unverified claims. High risk of fraud or inflation.',
        placenxt: 'Verified credentials. Badges tied to proctored skill tests and AI resume validations.',
        highlight: true
    },
    {
        metric: 'Screening Process',
        traditional: 'Manual screening of thousands of resumes. Highly prone to bias and delays.',
        placenxt: 'Automated AI scoring and simulated pre-interviews to shortlist top performers instantly.',
        highlight: false
    },
    {
        metric: 'Candidate Preparation',
        traditional: 'Passive learning. No feedback on why applications get rejected.',
        placenxt: 'Active preparation. Generates detailed ATS gap analysis and custom mock interviews.',
        highlight: true
    },
    {
        metric: 'Time-to-Hire',
        traditional: '3 to 6 weeks spent sourcing, scheduling, and screening early-stage candidates.',
        placenxt: '2 to 5 days. Reach out directly to already-vetted, matching profiles.',
        highlight: false
    }
];

const STATS = [
    { value: '80%', label: 'Reduction in Screening Time', desc: 'Recruiters skip manual screening entirely.' },
    { value: '3.5x', label: 'Higher Interview Rates', desc: 'Verified badged students get fast-tracked.' },
    { value: '100%', label: 'Skill Verification Integrity', desc: 'Assessments are secure and proctored.' }
];

export default function WhyPlaceNxtPage() {
    const { resolvedTheme } = useTheme();
    const isLightMode = resolvedTheme === 'light';
    const [activePillar, setActivePillar] = useState('students');

    const cardBg = isLightMode 
        ? 'bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)]' 
        : 'bg-[#091324]/50 border-[rgba(43,127,255,0.08)] backdrop-blur-xl';

    const textMuted = isLightMode ? 'text-slate-500' : 'text-[#8FA5C7]';
    const textTitle = isLightMode ? 'text-slate-900' : 'text-white';
    
    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isLightMode ? 'bg-[#F7F9FC]' : 'bg-[#050B18] text-white'}`}>
            <Navbar />

            {/* Ambient Background Glows */}
            {!isLightMode && (
                <>
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
                    <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />
                </>
            )}

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-4 relative z-10">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border ${
                            isLightMode 
                                ? 'bg-blue-50 border-blue-200/80 text-blue-600' 
                                : 'bg-[#2B7FFF]/10 border-[#2B7FFF]/20 text-[#5BA3FF]'
                        }`}>
                            <Cpu className="w-3.5 h-3.5" />
                            THE PLACENXT ADVANTAGE
                        </span>
                        
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-[1.08] bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
                            Why Choose PlaceNxt?
                        </h1>
                        
                        <p className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10 ${textMuted}`}>
                            Traditional recruitment processes are slow, manual, and full of uncertainty. PlaceNxt is an AI-first career platform built to align student preparation, university placement tracking, and recruiter sourcing in one unified ecosystem.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Dashboard Layout */}
            <section className="pb-16 px-4 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {STATS.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className={`p-8 rounded-2xl border ${cardBg}`}
                            >
                                <p className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500 mb-2">
                                    {stat.value}
                                </p>
                                <h3 className={`font-bold text-sm mb-1 ${textTitle}`}>{stat.label}</h3>
                                <p className={`text-xs ${textMuted}`}>{stat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interactive Pillar Section */}
            <section className="py-16 px-4 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-4">Unified Career Platform</h2>
                        <p className={`max-w-xl mx-auto text-sm ${textMuted}`}>
                            Explore how PlaceNxt tailors its AI-driven features to provide value to every stakeholder.
                        </p>
                    </div>

                    {/* Pillar Navigation Pills */}
                    <div className="flex justify-center gap-2 mb-12">
                        {PILLARS.map((p) => {
                            const Icon = p.icon;
                            const isActive = activePillar === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setActivePillar(p.id)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : isLightMode
                                                ? 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                                : 'bg-[#091324]/50 hover:bg-[#0E1E38] text-[#8FA5C7] border border-white/5'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {p.title}
                                </button>
                            );
                        })}
                    </div>

                    {/* Pillar Panel Card */}
                    <div className="relative min-h-[350px]">
                        <AnimatePresence mode="wait">
                            {PILLARS.map((p) => {
                                if (p.id !== activePillar) return null;
                                return (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.25 }}
                                        className={`grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 md:p-12 rounded-3xl border ${cardBg}`}
                                    >
                                        {/* Left Side: General Overview */}
                                        <div className="lg:col-span-5 flex flex-col justify-center">
                                            <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r ${p.color} text-white mb-4`}>
                                                {p.badge}
                                            </span>
                                            <h3 className="text-2xl md:text-3xl font-black mb-4 tracking-tight">
                                                {p.subtitle}
                                            </h3>
                                            <p className={`text-sm leading-relaxed mb-6 ${textMuted}`}>
                                                By automating intelligence metrics and removing manual friction, PlaceNxt ensures candidate outcomes are transparent, accessible, and fast.
                                            </p>
                                        </div>

                                        {/* Right Side: Features List */}
                                        <div className="lg:col-span-7 space-y-6">
                                            {p.features.map((f, index) => (
                                                <div 
                                                    key={index}
                                                    className={`p-5 rounded-2xl border transition-all ${
                                                        isLightMode
                                                            ? 'bg-slate-50 border-slate-100'
                                                            : 'bg-[#0E1E38]/30 border-white/[0.03]'
                                                    }`}
                                                >
                                                    <h4 className="font-bold text-sm mb-1.5 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        {f.title}
                                                    </h4>
                                                    <p className={`text-xs leading-relaxed pl-3.5 ${textMuted}`}>
                                                        {f.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* Comparison Grid Section */}
            <section className="py-16 px-4 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-4">How PlaceNxt Differs</h2>
                        <p className={`max-w-xl mx-auto text-sm ${textMuted}`}>
                            Traditional recruitment relies on self-reported assertions. PlaceNxt builds trust via automated, verifiable assessments.
                        </p>
                    </div>

                    <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b ${isLightMode ? 'border-slate-200 bg-slate-50/50' : 'border-white/5 bg-[#091324]/80'}`}>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${textTitle}`}>Capability</th>
                                        <th className="p-6 text-xs font-bold uppercase tracking-wider text-red-500/80">Traditional Methods</th>
                                        <th className="p-6 text-xs font-bold uppercase tracking-wider text-emerald-500/80">PlaceNxt Platform</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                    {COMPARISON.map((row, i) => (
                                        <tr 
                                            key={i} 
                                            className={`transition-colors ${
                                                row.highlight 
                                                    ? isLightMode 
                                                        ? 'bg-blue-50/20' 
                                                        : 'bg-blue-500/[0.015]' 
                                                    : ''
                                            }`}
                                        >
                                            <td className={`p-6 text-sm font-bold ${textTitle}`}>
                                                {row.metric}
                                            </td>
                                            <td className={`p-6 text-xs leading-relaxed ${textMuted} flex items-start gap-2`}>
                                                <XCircle className="w-4 h-4 text-red-500/80 flex-shrink-0 mt-0.5" />
                                                <span>{row.traditional}</span>
                                            </td>
                                            <td className={`p-6 text-xs leading-relaxed ${isLightMode ? 'text-slate-800' : 'text-slate-200'} font-medium`}>
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span>{row.placenxt}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Tech Advantage */}
            <section className="py-16 px-4 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <span className="text-xs font-bold text-blue-500 tracking-wider uppercase mb-3 block">INTELLIGENT RECRUITING</span>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
                                Powering outcomes with reliable AI credentials.
                            </h2>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm mb-1 ${textTitle}`}>Fine-Tuned GPT Evaluation</h4>
                                        <p className={`text-xs leading-relaxed ${textMuted}`}>
                                            Our algorithms assess responses, resumes, and code samples dynamically, matching recruiters criteria with zero bias.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center flex-shrink-0">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm mb-1 ${textTitle}`}>Secure Proctoring Standards</h4>
                                        <p className={`text-xs leading-relaxed ${textMuted}`}>
                                            Skill tests utilize advanced client-side camera tracking and window-focus checks to ensure score integrity.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm mb-1 ${textTitle}`}>Dynamic Gap Analysis</h4>
                                        <p className={`text-xs leading-relaxed ${textMuted}`}>
                                            Whenever a student falls short on a skill, PlaceNxt pinpoints exactly what concepts to study to raise their profile score.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Mock-up */}
                        <div className={`p-8 rounded-3xl border flex flex-col justify-center min-h-[350px] relative overflow-hidden ${cardBg}`}>
                            {/* Decorative background circle */}
                            <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">Candidate Report</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 font-bold">VERIFIED PROFILE</span>
                                </div>
                                
                                <div className="space-y-2">
                                    <h4 className={`font-bold text-base ${textTitle}`}>Ananya Sen</h4>
                                    <p className="text-xs opacity-75">B.Tech Computer Science — Class of 2026</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-2">
                                    <div className={`p-3.5 rounded-xl border ${isLightMode ? 'bg-slate-50' : 'bg-[#0E1E38]/20'}`}>
                                        <span className="text-[10px] block opacity-60 mb-0.5">Resume ATS Compatibility</span>
                                        <span className="text-lg font-black text-blue-500">88% Match</span>
                                    </div>
                                    <div className={`p-3.5 rounded-xl border ${isLightMode ? 'bg-slate-50' : 'bg-[#0E1E38]/20'}`}>
                                        <span className="text-[10px] block opacity-60 mb-0.5">Interview Practice Hours</span>
                                        <span className="text-lg font-black text-violet-500">12.4 Hours</span>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <span className="text-[10px] font-bold uppercase opacity-60 block">Verified Badge Certificates</span>
                                    <div className="flex gap-2">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                            <Award className="w-3.5 h-3.5" /> Frontend Engineering
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2B7FFF]/10 text-[#5BA3FF] border border-[#2B7FFF]/20">
                                            <Star className="w-3.5 h-3.5" /> React Expert
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="rounded-3xl p-10 md:p-16 text-center text-white bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-2xl shadow-blue-500/15 relative overflow-hidden">
                        {/* Graphic details */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                        <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight relative z-10">
                            Ready to Transform Your Placement Pipeline?
                        </h2>
                        
                        <p className="text-base text-blue-100 max-w-2xl mx-auto leading-relaxed mb-10 relative z-10">
                            Whether you are looking for verified talent, tracking college cohorts, or preparing for interviews — PlaceNxt has the tools you need to succeed.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <Link href="/register" className="px-8 py-3.5 rounded-xl bg-white text-blue-600 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                                Get Started Free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/contact" className="px-8 py-3.5 rounded-xl border border-white/25 text-white hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                Request Custom Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
