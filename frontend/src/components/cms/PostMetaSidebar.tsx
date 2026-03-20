'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { PostDraft } from '@/lib/cms-api';

const CATEGORIES = [
    'Resume Building',
    'Interview Prep',
    'Career Growth',
    'Campus Placement',
    'Skills & Learning',
    'Job Search',
    'Industry Insights',
    'Recruiter Tips',
];

interface Props {
    value: Partial<PostDraft>;
    onChange: (field: keyof PostDraft, value: any) => void;
    status?: string;
    rejectNote?: string | null;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function PostMetaSidebar({ value, onChange, status, rejectNote }: Props) {
    const [keywordInput, setKeywordInput] = useState('');

    // Auto-generate slug from title if slug is empty
    useEffect(() => {
        if (value.title && !value.slug) {
            onChange('slug', slugify(value.title));
        }
    }, [value.title]);

    const addKeyword = () => {
        const kw = keywordInput.trim();
        if (!kw) return;
        const current = value.keywords || [];
        if (!current.includes(kw)) {
            onChange('keywords', [...current, kw]);
        }
        setKeywordInput('');
    };

    const removeKeyword = (kw: string) => {
        onChange('keywords', (value.keywords || []).filter(k => k !== kw));
    };

    return (
        <div className="space-y-5">
            {/* Status */}
            {status && (
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status === 'PUBLISHED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                        status === 'ARCHIVED' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                        {status.replace('_', ' ')}
                    </span>
                </div>
            )}

            {/* Reject note */}
            {rejectNote && status === 'DRAFT' && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Rejected by admin:</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{rejectNote}</p>
                </div>
            )}

            {/* Title */}
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                    type="text"
                    value={value.title || ''}
                    onChange={e => onChange('title', e.target.value)}
                    placeholder="Your article title"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Slug */}
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">URL Slug</label>
                <input
                    type="text"
                    value={value.slug || ''}
                    onChange={e => onChange('slug', slugify(e.target.value))}
                    placeholder="auto-generated-from-title"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
            </div>

            {/* Excerpt */}
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Excerpt *{' '}
                    <span className="text-gray-400">({(value.excerpt || '').length}/200)</span>
                </label>
                <textarea
                    value={value.excerpt || ''}
                    onChange={e => onChange('excerpt', e.target.value.slice(0, 200))}
                    rows={3}
                    placeholder="Brief description of the article"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>

            {/* Category */}
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select
                    value={value.category || ''}
                    onChange={e => onChange('category', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Cover Image */}
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
                <input
                    type="url"
                    value={value.coverImage || ''}
                    onChange={e => onChange('coverImage', e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {value.coverImage && (
                    <img src={value.coverImage} alt="Cover preview" className="mt-2 w-full h-24 object-cover rounded-lg" />
                )}
            </div>

            {/* Read Time */}
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Read Time</label>
                <input
                    type="text"
                    value={value.readTime || ''}
                    onChange={e => onChange('readTime', e.target.value)}
                    placeholder="e.g. 5 min read"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Keywords */}
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Keywords</label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                        placeholder="Add keyword..."
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="button"
                        onClick={addKeyword}
                        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {(value.keywords || []).map(kw => (
                        <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                            {kw}
                            <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500">
                                <X size={10} />
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Featured */}
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Featured post</label>
                <button
                    type="button"
                    onClick={() => onChange('featured', !value.featured)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        value.featured ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        value.featured ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                </button>
            </div>
        </div>
    );
}
