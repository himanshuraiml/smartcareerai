import { Queue } from 'bullmq';
import { logger } from '../utils/logger';

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

export const sequenceQueue = new Queue('sequence-messages', {
    connection: redisConnection,
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
