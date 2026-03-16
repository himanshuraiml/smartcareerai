import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { messageService } from '../services/message.service';
import { logger } from '../utils/logger';
import type { SequenceJobData } from './sequence.queue';

const prisma = new PrismaClient();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

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
            connection: {
                host: REDIS_HOST,
                port: REDIS_PORT,
            },
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
