import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'src/content/blog');

export interface BlogPostFrontmatter {
    title: string;
    excerpt: string;
    category: string;
    readTime: string;
    date: string;
    image: string;
    featured: boolean;
    keywords: string[];
}

export interface BlogPost {
    slug: string;
    frontmatter: BlogPostFrontmatter;
    content: string;
}

/**
 * Returns ALL posts regardless of date.
 * Used for generateStaticParams so Next.js can pre-render all slugs.
 */
export function getAllPosts(): BlogPost[] {
    const fileNames = fs.readdirSync(postsDirectory);
    const mdxFiles = fileNames.filter(fileName => fileName.endsWith('.mdx'));

    const allPosts = mdxFiles.map((fileName) => {
        const slug = fileName.replace(/\.mdx$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        const { data, content } = matter(fileContents);

        return {
            slug,
            frontmatter: data as BlogPostFrontmatter,
            content,
        };
    });

    // Sort posts by date (newest first)
    return allPosts.sort((a, b) => {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
    });
}

/**
 * Returns only PUBLISHED posts (date <= today).
 * This ensures blog posts appear one per week on their scheduled date.
 */
export function getPublishedPosts(): BlogPost[] {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Include posts published today

    return getAllPosts().filter(post => {
        const postDate = new Date(post.frontmatter.date);
        return postDate <= now;
    });
}

export function getPostBySlug(slug: string): BlogPost | undefined {
    try {
        const fullPath = path.join(postsDirectory, `${slug}.mdx`);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
            slug,
            frontmatter: data as BlogPostFrontmatter,
            content,
        };
    } catch (e) {
        return undefined;
    }
}

export function getAllCategories(): string[] {
    const posts = getPublishedPosts();
    const categories = new Set(posts.map(post => post.frontmatter.category));
    return ["All", ...Array.from(categories)];
}

// ============================================
// API-BACKED BLOG FUNCTIONS (CMS database)
// ============================================

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
    status: string;
    authorId: string;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
        email: string;
    };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function getPublishedPostsFromApi(params?: {
    category?: string;
    page?: number;
    limit?: number;
}): Promise<BlogPostData[]> {
    try {
        const query = new URLSearchParams();
        if (params?.category && params.category !== 'All') query.set('category', params.category);
        if (params?.page) query.set('page', String(params.page));
        if (params?.limit) query.set('limit', String(params.limit));
        const qs = query.toString();

        const res = await fetch(`${API_URL}/cms/posts${qs ? `?${qs}` : ''}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch {
        return [];
    }
}

export async function getPublishedPostBySlugFromApi(slug: string): Promise<BlogPostData | null> {
    try {
        const res = await fetch(`${API_URL}/cms/posts/slug/${encodeURIComponent(slug)}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || null;
    } catch {
        return null;
    }
}

export async function getAllPublishedCategoriesFromApi(): Promise<string[]> {
    const posts = await getPublishedPostsFromApi({ limit: 200 });
    const cats = new Set(posts.map(p => p.category));
    return ['All', ...Array.from(cats)];
}

