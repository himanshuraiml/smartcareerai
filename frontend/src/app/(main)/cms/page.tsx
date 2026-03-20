'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cmsApi, BlogPostData } from '@/lib/cms-api';
import { PenSquare, Eye, Trash2, Send, Plus, RefreshCw } from 'lucide-react';

const STATUS_TABS = ['All', 'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
type TabType = typeof STATUS_TABS[number];

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

export default function CmsPostsPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const isAdmin = user?.role === 'ADMIN';

    const [tab, setTab] = useState<TabType>('All');
    const [posts, setPosts] = useState<BlogPostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                const res = await cmsApi.listAllPosts({ status: tab === 'All' ? undefined : tab, limit: 50 });
                setPosts(res.data);
            } else {
                const res = await cmsApi.getMyPosts({ limit: 50 });
                const filtered = tab === 'All' ? res.data : res.data.filter(p => p.status === tab);
                setPosts(filtered);
            }
        } finally {
            setLoading(false);
        }
    }, [tab, isAdmin]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleSubmit = async (id: string) => {
        setActionId(id);
        try {
            await cmsApi.submitForReview(id);
            fetchPosts();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        setActionId(id);
        try {
            await cmsApi.deletePost(id);
            fetchPosts();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isAdmin ? 'All Posts' : 'My Posts'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isAdmin ? 'Manage and moderate all blog content' : 'Write and manage your articles'}
                    </p>
                </div>
                <Link
                    href="/cms/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={15} />
                    New Post
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-white/10">
                {STATUS_TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                            tab === t
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {t === 'All' ? 'All' : STATUS_LABEL[t]}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw size={20} className="animate-spin text-gray-400" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20">
                    <PenSquare size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 text-sm">No posts found</p>
                    <Link href="/cms/new" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                        Write your first article →
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {posts.map(post => (
                        <div
                            key={post.id}
                            className="flex items-start gap-4 p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors"
                        >
                            {/* Cover */}
                            {post.coverImage ? (
                                <img src={post.coverImage} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
                            ) : (
                                <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shrink-0" />
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 flex-wrap">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                        {post.title}
                                    </h3>
                                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[post.status]}`}>
                                        {STATUS_LABEL[post.status]}
                                    </span>
                                    {post.rejectNote && post.status === 'DRAFT' && (
                                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" title={post.rejectNote}>
                                            Rejected
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{post.excerpt}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                    <span>{post.category}</span>
                                    <span>·</span>
                                    <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                                    {isAdmin && <span>· by {post.author.name || post.author.email}</span>}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Link
                                    href={`/cms/${post.id}/preview`}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    title="Preview"
                                >
                                    <Eye size={15} />
                                </Link>
                                {post.status === 'DRAFT' && (
                                    <>
                                        <Link
                                            href={`/cms/${post.id}/edit`}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                            title="Edit"
                                        >
                                            <PenSquare size={15} />
                                        </Link>
                                        <button
                                            onClick={() => handleSubmit(post.id)}
                                            disabled={actionId === post.id}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-40"
                                            title="Submit for review"
                                        >
                                            <Send size={15} />
                                        </button>
                                    </>
                                )}
                                {post.status === 'PENDING_REVIEW' && (
                                    <Link
                                        href={`/cms/${post.id}/edit`}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                        title="Edit"
                                    >
                                        <PenSquare size={15} />
                                    </Link>
                                )}
                                <button
                                    onClick={() => handleDelete(post.id, post.title)}
                                    disabled={actionId === post.id}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                                    title="Delete"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
