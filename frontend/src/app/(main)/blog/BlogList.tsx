'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, BookOpen, Clock, Tag, X, Menu, Search, FileText,
    ChevronRight, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { BlogPostData } from '@/lib/blog';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface BlogListProps {
    initialPosts: BlogPostData[];
    categories: string[];
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BlogList({ initialPosts, categories }: BlogListProps) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPosts = initialPosts.filter(post => {
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
        const matchesSearch =
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const featuredPost = filteredPosts.find(p => p.featured) || filteredPosts[0];
    const regularPosts = filteredPosts.filter(p => p.slug !== featuredPost?.slug);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080C16] text-gray-900 dark:text-white overflow-x-hidden landing-page">
            <Navbar />

            {/* ── Hero / Header ── */}
            <section className="relative pt-48 pb-16 px-4 overflow-hidden">
                {/* Background orbs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[130px] bg-indigo-500/15 dark:bg-indigo-500/15" />
                    <div className="absolute top-1/3 -right-48 w-[350px] h-[350px] rounded-full blur-[100px] bg-violet-400/10 dark:bg-violet-700/10" />
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                        style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border mb-6
                            bg-white dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-md dark:shadow-none">
                        <BookOpen className="w-4 h-4" />
                        Career Insights &amp; Tips
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black mb-5 tracking-tight leading-[1.05]">
                        The <span className="gradient-text">PlaceNxt Blog</span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg mb-10 leading-relaxed">
                        Expert advice on resumes, interviews, and career growth to help you land your dream job.
                    </motion.p>

                    {/* Search */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="relative w-full max-w-xl mx-auto mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-white/[0.04] backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                        />
                    </motion.div>

                    {/* Category pills */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-2">
                        {['All', ...categories.filter(c => c !== 'All')].map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${selectedCategory === cat
                                    ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-105'
                                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-white'}`}>
                                {cat}
                            </button>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Main Content ── */}
            <main className="max-w-7xl mx-auto px-4 pb-24">
                <AnimatePresence mode="wait">
                    {filteredPosts.length > 0 ? (
                        <motion.div key={`${selectedCategory}-${searchQuery}`}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                            className="space-y-14">

                            {/* Featured Post */}
                            {featuredPost && (
                                <Link href={`/blog/${featuredPost.slug}`}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -3 }} transition={{ duration: 0.3 }}
                                        className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-white/[0.06] shadow-xl dark:shadow-2xl dark:shadow-black/40 group cursor-pointer bg-white dark:bg-white/[0.02]">
                                        {/* Gradient fill on dark */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/70 to-transparent z-10 hidden dark:block" />
                                        {/* Light gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent z-10 dark:hidden" />

                                        <div className="grid md:grid-cols-2 gap-0 relative z-20">
                                            <div className="p-8 md:p-12 flex flex-col justify-end min-h-[360px]">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-500/30">
                                                        {featuredPost.category}
                                                    </span>
                                                    <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-100 dark:border-amber-500/30 flex items-center gap-1">
                                                        <Tag className="w-3 h-3" /> Featured
                                                    </span>
                                                </div>
                                                <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                                    {featuredPost.title}
                                                </h2>
                                                <p className="text-gray-500 dark:text-gray-300 text-base mb-7 line-clamp-2 leading-relaxed">
                                                    {featuredPost.excerpt}
                                                </p>
                                                <div className="flex items-center gap-5 text-sm text-gray-400 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                                                            {(featuredPost.author.name || 'P').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-gray-600 dark:text-gray-300">
                                                            {featuredPost.author.name || 'PlaceNxt Team'}
                                                        </span>
                                                    </div>
                                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {featuredPost.readTime || '5 min read'}</span>
                                                    <span>{formatDate(featuredPost.publishedAt)}</span>
                                                </div>
                                                <div className="mt-6 inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm group-hover:gap-3 transition-all">
                                                    Read Article <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                            {/* Image panel */}
                                            <div className="hidden md:block relative bg-gray-100 dark:bg-gray-800 min-h-[360px]">
                                                {featuredPost.coverImage ? (
                                                    <>
                                                        <Image src={featuredPost.coverImage} alt={featuredPost.title}
                                                            fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white dark:to-gray-950 opacity-20" />
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center">
                                                        <BookOpen className="w-20 h-20 text-indigo-200 dark:text-white/10" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            )}

                            {/* Posts Grid */}
                            {regularPosts.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <span className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500 inline-block" />
                                        Latest Articles
                                    </h2>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {regularPosts.map((post, idx) => (
                                            <Link href={`/blog/${post.slug}`} key={post.slug} className="block h-full">
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true, margin: '-50px' }}
                                                    transition={{ delay: (idx % 3) * 0.08, duration: 0.45 }}
                                                    whileHover={{ y: -5 }}
                                                    className="h-full flex flex-col group rounded-2xl overflow-hidden border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all duration-300 cursor-pointer">
                                                    {/* Image */}
                                                    <div className="h-48 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                        {post.coverImage ? (
                                                            <Image src={post.coverImage} alt={post.title}
                                                                fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center">
                                                                <FileText className="w-12 h-12 text-indigo-200 dark:text-white/10" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-3 left-3">
                                                            <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm text-xs font-semibold text-gray-700 dark:text-white border border-gray-200/50 dark:border-white/10">
                                                                {post.category}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Card body */}
                                                    <div className="p-5 flex-1 flex flex-col">
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                                            <Clock className="w-3 h-3" /> {post.readTime || '5 min read'}
                                                            <span className="text-gray-300 dark:text-gray-700">•</span>
                                                            <span>{formatDate(post.publishedAt)}</span>
                                                        </div>
                                                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                                                            {post.title}
                                                        </h3>
                                                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-5 flex-1 leading-relaxed">
                                                            {post.excerpt}
                                                        </p>
                                                        <div className="flex items-center text-indigo-500 dark:text-indigo-400 text-sm font-semibold gap-1 mt-auto group-hover:gap-2 transition-all">
                                                            Read Article <ArrowRight className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-24">
                            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
                                <BookOpen className="w-9 h-9 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No articles found</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Try adjusting your search or category filter.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
}
