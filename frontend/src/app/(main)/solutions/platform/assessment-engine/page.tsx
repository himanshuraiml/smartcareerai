'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    Target, CheckCircle2, Clock, ShieldCheck, Code2,
    ArrowRight, Users, BarChart2, Lock, Layers, Cpu, Award
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const TEST_TYPES = [
    {
        icon: Code2,
        title: 'Coding Assessments',
        desc: 'Multi-language coding challenges graded by correctness, time complexity, and code quality — powered by Piston sandbox.',
        tags: ['Python', 'Java', 'C++', 'JavaScript', 'Go'],
        color: 'blue',
    },
    {
        icon: Cpu,
        title: 'Technical MCQ Banks',
        desc: 'Domain-specific question banks across 60+ skills: DSA, system design, databases, cloud, and more. Shuffled per attempt.',
        tags: ['DSA', 'DBMS', 'OS', 'Networks', 'Cloud'],
        color: 'indigo',
    },
    {
        icon: Layers,
        title: 'Soft Skill Evaluation',
        desc: 'Scenario-based questions that assess problem solving, communication, and teamwork — skills recruiters can\'t read from a resume.',
        tags: ['Communication', 'Leadership', 'Problem Solving'],
        color: 'violet',
    },
    {
        icon: Users,
        title: 'Role-Mapped Tests',
        desc: 'Pre-built assessment blueprints for 200+ job roles. Students take exactly the test that matches the position they\'re applying for.',
        tags: ['SDE-1', 'Data Analyst', 'Product Manager', 'ML Engineer'],
        color: 'cyan',
    },
];

const PROCTORING = [
    { icon: Lock, title: 'Tab-switch detection', desc: 'Alerts flagged when candidates leave the test window.' },
    { icon: Clock, title: 'Time-boxed sessions', desc: 'Per-question timers prevent extended outside lookups.' },
    { icon: ShieldCheck, title: 'Randomised questions', desc: 'Every attempt draws from a shuffled pool — no two tests are identical.' },
    { icon: BarChart2, title: 'Percentile reporting', desc: 'Scores normalised against all candidates who took the same role test.' },
];

const STATS = [
    { val: '60+', label: 'Skill categories' },
    { val: '900+', label: 'Validated questions' },
    { val: '200+', label: 'Role-mapped blueprints' },
    { val: '100%', label: 'Browser-native, no plugins' },
];

export default function AssessmentEnginePage() {
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
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                            <Target className="w-3 h-3" /> Platform · Assessment Engine
                        </span>
                        <h1 className={`text-4xl md:text-6xl font-black mb-6 leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Prove Competency. <span className="text-indigo-500">Skip the Filter.</span>
                        </h1>
                        <p className={`text-lg md:text-xl leading-relaxed mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            Bypass the "unqualified" label with validated, proctored skill tests across 60+ domains. Recruiters see your score — not just your claim.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-transform">
                                Take a Free Test <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/solutions/students" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl border font-semibold transition-all hover:scale-[1.02] ${isLight ? 'border-gray-200 text-gray-700 hover:border-indigo-200' : 'border-white/10 text-gray-300 hover:border-indigo-500/40'}`}>
                                All Student Tools
                            </Link>
                        </div>
                    </motion.div>

                    {/* Assessment UI Mock */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="flex-1 w-full"
                    >
                        <div className={`rounded-3xl border shadow-2xl overflow-hidden ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.04] border-white/10'}`}>
                            {/* Header bar */}
                            <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                        <Code2 className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Data Structures — Arrays & Hashing</p>
                                        <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Question 4 of 20</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10">
                                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-orange-500 font-bold text-sm">12:34</span>
                                </div>
                            </div>
                            {/* Question */}
                            <div className="p-6">
                                <p className={`text-sm font-semibold mb-5 ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>
                                    What is the worst-case time complexity of finding an element in a hash table with open addressing?
                                </p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'A', text: 'O(1)', selected: false },
                                        { label: 'B', text: 'O(log n)', selected: false },
                                        { label: 'C', text: 'O(n)', selected: true },
                                        { label: 'D', text: 'O(n²)', selected: false },
                                    ].map(opt => (
                                        <div key={opt.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer text-sm transition-all ${opt.selected
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold'
                                            : isLight ? 'border-gray-100 text-gray-700 hover:border-gray-200' : 'border-white/[0.07] text-gray-300 hover:border-white/20'
                                        }`}>
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${opt.selected ? 'bg-indigo-500 text-white' : isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/10 text-gray-400'}`}>{opt.label}</span>
                                            {opt.text}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10">
                                        <div className="h-full w-[20%] bg-indigo-500 rounded-full" />
                                    </div>
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
                            <p className="text-3xl font-black text-indigo-500 mb-1">{s.val}</p>
                            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Test Types */}
            <section className="max-w-7xl mx-auto px-4 py-28">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className={`text-3xl md:text-5xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Four types of <span className="text-indigo-500">validated assessment</span>
                    </h2>
                    <p className={`text-base max-w-2xl mx-auto ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        Every test type is designed to produce recruiter-readable results, not just a pass/fail.
                    </p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {TEST_TYPES.map((t, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className={`p-8 rounded-2xl border transition-all hover:shadow-xl ${isLight ? 'bg-white border-gray-100 hover:border-indigo-100' : 'bg-white/[0.03] border-white/[0.06] hover:border-indigo-500/30'}`}>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-5">
                                <t.icon className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>{t.title}</h3>
                            <p className={`text-sm leading-relaxed mb-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{t.desc}</p>
                            <div className="flex flex-wrap gap-2">
                                {t.tags.map(tag => (
                                    <span key={tag} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>{tag}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Proctoring */}
            <section className={`py-24 px-4 ${isLight ? 'bg-indigo-50/50' : 'bg-indigo-500/[0.04]'}`}>
                <div className="max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
                        <h2 className={`text-3xl md:text-4xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Built-in integrity, zero plugins
                        </h2>
                        <p className={`text-base ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            Scores recruiters trust because the test environment is tamper-aware by design.
                        </p>
                    </motion.div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {PROCTORING.map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className={`flex items-start gap-4 p-6 rounded-2xl border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                    <item.icon className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.title}</h4>
                                    <p className={`text-xs leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className={`rounded-[40px] p-12 relative border text-center ${isLight ? 'bg-indigo-600 border-indigo-500 shadow-2xl' : 'bg-white/[0.02] border-white/10'}`}>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to prove what you know?</h2>
                    <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">Pick a skill, take the test, earn your badge. Recruiters are already watching.</p>
                    <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                        Start Testing Free <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
