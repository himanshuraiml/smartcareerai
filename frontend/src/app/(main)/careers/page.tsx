'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, ArrowRight, Zap, Heart, Globe, Users } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useTheme } from '@/providers/ThemeProvider';

const OPENINGS = [
    {
        title: 'University Success Manager',
        team: 'Partnerships',
        location: 'Pan-India (Remote)',
        type: 'Full-time',
        level: 'Mid',
        description: 'Be the face of PlaceNxt for our partner institutions. Help placement cells get maximum value from the platform and onboard new colleges.',
        tags: ['Account Management', 'EdTech', 'B2B'],
    },
    {
        title: 'Growth Marketing Analyst',
        team: 'Marketing',
        location: 'Pan-India (Remote)',
        type: 'Full-time',
        level: 'Junior–Mid',
        description: 'Drive user acquisition and engagement through data-driven campaigns. Own our SEO, content, and performance marketing channels.',
        tags: ['SEO', 'Performance Marketing', 'Analytics'],
    },
];

const PERKS = [
    { icon: Zap, title: 'Accelerated Learning', desc: 'Access to courses, conferences, and a generous L&D budget.' },
    { icon: Heart, title: 'Health & Wellness', desc: 'Comprehensive medical, dental, and mental health coverage.' },
    { icon: Globe, title: 'Remote-Friendly', desc: 'Flexible work from anywhere — results matter, not location.' },
    { icon: Users, title: 'Mission-Driven Team', desc: 'Work alongside former Googlers, IITians, and EdTech veterans.' },
];

export default function CareersPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const cardStyle = isLight
        ? { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }
        : { background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6">
                            <Briefcase className="w-4 h-4" /> We're Hiring
                        </span>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                            Help Shape the Future<br />of Career Intelligence
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            Join a team on a mission to make career success accessible to every student in India and beyond.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Perks */}
            <section className="pb-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {PERKS.map((perk, i) => (
                            <motion.div
                                key={perk.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl p-5 text-center"
                                style={cardStyle}
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                                    <perk.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-bold mb-1">{perk.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{perk.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Job Listings */}
            <section className="py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black mb-1">Open Positions</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{OPENINGS.length} open roles — join us and help shape the future of placement.</p>
                    </div>
                    <div className="space-y-4">
                        {OPENINGS.map((job, i) => (
                            <motion.div
                                key={job.title}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-2xl p-6 group hover:border-blue-500/40 transition-all"
                                style={cardStyle}
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">{job.team}</span>
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400">{job.level}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{job.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{job.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {job.tags.map(tag => (
                                                <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-medium">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 md:items-end flex-shrink-0">
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.type}</span>
                                        </div>
                                        <Link
                                            href={`/contact?role=${encodeURIComponent(job.title)}`}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                                        >
                                            Apply Now <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Open Application */}
                    <div className="mt-8 rounded-2xl p-8 text-center bg-gradient-to-br from-blue-600 to-violet-700 text-white">
                        <h3 className="text-xl font-black mb-2">Don't See Your Role?</h3>
                        <p className="text-blue-100 mb-6 text-sm">We're always looking for exceptional people. Send us your profile and we'll reach out when the right role opens up.</p>
                        <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors">
                            Send Open Application <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <div className="py-16" />
            <Footer />
        </div>
    );
}
