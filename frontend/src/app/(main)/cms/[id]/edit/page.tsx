'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth.store';
import { cmsApi, BlogPostData, PostDraft } from '@/lib/cms-api';
import PostMetaSidebar from '@/components/cms/PostMetaSidebar';
import { Save, Send, Eye, Loader2, CheckCircle } from 'lucide-react';

const PostEditor = dynamic(() => import('@/components/cms/PostEditor'), { ssr: false });

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const id = params.id as string;
    const isAdmin = user?.role === 'ADMIN';

    const [post, setPost] = useState<BlogPostData | null>(null);
    const [draft, setDraft] = useState<Partial<PostDraft>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(searchParams.get('saved') === '1');

    useEffect(() => {
        async function load() {
            try {
                const p = await cmsApi.getPostById(id);
                setPost(p);
                setDraft({
                    title: p.title,
                    slug: p.slug,
                    excerpt: p.excerpt,
                    content: p.content,
                    category: p.category,
                    coverImage: p.coverImage || '',
                    readTime: p.readTime || '',
                    keywords: p.keywords,
                    featured: p.featured,
                });
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    const handleMeta = (field: keyof PostDraft, value: any) => {
        setDraft(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const validate = (): string | null => {
        if (!draft.title?.trim()) return 'Title is required';
        if (!draft.excerpt?.trim()) return 'Excerpt is required';
        if (!draft.category) return 'Category is required';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setSaving(true);
        setError('');
        try {
            const updated = await cmsApi.updatePost(id, draft);
            setPost(updated);
            setSaved(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        await handleSave();
        setSubmitting(true);
        try {
            await cmsApi.submitForReview(id);
            router.push('/cms?submitted=1');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublish = async () => {
        setPublishing(true);
        try {
            await cmsApi.publishPost(id);
            router.push('/cms/admin/posts?published=1');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setPublishing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="p-8 text-center text-gray-500">Post not found</div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Editor area */}
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Edit Post</h1>
                        <a
                            href={`/cms/${id}/preview`}
                            target="_blank"
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <Eye size={14} />
                            Preview
                        </a>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {saved && (
                        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                            <CheckCircle size={14} />
                            Saved successfully
                        </div>
                    )}

                    {draft.content !== undefined && (
                        <PostEditor
                            initialContent={draft.content}
                            onChange={html => handleMeta('content', html)}
                        />
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50">
                <PostMetaSidebar
                    value={draft}
                    onChange={handleMeta}
                    status={post.status}
                    rejectNote={post.rejectNote}
                />

                <div className="mt-6 space-y-3">
                    {/* Admin: publish directly */}
                    {isAdmin && (
                        <button
                            onClick={handlePublish}
                            disabled={publishing || saving}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {publishing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            Publish Now
                        </button>
                    )}

                    {/* Non-admin: submit for review */}
                    {!isAdmin && post.status === 'DRAFT' && (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || saving}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                            Submit for Review
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving || submitting || publishing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        Save
                    </button>
                </div>
            </aside>
        </div>
    );
}
