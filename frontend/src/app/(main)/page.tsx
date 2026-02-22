'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, FileText, Zap, Mic, Rocket, Gem,
    Check, Star, Users, TrendingUp, Award, Menu, X,
    ChevronRight, Sparkles, ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useTheme } from '@/providers/ThemeProvider';

export default function HomePage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isLight
                ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/80 shadow-sm'
                : 'bg-[#080C16]/80 backdrop-blur-xl border-b border-white/[0.06]'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                Place<span className="text-indigo-500">Nxt</span>
                            </span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-1">
                            {[
                                { label: 'Blog', href: '/blog' },
                                { label: 'Pricing', href: '/pricing' },
                            ].map(item => (
                                <Link key={item.href} href={item.href}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLight
                                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                    {item.label}
                                </Link>
                            ))}
                            <div className={`mx-3 h-5 w-px ${isLight ? 'bg-gray-200' : 'bg-white/10'}`} />
                            <Link href="/login"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLight
                                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                Login
                            </Link>
                            <Link href="/register"
                                className="ml-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/25 flex items-center gap-1.5">
                                Get Started <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                            <div className="ml-2"><ThemeToggle /></div>
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden flex items-center gap-2">
                            <ThemeToggle />
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-gray-300'}`}
                                aria-label="Toggle menu">
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                            className={`md:hidden border-t ${isLight ? 'border-gray-100 bg-white' : 'border-white/5 bg-[#0B0F19]'}`}>
                            <div className="px-4 py-4 space-y-1">
                                {[
                                    { label: 'Blog', href: '/blog' },
                                    { label: 'Pricing', href: '/pricing' },
                                    { label: 'Login', href: '/login' },
                                ].map(item => (
                                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                                        className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isLight
                                            ? 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                                        {item.label}
                                    </Link>
                                ))}
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold text-center mt-2">
                                    Get Started Free
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ── Hero Section ── */}
            <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-4 overflow-hidden">
                {/* Layered glow mesh */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[160px] ${isLight ? 'bg-indigo-400/20' : 'bg-indigo-600/20'}`} />
                    <div className={`absolute top-1/3 -left-48 w-[500px] h-[400px] rounded-full blur-[120px] ${isLight ? 'bg-violet-300/15' : 'bg-violet-700/15'}`} />
                    <div className={`absolute top-1/3 -right-48 w-[500px] h-[400px] rounded-full blur-[120px] ${isLight ? 'bg-cyan-300/10' : 'bg-cyan-700/10'}`} />
                    {/* Grid dots */}
                    <div className={`absolute inset-0 ${isLight ? 'opacity-[0.04]' : 'opacity-[0.06]'}`}
                        style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* Status badge */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-medium mb-8 border ${isLight
                            ? 'bg-white border-indigo-100 text-indigo-700 shadow-md shadow-indigo-100/60'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'}`}>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        AI-Powered Placement Platform
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
                        <span className="gradient-text">Your Next Placement</span>
                        <br />
                        <span className={isLight ? 'text-gray-900' : 'text-white'}>Starts Here</span>
                    </motion.h1>

                    {/* Sub */}
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className={`text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                        One platform for resume scoring, skill validation, mock interviews,
                        and job tracking – everything you need to get placed, powered by AI.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link href="/register"
                            className="group w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-base sm:text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-indigo-500/30">
                            Start Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link href="#roadmap"
                            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${isLight
                                ? 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
                                : 'bg-white/5 border border-white/10 text-gray-300 hover:border-indigo-500/40 hover:text-white'}`}>
                            See How It Works
                        </Link>
                    </motion.div>

                    {/* Social proof */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                        className={`flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                        {[
                            { icon: Users, value: '10,000+', label: 'Students Placed', iconColor: 'text-indigo-400' },
                            { icon: Star, value: '4.9/5', label: 'User Rating', iconColor: 'text-amber-400' },
                            { icon: TrendingUp, value: '85%', label: 'Success Rate', iconColor: 'text-emerald-400' },
                        ].map(stat => (
                            <div key={stat.label} className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                                    <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                                </div>
                                <span>
                                    <strong className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stat.value}</strong>
                                    {' '}{stat.label}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Feature pill row */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="mt-14 flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto relative z-10">
                    {['Resume AI Scoring', 'Skill Tests & Badges', 'Mock AI Interviews', 'Job Application Tracker', 'Gap Analysis'].map((pill) => (
                        <span key={pill}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${isLight
                                ? 'bg-white border-gray-200 text-gray-600 shadow-sm'
                                : 'bg-white/5 border-white/10 text-gray-400'}`}>
                            <Check className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                            {pill}
                        </span>
                    ))}
                </motion.div>
            </section>

            {/* ── Career Roadmap Section ── */}
            <section id="roadmap" className="py-16 md:py-28 px-4 relative">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.04] to-transparent" />

                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} className="text-center mb-20">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                            <Sparkles className="w-3 h-3" /> Guided Career Path
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight">
                            <span className="gradient-text">5 Stages. One Mission.</span>
                            <br />
                            <span className={isLight ? 'text-gray-900' : 'text-white'}>Your Career.</span>
                        </h2>
                        <p className={`text-base md:text-lg max-w-xl mx-auto ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            Follow the guided path or skip ahead. Each stage unlocks AI-powered tools to accelerate your placement.
                        </p>
                    </motion.div>

                    {/* Roadmap */}
                    <div className="relative">
                        {/* Center line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/0 via-indigo-500/40 to-indigo-500/0 -translate-x-1/2 hidden md:block" />

                        <div className="md:space-y-0">
                            {roadmapStages.map((stage, i) => (
                                <motion.div key={stage.id}
                                    initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-100px' }}
                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                    className={`relative flex flex-col md:items-center gap-6 md:gap-0 md:py-10 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

                                    {/* Card */}
                                    <div className={`flex-1 ${i % 2 === 0 ? 'md:pr-20' : 'md:pl-20'}`}>
                                        <div className={`p-6 rounded-2xl border transition-all duration-300 group cursor-default
                                            hover:shadow-xl hover:-translate-y-0.5 ${isLight
                                                ? 'bg-white border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-indigo-100'
                                                : 'bg-white/[0.03] border-white/[0.06] hover:border-indigo-500/30'}`}>
                                            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-indigo-400' : 'text-indigo-500'}`}>
                                                Stage {i + 1}
                                            </div>
                                            <h3 className={`text-2xl font-bold mb-2 group-hover:text-indigo-500 transition-colors ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                {stage.title}
                                            </h3>
                                            <p className={`mb-5 text-sm leading-relaxed ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {stage.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {stage.tools.map((tool, ti) => (
                                                    <span key={ti} className={`px-3 py-1 rounded-full text-xs font-medium border ${isLight
                                                        ? 'bg-gray-50 border-gray-200 text-gray-600'
                                                        : 'bg-white/5 border-white/10 text-gray-300'}`}>
                                                        {tool}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Icon node */}
                                    <div className={`absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-gradient-to-br ${stage.color} flex items-center justify-center shadow-lg z-10 hidden md:flex ring-4 ${isLight ? 'ring-[#F8FAFC]' : 'ring-[#080C16]'}`}>
                                        <stage.icon className="w-7 h-7 text-white" />
                                    </div>

                                    {/* Mobile icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center flex-shrink-0 md:hidden shadow-lg`}>
                                        <stage.icon className="w-6 h-6 text-white" />
                                    </div>

                                    <div className="flex-1 hidden md:block" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Grid ── */}
            <section className="py-16 md:py-24 px-4 relative">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-[100px] rounded-full ${isLight ? 'bg-violet-400/10' : 'bg-violet-600/10'}`} />
                </div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} className="text-center mb-16">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight
                            ? 'bg-violet-50 border-violet-100 text-violet-600'
                            : 'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>
                            <Zap className="w-3 h-3" /> Feature-Packed
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            <span className="gradient-text">Powered by AI,</span>
                            <span className={isLight ? ' text-gray-900' : ' text-white'}> Built for You</span>
                        </h2>
                        <p className={`text-base md:text-lg max-w-xl mx-auto ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            Every tool designed to give you an unfair advantage in the placement race.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((feature, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                                className={`group p-6 rounded-2xl border transition-all duration-300 cursor-default
                                    hover:shadow-xl hover:-translate-y-0.5 ${isLight
                                        ? 'bg-white border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-indigo-100/60'
                                        : 'bg-white/[0.03] border-white/[0.06] hover:border-indigo-500/30'}`}>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className={`text-lg font-bold mb-2 group-hover:text-indigo-500 transition-colors ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                    {feature.title}
                                </h3>
                                <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
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

            {/* ── CTA Section ── */}
            <section className="py-16 md:py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                        className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center">
                        {/* Gradient bg */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
                        {/* Glow orbs */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                        {/* Dot grid */}
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <Rocket className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                                Ready to Get Placed?
                            </h2>
                            <p className="text-indigo-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                                Join thousands of students using AI to ace their placements. One platform replaces three separate tools.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/register"
                                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-indigo-600 font-bold text-lg hover:bg-indigo-50 transition-colors shadow-xl flex items-center justify-center gap-2">
                                    Start Free <ArrowRight className="w-5 h-5" />
                                </Link>
                                <div className="flex items-center gap-2 text-indigo-200 text-sm">
                                    <ShieldCheck className="w-4 h-4" />
                                    No credit card required
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className={`pt-12 pb-8 px-4 border-t ${isLight ? 'border-gray-200' : 'border-white/[0.06]'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        {/* Brand */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                Place<span className="text-indigo-500">Nxt</span>
                            </span>
                        </div>
                        <p className={`text-sm ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
                            AI-powered placement preparation — resume, skills, interviews, jobs.
                        </p>
                        <div className={`flex items-center gap-5 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            {[
                                { label: 'Pricing', href: '/pricing' },
                                { label: 'Privacy', href: '/privacy' },
                                { label: 'Terms', href: '/terms' },
                                { label: 'Contact', href: '/contact' },
                            ].map(link => (
                                <Link key={link.href} href={link.href}
                                    className={`transition-colors ${isLight ? 'hover:text-gray-900' : 'hover:text-white'}`}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className={`pt-6 border-t text-center text-xs ${isLight ? 'border-gray-100 text-gray-400' : 'border-white/5 text-gray-600'}`}>
                        © 2026 PlaceNxt. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ── Data ── */
const roadmapStages = [
    {
        id: 'resume',
        title: 'Resume Score',
        description: 'Upload your resume and get instant ATS scores. Know your score before HR does.',
        icon: FileText,
        tools: ['Resume Parser', 'ATS Scorer', 'Skill Extractor'],
        color: 'from-blue-500 to-cyan-500',
        shadow: 'neon-cyan',
    },
    {
        id: 'skills',
        title: 'Skill Lab',
        description: 'Prove your skills with AI-powered assessments. Earn verified badges that recruiters trust.',
        icon: Zap,
        tools: ['Skill Tests', 'Gap Analysis', 'Skill Badges'],
        color: 'from-amber-500 to-orange-500',
        shadow: 'neon-amber',
    },
    {
        id: 'interviews',
        title: 'Interview Arena',
        description: 'Practice with AI interviewers for technical, behavioral, and HR rounds. Get real-time feedback.',
        icon: Mic,
        tools: ['Mock Interviews', 'Voice Analysis', 'Answer Coaching'],
        color: 'from-rose-500 to-pink-500',
        shadow: 'neon-pink',
    },
    {
        id: 'jobs',
        title: 'Job Board',
        description: 'Find and track opportunities from top sources. Every application, one dashboard.',
        icon: Rocket,
        tools: ['Job Matching', 'Application Tracker', 'Email Alerts'],
        color: 'from-emerald-500 to-teal-500',
        shadow: 'neon-emerald',
    },
    {
        id: 'offers',
        title: 'Offer Hub',
        description: 'Compare offers, negotiate better, and plan your career growth with AI guidance.',
        icon: Gem,
        tools: ['Offer Analysis', 'Salary Insights', 'Growth Planner'],
        color: 'from-violet-500 to-purple-500',
        shadow: 'neon-purple',
    },
];

const features = [
    {
        icon: FileText,
        title: 'ATS Resume Scoring',
        description: 'Know your score before HR does. AI-powered ATS analysis and smart improvement suggestions.',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Award,
        title: 'Verified Skill Badges',
        description: 'Prove it. Badge it. Show it. Digital badges trusted by recruiters at top companies.',
        color: 'from-amber-500 to-orange-500',
    },
    {
        icon: Mic,
        title: 'AI Mock Interviews',
        description: 'Practice with AI. Perform with confidence. Real-time feedback on every answer.',
        color: 'from-rose-500 to-pink-500',
    },
    {
        icon: Zap,
        title: 'Personalized Learning',
        description: 'Close skill gaps with AI-curated roadmaps tailored to your target role and company.',
        color: 'from-violet-500 to-purple-500',
    },
    {
        icon: TrendingUp,
        title: 'Career Analytics',
        description: 'Track your progress with detailed insights, growth metrics, and placement readiness scores.',
        color: 'from-emerald-500 to-teal-500',
    },
    {
        icon: Rocket,
        title: 'Smart Job Matching',
        description: 'Get matched to opportunities with AI that understands your skills, not just keywords.',
        color: 'from-indigo-500 to-blue-500',
    },
];
