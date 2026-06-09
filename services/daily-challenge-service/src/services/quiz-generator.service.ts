import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { analyzeWithLLM } from '../utils/groq';

export class QuizGeneratorService {
    /**
     * Get questions for a specific daily challenge, or generate them if it's a new challenge.
     */
    async getOrCreateQuestionsForChallenge(_date: Date, quizQuestionIds: string[], quizSkillId?: string | null): Promise<any[]> {
        // 1. If we already have question IDs, fetch those specific questions
        if (quizQuestionIds && quizQuestionIds.length > 0) {
            const questions = await prisma.testQuestion.findMany({
                where: {
                    id: { in: quizQuestionIds },
                },
            });

            // Maintain the stored order if possible
            const questionMap = new Map(questions.map(q => [q.id, q]));
            return quizQuestionIds
                .map(id => questionMap.get(id))
                .filter(Boolean) as any[];
        }

        // 2. Generate new questions for the daily challenge
        let targetSkillId = quizSkillId;

        // If no skill specified, find a skill that has tests and seeded questions
        if (!targetSkillId) {
            const skillsWithQuestions = await prisma.skill.findMany({
                where: {
                    isActive: true,
                    skillTests: {
                        some: {
                            questions: {
                                some: {}
                            }
                        }
                    }
                },
                select: { id: true },
            });

            if (skillsWithQuestions.length > 0) {
                // Select a random skill
                const randomIdx = Math.floor(Math.random() * skillsWithQuestions.length);
                targetSkillId = skillsWithQuestions[randomIdx].id;
            } else {
                // Fallback: pick any active skill, or create/use a default "General Aptitude" skill
                const anySkill = await prisma.skill.findFirst({
                    where: { isActive: true },
                });
                targetSkillId = anySkill?.id || null;
            }
        }

        if (!targetSkillId) {
            throw new AppError('No skills available in the database to generate a quiz', 500, 'NO_SKILLS_AVAILABLE');
        }

        // 3. Try to fetch 5 random questions from the database for the selected skill
        const questionsFromDb = await prisma.testQuestion.findMany({
            where: {
                test: {
                    skillId: targetSkillId,
                },
            },
            take: 15, // Get a pool of questions to randomize
        });

        if (questionsFromDb.length >= 5) {
            // Shuffle and pick 5
            const shuffled = [...questionsFromDb].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 5);
            return selected;
        }

        // 4. Fallback: Generate 5 questions dynamically using LLM for this skill
        const skill = await prisma.skill.findUnique({
            where: { id: targetSkillId },
        });

        if (!skill) {
            throw new AppError('Skill not found', 404, 'SKILL_NOT_FOUND');
        }

        logger.info(`Not enough questions in DB for "${skill.name}". Generating questions with LLM...`);
        const generated = await this.generateQuestionsWithLLM(skill.name, 5);

        if (generated && generated.length > 0) {
            // Find or create an EASY test to attach them to
            let test = await prisma.skillTest.findFirst({
                where: { skillId: skill.id, difficulty: 'EASY' },
            });

            if (!test) {
                test = await prisma.skillTest.create({
                    data: {
                        skillId: skill.id,
                        title: `${skill.name} Basics`,
                        description: `Core concepts and fundamentals of ${skill.name}`,
                        difficulty: 'EASY',
                        durationMinutes: 10,
                        passingScore: 70,
                        questionsCount: 5,
                    },
                });
            }

            // Save generated questions to DB
            const savedQuestions: any[] = [];
            for (let i = 0; i < generated.length; i++) {
                const q = generated[i];
                const saved = await prisma.testQuestion.create({
                    data: {
                        testId: test.id,
                        questionText: q.questionText,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation || '',
                        orderIndex: i + 1,
                        source: 'ai_generated',
                    },
                });
                savedQuestions.push(saved);
            }

            return savedQuestions;
        }

        throw new AppError(`Could not obtain questions for skill: ${skill.name}`, 500, 'QUESTION_GENERATION_FAILED');
    }

    /**
     * Generate MCQ questions via LLM
     */
    private async generateQuestionsWithLLM(skillName: string, count: number): Promise<any[]> {
        const systemPrompt = 'You are an expert quiz creator for technical skills assessment. Return JSON only.';
        const userPrompt = `Generate ${count} easy-to-medium multiple-choice questions for "${skillName}".
Rules:
- Each question must have exactly 4 distinct options.
- The correctAnswer MUST be one of the options verbatim.
- No duplicate options within a question.
- Include a brief explanation of the correct answer.

Return JSON:
{
  "questions": [
    {
      "questionText": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation here..."
    }
  ]
}`;

        const result = await analyzeWithLLM(systemPrompt, userPrompt);
        if (result && result.questions && Array.isArray(result.questions)) {
            return result.questions;
        }
        return [];
    }
}

export const quizGeneratorService = new QuizGeneratorService();
