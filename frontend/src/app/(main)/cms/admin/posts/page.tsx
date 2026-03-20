'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cmsApi, BlogPostData } from '@/lib/cms-api';
import { Eye, Archive, PenSquare, RefreshCw } from 'lucide-react';

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

const STATUS_FILTER_TABS = ['All', 'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;

export default function AdminAllPostsPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [posts, setPosts] = useState<BlogPostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => {
        if (user && user.role !== 'ADMIN') router.push('/cms');
    }, [user, router]);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await cmsApi.listAllPosts({
                status: statusFilter === 'All' ? undefined : statusFilter,
                limit: 100,
            });
            setPosts(res.data);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleArchive = async (id: string, title: string) => {
        if (!confirm(`Archive "${title}"?`)) return;
        setActionId(id);
        try {
            await cmsApi.archivePost(id);
            fetchPosts();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-5xl">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">All Posts</h1>
                <p className="text-sm text-gray-500 mt-0.5">Complete view of all blog content across all authors</p>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-white/10">
                {STATUS_FILTER_TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setStatusFilter(t)}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                            statusFilter === t
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
                <div className="text-center py-20 text-gray-500 text-sm">No posts found</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/10 text-left">
                                <th className="pb-3 font-medium text-gray-500 pr-4">Title</th>
                                <th className="pb-3 font-medium text-gray-500 pr-4">Author</th>
                                <th className="pb-3 font-medium text-gray-500 pr-4">Category</th>
                                <th className="pb-3 font-medium text-gray-500 pr-4">Status</th>
                                <th className="pb-3 font-medium text-gray-500 pr-4">Date</th>
                                <th className="pb-3 font-medium text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map(post => (
                                <tr key={post.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/2">
                                    <td className="py-3 pr-4 max-w-xs">
                                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                                        <p className="text-xs text-gray-400 truncate">/blog/{post.slug}</p>
                                    </td>
                                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {post.author.name || post.author.email}
                                    </td>
                                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{post.category}</td>
                                    <td className="py-3 pr-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[post.status]}`}>
                                            {STATUS_LABEL[post.status]}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">
                                        {new Date(post.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <Link
                                                href={`/cms/${post.id}/preview`}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                title="Preview"
                                            >
                                                <Eye size={14} />
                                            </Link>
                                            <Link
                                                href={`/cms/${post.id}/edit`}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                                title="Edit"
                                            >
                                                <PenSquare size={14} />
                                            </Link>
                                            {post.status === 'PUBLISHED' && (
                                                <button
                                                    onClick={() => handleArchive(post.id, post.title)}
                                                    disabled={actionId === post.id}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors disabled:opacity-40"
                                                    title="Archive"
                                                >
                                                    <Archive size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
