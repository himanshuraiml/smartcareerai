'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    GraduationCap, Building2, Briefcase,
    ArrowRight, CheckCircle2, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SolutionsHubPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const solutions = [
        {
            id: 'students',
            slug: 'students',
            title: 'For Students & Candidates',
            desc: 'Your AI-powered roadmap to landing the dream job. From ATS resume scoring to realistic mock interviews.',
            icon: GraduationCap,
            color: 'from-blue-500 to-cyan-500',
            features: ['ATS Resume Scoring', 'AI-Led Mock Interviews', 'Verified Skill Badges', 'Smart Job Matching']
        },
        {
            id: 'university',
            slug: 'university',
            title: 'For Universities & Institutions',
            desc: 'Empower your placement cell with real-time analytics, co-branded portals, and mass recruitment tools.',
            icon: Building2,
            color: 'from-purple-500 to-fuchsia-500',
            features: ['Batch Performance Tracking', 'Skill Gap Analytics', 'White-Labeled Portal', 'Corporate Export']
        },
        {
            id: 'recruiter',
            slug: 'recruiter',
            title: 'For Recruiters & Companies',
            desc: 'Hire faster and better. AI pre-screens and ranks candidates based on proven skills, not just keywords.',
            icon: Briefcase,
            color: 'from-emerald-500 to-teal-500',
            features: ['Pre-Vetted Talent Pools', 'Automated Interviewing', 'Custom Assessments', 'Fit Score Analytics']
        }
    ];

    return (
        <div className={`min-h-screen ${isLight ? 'bg-[#F8FAFC]' : 'bg-[#080C16]'}`}>
            <Navbar />

            {/* Header */}
            <header className="max-w-4xl mx-auto px-4 text-center pt-48 mb-24">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                        <Sparkles className="w-3 h-3" /> The Future of Hiring
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                        <span className="gradient-text">Our Solutions.</span><br />
                        <span className={isLight ? 'text-gray-900' : 'text-white'}>Built for Everyone.</span>
                    </h1>
                    <p className={`text-lg md:text-xl leading-relaxed mx-auto max-w-2xl ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        Whether you're a student building your career, a university boosting placements, or a recruiter finding elite talent—PlaceNxt is your unfair advantage.
                    </p>
                </motion.div>
            </header>

            {/* Solutions Grid */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {solutions.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`group relative p-8 rounded-[40px] border transition-all duration-500 hover:scale-[1.02] ${isLight ? 'bg-white border-gray-100 hover:shadow-2xl hover:shadow-gray-200' : 'bg-white/5 border-white/5 hover:bg-white/[0.08] shadow-2xl shadow-black'}`}
                        >
                            {/* Decorative background glow */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity`} />

                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                                <item.icon className="w-8 h-8" />
                            </div>

                            <h3 className={`text-2xl font-black mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.title}</h3>
                            <p className={`mb-8 leading-relaxed line-clamp-3 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{item.desc}</p>

                            <div className="space-y-3 mb-10">
                                {item.features.map((feat, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm font-medium">
                                        <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                                        <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href={`/solutions/${item.slug}`} className={`inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all ${isLight ? 'text-indigo-600 group-hover:text-indigo-700' : 'text-indigo-400 group-hover:text-indigo-300'}`}>
                                Detailed Features
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="max-w-7xl mx-auto px-4 mt-32">
                <div className={`p-12 rounded-[48px] text-center border overflow-hidden relative ${isLight ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 border-white/10'}`}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black mb-6">Experience PlaceNxt Today.</h2>
                        <p className={`mb-10 text-lg max-w-2xl mx-auto ${isLight ? 'text-indigo-100' : 'text-gray-400'}`}>
                            Unified identity. Shared analytics. Core AI model access. Everything you need to secure a future in one platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/register" className={`px-10 py-5 rounded-2xl font-black text-lg transition-transform hover:scale-105 shadow-xl ${isLight ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
                                Create Free Account
                            </Link>
                            <Link href="/contact" className={`px-10 py-5 rounded-2xl font-black text-lg border transition-all ${isLight ? 'border-indigo-400 text-white hover:bg-white/10' : 'border-white/10 text-white hover:bg-white/5'}`}>
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
