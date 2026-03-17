import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export interface BehaviorMetricSample {
    timestamp: number;
    emotion?: string;
    eyeContact?: number;     // 0-1 confidence score
    posture?: number;        // 0-1 confidence score
}

export interface SpeechMetrics {
    wordsPerMinute?: number;
    fillerWordCount?: number;
    avgPauseSeconds?: number;
    clarityScore?: number;
    confidenceScore?: number;
}

export interface AggregatedBehaviorMetrics {
    eyeContact: number;          // 0-100 percentage
    dominantEmotion: string;     // e.g. "neutral", "confident"
    postureScore: number;        // 0-100
    speechRate: number;          // WPM
    fillerWords: number;         // count
    avgPause: number;            // seconds
    clarityScore: number;        // 0-100
    confidenceScore: number;     // 0-100
    sampleCount: number;
}

export class BehaviorMetricsService {
    /**
     * Aggregate an array of per-frame samples into a single score object.
     */
    aggregateVisionSamples(samples: BehaviorMetricSample[]): Partial<AggregatedBehaviorMetrics> {
        if (!samples || samples.length === 0) {
            return {};
        }

        // Eye contact: average confidence where a reading exists
        const eyeSamples = samples.filter(s => s.eyeContact !== undefined);
        const eyeContact = eyeSamples.length > 0
            ? Math.round(eyeSamples.reduce((sum, s) => sum + (s.eyeContact ?? 0), 0) / eyeSamples.length * 100)
            : 0;

        // Dominant emotion: most frequent across samples
        const emotionCounts: Record<string, number> = {};
        samples.forEach(s => {
            if (s.emotion) {
                emotionCounts[s.emotion] = (emotionCounts[s.emotion] ?? 0) + 1;
            }
        });
        const dominantEmotion = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral';

        // Posture: average
        const postureSamples = samples.filter(s => s.posture !== undefined);
        const postureScore = postureSamples.length > 0
            ? Math.round(postureSamples.reduce((sum, s) => sum + (s.posture ?? 0), 0) / postureSamples.length * 100)
            : 0;

        return { eyeContact, dominantEmotion, postureScore, sampleCount: samples.length };
    }

    /**
     * Persist aggregated behavior metrics to InterviewSession.
     */
    async saveBehaviorMetrics(
        sessionId: string,
        userId: string,
        visionSamples: BehaviorMetricSample[],
        speechMetrics: SpeechMetrics
    ): Promise<AggregatedBehaviorMetrics> {
        // Verify session ownership
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
        });

        if (!session) {
            throw new Error(`Interview session ${sessionId} not found or unauthorized`);
        }

        const vision = this.aggregateVisionSamples(visionSamples);

        const metrics: AggregatedBehaviorMetrics = {
            eyeContact: vision.eyeContact ?? 0,
            dominantEmotion: vision.dominantEmotion ?? 'neutral',
            postureScore: vision.postureScore ?? 0,
            speechRate: speechMetrics.wordsPerMinute ?? 0,
            fillerWords: speechMetrics.fillerWordCount ?? 0,
            avgPause: speechMetrics.avgPauseSeconds ?? 0,
            clarityScore: speechMetrics.clarityScore ?? 0,
            confidenceScore: speechMetrics.confidenceScore ?? 0,
            sampleCount: vision.sampleCount ?? 0,
        };

        await prisma.interviewSession.update({
            where: { id: sessionId },
            data: { behaviorMetrics: metrics as any },
        });

        logger.info(`Saved behavior metrics for session ${sessionId}: ${JSON.stringify(metrics)}`);
        return metrics;
    }

    /**
     * Retrieve behavior metrics for a session.
     */
    async getBehaviorMetrics(sessionId: string, userId: string): Promise<AggregatedBehaviorMetrics | null> {
        const session = await prisma.interviewSession.findFirst({
            where: { id: sessionId, userId },
            select: { behaviorMetrics: true },
        });

        if (!session) {
            throw new Error(`Interview session ${sessionId} not found or unauthorized`);
        }

        return (session.behaviorMetrics as unknown as AggregatedBehaviorMetrics) ?? null;
    }
}

export const behaviorMetricsService = new BehaviorMetricsService();
