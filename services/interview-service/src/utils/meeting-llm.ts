import Groq from 'groq-sdk';
import { logger } from './logger';

const AI_MODEL_NAME = process.env.AI_MODEL_NAME || 'llama-3.3-70b-versatile';
const FAST_MODEL = 'llama-3.1-8b-instant';

let groq: Groq | null = null;
let initialized = false;

function getGroq(): Groq | null {
    if (!initialized) {
        const apiKey = process.env.GROQ_API_KEY;
        if (apiKey) {
            groq = new Groq({ apiKey });
        } else {
            logger.warn('GROQ_API_KEY not set — meeting AI analysis will use fallback values');
        }
        initialized = true;
    }
    return groq;
}

function cleanJson(text: string): string {
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Shared Types ──────────────────────────────────────────────────────────────

export interface TranscriptSegmentInput {
    speakerId: string;
    speakerName: string;
    text: string;
    startTime: number;
    endTime: number;
}

export interface CandidateScores {
    technical: number;
    communication: number;
    confidence: number;
    overall: number;
}

export interface SentimentWindow {
    timeWindow: string;
    startTime: number;
    endTime: number;
    sentiment: 'positive' | 'neutral' | 'negative' | 'confident';
    confidence: number;
    dominantSpeaker: string;
}

export interface MeetingAnalysisResult {
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    candidateScores: CandidateScores;
    recommendations: string[];
    hiringRecommendation: 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO';
    hiringJustification: string;
}

// ── Main Analysis ─────────────────────────────────────────────────────────────

export async function analyzeMeetingTranscript(
    segments: TranscriptSegmentInput[],
    speakingRatio: Record<string, { name: string; percentage: number }>,
): Promise<MeetingAnalysisResult> {
    const fallback: MeetingAnalysisResult = {
        summary: 'Meeting analysis unavailable — AI not configured.',
        keyPoints: [],
        actionItems: [],
        candidateScores: { technical: 0, communication: 0, confidence: 0, overall: 0 },
        recommendations: [],
        hiringRecommendation: 'MAYBE',
        hiringJustification: 'Insufficient data to make a recommendation.',
    };

    const client = getGroq();
    if (!client || segments.length === 0) return fallback;

    const transcriptText = segments
        .map(s => `[${formatTime(s.startTime)}] ${s.speakerName}: ${s.text}`)
        .join('\n');

    const speakerInfo = Object.values(speakingRatio)
        .map(s => `${s.name}: ${s.percentage.toFixed(1)}% speaking time`)
        .join(', ');

    const userPrompt = `Analyze this interview meeting transcript and provide a structured hiring assessment.

TRANSCRIPT:
${transcriptText}

SPEAKING DISTRIBUTION: ${speakerInfo}

Return a JSON object with EXACTLY this structure:
{
  "summary": "2-3 sentence executive summary of the interview",
  "keyPoints": ["key observation 1", "key observation 2", "key observation 3"],
  "actionItems": ["next step 1", "next step 2"],
  "candidateScores": {
    "technical": <integer 0-100>,
    "communication": <integer 0-100>,
    "confidence": <integer 0-100>,
    "overall": <integer 0-100>
  },
  "recommendations": ["recommendation 1", "recommendation 2"],
  "hiringRecommendation": "<STRONG_YES|YES|MAYBE|NO>",
  "hiringJustification": "2-3 sentences justifying the recommendation"
}`;

    try {
        const completion = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert hiring consultant analyzing interview recordings. Provide objective, data-driven assessments.',
                },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content ?? '';
        const parsed = JSON.parse(cleanJson(raw));
        const validRecs = ['STRONG_YES', 'YES', 'MAYBE', 'NO'];

        return {
            summary: typeof parsed.summary === 'string' ? parsed.summary : fallback.summary,
            keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
            actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
            candidateScores: {
                technical: clamp(Number(parsed.candidateScores?.technical), 0, 100),
                communication: clamp(Number(parsed.candidateScores?.communication), 0, 100),
                confidence: clamp(Number(parsed.candidateScores?.confidence), 0, 100),
                overall: clamp(Number(parsed.candidateScores?.overall), 0, 100),
            },
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
            hiringRecommendation: validRecs.includes(parsed.hiringRecommendation)
                ? parsed.hiringRecommendation
                : 'MAYBE',
            hiringJustification: typeof parsed.hiringJustification === 'string'
                ? parsed.hiringJustification
                : fallback.hiringJustification,
        };
    } catch (err: any) {
        logger.error('analyzeMeetingTranscript failed:', err.message);
        return fallback;
    }
}

// ── Sentiment Per Window ──────────────────────────────────────────────────────

export async function analyzeSentimentForWindow(
    text: string,
    dominantSpeaker: string,
    startTime: number,
    endTime: number,
): Promise<SentimentWindow> {
    const base: SentimentWindow = {
        timeWindow: `${formatTime(startTime)}–${formatTime(endTime)}`,
        startTime,
        endTime,
        sentiment: 'neutral',
        confidence: 0.5,
        dominantSpeaker,
    };

    const client = getGroq();
    if (!client || !text.trim()) return base;

    try {
        const completion = await client.chat.completions.create({
            model: FAST_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'Classify interview text sentiment. Return JSON: {"sentiment":"positive|neutral|negative|confident","confidence":0.0-1.0}',
                },
                { role: 'user', content: text.slice(0, 800) },
            ],
            temperature: 0.1,
            max_tokens: 60,
            response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content ?? '';
        const parsed = JSON.parse(cleanJson(raw));
        const validSentiments = ['positive', 'neutral', 'negative', 'confident'];

        return {
            ...base,
            sentiment: validSentiments.includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
            confidence: typeof parsed.confidence === 'number'
                ? Math.min(Math.max(parsed.confidence, 0), 1)
                : 0.5,
        };
    } catch {
        return base;
    }
}

function clamp(value: number, min: number, max: number): number {
    if (isNaN(value)) return 0;
    return Math.min(Math.max(value, min), max);
}
