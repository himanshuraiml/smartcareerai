'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cmsApi, BlogPostData } from '@/lib/cms-api';
import { Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function PendingReviewPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    const [posts, setPosts] = useState<BlogPostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
    const [rejectNote, setRejectNote] = useState('');

    useEffect(() => {
        if (user && user.role !== 'ADMIN') router.push('/cms');
    }, [user, router]);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await cmsApi.listAllPosts({ status: 'PENDING_REVIEW', limit: 100 });
            setPosts(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handlePublish = async (id: string) => {
        setActionId(id);
        try {
            await cmsApi.publishPost(id);
            fetchPosts();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setActionId(rejectModal.id);
        try {
            await cmsApi.rejectPost(rejectModal.id, rejectNote);
            setRejectModal(null);
            setRejectNote('');
            fetchPosts();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pending Review</h1>
                <p className="text-sm text-gray-500 mt-0.5">Review and moderate submitted articles</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw size={20} className="animate-spin text-gray-400" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20">
                    <CheckCircle size={36} className="mx-auto text-green-400 mb-3" />
                    <p className="text-gray-500 text-sm">All caught up! No posts pending review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <div
                            key={post.id}
                            className="p-5 bg-white dark:bg-white/5 rounded-xl border border-amber-200 dark:border-amber-500/30"
                        >
                            <div className="flex items-start gap-4">
                                {post.coverImage ? (
                                    <img src={post.coverImage} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                                ) : (
                                    <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{post.excerpt}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                        <span className="font-medium text-gray-600 dark:text-gray-300">
                                            by {post.author.name || post.author.email}
                                        </span>
                                        <span>·</span>
                                        <span>{post.category}</span>
                                        <span>·</span>
                                        <span>Submitted {new Date(post.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        href={`/cms/${post.id}/preview`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Eye size={13} />
                                        Preview
                                    </Link>
                                    <button
                                        onClick={() => handlePublish(post.id)}
                                        disabled={actionId === post.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                    >
                                        <CheckCircle size={13} />
                                        Publish
                                    </button>
                                    <button
                                        onClick={() => { setRejectModal({ id: post.id, title: post.title }); setRejectNote(''); }}
                                        disabled={actionId === post.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                    >
                                        <XCircle size={13} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Reject post</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Explain to the author why <span className="font-medium text-gray-700 dark:text-gray-300">"{rejectModal.title}"</span> was rejected.
                        </p>
                        <textarea
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            rows={4}
                            placeholder="e.g. Please add more specific examples in the 'Technical Interview' section..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectModal(null)}
                                className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectNote.trim() || actionId === rejectModal.id}
                                className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                Send Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
