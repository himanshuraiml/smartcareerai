import OpenAI from 'openai';
import { logger } from '../utils/logger';

/**
 * TTSService — converts text to MP3 audio using OpenAI TTS.
 *
 * Returns a Buffer containing MP3 data suitable for piping into FFmpeg for
 * RTP/Opus encoding and delivery via a MediaSoup PlainTransport.
 */
export class TTSService {
    private client: OpenAI;
    private model: string;
    private voice: OpenAI.Audio.Speech.SpeechCreateParams['voice'];

    constructor() {
        this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.model = process.env.TTS_MODEL || 'tts-1';
        this.voice = (process.env.TTS_VOICE as OpenAI.Audio.Speech.SpeechCreateParams['voice']) || 'nova';
    }

    /**
     * Synthesise `text` to MP3 and return as a Buffer.
     * Throws if OpenAI is not configured or the request fails.
     */
    async synthesise(text: string): Promise<Buffer> {
        logger.info(`TTS synthesising ${text.length} chars`);

        const response = await this.client.audio.speech.create({
            model: this.model,
            voice: this.voice,
            input: text,
            response_format: 'mp3',
            speed: 1.0,
        });

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        logger.info(`TTS produced ${buffer.length} bytes of MP3`);
        return buffer;
    }

    /**
     * Returns true when an OPENAI_API_KEY is present in the environment.
     */
    isAvailable(): boolean {
        return !!process.env.OPENAI_API_KEY;
    }
}

export const ttsService = new TTSService();
