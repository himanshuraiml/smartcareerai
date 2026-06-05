'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    FileText, CheckCircle2, Zap, Target, BarChart3,
    ArrowRight, ShieldCheck, Sparkles, TrendingUp, Search, AlignLeft, Hash
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const HOW_IT_WORKS = [
    { step: '01', title: 'Upload Your Resume', desc: 'Drop your PDF or Word file. Our parser extracts every detail — experience, skills, formatting structure.' },
    { step: '02', title: 'Paste the Job Description', desc: 'Add the JD you\'re targeting. PlaceNxt reads employer intent: required skills, action verbs, keyword density.' },
    { step: '03', title: 'Get Your ATS Score', desc: 'Receive a 0–100 score with a breakdown of what\'s passing and what\'s holding you back.' },
    { step: '04', title: 'Apply Suggestions', desc: 'One-click keyword insertions, formatting fixes, and bullet rewrites. Rescore until you\'re above 80.' },
];

const CAPABILITIES = [
    {
        icon: Search,
        title: 'Keyword Gap Analysis',
        desc: 'Identifies every skill and phrase in the JD that\'s missing from your resume, ranked by ATS weight.',
        color: 'blue',
    },
    {
        icon: AlignLeft,
        title: 'Formatting & Structure Audit',
        desc: 'Detects ATS-breaking elements: tables, graphics, unusual fonts, and non-standard section headers.',
        color: 'indigo',
    },
    {
        icon: Hash,
        title: 'Action Verb Scoring',
        desc: 'Replaces weak verbs with high-impact alternatives drawn from top-quartile resumes at Fortune 500 companies.',
        color: 'violet',
    },
    {
        icon: BarChart3,
        title: 'Role-Specific Benchmarking',
        desc: 'Compares your resume against 10,000+ anonymised resumes that got interviews for the same role.',
        color: 'cyan',
    },
    {
        icon: TrendingUp,
        title: 'Impact Quantification',
        desc: 'Flags vague bullets and suggests data-driven rewrites ("improved sales" → "grew sales by 34% in Q3").',
        color: 'green',
    },
    {
        icon: Sparkles,
        title: 'AI-Powered Rewrites',
        desc: 'Generate full bullet-point rewrites with a single click. Edit freely before applying.',
        color: 'orange',
    },
];

const STATS = [
    { val: '3×', label: 'More interview callbacks' },
    { val: '98.5%', label: 'ATS parsing accuracy' },
    { val: '<30s', label: 'Time to first score' },
    { val: '50K+', label: 'Resumes scored' },
];

export default function ResumeScorerPage() {
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
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                            <FileText className="w-3 h-3" /> Platform · AI Resume Scorer
                        </span>
                        <h1 className={`text-4xl md:text-6xl font-black mb-6 leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Know Your ATS Score <span className="text-blue-500">Before HR Does.</span>
                        </h1>
                        <p className={`text-lg md:text-xl leading-relaxed mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            PlaceNxt's AI resume scorer reads your CV the way real ATS software does — then tells you exactly what to fix, keyword by keyword, bullet by bullet.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-transform">
                                Score My Resume Free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/solutions/students" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl border font-semibold transition-all hover:scale-[1.02] ${isLight ? 'border-gray-200 text-gray-700 hover:border-blue-200' : 'border-white/10 text-gray-300 hover:border-blue-500/40'}`}>
                                See All Student Tools
                            </Link>
                        </div>
                    </motion.div>

                    {/* Score Card Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="flex-1 w-full"
                    >
                        <div className={`rounded-3xl border p-8 shadow-2xl ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.04] border-white/10'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>ATS Compatibility Score</p>
                                    <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Software Engineer — Google (JD matched)</p>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>
                            {/* Score Ring */}
                            <div className="flex items-center gap-8 mb-8">
                                <div className="relative w-28 h-28 flex-shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="50" fill="none" stroke={isLight ? '#F0F4F8' : '#ffffff10'} strokeWidth="12" />
                                        <circle cx="60" cy="60" r="50" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="314" strokeDashoffset="75" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-2xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>76</span>
                                    </div>
                                </div>
                                <div className="space-y-3 flex-1">
                                    {[
                                        { label: 'Keyword Match', val: 68, color: 'bg-blue-500' },
                                        { label: 'Formatting', val: 92, color: 'bg-green-500' },
                                        { label: 'Impact Score', val: 60, color: 'bg-orange-400' },
                                    ].map(item => (
                                        <div key={item.label}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>{item.label}</span>
                                                <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.val}%</span>
                                            </div>
                                            <div className={`h-1.5 rounded-full ${isLight ? 'bg-gray-100' : 'bg-white/10'}`}>
                                                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { tag: 'Missing keyword', text: '"Kubernetes" appears 4× in JD but 0× in your resume', type: 'warn' },
                                    { tag: 'Weak bullet', text: '"Worked on backend systems" → suggest quantified rewrite', type: 'warn' },
                                    { tag: 'Passing', text: 'Contact section, education format, file type', type: 'ok' },
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs ${item.type === 'ok' ? (isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/10 text-green-400') : (isLight ? 'bg-orange-50 text-orange-700' : 'bg-orange-500/10 text-orange-400')}`}>
                                        <span className="font-bold flex-shrink-0">{item.tag}</span>
                                        <span className="opacity-80">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Stats Bar */}
            <section className={`border-y ${isLight ? 'border-gray-100 bg-white' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {STATS.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
                            <p className="text-3xl font-black text-blue-500 mb-1">{s.val}</p>
                            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Capabilities */}
            <section className="max-w-7xl mx-auto px-4 py-28">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className={`text-3xl md:text-5xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Six layers of <span className="text-blue-500">resume intelligence</span>
                    </h2>
                    <p className={`text-base max-w-2xl mx-auto ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        Every analysis goes beyond keyword matching to audit the entire document for recruiter and ATS readability.
                    </p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CAPABILITIES.map((cap, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                            className={`p-7 rounded-2xl border transition-all hover:shadow-xl ${isLight ? 'bg-white border-gray-100 hover:border-blue-100' : 'bg-white/[0.03] border-white/[0.06] hover:border-blue-500/30'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-blue-500/10`}>
                                <cap.icon className="w-6 h-6 text-blue-500" />
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>{cap.title}</h3>
                            <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{cap.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className={`py-24 px-4 ${isLight ? 'bg-indigo-50/50' : 'bg-indigo-500/[0.04]'}`}>
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
                        <h2 className={`text-3xl md:text-4xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>How it works</h2>
                        <p className={`text-base ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>From upload to interview-ready in under two minutes.</p>
                    </motion.div>
                    <div className="space-y-8">
                        {HOW_IT_WORKS.map((step, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className={`flex gap-6 p-6 rounded-2xl border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                                <span className="text-4xl font-black text-blue-500/20 flex-shrink-0 leading-none">{step.step}</span>
                                <div>
                                    <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{step.title}</h3>
                                    <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className={`rounded-[40px] p-12 overflow-hidden relative border text-center ${isLight ? 'bg-blue-600 border-blue-500 shadow-2xl' : 'bg-white/[0.02] border-white/10'}`}>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Your next job starts with a better resume.</h2>
                        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Score it for free — no credit card, no signup friction.</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-colors shadow-lg">
                                Start Free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <div className="flex items-center gap-2 text-blue-200 text-sm">
                                <ShieldCheck className="w-4 h-4" /> No Credit Card Required
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
