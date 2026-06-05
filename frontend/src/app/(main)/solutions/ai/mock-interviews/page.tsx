'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    Mic, MessageSquare, Brain, Video, ChevronRight,
    ArrowRight, ShieldCheck, Volume2, BarChart3, Clock, RefreshCw, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const INTERVIEW_MODES = [
    {
        icon: Brain,
        title: 'Technical Deep-Dive',
        desc: 'Get grilled on DSA, system design, and domain-specific coding questions at your target difficulty level. Each answer is scored on correctness, approach, and communication.',
        tags: ['DSA', 'System Design', 'SQL', 'ML Concepts'],
        color: 'blue',
    },
    {
        icon: MessageSquare,
        title: 'Behavioural & HR Round',
        desc: 'AI plays the role of a seasoned HR interviewer. Practice STAR-method answers for leadership, conflict, and situational questions with instant tone analysis.',
        tags: ['STAR Method', 'Leadership', 'Conflict Resolution', 'Culture Fit'],
        color: 'green',
    },
    {
        icon: Video,
        title: 'Full Mock Interview Session',
        desc: 'A 30–60 minute end-to-end simulation combining technical, behavioral, and case rounds — just like a real final-round interview at a top firm.',
        tags: ['Full Panel Sim', 'Mixed Rounds', 'Time Pressure', 'Feedback Report'],
        color: 'violet',
    },
    {
        icon: RefreshCw,
        title: 'Targeted Weak-Spot Drills',
        desc: 'After each session, PlaceNxt identifies the topics where you struggled and auto-generates a focused drill set so you improve before the next real interview.',
        tags: ['Auto-Generated', 'Adaptive', 'Skill Gap Targeting'],
        color: 'orange',
    },
];

const FEEDBACK_SIGNALS = [
    { icon: Volume2, label: 'Pace & Clarity', desc: 'Detects filler words, speaking pace, and hesitation patterns.' },
    { icon: Brain, label: 'Answer Accuracy', desc: 'Scores technical answers against optimal solution patterns.' },
    { icon: BarChart3, label: 'Confidence Index', desc: 'Measures response confidence from answer structure and tone.' },
    { icon: Clock, label: 'Time Management', desc: 'Flags answers that run too long or end too abruptly.' },
    { icon: MessageSquare, label: 'STAR Adherence', desc: 'Ensures behavioral answers follow Situation-Task-Action-Result.' },
    { icon: Sparkles, label: 'AI Coaching Tips', desc: 'Personalised suggestions after every answer — not just a score.' },
];

const STATS = [
    { val: '82%', label: 'of users pass real interviews after 5 sessions' },
    { val: '30+', label: 'Role-specific question banks' },
    { val: '6', label: 'Feedback signals per answer' },
    { val: 'Real-time', label: 'Analysis powered by Groq' },
];

