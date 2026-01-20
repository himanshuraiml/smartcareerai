'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, FileText, Zap, Mic, Rocket, Gem,
    Check, Star, Users, TrendingUp, Award, Menu, X
} from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0B0F19] dark-mode:bg-[#0B0F19] bg-grid overflow-hidden landing-page">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass-premium">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="SmartCareerAI Logo"
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-lg neon-purple"
                            />
                            <span className="text-xl font-bold gradient-text">SmartCareerAI</span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href="/pricing"
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                Pricing
                            </Link>
                            <Link
                                href="/login"
                                className="text-gray-300 hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity neon-purple"
                            >
                                Get Started
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-lg"
                        >
                            <div className="px-4 py-4 space-y-3">
                                <Link
                                    href="/pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    Pricing
                                </Link>
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity text-center neon-purple"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-4 relative">
                {/* Background Glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-500/20 rounded-full blur-[150px] pointer-events-none" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium mb-6"
                    >
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm text-gray-300">AI-Powered Career Acceleration</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
                    >
                        <span className="gradient-text">Your Career Journey,</span>
                        <br />
                        <span className="text-white">One Mission at a Time</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 md:mb-10"
                    >
                        A gamified, step-by-step roadmap that guides you from resume optimization
                        to landing your dream job – powered by AI.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 neon-purple"
                        >
                            Start Your Journey <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="#roadmap"
                            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl glass-card text-white font-semibold text-base sm:text-lg hover:border-purple-500/50 transition-colors"
                        >
                            See the Roadmap
                        </Link>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400"
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            <span><strong className="text-white">10,000+</strong> Career Journeys Started</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400" />
                            <span><strong className="text-white">4.9/5</strong> User Rating</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <span><strong className="text-white">85%</strong> Success Rate</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Career Roadmap Section */}
            <section id="roadmap" className="py-12 md:py-24 px-4 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none" />

                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                            <span className="gradient-text">Your Career Mission</span>
                        </h2>
                        <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
                            Follow the guided path or skip ahead – the choice is yours.
                            Each stage unlocks new AI-powered tools to accelerate your growth.
                        </p>
                    </motion.div>

                    {/* Visual Roadmap */}
                    <div className="relative">
                        {/* Central Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500/50 via-pink-500/50 to-cyan-500/50 -translate-x-1/2 rounded-full hidden md:block" />

                        {/* Roadmap Stages */}
                        <div className="space-y-12 md:space-y-0">
                            {roadmapStages.map((stage, index) => (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ delay: index * 0.1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative flex flex-col-reverse md:items-center gap-6 md:gap-0 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                                        }`}
                                >
                                    {/* Content Card */}
                                    <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                                        <div className="p-6 rounded-2xl glass-card hover:neon-purple transition-all group cursor-pointer text-center md:text-left">
                                            <div className={`flex items-center justify-center gap-3 mb-3 ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Stage {index + 1}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                                {stage.title}
                                            </h3>
                                            <p className="text-gray-400 mb-4">{stage.description}</p>
                                            <div className={`flex flex-wrap justify-center gap-2 ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                                                {stage.tools.map((tool, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-white/10">
                                                        {tool}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center Node */}
                                    <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center neon-purple z-10 hidden md:flex">
                                        <stage.icon className="w-8 h-8 text-white" />
                                    </div>

                                    {/* Mobile Icon */}
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 md:hidden">
                                        <stage.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                                    </div>

                                    {/* Spacer for opposite side */}
                                    <div className="flex-1 hidden md:block" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-12 md:py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            <span className="gradient-text">Powered by AI, Built for You</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            Every tool is designed to give you an unfair advantage
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="p-6 rounded-2xl glass-card group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:neon-purple transition-all">
                                    <feature.icon className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 md:py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="p-12 rounded-3xl glass-premium border-gradient relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 animate-float neon-purple">
                                <Rocket className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Ready to Launch Your Career?
                            </h2>
                            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                                Join the next generation of professionals using AI to navigate their career journey.
                            </p>
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg hover:opacity-90 transition-opacity neon-purple"
                            >
                                Start Free Today <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500" />
                        <span className="text-gray-400">© 2026 SmartCareerAI. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-6 text-gray-400">
                        <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const roadmapStages = [
    {
        id: 'profile',
        title: 'Profile DNA',
        description: 'Upload your resume and let AI analyze your professional DNA. Get instant ATS scores and optimization tips.',
        icon: FileText,
        tools: ['Resume Parser', 'ATS Scorer', 'Skill Extractor'],
    },
    {
        id: 'skills',
        title: 'Skill Synchronization',
        description: 'Take AI-powered assessments to validate your skills. Earn verified badges that recruiters trust.',
        icon: Zap,
        tools: ['Skill Tests', 'Gap Analysis', 'Learning Paths'],
    },
    {
        id: 'interviews',
        title: 'Simulation Training',
        description: 'Practice with AI interviewers for technical, behavioral, and HR rounds. Get real-time feedback.',
        icon: Mic,
        tools: ['Mock Interviews', 'Voice Analysis', 'Answer Coaching'],
    },
    {
        id: 'jobs',
        title: 'Career Launchpad',
        description: 'Access curated job matches from top sources. Track applications and never miss a deadline.',
        icon: Rocket,
        tools: ['Job Matching', 'Application Tracker', 'Email Alerts'],
    },
    {
        id: 'growth',
        title: 'Career Ascension',
        description: 'Analyze offers, negotiate salary, and plan your long-term growth with AI guidance.',
        icon: Gem,
        tools: ['Offer Analysis', 'Salary Insights', 'Growth Planner'],
    },
];

const features = [
    {
        icon: FileText,
        title: 'ATS Resume Scoring',
        description: 'Get instant feedback with AI-powered ATS analysis and suggestions.',
    },
    {
        icon: Award,
        title: 'Verified Skill Badges',
        description: 'Prove your expertise with digital badges trusted by recruiters.',
    },
    {
        icon: Mic,
        title: 'AI Mock Interviews',
        description: 'Practice unlimited interviews with real-time AI feedback.',
    },
    {
        icon: Zap,
        title: 'Personalized Learning',
        description: 'Close skill gaps with AI-curated learning recommendations.',
    },
    {
        icon: TrendingUp,
        title: 'Career Analytics',
        description: 'Track your progress with detailed insights and growth metrics.',
    },
    {
        icon: Rocket,
        title: 'Smart Job Matching',
        description: 'Find perfect opportunities with AI-powered recommendations.',
    },
];
