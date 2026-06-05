'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    Zap, FileSearch, ArrowRight, ShieldCheck,
    BarChart3, AlertCircle, CheckCircle2, RefreshCw, Target, Layers, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const HOW_IT_WORKS = [
    {
        step: '01',
        title: 'Paste the Job Description',
        desc: 'Drop in any JD — from LinkedIn, Naukri, or a company careers page. PlaceNxt extracts required skills, preferred qualifications, and hidden keyword weights.',
    },
    {
        step: '02',
        title: 'Upload or Connect Your Resume',
        desc: 'Upload a PDF or link your existing PlaceNxt profile. No re-entry needed if you\'ve already scored a resume.',
    },
    {
        step: '03',
        title: 'Run the ATS Prediction',
        desc: 'PlaceNxt simulates how 7 major ATS platforms (Workday, Greenhouse, Taleo, Lever, and more) would parse and rank your resume against this specific JD.',
    },
    {
        step: '04',
        title: 'See Your Predicted Pass Rate',
        desc: 'Get a pass/reject prediction per ATS, a keyword gap list ranked by JD frequency, and a one-click optimise option.',
    },
];

const ATS_SIGNALS = [
    { icon: Target, title: 'JD Keyword Mapping', desc: 'Every keyword in the JD is weighted by frequency and placement. We surface the ones your resume is missing the most.' },
    { icon: Layers, title: 'Multi-ATS Simulation', desc: 'Different ATS platforms parse resumes differently. See your pass probability across 7 major systems simultaneously.' },
    { icon: BarChart3, title: 'Section-Level Scoring', desc: 'Each section of your resume — summary, experience, skills — gets its own sub-score so you know exactly where to focus.' },
    { icon: RefreshCw, title: 'Iterative Re-score', desc: 'Edit your resume in the side-by-side view and re-run the prediction instantly. Iterate until you cross the threshold.' },
    { icon: AlertCircle, title: 'Red Flag Detection', desc: 'Catches common ATS killers: inconsistent date formatting, tables, images, non-standard headers, and Unicode characters.' },
    { icon: TrendingUp, title: 'Percentile Ranking', desc: 'See where you rank against other applicants who scored the same JD. Understand how competitive your application is.' },
];

const STATS = [
    { val: '7', label: 'ATS platforms simulated' },
    { val: '91%', label: 'Prediction accuracy vs real outcomes' },
    { val: '60s', label: 'Time to full ATS report' },
    { val: '3×', label: 'Interview rate improvement' },
];

const ATS_PLATFORMS = ['Workday', 'Greenhouse', 'Taleo', 'Lever', 'iCIMS', 'SmartRecruiters', 'BambooHR'];

