'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    Gem, Share2, ExternalLink, CheckCircle2,
    ArrowRight, ShieldCheck, QrCode, Globe, Award, Star, Lock
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const BADGE_TIERS = [
    {
        tier: 'Foundation',
        color: 'from-cyan-400 to-blue-500',
        ring: 'ring-cyan-500/30',
        desc: 'Awarded when you pass a core skill test with a score above 60%. Signals baseline competency to recruiters.',
        skills: ['HTML & CSS', 'SQL Basics', 'Python Fundamentals', 'Git'],
    },
    {
        tier: 'Proficient',
        color: 'from-blue-500 to-indigo-600',
        ring: 'ring-blue-500/30',
        desc: 'Requires 75%+ on an advanced test. Recruiters filter specifically for this tier when hiring for mid-level roles.',
        skills: ['React.js', 'Node.js', 'Data Structures', 'System Design'],
    },
    {
        tier: 'Expert',
        color: 'from-violet-600 to-purple-700',
        ring: 'ring-violet-500/30',
        desc: 'Top 10% percentile placement on proctored expert assessments. Rare, visible, and actively sourced.',
        skills: ['ML Engineering', 'Kubernetes', 'Distributed Systems'],
    },
];

const SHARE_FEATURES = [
    { icon: Globe, title: 'Public Profile URL', desc: 'Every badge lives on a verified public profile page that recruiters can access without signing up.' },
    { icon: QrCode, title: 'Embeddable QR Code', desc: 'Add a QR to your printed resume that instantly opens your verified credential page.' },
    { icon: Share2, title: 'LinkedIn & Portfolio', desc: 'One-click export to LinkedIn Certifications and any portfolio or personal site.' },
    { icon: Lock, title: 'Tamper-proof Verification', desc: 'Each badge has a unique verification hash. Employers can confirm authenticity in seconds.' },
];

const STATS = [
    { val: '74%', label: 'Of recruiters filter by badge tier' },
    { val: '2.4×', label: 'More profile views with Expert badge' },
    { val: '48h', label: 'Avg. recruiter response after badge earned' },
    { val: '100%', label: 'Free to earn and share' },
];

export default function CredentialsPage() {
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
                            <Gem className="w-3 h-3" /> Platform · Credentials & Badges
                        </span>
                        <h1 className={`text-4xl md:text-6xl font-black mb-6 leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Show Proof. <span className="text-violet-500">Not Just Claims.</span>
                        </h1>
                        <p className={`text-lg md:text-xl leading-relaxed mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            PlaceNxt skill badges are verified credentials tied to real proctored assessments. They live on your public profile and are actively searched by our recruiter network.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-600/20 hover:scale-[1.02] transition-transform">
                                Earn Your First Badge <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/solutions/students" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl border font-semibold transition-all hover:scale-[1.02] ${isLight ? 'border-gray-200 text-gray-700 hover:border-violet-200' : 'border-white/10 text-gray-300 hover:border-violet-500/40'}`}>
                                All Student Tools
                            </Link>
                        </div>
                    </motion.div>

                    {/* Badge visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="flex-1 w-full flex items-center justify-center"
                    >
                        <div className="relative w-full max-w-sm">
                            {/* Profile card */}
                            <div className={`rounded-3xl border shadow-2xl p-8 ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.04] border-white/10'}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl">A</div>
                                    <div>
                                        <p className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Arjun Mehta</p>
                                        <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>CS Final Year · IIT Delhi</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">Verified</span>
                                    </div>
                                </div>
                                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Earned Badges</p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Data Structures & Algorithms', tier: 'Expert', color: 'from-violet-600 to-purple-700', score: '94/100' },
                                        { label: 'System Design', tier: 'Proficient', color: 'from-blue-500 to-indigo-600', score: '81/100' },
                                        { label: 'Python', tier: 'Expert', color: 'from-violet-600 to-purple-700', score: '91/100' },
                                    ].map((badge, i) => (
                                        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center flex-shrink-0`}>
                                                <Award className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{badge.label}</p>
                                                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{badge.tier} · {badge.score}</p>
                                            </div>
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        </div>
                                    ))}
                                </div>
                                <button className="mt-5 w-full py-2.5 rounded-xl bg-violet-500/10 text-violet-500 font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-violet-500/20 transition-colors">
                                    Share Profile <ExternalLink className="w-3.5 h-3.5" />
                                </button>
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

            {/* Badge Tiers */}
            <section className="max-w-7xl mx-auto px-4 py-28">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className={`text-3xl md:text-5xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Three tiers. <span className="text-violet-500">Real differentiation.</span>
                    </h2>
                    <p className={`text-base max-w-2xl mx-auto ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        Each tier signals a measurable competency level. Recruiters know exactly what they're hiring.
                    </p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {BADGE_TIERS.map((tier, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                            className={`p-8 rounded-2xl border transition-all hover:shadow-xl ring-2 ${tier.ring} ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-6 shadow-lg`}>
                                <Star className="w-8 h-8 text-white" />
                            </div>
                            <h3 className={`text-2xl font-black mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>{tier.tier}</h3>
                            <p className={`text-sm leading-relaxed mb-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{tier.desc}</p>
                            <div className="flex flex-wrap gap-2">
                                {tier.skills.map(skill => (
                                    <span key={skill} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isLight ? 'bg-violet-50 border-violet-100 text-violet-600' : 'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>{skill}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Sharing */}
            <section className={`py-24 px-4 ${isLight ? 'bg-violet-50/50' : 'bg-violet-500/[0.04]'}`}>
                <div className="max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
                        <h2 className={`text-3xl md:text-4xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Your badge. Everywhere recruiters look.
                        </h2>
                        <p className={`text-base ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Four ways to put your verified credential in front of hiring teams.</p>
                    </motion.div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {SHARE_FEATURES.map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className={`flex items-start gap-4 p-6 rounded-2xl border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.03] border-white/[0.07]'}`}>
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                    <item.icon className="w-5 h-5 text-violet-500" />
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
                <div className={`rounded-[40px] p-12 relative border text-center ${isLight ? 'bg-violet-600 border-violet-500 shadow-2xl' : 'bg-white/[0.02] border-white/10'}`}>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Your skills deserve proof.</h2>
                    <p className="text-violet-100 text-lg mb-8 max-w-xl mx-auto">Earn verified badges for free. Let recruiters find you based on what you can actually do.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-violet-600 font-bold hover:bg-violet-50 transition-colors shadow-lg">
                            Earn Badges Free <ArrowRight className="w-4 h-4" />
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
