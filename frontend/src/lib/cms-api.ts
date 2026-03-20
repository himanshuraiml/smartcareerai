import { authFetch } from '@/lib/auth-fetch';

export interface BlogPostData {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    coverImage: string | null;
    featured: boolean;
    readTime: string | null;
    keywords: string[];
    status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
    authorId: string;
    publishedAt: string | null;
    rejectedAt: string | null;
    rejectNote: string | null;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
        email: string;
    };
}

export interface PostDraft {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    coverImage?: string;
    featured?: boolean;
    readTime?: string;
    keywords?: string[];
    slug?: string;
}

export interface PaginatedPosts {
    data: BlogPostData[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function buildQuery(params?: Record<string, string | number | undefined>): string {
    if (!params) return '';
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') q.set(k, String(v));
    }
    const s = q.toString();
    return s ? `?${s}` : '';
}

// ── Public (no auth) ──────────────────────────────────────────────────────

export async function getPublishedPosts(params?: {
    category?: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedPosts> {
    const res = await fetch(`${API_URL}/cms/posts${buildQuery(params as any)}`, {
        next: { revalidate: 60 },
    });
    if (!res.ok) return { data: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } };
    const json = await res.json();
    return { data: json.data || [], pagination: json.pagination };
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPostData | null> {
    const res = await fetch(`${API_URL}/cms/posts/slug/${encodeURIComponent(slug)}`, {
        next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
}

// ── Authenticated ─────────────────────────────────────────────────────────

export const cmsApi = {
    async getMyPosts(params?: { page?: number; limit?: number }): Promise<PaginatedPosts> {
        const res = await authFetch(`/cms/my-posts${buildQuery(params as any)}`);
        const json = await res.json();
        return { data: json.data || [], pagination: json.pagination };
    },

    async createPost(data: PostDraft): Promise<BlogPostData> {
        const res = await authFetch('/cms/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to create post');
        return json.data;
    },

    async getPostById(id: string): Promise<BlogPostData> {
        const res = await authFetch(`/cms/posts/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to fetch post');
        return json.data;
    },

    async updatePost(id: string, data: Partial<PostDraft>): Promise<BlogPostData> {
        const res = await authFetch(`/cms/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to update post');
        return json.data;
    },

    async deletePost(id: string): Promise<void> {
        const res = await authFetch(`/cms/posts/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const json = await res.json();
            throw new Error(json.message || 'Failed to delete post');
        }
    },

    async submitForReview(id: string): Promise<BlogPostData> {
        const res = await authFetch(`/cms/posts/${id}/submit`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to submit post');
        return json.data;
    },

    // ── Admin ──────────────────────────────────────────────────────────────

    async listAllPosts(params?: {
        status?: string;
        category?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedPosts> {
        const res = await authFetch(`/cms/admin/posts${buildQuery(params as any)}`);
        const json = await res.json();
        return { data: json.data || [], pagination: json.pagination };
    },

    async publishPost(id: string): Promise<BlogPostData> {
        const res = await authFetch(`/cms/admin/posts/${id}/publish`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to publish post');
        return json.data;
    },

    async rejectPost(id: string, note: string): Promise<BlogPostData> {
        const res = await authFetch(`/cms/admin/posts/${id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to reject post');
        return json.data;
    },

    async archivePost(id: string): Promise<BlogPostData> {
        const res = await authFetch(`/cms/admin/posts/${id}/archive`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to archive post');
        return json.data;
    },
};
