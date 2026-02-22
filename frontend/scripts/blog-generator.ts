/**
 * Blog Generator Script — On-Demand, One Post at a Time
 * 
 * Generates the NEXT scheduled blog post using the Groq LLM API.
 * Designed to be run weekly (e.g., via cron job, GitHub Action, or manually).
 * Only generates ONE post per run — the next unwritten topic in the schedule.
 *
 * Usage:
 *   npx tsx frontend/scripts/blog-generator.ts           # Generate next due post
 *   npx tsx frontend/scripts/blog-generator.ts --dry-run  # Preview without writing
 *   npx tsx frontend/scripts/blog-generator.ts --force 5  # Force-generate topic at index 5
 *   npx tsx frontend/scripts/blog-generator.ts --status    # Show schedule status
 */

import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { blogTopics, BlogTopic } from './topics';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_MODEL = process.env.AI_MODEL_NAME || 'llama-3.3-70b-versatile';
const OUTPUT_DIR = path.resolve(__dirname, '../src/content/blog');

// ─── Schedule Config ────────────────────────────────────────────────────────
// Week 0 starts on this date. Each subsequent topic publishes 7 days later.
const SCHEDULE_START = new Date('2026-02-21'); // Today — first post goes live immediately
SCHEDULE_START.setHours(0, 0, 0, 0);

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getPublicationDate(weekIndex: number): Date {
    const pubDate = new Date(SCHEDULE_START);
    pubDate.setDate(pubDate.getDate() + weekIndex * 7);
    return pubDate;
}

function estimateReadTime(wordCount: number): string {
    const minutes = Math.max(3, Math.ceil(wordCount / 200));
    return `${minutes} min read`;
}

function fileExists(slug: string): boolean {
    return fs.existsSync(path.join(OUTPUT_DIR, `${slug}.mdx`));
}

// ─── Schedule Status ────────────────────────────────────────────────────────

function showStatus(): void {
    const now = new Date();
    console.log(`\n📅 Blog Schedule Status (${formatDate(now)})\n`);
    console.log('  #  | Status    | Publish Date   | Topic');
    console.log('─────┼───────────┼────────────────┼──────────────────────────────────────────');

    let nextDue: number | null = null;
    blogTopics.forEach((topic, idx) => {
        const slug = slugify(topic.title);
        const pubDate = getPublicationDate(idx);
        const exists = fileExists(slug);
        const isDue = pubDate <= now;

        let status: string;
        if (exists) {
            status = '✅ Live   ';
        } else if (isDue) {
            status = '🔴 OVERDUE';
            if (nextDue === null) nextDue = idx;
        } else {
            status = '⏳ Queued ';
            if (nextDue === null) nextDue = idx;
        }

        console.log(`  ${String(idx + 1).padStart(2)} | ${status} | ${formatDate(pubDate).padEnd(14)} | ${topic.title.substring(0, 50)}`);
    });

    if (nextDue !== null) {
        console.log(`\n➡️  Next to generate: #${nextDue + 1} — "${blogTopics[nextDue].title}"`);
        console.log(`   Publish date: ${formatDate(getPublicationDate(nextDue))}\n`);
    } else {
        console.log(`\n🎉 All 52 posts have been generated!\n`);
    }
}

// ─── LLM Article Generation ─────────────────────────────────────────────────