export default function MockInterviewsPage() {
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
                            <Mic className="w-3 h-3" /> AI Features · Mock Interviews
                        </span>
                        <h1 className={`text-4xl md:text-6xl font-black mb-6 leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Practice Until You <span className="text-blue-500">Can't Get It Wrong.</span>
                        </h1>
                        <p className={`text-lg md:text-xl leading-relaxed mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            PlaceNxt's AI interviewer simulates real technical and HR rounds with live feedback on every answer — so your first mistake isn't in the actual interview.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-transform">
                                Start a Mock Interview <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/solutions/students" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl border font-semibold transition-all hover:scale-[1.02] ${isLight ? 'border-gray-200 text-gray-700 hover:border-blue-200' : 'border-white/10 text-gray-300 hover:border-blue-500/40'}`}>
                                All Student Tools
                            </Link>
                        </div>
                    </motion.div>

                    {/* Interview Chat UI Mock */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="flex-1 w-full"
                    >
                        <div className={`rounded-3xl border shadow-2xl overflow-hidden ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.04] border-white/10'}`}>
                            <div className={`flex items-center gap-3 px-6 py-4 border-b ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>PlaceNxt AI Interviewer</p>
                                    <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Live Session</p>
                                </div>
                                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10">
                                    <Mic className="w-3.5 h-3.5 text-red-500" />
                                    <span className="text-red-500 font-bold text-xs">REC</span>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-none text-sm ${isLight ? 'bg-blue-50 text-gray-800' : 'bg-blue-500/10 text-gray-200'}`}>
                                    Design a URL shortener like bit.ly. Walk me through your system design, starting with the high-level architecture.
                                </div>
                                <div className={`max-w-[85%] ml-auto px-4 py-3 rounded-2xl rounded-tr-none text-sm ${isLight ? 'bg-gray-100 text-gray-800' : 'bg-white/[0.07] text-gray-200'}`}>
                                    I'd start with a simple two-tier architecture — a web server that handles encode/decode requests and a NoSQL database for the mappings...
                                </div>
                                <div className={`p-4 rounded-xl border text-xs space-y-2 ${isLight ? 'bg-green-50 border-green-100' : 'bg-green-500/[0.07] border-green-500/20'}`}>
                                    <p className={`font-bold ${isLight ? 'text-green-700' : 'text-green-400'}`}>Real-time feedback</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Accuracy', val: '78%', up: true },
                                            { label: 'Pace', val: 'Good', up: true },
                                            { label: 'Depth', val: 'Needs more', up: false },
                                        ].map(fb => (
                                            <div key={fb.label} className={`text-center p-2 rounded-lg ${isLight ? 'bg-white' : 'bg-white/[0.04]'}`}>
                                                <p className={`font-black text-sm ${fb.up ? 'text-green-500' : 'text-orange-400'}`}>{fb.val}</p>
                                                <p className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{fb.label}</p>
                                            </div>
                                        ))}
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
                            <p className="text-3xl font-black text-blue-500 mb-1">{s.val}</p>
                            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Interview Modes */}
            <section className="max-w-7xl mx-auto px-4 py-28">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className={`text-3xl md:text-5xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Four modes. <span className="text-blue-500">Every scenario covered.</span>
                    </h2>
                    <p className={`text-base max-w-2xl mx-auto ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        Whether you have 10 minutes or a full hour, there's a session format built for your prep stage.
                    </p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {INTERVIEW_MODES.map((mode, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className={`p-8 rounded-2xl border transition-all hover:shadow-xl ${isLight ? 'bg-white border-gray-100 hover:border-blue-100' : 'bg-white/[0.03] border-white/[0.06] hover:border-blue-500/30'}`}>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5">
                                <mode.icon className="w-6 h-6 text-blue-500" />
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>{mode.title}</h3>
                            <p className={`text-sm leading-relaxed mb-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{mode.desc}</p>
                            <div className="flex flex-wrap gap-2">
                                {mode.tags.map(tag => (
                                    <span key={tag} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isLight ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>{tag}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Feedback Signals */}
            <section className={`py-24 px-4 ${isLight ? 'bg-blue-50/50' : 'bg-blue-500/[0.04]'}`}>
                <div className="max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
                        <h2 className={`text-3xl md:text-4xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Six feedback signals. Per answer.
                        </h2>
                        <p className={`text-base ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Real improvement requires granular data — not just "good" or "needs work".</p>
                    </motion.div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {FEEDBACK_SIGNALS.map((signal, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                                className={`flex items-start gap-4 p-5 rounded-2xl border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <signal.icon className="w-5 h-5 text-blue-500" />
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
                <div className={`rounded-[40px] p-12 relative border text-center ${isLight ? 'bg-blue-600 border-blue-500 shadow-2xl' : 'bg-white/[0.02] border-white/10'}`}>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Your next interview is already scheduled.</h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Practice it first. The AI won't judge you — it will just make you better.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-colors shadow-lg">
                            Start Practicing Free <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2 text-blue-200 text-sm">
                            <ShieldCheck className="w-4 h-4" /> No Credit Card Required
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
