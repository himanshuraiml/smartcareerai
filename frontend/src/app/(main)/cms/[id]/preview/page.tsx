'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cmsApi, BlogPostData } from '@/lib/cms-api';
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Pending Review',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
};

const STATUS_CLASS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    PENDING_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    ARCHIVED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function PreviewPostPage() {
    const params = useParams();
    const id = params.id as string;
    const [post, setPost] = useState<BlogPostData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cmsApi.getPostById(id).then(setPost).catch(() => {}).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
        );
    }

    if (!post) {
        return <div className="p-8 text-center text-gray-500">Post not found</div>;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Preview banner */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-gray-900 text-white text-sm">
                <div className="flex items-center gap-3">
                    <Link href={`/cms/${id}/edit`} className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
                        <ArrowLeft size={14} />
                        Back to editor
                    </Link>
                    <span className="text-gray-600">·</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[post.status]}`}>
                        {STATUS_LABEL[post.status]}
                    </span>
                </div>
                {post.status === 'PUBLISHED' && (
                    <a href={`/blog/${post.slug}`} target="_blank" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300">
                        <ExternalLink size={13} />
                        View live
                    </a>
                )}
            </div>

            {/* Article preview */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Meta */}
                <div className="mb-8">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{post.category}</span>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                        {post.title}
                    </h1>
                    <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">{post.excerpt}</p>
                    <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
                        <span>{post.author.name || 'Author'}</span>
                        <span>·</span>
                        <span>{post.readTime || '5 min read'}</span>
                        <span>·</span>
                        <span>{post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                            : 'Unpublished'
                        }</span>
                    </div>
                </div>

                {/* Cover image */}
                {post.coverImage && (
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-64 object-cover rounded-2xl mb-8"
                    />
                )}

                {/* Content */}
                <article
                    className="prose dark:prose-invert prose-blue prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Keywords */}
                {post.keywords.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
                        <div className="flex flex-wrap gap-2">
                            {post.keywords.map(kw => (
                                <span key={kw} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-sm">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
