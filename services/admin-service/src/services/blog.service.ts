import { PrismaClient, BlogPostStatus } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img', 'h1', 'h2', 'del', 'ins', 'pre', 'code',
    ]),
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height'],
        a: ['href', 'name', 'target', 'rel'],
        '*': ['class'],
    },
};

function sanitize(html: string): string {
    return sanitizeHtml(html, SANITIZE_OPTIONS);
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = slugify(base);
    let suffix = 0;
    while (true) {
        const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
        const existing = await prisma.blogPost.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });
        if (!existing || existing.id === excludeId) return candidate;
        suffix++;
    }
}

export interface CreatePostInput {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    coverImage?: string;
    featured?: boolean;
    readTime?: string;
    keywords?: string[];
    authorId: string;
    slug?: string;
}

export interface UpdatePostInput {
    title?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    coverImage?: string;
    featured?: boolean;
    readTime?: string;
    keywords?: string[];
    slug?: string;
}

export interface ListPostsFilters {
    status?: BlogPostStatus;
    authorId?: string;
    category?: string;
    page?: number;
    limit?: number;
}

const POST_SELECT = {
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    content: true,
    category: true,
    coverImage: true,
    featured: true,
    readTime: true,
    keywords: true,
    status: true,
    authorId: true,
    publishedAt: true,
    rejectedAt: true,
    rejectNote: true,
    createdAt: true,
    updatedAt: true,
    author: {
        select: { id: true, name: true, avatarUrl: true, email: true },
    },
} as const;

class BlogService {
    async createPost(data: CreatePostInput) {
        const slug = data.slug
            ? await generateUniqueSlug(data.slug)
            : await generateUniqueSlug(data.title);

        return prisma.blogPost.create({
            data: {
                title: data.title,
                slug,
                excerpt: data.excerpt,
                content: sanitize(data.content),
                category: data.category,
                coverImage: data.coverImage || null,
                featured: data.featured ?? false,
                readTime: data.readTime || null,
                keywords: data.keywords || [],
                authorId: data.authorId,
                status: BlogPostStatus.DRAFT,
            },
            select: POST_SELECT,
        });
    }

    async getPostById(id: string, requesterId: string, requesterRole: string) {
        const post = await prisma.blogPost.findUnique({
            where: { id },
            select: POST_SELECT,
        });
        if (!post) throw createError('Post not found', 404, 'NOT_FOUND');
        if (requesterRole !== 'ADMIN' && post.authorId !== requesterId) {
            throw createError('Access denied', 403, 'FORBIDDEN');
        }
        return post;
    }

    async getPublishedPostBySlug(slug: string) {
        const post = await prisma.blogPost.findFirst({
            where: { slug, status: BlogPostStatus.PUBLISHED },
            select: POST_SELECT,
        });
        if (!post) throw createError('Post not found', 404, 'NOT_FOUND');
        return post;
    }

    async updatePost(id: string, data: UpdatePostInput, requesterId: string, requesterRole: string) {
        const post = await prisma.blogPost.findUnique({ where: { id }, select: { authorId: true, status: true } });
        if (!post) throw createError('Post not found', 404, 'NOT_FOUND');
        if (requesterRole !== 'ADMIN' && post.authorId !== requesterId) {
            throw createError('Access denied', 403, 'FORBIDDEN');
        }

        const updateData: Record<string, any> = { ...data };
        if (data.content) updateData.content = sanitize(data.content);
        if (data.slug) updateData.slug = await generateUniqueSlug(data.slug, id);
        if (data.title && !data.slug) updateData.slug = await generateUniqueSlug(data.title, id);

        // If a rejected DRAFT is edited, clear the rejection info so it can be resubmitted
        if (post.status === BlogPostStatus.DRAFT) {
            updateData.rejectedAt = null;
            updateData.rejectNote = null;
        }

        return prisma.blogPost.update({
            where: { id },
            data: updateData,
            select: POST_SELECT,
        });
    }

    async deletePost(id: string, requesterId: string, requesterRole: string) {
        const post = await prisma.blogPost.findUnique({ where: { id }, select: { authorId: true } });
        if (!post) throw createError('Post not found', 404, 'NOT_FOUND');
        if (requesterRole !== 'ADMIN' && post.authorId !== requesterId) {
            throw createError('Access denied', 403, 'FORBIDDEN');
        }
        await prisma.blogPost.delete({ where: { id } });
    }

    async getMyPosts(authorId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            prisma.blogPost.findMany({
                where: { authorId },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
                select: POST_SELECT,
            }),
            prisma.blogPost.count({ where: { authorId } }),
        ]);
        return { posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async listAllPosts(filters: ListPostsFilters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const where: Record<string, any> = {};
        if (filters.status) where.status = filters.status;
        if (filters.category) where.category = filters.category;

        const [posts, total] = await Promise.all([
            prisma.blogPost.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
                select: POST_SELECT,
            }),
            prisma.blogPost.count({ where }),
        ]);
        return { posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async getPublishedPosts(params: { category?: string; page?: number; limit?: number }) {
        const page = params.page || 1;
        const limit = params.limit || 12;
        const skip = (page - 1) * limit;

        const where: Record<string, any> = { status: BlogPostStatus.PUBLISHED };
        if (params.category && params.category !== 'All') where.category = params.category;

        const [posts, total] = await Promise.all([
            prisma.blogPost.findMany({
                where,
                orderBy: { publishedAt: 'desc' },
                skip,
                take: limit,
                select: POST_SELECT,
            }),
            prisma.blogPost.count({ where }),
        ]);
        return { posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async submitForReview(id: string, requesterId: string) {
        const post = await prisma.blogPost.findUnique({ where: { id }, select: { authorId: true, status: true } });
        if (!post) throw createError('Post not found', 404, 'NOT_FOUND');
        if (post.authorId !== requesterId) throw createError('Access denied', 403, 'FORBIDDEN');
        if (post.status !== BlogPostStatus.DRAFT) {
            throw createError('Only draft posts can be submitted for review', 400, 'INVALID_STATUS');
        }
        return prisma.blogPost.update({
            where: { id },
            data: { status: BlogPostStatus.PENDING_REVIEW, rejectedAt: null, rejectNote: null },
            select: POST_SELECT,
        });
    }

    async publishPost(id: string) {
        const post = await prisma.blogPost.findUnique({ where: { id }, select: { status: true } });
        if (!post) throw createError('Post not found', 404, 'NOT_FOUND');
        return prisma.blogPost.update({
            where: { id },
            data: { status: BlogPostStatus.PUBLISHED, publishedAt: new Date() },
            select: POST_SELECT,
        });
    }

    async rejectPost(id: string, note: string) {
        const post = await prisma.blogPost.findUnique({ where: { id }, select: { status: true } });
        if (!post) throw createError('Post not found', 404, 'NOT_FOUND');
        if (post.status !== BlogPostStatus.PENDING_REVIEW) {
            throw createError('Only pending review posts can be rejected', 400, 'INVALID_STATUS');
        }
        return prisma.blogPost.update({
            where: { id },
            data: {
                status: BlogPostStatus.DRAFT,
                rejectedAt: new Date(),
                rejectNote: note,
            },
            select: POST_SELECT,
        });
    }

    async archivePost(id: string) {
        const post = await prisma.blogPost.findUnique({ where: { id }, select: { status: true } });
        if (!post) throw createError('Post not found', 404, 'NOT_FOUND');
        return prisma.blogPost.update({
            where: { id },
            data: { status: BlogPostStatus.ARCHIVED },
            select: POST_SELECT,
        });
    }
}

export const blogService = new BlogService();