export default function AtsPredictorPage() {
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
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight ? 'bg-cyan-50 border-cyan-100 text-cyan-600' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                            <Zap className="w-3 h-3" /> AI Features · ATS Score Predictor
                        </span>
                        <h1 className={`text-4xl md:text-6xl font-black mb-6 leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Will Your Resume Pass <span className="text-cyan-500">the ATS Filter?</span>
                        </h1>
                        <p className={`text-lg md:text-xl leading-relaxed mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            75% of resumes are rejected before a human sees them. PlaceNxt predicts your ATS pass rate across 7 major platforms — and tells you exactly how to fix it.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-600/20 hover:scale-[1.02] transition-transform">
                                Check My Resume <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/solutions/students" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl border font-semibold transition-all hover:scale-[1.02] ${isLight ? 'border-gray-200 text-gray-700 hover:border-cyan-200' : 'border-white/10 text-gray-300 hover:border-cyan-500/40'}`}>
                                All Student Tools
                            </Link>
                        </div>
                    </motion.div>

                    {/* ATS Results Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="flex-1 w-full"
                    >
                        <div className={`rounded-3xl border shadow-2xl p-8 ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.04] border-white/10'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                    <FileSearch className="w-5 h-5 text-cyan-500" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>ATS Compatibility Report</p>
                                    <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>SDE-2 · Google · JD analysed</p>
                                </div>
                            </div>
                            <div className="space-y-3 mb-6">
                                {[
                                    { name: 'Workday', pass: true, score: 82 },
                                    { name: 'Greenhouse', pass: true, score: 79 },
                                    { name: 'Taleo', pass: false, score: 54 },
                                    { name: 'Lever', pass: true, score: 88 },
                                    { name: 'iCIMS', pass: false, score: 61 },
                                ].map(ats => (
                                    <div key={ats.name} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isLight ? 'border-gray-100 bg-gray-50' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                                        <span className={`text-xs font-bold w-28 flex-shrink-0 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{ats.name}</span>
                                        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10">
                                            <div className={`h-full rounded-full ${ats.pass ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${ats.score}%` }} />
                                        </div>
                                        <span className={`text-xs font-bold w-8 text-right ${ats.pass ? 'text-green-500' : 'text-red-400'}`}>{ats.score}</span>
                                        {ats.pass
                                            ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                                    </div>
                                ))}
                            </div>
                            <div className={`p-4 rounded-xl border text-xs ${isLight ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-orange-500/[0.08] border-orange-500/20 text-orange-400'}`}>
                                <p className="font-bold mb-1">Top missing keywords</p>
                                <p className="opacity-80">"Kubernetes" (6× in JD), "distributed systems" (4×), "Go" or "Golang" (3×)</p>
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
                            <p className="text-3xl font-black text-cyan-500 mb-1">{s.val}</p>
                            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ATS Platform badges */}
            <section className="max-w-7xl mx-auto px-4 pt-20 pb-4">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
                    <p className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Simulates results across</p>
                </motion.div>
                <div className="flex flex-wrap gap-3 justify-center">
                    {ATS_PLATFORMS.map((name, i) => (
                        <motion.span key={name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                            className={`px-4 py-2 rounded-full border text-sm font-semibold ${isLight ? 'bg-white border-gray-200 text-gray-700' : 'bg-white/[0.04] border-white/10 text-gray-300'}`}>
                            {name}
                        </motion.span>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className={`py-24 px-4 mt-16 ${isLight ? 'bg-cyan-50/50' : 'bg-cyan-500/[0.04]'}`}>
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
                        <h2 className={`text-3xl md:text-4xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>How the prediction works</h2>
                        <p className={`text-base ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>From JD paste to optimised resume in under two minutes.</p>
                    </motion.div>
                    <div className="space-y-6">
                        {HOW_IT_WORKS.map((step, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className={`flex gap-6 p-6 rounded-2xl border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                                <span className="text-4xl font-black text-cyan-500/20 flex-shrink-0 leading-none">{step.step}</span>
                                <div>
                                    <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{step.title}</h3>
                                    <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Signals */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
                    <h2 className={`text-3xl md:text-4xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Six intelligence signals. <span className="text-cyan-500">One report.</span>
                    </h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {ATS_SIGNALS.map((signal, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                            className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${isLight ? 'bg-white border-gray-100 hover:border-cyan-100' : 'bg-white/[0.03] border-white/[0.06] hover:border-cyan-500/30'}`}>
                            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                                <signal.icon className="w-5 h-5 text-cyan-500" />
                            </div>
                            <h3 className={`text-base font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>{signal.title}</h3>
                            <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{signal.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 pb-24">
                <div className={`rounded-[40px] p-12 relative border text-center ${isLight ? 'bg-cyan-600 border-cyan-500 shadow-2xl' : 'bg-white/[0.02] border-white/10'}`}>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Stop guessing. Start knowing.</h2>
                    <p className="text-cyan-100 text-lg mb-8 max-w-xl mx-auto">Run your first ATS prediction for free. See exactly what's blocking you from the shortlist.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-cyan-700 font-bold hover:bg-cyan-50 transition-colors shadow-lg">
                            Predict My ATS Score <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2 text-cyan-200 text-sm">
                            <ShieldCheck className="w-4 h-4" /> No Credit Card Required
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
