'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Target, Zap, Globe, Heart, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useTheme } from '@/providers/ThemeProvider';

const TEAM = [
    { name: 'Dr. Himanshu Rai', role: 'CEO & Founder', bio: 'Visionary behind PlaceNxt — driving product strategy and the mission to make career intelligence accessible to every student.', avatar: 'HR' },
    { name: 'Dr. Kanaga Suba Raja', role: 'Co-Founder', bio: 'Associate Dean and HOD-CSE at SRMIST Tiruchirappalli campus — bringing deep academic leadership and institutional expertise to shape PlaceNxt\'s university partnerships.', avatar: 'KR' },
    { name: 'Dr. J. Jegan', role: 'Head of Partnerships', bio: 'Brings deep academic and industry expertise to shape institutional partnerships and expand PlaceNxt across universities.', avatar: 'JJ' },
    { name: 'Dr. Kiran Kumar', role: 'Head of Partnerships', bio: 'Leads university outreach and collaboration, ensuring PlaceNxt delivers measurable placement outcomes for every partner institution.', avatar: 'KK' },
];

const VALUES = [
    { icon: Target, title: 'Outcome-First', desc: 'Every feature we build is tied to a measurable placement outcome. No vanity metrics.' },
    { icon: Globe, title: 'Accessible by Default', desc: 'Career intelligence shouldn\'t be gated by geography or institution prestige.' },
    { icon: Zap, title: 'Speed of Learning', desc: 'The job market moves fast. Our platform keeps students one step ahead.' },
    { icon: Heart, title: 'Student-Centric', desc: 'We obsess over the student journey — from first resume to first offer letter.' },
];

const MILESTONES = [
    { year: '2026', label: 'Founded', desc: 'PlaceNxt started as a side project at SRMIST Tiruchirappalli to help final-year students prepare for placements.' },
    { year: 'Goal', label: 'First 10 Universities', desc: 'Target to onboard 10 universities and empower thousands of students with AI-driven placement preparation.', upcoming: true },
];

export default function AboutPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const cardStyle = isLight
        ? { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }
        : { background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6">
                            <Users className="w-4 h-4" /> Our Story
                        </span>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                            Built for the Next<br />Generation of Talent
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            PlaceNxt was born from a simple observation: the gap between what colleges teach and what companies need is widening every year. We're here to close it.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats — hidden */}

            {/* Mission */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-violet-700 p-10 md:p-16 text-white text-center">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Our Mission</h2>
                        <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                            To give every student — regardless of which college they attend or city they're from — the tools, intelligence, and confidence to land the career they deserve.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-3">What We Stand For</h2>
                        <p className="text-gray-500 dark:text-gray-400">The principles that guide every product decision we make.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {VALUES.map((v, i) => (
                            <motion.div
                                key={v.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl p-6 flex gap-4"
                                style={cardStyle}
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <v.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{v.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-3">Our Journey</h2>
                        <p className="text-gray-500 dark:text-gray-400">Born at SRMIST Tiruchirappalli — built to change how India's students get placed.</p>
                    </div>
                    <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 to-violet-500" />
                        <div className="space-y-8">
                            {MILESTONES.map((m, i) => (
                                <motion.div
                                    key={`${m.year}-${i}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-6 pl-4"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-lg ${(m as any).upcoming ? 'bg-violet-500 shadow-violet-500/30 ring-2 ring-violet-400/40 ring-offset-2 ring-offset-transparent' : 'bg-blue-600 dark:bg-blue-500 shadow-blue-500/30'}`}>
                                        <span className="w-3 h-3 rounded-full bg-white" />
                                    </div>
                                    <div className={`rounded-2xl p-5 flex-1 ${(m as any).upcoming ? 'border border-dashed border-violet-400 dark:border-violet-500/40 bg-violet-50/50 dark:bg-violet-500/5' : ''}`} style={(m as any).upcoming ? {} : cardStyle}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${(m as any).upcoming ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>{m.year}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{m.label}</span>
                                            {(m as any).upcoming && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-200 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">Upcoming</span>}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{m.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-3">Meet the Team</h2>
                        <p className="text-gray-500 dark:text-gray-400">Researchers, educators, and builders — united by a shared mission.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        {TEAM.map((member, i) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl p-6 text-center"
                                style={cardStyle}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-4 text-white font-black text-lg">
                                    {member.avatar}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-0.5">{member.name}</h3>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-3">{member.role}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{member.bio}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-black mb-4">Join Us on the Journey</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Whether you're a student, university, or company — there's a place for you in the PlaceNxt ecosystem.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register" className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                            Get Started Free <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/careers" className="px-8 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                            We're Hiring <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
