'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, FileText, Video, Download, ArrowRight, Search, Zap, Code2, Users, BarChart3 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useTheme } from '@/providers/ThemeProvider';
import { useState } from 'react';

const CATEGORIES = ['All', 'Resume', 'Interview', 'Career', 'Coding', 'Recruiter'];

const RESOURCES = [
    {
        type: 'guide',
        category: 'Resume',
        title: 'The ATS-Proof Resume Guide 2025',
        desc: 'Step-by-step guide to writing a resume that passes automated screening systems at top tech companies. Includes 15 real before/after examples.',
        icon: FileText,
        gradient: 'from-blue-500 to-cyan-500',
        downloadLabel: 'Download PDF',
        readTime: '20 min read',
        featured: true,
    },
    {
        type: 'guide',
        category: 'Interview',
        title: 'System Design Interview Cheatsheet',
        desc: 'A visual reference guide covering CAP theorem, database scaling, caching strategies, and microservice patterns — the 10 most common system design topics.',
        icon: Code2,
        gradient: 'from-violet-500 to-purple-500',
        downloadLabel: 'Download PDF',
        readTime: '15 min read',
        featured: true,
    },
    {
        type: 'template',
        category: 'Resume',
        title: 'SWE Resume Template (FAANG-Approved)',
        desc: 'The exact resume format used by candidates who got offers at Google, Meta, Amazon, and Flipkart. Optimized for ATS systems.',
        icon: FileText,
        gradient: 'from-emerald-500 to-teal-500',
        downloadLabel: 'Download .docx',
        readTime: 'Template',
        featured: false,
    },
    {
        type: 'guide',
        category: 'Interview',
        title: 'Behavioural Interview Mastery (STAR Method)',
        desc: 'Master the STAR method with 40 sample answers to the most common behavioural questions. Covers leadership, conflict, failure, and more.',
        icon: Users,
        gradient: 'from-orange-500 to-amber-500',
        downloadLabel: 'Download PDF',
        readTime: '25 min read',
        featured: false,
    },
    {
        type: 'guide',
        category: 'Coding',
        title: 'DSA Patterns for Product Companies',
        desc: 'The 14 core DSA patterns that appear in 90% of coding interviews. Each pattern includes 5–8 practice problems with solutions in Python and Java.',
        icon: Code2,
        gradient: 'from-pink-500 to-rose-500',
        downloadLabel: 'Download PDF',
        readTime: '45 min read',
        featured: true,
    },
    {
        type: 'guide',
        category: 'Career',
        title: 'Salary Negotiation Playbook',
        desc: 'Scripts, tactics, and email templates for negotiating a higher offer. Based on 500+ successful negotiations by PlaceNxt users.',
        icon: BarChart3,
        gradient: 'from-indigo-500 to-blue-500',
        downloadLabel: 'Download PDF',
        readTime: '12 min read',
        featured: false,
    },
    {
        type: 'template',
        category: 'Recruiter',
        title: 'Hiring Manager Scorecard Template',
        desc: 'A structured scoring rubric for evaluating candidates consistently across interviews. Includes role-specific criteria for engineering, product, and ops.',
        icon: Users,
        gradient: 'from-teal-500 to-cyan-600',
        downloadLabel: 'Download .xlsx',
        readTime: 'Template',
        featured: false,
    },
    {
        type: 'guide',
        category: 'Career',
        title: 'First-Year Engineer Survival Guide',
        desc: 'How to ramp up quickly, build relationships, pick the right projects, and position yourself for your first promotion. Written by senior engineers at top companies.',
        icon: Zap,
        gradient: 'from-amber-500 to-orange-500',
        downloadLabel: 'Download PDF',
        readTime: '18 min read',
        featured: false,
    },
];

const TYPE_ICON: Record<string, typeof FileText> = {
    guide: BookOpen,
    template: FileText,
    video: Video,
};

export default function ResourcesPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');

    const cardStyle = isLight
        ? { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }
        : { background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' };

    const filtered = RESOURCES.filter(r => {
        const matchesCat = activeCategory === 'All' || r.category === activeCategory;
        const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const featured = RESOURCES.filter(r => r.featured);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-6">
                            <BookOpen className="w-4 h-4" /> Free Resources
                        </span>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                            Everything You Need<br />to Land the Job
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            Free guides, templates, and cheatsheets curated by PlaceNxt's career experts. No email required.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Featured */}
            <section className="pb-10 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-xl font-black mb-5">Featured Resources</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {featured.map((r, i) => (
                            <motion.div
                                key={r.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl overflow-hidden"
                                style={cardStyle}
                            >
                                <div className={`h-1.5 bg-gradient-to-r ${r.gradient}`} />
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${r.gradient} flex items-center justify-center`}>
                                            <r.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{r.category}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{r.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4">{r.desc}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">{r.readTime}</span>
                                        <button className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r ${r.gradient} text-white shadow-sm hover:opacity-90`}>
                                            <Download className="w-3 h-3" /> {r.downloadLabel}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* All Resources */}
            <section className="py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search resources..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filtered.map((r, i) => (
                            <motion.div
                                key={r.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-2xl p-5 flex gap-4"
                                style={cardStyle}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                    <r.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{r.category}</span>
                                        <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
                                        <span className="text-[10px] text-gray-400">{r.readTime}</span>
                                    </div>
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">{r.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">{r.desc}</p>
                                    <button className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r ${r.gradient} text-white shadow-sm hover:opacity-90`}>
                                        <Download className="w-3 h-3" /> {r.downloadLabel}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No resources match your search.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Blog CTA */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-10 text-white">
                    <h2 className="text-2xl font-black mb-3">Want Even More Content?</h2>
                    <p className="text-indigo-100 mb-6 text-sm">Our blog publishes weekly guides on careers, AI, and the job market.</p>
                    <Link href="/blog" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors">
                        Visit the Blog <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
