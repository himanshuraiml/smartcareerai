import Groq from 'groq-sdk';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Lazy initialize Groq client
let groq: Groq | null = null;

function getGroqClient(): Groq {
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY is not configured');
        }
        groq = new Groq({ apiKey });
    }
    return groq;
}

export interface TranscriptionResult {
    text: string;
    duration: number;
    language: string;
    wordCount: number;
    wordsPerMinute: number;
}

export interface FillerWordAnalysis {
    fillerWords: { word: string; count: number }[];
    totalFillerWords: number;
    fillerWordPercentage: number;
}

export class WhisperService {
    /**
     * Transcribe audio file to text using Groq's Whisper API
     */
    async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<TranscriptionResult> {
        const client = getGroqClient();

        try {
            logger.info(`Transcribing audio file: ${filename}`);

            // Create a temporary file for the audio
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempPath = path.join(tempDir, filename);
            fs.writeFileSync(tempPath, audioBuffer);

            try {
                // Use Groq Whisper for transcription
                const transcription = await client.audio.transcriptions.create({
                    file: fs.createReadStream(tempPath),
                    model: 'whisper-large-v3-turbo',
                    response_format: 'verbose_json',
                    language: 'en',
                }) as any;

                const text: string = transcription.text || '';
                const duration: number = transcription.duration || 0;
                const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
                const wordsPerMinute = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;

                logger.info(`Transcription complete: ${wordCount} words, ${duration}s, ${wordsPerMinute} WPM`);

                return {
                    text,
                    duration,
                    language: transcription.language || 'en',
                    wordCount,
                    wordsPerMinute,
                };
            } finally {
                // Clean up temp file regardless of success/fail
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            }
        } catch (error: any) {
            logger.error('Whisper transcription error:', error.message);
            throw error;
        }
    }

    /**
     * Analyze transcript for filler words
     */
    analyzeFillerWords(text: string): FillerWordAnalysis {
        const fillerPatterns = [
            { pattern: /\b(um+)\b/gi, word: 'um' },
            { pattern: /\b(uh+)\b/gi, word: 'uh' },
            { pattern: /\b(like)\b/gi, word: 'like' },
            { pattern: /\b(you know)\b/gi, word: 'you know' },
            { pattern: /\b(so+)\b/gi, word: 'so' },
            { pattern: /\b(basically)\b/gi, word: 'basically' },
            { pattern: /\b(actually)\b/gi, word: 'actually' },
            { pattern: /\b(literally)\b/gi, word: 'literally' },
            { pattern: /\b(right)\b/gi, word: 'right' },
            { pattern: /\b(okay|ok)\b/gi, word: 'okay' },
            { pattern: /\b(i mean)\b/gi, word: 'I mean' },
            { pattern: /\b(kind of|kinda)\b/gi, word: 'kind of' },
            { pattern: /\b(sort of|sorta)\b/gi, word: 'sort of' },
        ];

        const fillerWords: { word: string; count: number }[] = [];
        let totalFillerWords = 0;

        for (const { pattern, word } of fillerPatterns) {
            const matches = text.match(pattern);
            const count = matches ? matches.length : 0;
            if (count > 0) {
                fillerWords.push({ word, count });
                totalFillerWords += count;
            }
        }

        const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;
        const fillerWordPercentage = totalWords > 0
            ? Math.round((totalFillerWords / totalWords) * 100 * 10) / 10
            : 0;

        // Sort by count descending
        fillerWords.sort((a, b) => b.count - a.count);

        return {
            fillerWords,
            totalFillerWords,
            fillerWordPercentage,
        };
    }

    /**
     * Get speaking pace feedback
     */
    getSpeakingPaceFeedback(wordsPerMinute: number): { rating: string; feedback: string } {
        if (wordsPerMinute < 100) {
            return {
                rating: 'slow',
                feedback: 'Your speaking pace is quite slow. Try to speak a bit faster to maintain engagement while still being clear.',
            };
        } else if (wordsPerMinute < 130) {
            return {
                rating: 'good',
                feedback: 'Great speaking pace! You are speaking clearly at a comfortable rate for listeners to follow.',
            };
        } else if (wordsPerMinute < 160) {
            return {
                rating: 'good',
                feedback: 'Good speaking pace. This is an ideal rate for professional communication.',
            };
        } else if (wordsPerMinute < 190) {
            return {
                rating: 'fast',
                feedback: 'You are speaking a bit fast. Consider slowing down slightly to ensure clarity.',
            };
        } else {
            return {
                rating: 'too_fast',
                feedback: 'Your speaking pace is quite fast. Slow down to allow listeners to absorb your points better.',
            };
        }
    }
}

export const whisperService = new WhisperService();
