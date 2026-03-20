'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cmsApi, PostDraft } from '@/lib/cms-api';
import PostMetaSidebar from '@/components/cms/PostMetaSidebar';
import { Save, Send, Loader2 } from 'lucide-react';

const PostEditor = dynamic(() => import('@/components/cms/PostEditor'), { ssr: false });

const DEFAULT_DRAFT: Partial<PostDraft> = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    coverImage: '',
    readTime: '',
    keywords: [],
    featured: false,
};

export default function NewPostPage() {
    const router = useRouter();
    const [draft, setDraft] = useState<Partial<PostDraft>>(DEFAULT_DRAFT);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleMeta = (field: keyof PostDraft, value: any) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const validate = (): string | null => {
        if (!draft.title?.trim()) return 'Title is required';
        if (!draft.excerpt?.trim()) return 'Excerpt is required';
        if (!draft.category) return 'Category is required';
        if (!draft.content || draft.content === '<p></p>') return 'Content is required';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setSaving(true);
        setError('');
        try {
            const post = await cmsApi.createPost(draft as PostDraft);
            router.push(`/cms/${post.id}/edit?saved=1`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAndSubmit = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setSubmitting(true);
        setError('');
        try {
            const post = await cmsApi.createPost(draft as PostDraft);
            await cmsApi.submitForReview(post.id);
            router.push('/cms?submitted=1');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Editor area */}
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-3xl">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-4">New Post</h1>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <PostEditor
                        onChange={html => handleMeta('content', html)}
                        placeholder="Start writing your article..."
                    />
                </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50">
                <PostMetaSidebar value={draft} onChange={handleMeta} />

                <div className="mt-6 space-y-3">
                    <button
                        onClick={handleSaveAndSubmit}
                        disabled={submitting || saving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        Save & Submit for Review
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || submitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        Save as Draft
                    </button>
                </div>
            </aside>
        </div>
    );
}
