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
    const posts = getAllPosts();
    const categories = new Set(posts.map(post => post.frontmatter.category));
    return ["All", ...Array.from(categories)];
}
