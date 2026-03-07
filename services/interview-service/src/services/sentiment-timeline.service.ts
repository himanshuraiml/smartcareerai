import {
    analyzeSentimentForWindow,
    SentimentWindow,
    TranscriptSegmentInput,
} from '../utils/meeting-llm';

const WINDOW_SECONDS = 30;

/**
 * Groups transcript segments into fixed-duration windows and
 * runs Groq sentiment analysis on each window in parallel.
 */
export class SentimentTimelineService {
    async buildTimeline(
        segments: TranscriptSegmentInput[],
        windowSeconds = WINDOW_SECONDS,
    ): Promise<SentimentWindow[]> {
        if (segments.length === 0) return [];

        const maxTime = Math.max(...segments.map(s => s.endTime));
        const windowPromises: Promise<SentimentWindow>[] = [];

        for (let start = 0; start < maxTime; start += windowSeconds) {
            const end = start + windowSeconds;
            const windowSegs = segments.filter(
                s => s.startTime >= start && s.startTime < end,
            );
            if (windowSegs.length === 0) continue;

            // Dominant speaker = most words in this window
            const speakerWords: Record<string, { name: string; count: number }> = {};
            for (const seg of windowSegs) {
                if (!speakerWords[seg.speakerId]) {
                    speakerWords[seg.speakerId] = { name: seg.speakerName, count: 0 };
                }
                speakerWords[seg.speakerId].count += seg.text.split(/\s+/).length;
            }
            const dominant = Object.values(speakerWords).sort((a, b) => b.count - a.count)[0];
            const text = windowSegs.map(s => s.text).join(' ');

            windowPromises.push(
                analyzeSentimentForWindow(text, dominant?.name ?? 'Unknown', start, end),
            );
        }

        return Promise.all(windowPromises);
    }
}

export const sentimentTimelineService = new SentimentTimelineService();
