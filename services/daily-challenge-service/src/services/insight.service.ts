import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { analyzeWithLLM } from '../utils/groq';

export class InsightService {
    /**
     * Get or assign a career insight for a given date
     */
    async getInsightForDate(date: Date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // 1. Check if an insight is already assigned to this date
        let insight = await prisma.careerInsight.findFirst({
            where: {
                usedOnDate: targetDate,
                isActive: true,
            },
        });

        if (insight) {
            return insight;
        }

        // 2. Find an unused insight
        insight = await prisma.careerInsight.findFirst({
            where: {
                usedOnDate: null,
                isActive: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        if (insight) {
            // Assign it to this date
            insight = await prisma.careerInsight.update({
                where: { id: insight.id },
                data: { usedOnDate: targetDate },
            });
            logger.info(`Assigned existing insight "${insight.title}" to date ${targetDate.toISOString().split('T')[0]}`);
            return insight;
        }

        // 3. If no unused insights, generate a new one via LLM (or recycle if LLM fails)
        try {
            logger.info('No unused career insights found. Generating new insight with LLM...');
            const newInsightData = await this.generateInsightWithLLM();
            if (newInsightData) {
                insight = await prisma.careerInsight.create({
                    data: {
                        ...newInsightData,
                        usedOnDate: targetDate,
                        source: 'ai_generated',
                    },
                });
                logger.info(`Successfully generated and saved new insight: "${insight.title}"`);
                return insight;
            }
        } catch (error) {
            logger.error('Failed to generate insight with LLM:', error);
        }

        // 4. Fallback: Recycle the oldest used insight
        insight = await prisma.careerInsight.findFirst({
            where: { isActive: true },
            orderBy: { usedOnDate: 'asc' },
        });

        if (insight) {
            // Assign it to this date
            insight = await prisma.careerInsight.update({
                where: { id: insight.id },
                data: { usedOnDate: targetDate },
            });
            logger.info(`Recycled insight "${insight.title}" for date ${targetDate.toISOString().split('T')[0]}`);
            return insight;
        }

        throw new AppError('No insights available', 500, 'NO_INSIGHTS_AVAILABLE');
    }

    /**
     * Generate a new career insight using the LLM
     */
    private async generateInsightWithLLM() {
        const categories = ["Resume Tip", "Interview Tip", "Career Insight", "Tech Tip", "Soft Skills", "Pro Tip"];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        // Map categories to appropriate Lucide icons and colors
        const iconMap: Record<string, { icon: string; color: string }> = {
            "Resume Tip": { icon: "FileText", color: "text-blue-500" },
            "Interview Tip": { icon: "Mic", color: "text-rose-500" },
            "Career Insight": { icon: "TrendingUp", color: "text-emerald-500" },
            "Tech Tip": { icon: "Code", color: "text-purple-500" },
            "Soft Skills": { icon: "Users", color: "text-amber-500" },
            "Pro Tip": { icon: "Rocket", color: "text-cyan-500" }
        };

        const config = iconMap[randomCategory] || { icon: "TrendingUp", color: "text-emerald-500" };

        const systemPrompt = "You are a career development and tech placement expert. Return JSON only.";
        const userPrompt = `Generate a single short, high-impact career tip or placement insight for category "${randomCategory}".
Rules:
- The title should be short and catchy (max 4 words).
- The content should be practical and actionable (max 30 words).
- Provide 2-3 relevant tags.

Return JSON:
{
  "title": "Short Title",
  "content": "A high-impact actionable tip for students...",
  "tags": ["tag1", "tag2"]
}`;

        const result = await analyzeWithLLM(systemPrompt, userPrompt);
        if (result && result.title && result.content) {
            return {
                title: result.title,
                content: result.content,
                category: randomCategory,
                icon: config.icon,
                color: config.color,
                tags: result.tags || [],
            };
        }
        return null;
    }
}

export const insightService = new InsightService();
