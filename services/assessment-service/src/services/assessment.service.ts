import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import axios from 'axios';
import { uploadBuffer, getPresignedUrl } from '../utils/minio';

const SCORING_SERVICE_URL = process.env.SCORING_SERVICE_URL || 'http://localhost:3003';

export class AssessmentService {
    // Question Bank Management
    async createQuestion(data: any) {
        return await prisma.assessmentBankQuestion.create({
            data,
        });
    }

    async getQuestions(filters: any) {
        const { category, difficulty, type, search } = filters;
        return await prisma.assessmentBankQuestion.findMany({
            where: {
                category: category || undefined,
                difficulty: difficulty || undefined,
                type: type || undefined,
                text: search ? { contains: search, mode: 'insensitive' } : undefined,
                isActive: true,
            },
        });
    }

    async updateQuestion(id: string, data: any) {
        return await prisma.assessmentBankQuestion.update({
            where: { id },
            data,
        });
    }

    async deleteQuestion(id: string) {
        return await prisma.assessmentBankQuestion.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Template Mapping
    async createTemplate(jobId: string, config: any) {
        const assessmentDeadline = config.assessmentDeadline ? new Date(config.assessmentDeadline) : undefined;
        return await prisma.assessmentTemplate.upsert({
            where: { jobId },
            update: {
                durationMinutes: config.durationMinutes,
                totalQuestions: config.totalQuestions,
                difficultyDistribution: config.difficultyDistribution,
                requiredSkills: config.requiredSkills,
                ...(assessmentDeadline !== undefined ? { assessmentDeadline } : {}),
            },
            create: {
                jobId,
                durationMinutes: config.durationMinutes,
                totalQuestions: config.totalQuestions,
                difficultyDistribution: config.difficultyDistribution,
                requiredSkills: config.requiredSkills,
                ...(assessmentDeadline !== undefined ? { assessmentDeadline } : {}),
            },
        });
    }

    async getTemplateByJobId(jobId: string) {
        return await prisma.assessmentTemplate.findUnique({
            where: { jobId },
            include: { job: true }
        });
    }

    async deleteTemplate(id: string) {
        return await prisma.assessmentTemplate.delete({
            where: { id },
        });
    }

    // Assessment Attempt Logic
    async startAttempt(studentId: string, templateId: string) {
        const template = await prisma.assessmentTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) throw new Error('Template not found');

        // Enforce assessment deadline
        if (template.assessmentDeadline && new Date() > template.assessmentDeadline) {
            const err: any = new Error('The assessment deadline has passed');
            err.status = 410;
            err.code = 'ASSESSMENT_DEADLINE_PASSED';
            throw err;
        }

        // Logic to select questions based on difficulty distribution
        const questions = await this.selectQuestions(template);

        const attempt = await prisma.assessmentAttempt.create({
            data: {
                studentId,
                templateId,
                status: 'IN_PROGRESS',
            },
            include: {
                template: true,
            }
        });

        // Return attempt with questions (but hide answers)
        return {
            ...attempt,
            questions: questions.map(q => ({
                id: q.id,
                text: q.text,
                options: q.options,
                type: q.type,
                category: q.category
            }))
        };
    }

    private async selectQuestions(template: any) {
        const dist = template.difficultyDistribution as Record<string, number>;
        const selected: any[] = [];

        // If requiredSkills contains known category names, filter questions by those categories.
        const knownCategories = ['Analytical', 'Logical Reasoning', 'Numerical Reasoning', 'Verbal Reasoning', 'Behavioral', 'Psychometric'];
        const categoryFilter = ((template.requiredSkills as string[]) ?? [])
            .filter((s: string) => knownCategories.includes(s));

        for (const [diff, count] of Object.entries(dist)) {
            let questions: any[];
            if (categoryFilter.length > 0) {
                const placeholders = categoryFilter.map((_: string, i: number) => `$${i + 3}`).join(', ');
                questions = await prisma.$queryRawUnsafe(
                    `SELECT * FROM assessment_bank_questions
                     WHERE difficulty = $1::"Difficulty" AND is_active = true
                       AND category = ANY(ARRAY[${placeholders}])
                     ORDER BY RANDOM() LIMIT $2`,
                    diff.toUpperCase(),
                    count,
                    ...categoryFilter
                );
            } else {
                questions = await prisma.$queryRawUnsafe(
                    `SELECT * FROM assessment_bank_questions
                     WHERE difficulty = $1::"Difficulty" AND is_active = true
                     ORDER BY RANDOM() LIMIT $2`,
                    diff.toUpperCase(),
                    count
                );
            }
            selected.push(...(questions as any[]));
        }

        return selected;
    }