async function generateArticle(topic: BlogTopic): Promise<string> {
    const systemPrompt = `You are an expert SEO content writer for PlaceNxt, a leading AI-powered career platform for students and early-career professionals. Write engaging, informative, and actionable blog articles.

RULES:
- Write in a conversational yet professional tone.
- Use clear markdown formatting with ## and ### headings.
- Include actionable tips, numbered lists, and bullet points.
- Naturally weave in the provided keywords without keyword stuffing.
- Target 800-1200 words.
- Include a brief intro paragraph and a strong concluding paragraph with a call to action mentioning PlaceNxt.
- Do NOT include the article title as an H1 heading (the blog template adds it).
- Do NOT include any frontmatter or metadata — just the article body in markdown.
- Use real-world examples, statistics, and practical advice.
- Break content into digestible sections with descriptive subheadings.`;

    const userPrompt = `Write a comprehensive blog article about:

**Title:** ${topic.title}
**Category:** ${topic.category}
**Target Keywords:** ${topic.keywords.join(', ')}
**Brief:** ${topic.excerpt}

Write the full article body in markdown. Remember: no title heading, no frontmatter, just the content.`;

    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not found in .env');
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const response = await groq.chat.completions.create({
        model: AI_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error(`LLM returned empty content for: ${topic.title}`);
    }
    return content.trim();
}

// ─── MDX File Builder ───────────────────────────────────────────────────────

function buildMdxFile(topic: BlogTopic, body: string, weekIndex: number): string {
    const pubDate = getPublicationDate(weekIndex);
    const wordCount = body.split(/\s+/).length;
    const readTime = estimateReadTime(wordCount);

    const frontmatter = [
        '---',
        `title: "${topic.title}"`,
        `excerpt: "${topic.excerpt.replace(/"/g, '\\"')}"`,
        `category: "${topic.category}"`,
        `readTime: "${readTime}"`,
        `date: "${formatDate(pubDate)}"`,
        `image: ""`,
        `featured: ${weekIndex < 3}`,
        `keywords: [${topic.keywords.map(k => `"${k}"`).join(', ')}]`,
        '---',
    ].join('\n');

    return `${frontmatter}\n\n${body}\n`;
}

// ─── Generate Single Post ───────────────────────────────────────────────────

async function generatePost(topicIndex: number, dryRun: boolean): Promise<void> {
    const topic = blogTopics[topicIndex];
    const slug = slugify(topic.title);
    const filePath = path.join(OUTPUT_DIR, `${slug}.mdx`);
    const pubDate = getPublicationDate(topicIndex);

    console.log(`\n📝 Generating post #${topicIndex + 1}:`);
    console.log(`   Title: "${topic.title}"`);
    console.log(`   Category: ${topic.category}`);
    console.log(`   Publish: ${formatDate(pubDate)}`);
    console.log(`   File: ${slug}.mdx`);

    if (fileExists(slug)) {
        console.log(`\n⏭️  File already exists. Use --force ${topicIndex} to overwrite.`);
        return;
    }

    if (dryRun) {
        console.log(`\n🔍 DRY RUN — would generate → ${slug}.mdx`);
        return;
    }

    console.log(`\n⏳ Calling LLM (${AI_MODEL})...`);

    const body = await generateArticle(topic);
    const mdxContent = buildMdxFile(topic, body, topicIndex);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(filePath, mdxContent, 'utf-8');

    const wordCount = body.split(/\s+/).length;
    console.log(`\n✅ Post generated! (${wordCount} words)`);
    console.log(`   Saved to: ${filePath}`);
    console.log(`   Will appear on blog page after: ${formatDate(pubDate)}\n`);
}

// ─── Find Next Due Post ─────────────────────────────────────────────────────

function findNextDuePost(): number | null {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    for (let i = 0; i < blogTopics.length; i++) {
        const slug = slugify(blogTopics[i].title);
        if (!fileExists(slug)) {
            return i; // First ungenerated topic
        }
    }
    return null; // All generated
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const showStatusFlag = args.includes('--status');
    const forceIdx = args.indexOf('--force');

    console.log(`\n🚀 PlaceNxt Blog Generator (On-Demand)`);
    console.log(`   Model: ${AI_MODEL}`);
    console.log(`   Schedule start: ${formatDate(SCHEDULE_START)}`);
    console.log(`   Total topics: ${blogTopics.length}`);

    if (showStatusFlag) {
        showStatus();
        return;
    }

    if (forceIdx !== -1) {
        const idx = parseInt(args[forceIdx + 1], 10);
        if (isNaN(idx) || idx < 0 || idx >= blogTopics.length) {
            console.error(`\n❌ Invalid index. Must be 0-${blogTopics.length - 1}.`);
            process.exit(1);
        }
        await generatePost(idx, dryRun);
        return;
    }

    // Default: generate the next unwritten post
    const nextIdx = findNextDuePost();
    if (nextIdx === null) {
        console.log(`\n🎉 All ${blogTopics.length} posts have been generated! Nothing to do.\n`);
        return;
    }

    await generatePost(nextIdx, dryRun);
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
});
