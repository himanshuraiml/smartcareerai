import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Tag, ArrowRight, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublishedPostBySlugFromApi, getPublishedPostsFromApi } from '@/lib/blog';
import Logo from '@/components/layout/Logo';
import ShareButton from '@/components/blog/ShareButton';

export async function generateStaticParams() {
    const posts = await getPublishedPostsFromApi({ limit: 500 });
    return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPublishedPostBySlugFromApi(slug);

    if (!post) {
        notFound();
    }

    const allPosts = await getPublishedPostsFromApi({ limit: 100 });
    const relatedPosts = allPosts
        .filter(p => p.category === post.category && p.slug !== post.slug)
        .slice(0, 2);

    const formattedDate = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] bg-grid landing-page text-gray-900 dark:text-white overflow-x-hidden">

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass-premium border-b border-gray-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <Logo width={160} height={40} />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/blog" className="text-gray-900 dark:text-white font-medium">Blog</Link>
                            <Link href="/pricing" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link>
                            <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Login</Link>
                            <Link
                                href="/register"
                                className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white !text-white font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-violet-500/30"
                            >
                                Start Free <ArrowRight className="w-4 h-4 text-white" />
                            </Link>
                        </div>

                        <Link
                            href="/blog"
                            className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link href="/blog" className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 group transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>

                    {/* Article Header */}
                    <div className="mb-10 text-center">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-sm font-bold rounded-lg border border-indigo-500/30">
                                {post.category}
                            </span>
                            {post.readTime && (
                                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                    <Clock className="w-4 h-4" /> {post.readTime}
                                </span>
                            )}
                            {formattedDate && (
                                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-4 h-4" /> {formattedDate}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">{post.title}</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">{post.excerpt}</p>

                        {/* Author Info */}
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {(post.author.name || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                                <div className="text-gray-900 dark:text-white font-medium">
                                    {post.author.name || 'PlaceNxt Team'}
                                </div>
                                <div className="text-xs text-gray-500">Career Experts</div>
                            </div>
                        </div>
                    </div>

                    {/* Featured Image */}
                    <div className="relative aspect-video rounded-3xl overflow-hidden mb-12 border border-gray-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10">
                        {post.coverImage ? (
                            <Image
                                src={post.coverImage}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex items-center justify-center">
                                <BookOpen className="w-32 h-32 text-white/10" />
                            </div>
                        )}
                    </div>

                    {/* Content — TipTap HTML rendered safely */}
                    <article
                        className="prose dark:prose-invert prose-lg max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:text-gray-600 dark:prose-ul:text-gray-300 prose-li:marker:text-indigo-500"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Article Footer: Keywords & Share */}
                    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div className="flex flex-wrap gap-2">
                                {post.keywords.map(keyword => (
                                    <span key={keyword} className="px-3 py-1 bg-white dark:bg-white/5 rounded-full text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5">
                                        #{keyword}
                                    </span>
                                ))}
                            </div>
                            <ShareButton title={post.title} slug={post.slug} />
                        </div>
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <div className="mt-20">
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-indigo-500" /> Related Articles
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                {relatedPosts.map(related => (
                                    <Link key={related.slug} href={`/blog/${related.slug}`} className="group p-6 rounded-2xl glass-card border border-gray-200 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                                        <div className="text-xs text-indigo-400 mb-2 font-medium">{related.category}</div>
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-300 transition-colors">{related.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{related.excerpt}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-white/10 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to accelerate your career?</h2>
                            <p className="text-gray-300 mb-8 max-w-xl mx-auto">Join thousands of students using PlaceNxt to build ATS-friendly resumes and ace their interviews.</p>
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-violet-500/30"
                            >
                                Start Free Now <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-gray-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                    <div>© 2026 PlaceNxt. All rights reserved.</div>
                    <div className="flex gap-6">
                        <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
                        <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link>
                        <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