    async logProctoringEvent(attemptId: string, event: any) {
        return await prisma.proctoringLog.create({
            data: {
                attemptId,
                eventType: event.type,
                metadata: event.metadata || {},
                snapshotUrl: event.snapshotUrl || null,
                timestamp: new Date()
            } as any,
        });
    }

    // F16: Add snapshot metadata (and optionally store image in MinIO)
    async addSnapshot(attemptId: string, studentId: string, snapshotMeta: { timestamp: string; imageData?: string }) {
        const attempt = await prisma.assessmentAttempt.findFirst({
            where: { id: attemptId, studentId },
        });
        if (!attempt) throw new Error('Attempt not found');

        const existing: any[] = (attempt.snapshots as any[]) || [];
        const snapshotIndex = existing.length;
        let snapshotUrl: string | null = null;

        // If image data (base64) provided, upload to MinIO
        if (snapshotMeta.imageData) {
            try {
                const base64Data = snapshotMeta.imageData.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64Data, 'base64');
                const key = `${attemptId}/${snapshotIndex}-${Date.now()}.jpg`;
                await uploadBuffer('proctoring-snapshots', key, imageBuffer, 'image/jpeg');
                snapshotUrl = await getPresignedUrl('proctoring-snapshots', key, 86400 * 7); // 7 days
            } catch (err: any) {
                logger.warn(`Failed to upload snapshot to MinIO: ${err.message}`);
            }
        }

        const newEntry = { timestamp: snapshotMeta.timestamp, index: snapshotIndex, url: snapshotUrl };
        const updated = [...existing, newEntry];

        await prisma.assessmentAttempt.update({
            where: { id: attemptId },
            data: { snapshots: updated },
        });

        await prisma.proctoringLog.create({
            data: {
                attemptId,
                eventType: 'SNAPSHOT',
                metadata: { index: snapshotIndex, timestamp: snapshotMeta.timestamp },
                snapshotUrl,
                timestamp: new Date(snapshotMeta.timestamp),
            } as any,
        });

