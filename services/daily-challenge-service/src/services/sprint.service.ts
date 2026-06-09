import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { analyzeWithLLM } from '../utils/groq';

export class SprintService {
    /**
     * Get 5 flashcards for a specific skill, generating them via LLM if not seeded in DB
     */
    async getSprintCards(skillId: string): Promise<any[]> {
        // 1. Query existing active cards for this skill
        let cards = await prisma.skillSprintCard.findMany({
            where: {
                skillId,
                isActive: true,
            },
            take: 5,
        });

        // 2. If not enough cards, generate 5 via LLM
        if (cards.length < 5) {
            const skill = await prisma.skill.findUnique({
                where: { id: skillId },
            });

            if (!skill) {
                throw new AppError('Skill not found', 404, 'SKILL_NOT_FOUND');
            }

            logger.info(`Not enough flashcards in DB for "${skill.name}". Generating with LLM...`);
            const generated = await this.generateFlashcardsWithLLM(skill.name, 5);

            if (generated && generated.length > 0) {
                const savedCards: any[] = [];
                for (const card of generated) {
                    const saved = await prisma.skillSprintCard.create({
                        data: {
                            skillId,
                            front: card.front,
                            back: card.back,
                            difficulty: 'EASY',
                            tags: card.tags || [],
                        },
                    });
                    savedCards.push(saved);
                }
                cards = [...cards, ...savedCards].slice(0, 5);
            }
        }

        return cards;
    }

    /**
     * Update spacing repetition progress for a card
     */
    async submitCardReview(userId: string, cardId: string, confidence: number) {
        const progress = await prisma.userSprintProgress.findUnique({
            where: {
                userId_cardId: { userId, cardId },
            },
        });

        const now = new Date();
        const nextReview = new Date(now);

        // Simple SuperMemo SM-2 inspired spacing interval (in days)
        let newReviewCount = progress ? progress.reviewCount + 1 : 1;
        let daysToAdd = 1;

        if (confidence >= 4) {
            daysToAdd = newReviewCount * 3; // review again in 3, 6, 9 days...
        } else if (confidence === 3) {
            daysToAdd = newReviewCount * 1.5;
        } else {
            daysToAdd = 1; // review tomorrow
            newReviewCount = 0; // reset progression
        }

        nextReview.setDate(nextReview.getDate() + Math.ceil(daysToAdd));

        const updatedProgress = await prisma.userSprintProgress.upsert({
            where: {
                userId_cardId: { userId, cardId },
            },
            create: {
                userId,
                cardId,
                confidence,
                reviewCount: newReviewCount,
                nextReviewAt: nextReview,
                lastReviewAt: now,
            },
            update: {
                confidence,
                reviewCount: newReviewCount,
                nextReviewAt: nextReview,
                lastReviewAt: now,
            },
        });

        return updatedProgress;
    }

    /**
     * Generate flashcards using LLM
     */
    private async generateFlashcardsWithLLM(skillName: string, count: number): Promise<any[]> {
        const systemPrompt = 'You are a technical educator. Generate high-quality flashcards. Return JSON only.';
        const userPrompt = `Generate ${count} learning flashcards for "${skillName}".
Rules:
- Front should have a question, definition request, or code snippet analysis prompt (max 15 words).
- Back should have the concise explanation or answer (max 30 words).
- Provide 1-2 tags.

Return JSON:
{
  "flashcards": [
    {
      "front": "What is the difference between let and var?",
      "back": "let is block-scoped and not hoisted, while var is function-scoped and hoisted.",
      "tags": ["scope", "variables"]
    }
  ]
}`;

        const result = await analyzeWithLLM(systemPrompt, userPrompt);
        if (result && result.flashcards && Array.isArray(result.flashcards)) {
            return result.flashcards;
        }
        return [];
    }
}

export const sprintService = new SprintService();
