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

