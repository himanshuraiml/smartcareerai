import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { addSequenceJob } from '../jobs/sequence.queue';

const prisma = new PrismaClient();

interface SequenceStep {
    delayHours: number;
    template: string;
}

export class SequenceService {
    /**
     * Create or replace a message sequence for a job + stage trigger.
     * One sequence per (jobId, stageTrigger) pair.
     */
    async upsertSequence(
        jobId: string,
        stageTrigger: string,
        steps: SequenceStep[],
        isActive: boolean,
        recruiterId: string,
    ) {
        // Verify job ownership
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
        });
        if (!job) throw createError('Job not found or access denied', 404);

        if (!steps || steps.length === 0) throw createError('At least one step is required', 400);

        const validStages = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED'];
        if (!validStages.includes(stageTrigger.toUpperCase())) {
            throw createError(`stageTrigger must be one of: ${validStages.join(', ')}`, 400);
        }

        // Upsert: delete existing for this job+stage, then create new
        await prisma.messageSequence.deleteMany({
            where: { jobId, stageTrigger: stageTrigger.toUpperCase() },
        });

        const sequence = await prisma.messageSequence.create({
            data: {
                jobId,
                stageTrigger: stageTrigger.toUpperCase(),
                steps: steps as any,
                isActive,
            },
        });

        logger.info(`Upserted sequence for job ${jobId}, trigger: ${stageTrigger}`);
        return sequence;
    }

    /**
     * Get all sequences for a job.
     */
    async getJobSequences(jobId: string, recruiterId: string) {
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
        });
        if (!job) throw createError('Job not found or access denied', 404);

        return prisma.messageSequence.findMany({
            where: { jobId },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Delete a specific sequence.
     */
    async deleteSequence(sequenceId: string, recruiterId: string) {
        const seq = await prisma.messageSequence.findFirst({
            where: { id: sequenceId },
            include: { job: { select: { recruiterId: true } } },
        });
        if (!seq) throw createError('Sequence not found', 404);
        if (seq.job.recruiterId !== recruiterId) throw createError('Access denied', 403);

        await prisma.messageSequence.delete({ where: { id: sequenceId } });
        return { deleted: true };
    }

    /**
     * Get performance metrics for all sequences of a job.
     * Returns per-sequence step stats: total scheduled, sent, failed.
     */
    async getSequenceMetrics(jobId: string, recruiterId: string) {
        const job = await prisma.recruiterJob.findFirst({ where: { id: jobId, recruiterId } });
        if (!job) throw createError('Job not found or access denied', 404);

        const sequences = await prisma.messageSequence.findMany({
            where: { jobId },
            include: { executions: true },
        });

        return sequences.map(seq => {
            const steps = seq.steps as unknown as Array<{ delayHours: number; template: string }>;
            const stepMetrics = steps.map((step, idx) => {
                const execs = seq.executions.filter(e => e.stepIndex === idx);
                return {
                    stepIndex: idx,
                    delayHours: step.delayHours,
                    template: step.template.slice(0, 60) + (step.template.length > 60 ? '...' : ''),
                    total: execs.length,
                    sent: execs.filter(e => e.status === 'SENT').length,
                    failed: execs.filter(e => e.status === 'FAILED').length,
                    pending: execs.filter(e => e.status === 'PENDING').length,
                };
            });

            const totalSent = seq.executions.filter(e => e.status === 'SENT').length;
            const totalSched = seq.executions.length;

            return {
                id: seq.id,
                stageTrigger: seq.stageTrigger,
                isActive: seq.isActive,
                totalScheduled: totalSched,
                totalSent,
                totalFailed: seq.executions.filter(e => e.status === 'FAILED').length,
                deliveryRate: totalSched > 0 ? Math.round((totalSent / totalSched) * 100) : null,
                stepMetrics,
            };
        });
    }

    /**
     * Called whenever an application's stage changes.
     * Queues delayed messages for any active sequence matching the new stage.
     */
    async triggerSequences(
        jobId: string,
        applicationId: string,
        candidateId: string,
        recruiterId: string,
        newStage: string,
    ) {
        // First, cancel any existing pending sequences for this application
        await this.cancelPendingSequences(applicationId);

        const sequences = await prisma.messageSequence.findMany({
            where: { jobId, stageTrigger: newStage.toUpperCase(), isActive: true },
        });

        if (sequences.length === 0) return;

        // Get candidate name for template substitution
        const candidate = await prisma.user.findUnique({
            where: { id: candidateId },
            select: { name: true },
        });
        const candidateName = candidate?.name || 'there';

        for (const seq of sequences) {
            const steps = seq.steps as unknown as SequenceStep[];
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const delayMs = (step.delayHours || 0) * 3600 * 1000;
                const scheduledAt = new Date(Date.now() + delayMs);

                // Create execution record in DB for tracking
                const execution = await prisma.messageSequenceExecution.create({
                    data: {
                        applicationId,
                        sequenceId: seq.id,
                        stepIndex: i,
                        scheduledAt,
                        status: 'PENDING',
                    }
                });

                await addSequenceJob(
                    {
                        jobId,
                        applicationId,
                        candidateId,
                        recruiterId,
                        template: step.template,
                        stepIndex: i,
                        candidateName,
                        executionId: execution.id, // Add executionId to job data
                    },
                    delayMs,
                );
            }
        }

        logger.info(`Triggered ${sequences.length} sequence(s) for application ${applicationId} → stage ${newStage}`);
    }

    /**
     * Cancel all pending sequence executions for an application.
     * Useful when candidate moves to a different stage.
     */
    async cancelPendingSequences(applicationId: string) {
        const result = await prisma.messageSequenceExecution.updateMany({
            where: { applicationId, status: 'PENDING' },
            data: { status: 'CANCELLED' }
        });
        if (result.count > 0) {
            logger.info(`Cancelled ${result.count} pending sequence steps for application ${applicationId}`);
        }
    }
}

export const sequenceService = new SequenceService();
