'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Clock, Tag, X, Menu, Search, FileText } from 'lucide-react';
import Image from 'next/image';
import { BlogPost } from '@/lib/blog';

interface BlogListProps {
    initialPosts: BlogPost[];
    categories: string[];
}

export default function BlogList({ initialPosts, categories }: BlogListProps) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter posts
    const filteredPosts = initialPosts.filter(post => {
        const matchesCategory = selectedCategory === "All" || post.frontmatter.category === selectedCategory;
        const matchesSearch = post.frontmatter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.frontmatter.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const featuredPost = filteredPosts.find(p => p.frontmatter.featured) || filteredPosts[0];
    const regularPosts = filteredPosts.filter(p => p.slug !== featuredPost?.slug);

    return (
        <div className="min-h-screen bg-[#0B0F19] bg-grid landing-page text-white overflow-x-hidden">

            {/* Navigation (Reused from Home) */}
            <nav className="fixed top-0 w-full z-50 glass-premium border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 cursor-pointer"
                            role="button"
                            tabIndex={0}
                        >
                            <Image
                                src="/logo.svg"
                                alt="PlaceNxt Logo"
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-lg neon-purple"
                            />
                            <span className="text-xl font-bold gradient-text">PlaceNxt</span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/blog" className="text-white font-medium">Blog</Link>
                            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
                            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
                            <Link
                                href="/register"
                                className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white !text-white font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-violet-500/30"
                            >
                                Start Free <ArrowRight className="w-4 h-4 text-white" />
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
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
                            className="md:hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-lg"
                        >
                            <div className="px-4 py-4 space-y-3">
                                <Link onClick={() => setMobileMenuOpen(false)} href="/blog" className="block px-4 py-3 rounded-lg text-white bg-white/5">Blog</Link>
                                <Link onClick={() => setMobileMenuOpen(false)} href="/pricing" className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10">Pricing</Link>
                                <Link onClick={() => setMobileMenuOpen(false)} href="/login" className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10">Login</Link>
                                <Link
                                    href="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2"
                                >
                                    Start Free <ArrowRight className="w-4 h-4 text-white" />
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Header Section */}
            <section className="pt-32 pb-12 px-4 relative">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium mb-6"
                    >
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-gray-300">Career Insights & Tips</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        The <span className="gradient-text">PlaceNxt Blog</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">
                        Expert advice on resumes, interviews, and career growth to help you land your dream job.
                    </p>

                    {/* Search & Filter - Centered Layout */}
                    <div className="flex flex-col items-center gap-6">
                        {/* Search Bar - Centered */}
                        <div className="relative w-full max-w-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xl shadow-black/20"
                            />
                        </div>

                        {/* Categories - Below Search Bar */}
                        <div className="flex flex-wrap justify-center gap-2 w-full max-w-3xl">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${selectedCategory === cat
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-105'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ambient Background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            </section>

            <main className="max-w-7xl mx-auto px-4 pb-20">
                {filteredPosts.length > 0 ? (
                    <div className="space-y-16">
                        {/* Featured Post */}
                        {featuredPost && (
                            <Link href={`/blog/${featuredPost.slug}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.01 }}
                                    className="relative rounded-3xl overflow-hidden glass-card border-none group cursor-pointer shadow-2xl shadow-black/40"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/80 to-transparent z-10" />
                                    <div className="grid md:grid-cols-2 gap-8 relative z-20">
                                        <div className="p-8 md:p-12 flex flex-col justify-end h-full min-h-[400px]">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/30">
                                                    {featuredPost.frontmatter.category}
                                                </span>
                                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg border border-yellow-500/30 flex items-center gap-1">
                                                    <Tag className="w-3 h-3" /> Featured
                                                </span>
                                            </div>
                                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight group-hover:text-indigo-300 transition-colors">
                                                {featuredPost.frontmatter.title}
                                            </h2>
                                            <p className="text-gray-300 text-lg mb-8 line-clamp-2 leading-relaxed">
                                                {featuredPost.frontmatter.excerpt}
                                            </p>
                                            <div className="flex items-center gap-6 text-sm text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">P</div>
                                                    <span>PlaceNxt Team</span>
                                                </div>
                                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {featuredPost.frontmatter.readTime}</span>
                                                <span>{featuredPost.frontmatter.date}</span>
                                            </div>
                                        </div>
                                        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2 bg-gray-800">
                                            {featuredPost.frontmatter.image ? (
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={featuredPost.frontmatter.image}
                                                        alt={featuredPost.frontmatter.title}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/50 to-transparent" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-violet-900/40 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-700">
                                                    <BookOpen className="w-24 h-24 text-white/10" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        )}

                        {/* Recent Posts Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {regularPosts.map((post, idx) => (
                                <Link href={`/blog/${post.slug}`} key={post.slug} className="block h-full">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="h-full flex flex-col group rounded-2xl glass-card overflow-hidden hover:translate-y-[-8px] transition-all duration-300 border border-white/5 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10"
                                    >
                                        <div className="h-48 bg-gray-800 relative overflow-hidden">
                                            {post.frontmatter.image ? (
                                                <Image
                                                    src={post.frontmatter.image}
                                                    alt={post.frontmatter.title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <FileText className="w-12 h-12 text-white/5 group-hover:text-white/10 transition-colors" />
                                                    </div>
                                                </>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-xs font-medium text-white rounded-lg border border-white/10">
                                                    {post.frontmatter.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.frontmatter.readTime}</span>
                                                <span>•</span>
                                                <span>{post.frontmatter.date}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
                                                {post.frontmatter.title}
                                            </h3>
                                            <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-1">
                                                {post.frontmatter.excerpt}
                                            </p>
                                            <div className="flex items-center text-indigo-400 text-sm font-medium group-hover:translate-x-1 transition-transform mt-auto">
                                                Read Article <ArrowRight className="w-4 h-4 ml-1" />
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-medium text-white mb-2">No articles found</h3>
                        <p>Try adjusting your search or category filter.</p>
                    </div>
                )}
            </main>

            {/* Footer (Simple Version) */}
            <footer className="py-8 px-4 border-t border-white/5 mt-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                    <div>© 2026 PlaceNxt. All rights reserved.</div>
                    <div className="flex gap-6">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}


