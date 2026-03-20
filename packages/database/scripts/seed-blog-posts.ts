/**
 * Seed existing MDX blog posts into the database.
 * Run once after the blog CMS migration:
 *   npm run seed:blog (from packages/database)
 */

import { PrismaClient, BlogPostStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const prisma = new PrismaClient();

// Simple Markdown → HTML converter (no external deps needed for basic content)
function markdownToHtml(md: string): string {
    return md
        // Headings
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold + italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Blockquote
        .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
        // Unordered list items
        .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
        // Ordered list items
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        // Wrap consecutive <li> in <ul>
        .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr />')
        // Paragraphs (double newlines)
        .replace(/\n\n(.+)/g, '<p>$1</p>')
        // Clean up extra newlines around block elements
        .replace(/\n(<\/(h[1-6]|ul|ol|blockquote|pre|hr)>)/g, '$1');
}

async function main() {
    const postsDir = path.join(__dirname, '../../../frontend/src/content/blog');

    if (!fs.existsSync(postsDir)) {
        console.log('⚠️  MDX posts directory not found at:', postsDir);
        console.log('    Skipping seed. Posts can be created via the CMS UI.');
        return;
    }

    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));
    if (files.length === 0) {
        console.log('ℹ️  No MDX files found. Nothing to seed.');
        return;
    }

    // Find admin user to set as author
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true, email: true },
    });

    if (!admin) {
        console.error('❌ No ADMIN user found. Run the main seed first: npm run seed');
        process.exit(1);
    }

    console.log(`✅ Using admin: ${admin.email}`);
    console.log(`📝 Seeding ${files.length} blog posts...\n`);

    for (const file of files) {
        const slug = file.replace(/\.mdx$/, '');
        const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
        const { data: fm, content } = matter(raw);

        // Parse publish date
        let publishedAt: Date | null = null;
        try {
            publishedAt = fm.date ? new Date(fm.date) : new Date();
            if (isNaN(publishedAt.getTime())) publishedAt = new Date();
        } catch {
            publishedAt = new Date();
        }

        const htmlContent = markdownToHtml(content);

        await prisma.blogPost.upsert({
            where: { slug },
            update: {
                title: fm.title || slug,
                excerpt: fm.excerpt || '',
                content: htmlContent,
                category: fm.category || 'General',
                coverImage: fm.image || null,
                featured: fm.featured || false,
                readTime: fm.readTime || null,
                keywords: fm.keywords || [],
                status: BlogPostStatus.PUBLISHED,
                publishedAt,
            },
            create: {
                title: fm.title || slug,
                slug,
                excerpt: fm.excerpt || '',
                content: htmlContent,
                category: fm.category || 'General',
                coverImage: fm.image || null,
                featured: fm.featured || false,
                readTime: fm.readTime || null,
                keywords: fm.keywords || [],
                status: BlogPostStatus.PUBLISHED,
                publishedAt,
                authorId: admin.id,
            },
        });

        console.log(`  ✓ ${slug}`);
    }

    console.log('\n🎉 Blog posts seeded successfully!');
}

main()
    .catch(e => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
