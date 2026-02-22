import { prisma } from './prisma';
import { logger } from './logger';
import { cacheGet, cacheSet } from '@smartcareer/shared';

interface BankQuestion {
    id: string;
    questionText: string;
    idealAnswer: string;
    category: string;
    difficulty: string;
    questionType: string;
}

/**
 * Fisher-Yates shuffle for randomizing question order
 */
function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Select randomized questions from the interview bank.
 * Returns questions matching the role, type, and difficulty.
 * Falls back gracefully if not enough questions in the bank.
 */
export async function selectQuestionsFromBank(
    interviewType: string,
    targetRole: string,
    difficulty: string,
    count: number
): Promise<BankQuestion[]> {
    try {
        // Find the job role by title (cached)
        const roleCacheKey = `interview:job-role:${targetRole}`;
        let jobRole = await cacheGet<{ id: string }>(roleCacheKey);
        if (!jobRole) {
            jobRole = await prisma.jobRole.findFirst({
                where: { title: targetRole },
                select: { id: true },
            });
            if (jobRole) {
                await cacheSet(roleCacheKey, jobRole, 3600); // 1 hour
            }
        }

        if (!jobRole) {
            logger.warn(`Job role not found for "${targetRole}", bank selection skipped`);
            return [];
        }

        if (interviewType === 'MIXED') {
            // 60% technical, 40% HR/behavioral
            const techCount = Math.ceil(count * 0.6);
            const hrCount = count - techCount;

            const techQuestions = await fetchBankQuestions(jobRole.id, 'TECHNICAL', difficulty, techCount);
            const hrQuestions = await fetchBankQuestions(null, null, difficulty, hrCount);

            return shuffle([...techQuestions, ...hrQuestions]);
        }

        if (interviewType === 'TECHNICAL') {
            return shuffle(await fetchBankQuestions(jobRole.id, 'TECHNICAL', difficulty, count));
        }

        // HR or BEHAVIORAL — these are shared (jobRoleId is null)
        return shuffle(await fetchBankQuestions(null, interviewType, difficulty, count));
    } catch (error) {
        logger.error('Failed to select from question bank:', error);
        return [];
    }
}

/**
 * Fetch questions from the bank with given filters.
 * jobRoleId=null queries shared HR/behavioral questions.
 * questionType=null queries both HR and BEHAVIORAL.
 */
async function fetchBankQuestions(
    jobRoleId: string | null,
    questionType: string | null,
    difficulty: string,
    count: number
): Promise<BankQuestion[]> {
    // Cache bank questions — they are seeded/static data
    const cacheKey = `interview:bank:${jobRoleId || 'shared'}:${questionType || 'mixed'}:${difficulty}`;
    let questions: BankQuestion[] | null = await cacheGet<BankQuestion[]>(cacheKey);

    if (!questions || questions.length === 0) {
        const where: any = {
            isActive: true,
        };

        if (jobRoleId) {
            where.jobRoleId = jobRoleId;
        } else {
            where.jobRoleId = null; // Shared HR/behavioral questions
        }

        if (questionType) {
            where.questionType = questionType;
        } else {
            // For mixed HR selection, get both HR and BEHAVIORAL
            where.questionType = { in: ['HR', 'BEHAVIORAL'] };
        }

        // Fetch more than needed so we can shuffle and pick
        const fetchedQuestions = await prisma.interviewBankQuestion.findMany({
            where,
            select: {
                id: true,
                questionText: true,
                idealAnswer: true,
                category: true,
                difficulty: true,
                questionType: true,
            },
        });

        questions = fetchedQuestions as BankQuestion[];

        await cacheSet(cacheKey, questions, 3600); // 1 hour
    }

    // Shuffle and take the required count
    const finalQuestions = questions as BankQuestion[];
    return shuffle<BankQuestion>(finalQuestions).slice(0, count);
}
