import { Queue } from 'bullmq';
import { logger } from '../utils/logger';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

export const sequenceQueue = new Queue('sequence-messages', {
    connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
    },
});

export interface SequenceJobData {
    jobId: string;
    applicationId: string;
    candidateId: string;
    recruiterId: string;
    template: string;
    stepIndex: number;
    candidateName: string;
    executionId: string;
}

export async function addSequenceJob(data: SequenceJobData, delayMs: number): Promise<void> {
    try {
        await sequenceQueue.add('send-message', data, { delay: delayMs });
        logger.info(`Queued sequence step ${data.stepIndex} for application ${data.applicationId} with delay ${delayMs}ms`);
    } catch (err: any) {
        logger.error(`Failed to queue sequence job: ${err.message}`);
    }
}
