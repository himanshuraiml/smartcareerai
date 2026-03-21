import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { messageService } from '../services/message.service';
import { logger } from '../utils/logger';
import type { SequenceJobData } from './sequence.queue';

const prisma = new PrismaClient();

function parseRedisConnection(url: string) {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname || 'localhost',
            port: parseInt(parsed.port || '6379'),
            password: parsed.password || undefined,
        };
    } catch {
        return { host: 'localhost', port: 6379, password: undefined };
    }
}

const redisConnection = parseRedisConnection(process.env.REDIS_URL || 'redis://localhost:6379');

export function startSequenceWorker(): Worker {
    const worker = new Worker<SequenceJobData>(
        'sequence-messages',
        async (job) => {
            const { candidateId, recruiterId, template, candidateName, applicationId, stepIndex, executionId } = job.data;

            // Verify execution is still PENDING and exists
            const execution = await prisma.messageSequenceExecution.findUnique({
                where: { id: executionId }
            });

            if (!execution || execution.status !== 'PENDING') {
                logger.debug(`Skipping sequence step ${stepIndex} for app ${applicationId}: status is ${execution?.status || 'MISSING'}`);
                return;
            }

            // Substitute {{name}} with candidate's name
            const content = template.replace(/\{\{name\}\}/g, candidateName || 'there');

            await messageService.sendMessage(recruiterId, candidateId, content);

            // Update execution record
            await prisma.messageSequenceExecution.update({
                where: { id: executionId },
                data: { status: 'SENT', sentAt: new Date() }
            });

            logger.info(`Drip sequence step ${stepIndex} sent for application ${applicationId}`);
        },
        {
            connection: redisConnection,
            concurrency: 5,
        },
    );

    worker.on('completed', (job) => {
        logger.info(`Sequence job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Sequence job ${job?.id} failed: ${err.message}`);
    });

    return worker;
}