        return { success: true, snapshotCount: updated.length, snapshotUrl };
    }

    // F16: Recruiter can flag/unflag an attempt for review
    async flagAttempt(attemptId: string, flagged: boolean, reason?: string) {
        const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
        if (!attempt) throw new Error('Attempt not found');

        return await prisma.assessmentAttempt.update({
            where: { id: attemptId },
            data: {
                recruiterFlagged: flagged,
                flagReason: flagged ? (reason || null) : null,
            },
        });
    }

    async getAttemptsByJob(jobId: string) {
        const template = await prisma.assessmentTemplate.findUnique({
            where: { jobId },
        });
        if (!template) return [];
        return await prisma.assessmentAttempt.findMany({
            where: { templateId: template.id },
            orderBy: { startedAt: 'desc' },
            include: {
                student: { select: { id: true, name: true, email: true } },
                answers: { select: { score: true, isCorrect: true } },
            },
        });
    }

    async getMyAttempts(studentId: string) {
        return await prisma.assessmentAttempt.findMany({
            where: { studentId },
            orderBy: { startedAt: 'desc' },
            include: {
                template: {
                    include: { job: { select: { id: true, title: true } } }
                }
            }
        });
    }

    async getAvailableAssessments(studentId: string) {
        // Find jobs the candidate has applied to that have an assessment template
        // but where the candidate has no existing attempt
        const applicantRecords = await prisma.recruiterJobApplicant.findMany({
            where: { candidateId: studentId },
            select: { jobId: true },
        });

        if (applicantRecords.length === 0) return [];

        const appliedJobIds = applicantRecords.map(r => r.jobId);

        // Get templates for those jobs
        const templates = await prisma.assessmentTemplate.findMany({
            where: { jobId: { in: appliedJobIds } },
            include: { job: { select: { id: true, title: true } } },
        });

        if (templates.length === 0) return [];

        // Exclude templates where the candidate already has an attempt
        const existingAttempts = await prisma.assessmentAttempt.findMany({
            where: {
                studentId,
                templateId: { in: templates.map(t => t.id) },
            },
            select: { templateId: true },
        });

        const startedTemplateIds = new Set(existingAttempts.map(a => a.templateId));

        const now = new Date();
        return templates
            .filter(t => !startedTemplateIds.has(t.id))
            .map(t => ({
                templateId: t.id,
                job: t.job,
                durationMinutes: t.durationMinutes,
                totalQuestions: t.totalQuestions,
                assessmentDeadline: t.assessmentDeadline ?? null,
                isExpired: t.assessmentDeadline ? now > t.assessmentDeadline : false,
            }));
    }

    async getAttemptById(attemptId: string, studentId: string) {
        const attempt: any = await prisma.assessmentAttempt.findFirst({
            where: { id: attemptId, studentId },
            include: {
                template: {
                    include: { job: { select: { id: true, title: true } } }
                },
                answers: true,
            }
        });

        if (!attempt) throw new Error('Attempt not found');

        // If in progress, select and return questions (without answers)
        let questions: any[] = [];
        if (attempt.status === 'IN_PROGRESS') {
            questions = await this.selectQuestions(attempt.template);
            questions = questions.map((q: any) => ({
                id: q.id,
                text: q.text,
                options: q.options,
                type: q.type,
                category: q.category,
            }));
        }

        return { ...attempt, questions };
    }

    async submitAttempt(attemptId: string, answers: any[]) {
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: { template: true }
        });

        if (!attempt) throw new Error('Attempt not found');
        if (attempt.status !== 'IN_PROGRESS') throw new Error('Attempt is already submitted or closed');

        // Timer Validation
        const startedAt = attempt.startedAt.getTime();
        const now = Date.now();
        const durationMs = (attempt.template.durationMinutes + 5) * 60 * 1000; // 5 mins grace period
        const isTimedOut = (now - startedAt) > durationMs;

        // Proctoring Check
        const proctoringLogs = await prisma.proctoringLog.findMany({
            where: { attemptId }
        });
        const tabSwitches = proctoringLogs.filter(l => l.eventType === 'TAB_SWITCH').length;
        const faceIssues = proctoringLogs.filter(l => l.eventType === 'FACE_NOT_DETECTED' || l.eventType === 'MULTIPLE_FACES').length;

        let status: any = 'EVALUATING';
        if (isTimedOut) status = 'COMPLETED'; // Marking as completed but will penalize in scoring if we want
        if (tabSwitches > 1 || faceIssues > 5) status = 'FLAGGED';

        // Save answers
        await prisma.assessmentAnswer.createMany({
            data: answers.map(a => ({
                attemptId,
                questionId: a.questionId,
                response: a.response,
            })),
        });

        // F16: Compute proctoring score (100 - violations × 10, min 0)
        const totalViolations = tabSwitches + faceIssues;
        const proctoringScore = Math.max(0, 100 - totalViolations * 10);

        // Update attempt status
        const updatedAttempt = await prisma.assessmentAttempt.update({
            where: { id: attemptId },
            data: {
                status,
                completedAt: new Date(),
                proctoringScore,
            },
        });

        // Trigger scoring via Scoring Service
        try {
            axios.post(`${SCORING_SERVICE_URL}/assessments/${attemptId}/score`).catch(err => {
                logger.error(`Failed to trigger async scoring: ${err.message}`);
            });
        } catch (error: any) {
            logger.error(`Scoring trigger error: ${error.message}`);
        }

        return updatedAttempt;
    }
}
