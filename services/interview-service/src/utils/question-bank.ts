import { prisma } from './prisma';
import { logger } from './logger';

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
        // Find the job role by title
        const jobRole = await prisma.jobRole.findFirst({
            where: { title: targetRole },
            select: { id: true },
        });

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
    const questions = await prisma.interviewBankQuestion.findMany({
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

    // Shuffle and take the required count
    return shuffle(questions).slice(0, count);
}
