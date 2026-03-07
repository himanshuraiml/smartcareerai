import { prisma } from '../utils/prisma';
import {
    analyzeMeetingTranscript,
    TranscriptSegmentInput,
} from '../utils/meeting-llm';
import { sentimentTimelineService } from './sentiment-timeline.service';
import { logger } from '../utils/logger';

const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || 'http://localhost:3014';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'internal-secret';

const FILLER_WORDS = [
    'um', 'uh', 'like', 'you know', 'sort of', 'kind of',
    'basically', 'literally', 'actually', 'so', 'right',
];

export class MeetingIntelligenceService {
    /**
     * Orchestrate post-meeting AI analysis:
     *  1. Fetch transcript from DB
     *  2. Compute speaking ratios + filler word analysis
     *  3. Run sentiment timeline + LLM analysis in parallel
     *  4. Persist MeetingAiAnalysis record
     */
    async analyzeMeeting(meetingId: string): Promise<void> {
        logger.info(`Starting AI analysis for meeting ${meetingId}`);

        // Create/reset record to PROCESSING
        await prisma.meetingAiAnalysis.upsert({
            where: { meetingId },
            create: {
                meetingId,
                processingStatus: 'PROCESSING',
                summary: '',
                keyPoints: [],
                actionItems: [],
                candidateScores: {},
                sentimentTimeline: [],
                speakingRatio: {},
                fillerWordAnalysis: {},
                recommendations: [],
                hiringRecommendation: 'MAYBE',
                hiringJustification: '',
            },
            update: { processingStatus: 'PROCESSING' },
        });

        try {
            const entries = await prisma.meetingTranscriptEntry.findMany({
                where: { meetingId },
                orderBy: { startTime: 'asc' },
            });

            if (entries.length === 0) {
                logger.warn(`No transcript entries for meeting ${meetingId} — marking FAILED`);
                await prisma.meetingAiAnalysis.update({
                    where: { meetingId },
                    data: {
                        processingStatus: 'FAILED',
                        summary: 'No transcript available for analysis.',
                    },
                });
                return;
            }

            const segments: TranscriptSegmentInput[] = entries.map(e => ({
                speakerId: e.speakerId,
                speakerName: e.speakerName,
                text: e.text,
                startTime: e.startTime,
                endTime: e.endTime,
            }));

            // ── Speaking ratio ────────────────────────────────────────────
            const speakerWords: Record<string, { name: string; words: number }> = {};
            for (const seg of segments) {
                if (!speakerWords[seg.speakerId]) {
                    speakerWords[seg.speakerId] = { name: seg.speakerName, words: 0 };
                }
                speakerWords[seg.speakerId].words += seg.text.split(/\s+/).length;
            }
            const totalWords = Object.values(speakerWords).reduce((n, s) => n + s.words, 0);
            const speakingRatio: Record<string, { name: string; percentage: number }> = {};
            for (const [id, info] of Object.entries(speakerWords)) {
                speakingRatio[id] = {
                    name: info.name,
                    percentage: totalWords > 0 ? (info.words / totalWords) * 100 : 0,
                };
            }

            // ── Filler word analysis ──────────────────────────────────────
            const fillerWordAnalysis: Record<
                string,
                { speakerName: string; total: number; words: Record<string, number> }
            > = {};
            for (const seg of segments) {
                if (!fillerWordAnalysis[seg.speakerId]) {
                    fillerWordAnalysis[seg.speakerId] = {
                        speakerName: seg.speakerName,
                        total: 0,
                        words: {},
                    };
                }
                const lower = seg.text.toLowerCase();
                for (const filler of FILLER_WORDS) {
                    const regex = new RegExp(`\\b${filler}\\b`, 'g');
                    const matches = lower.match(regex);
                    if (matches) {
                        fillerWordAnalysis[seg.speakerId].words[filler] =
                            (fillerWordAnalysis[seg.speakerId].words[filler] || 0) + matches.length;
                        fillerWordAnalysis[seg.speakerId].total += matches.length;
                    }
                }
            }

            // ── Parallel: sentiment timeline + LLM analysis ───────────────
            const [sentimentTimeline, analysisResult] = await Promise.all([
                sentimentTimelineService.buildTimeline(segments),
                analyzeMeetingTranscript(segments, speakingRatio),
            ]);

            // ── Persist ───────────────────────────────────────────────────
            await prisma.meetingAiAnalysis.update({
                where: { meetingId },
                data: {
                    summary: analysisResult.summary,
                    keyPoints: analysisResult.keyPoints,
                    actionItems: analysisResult.actionItems,
                    candidateScores: analysisResult.candidateScores as object,
                    sentimentTimeline: sentimentTimeline as object[],
                    speakingRatio,
                    fillerWordAnalysis,
                    recommendations: analysisResult.recommendations,
                    hiringRecommendation: analysisResult.hiringRecommendation,
                    hiringJustification: analysisResult.hiringJustification,
                    processingStatus: 'COMPLETED',
                },
            });

            logger.info(`Meeting analysis completed for ${meetingId}`);

            // Notify media-service so it can emit 'meeting:analysis-ready' to the room
            fetch(`${MEDIA_SERVICE_URL}/internal/meetings/${meetingId}/analysis-ready`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': INTERNAL_SECRET,
                },
                signal: AbortSignal.timeout(5000),
            }).catch(err => {
                logger.warn(`Failed to notify media-service of analysis completion: ${err.message}`);
            });
        } catch (err: any) {
            logger.error(`Meeting analysis failed for ${meetingId}:`, err.message);
            try {
                await prisma.meetingAiAnalysis.update({
                    where: { meetingId },
                    data: { processingStatus: 'FAILED' },
                });
            } catch { /* ignore secondary failure */ }
        }
    }

    async getAnalysisResult(meetingId: string) {
        return prisma.meetingAiAnalysis.findUnique({ where: { meetingId } });
    }
}

export const meetingIntelligenceService = new MeetingIntelligenceService();
