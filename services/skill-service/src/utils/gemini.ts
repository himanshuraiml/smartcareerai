import Groq from 'groq-sdk';
import { logger } from './logger';


let groq: Groq | null = null;
let initialized = false;

function getGroqClient(): Groq | null {
    if (!initialized) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            logger.warn('GROQ_API_KEY is not set - LLM features will use fallback');
            initialized = true;
            return null;
        }
        groq = new Groq({ apiKey });
        initialized = true;
    }
    return groq;
}

export async function generateWithLLM(
    systemPrompt: string,
    userPrompt: string,
    options: { json?: boolean; temperature?: number } = {}
): Promise<string | null> {
    const client = getGroqClient();

    if (!client) {
        logger.warn('Groq client not available, returning null');
        return null;
    }

    try {
        logger.info('Calling Groq API (Llama 3.3)...');

        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: options.temperature ?? 0.3,
            max_tokens: 4096,
            response_format: options.json ? { type: 'json_object' } : undefined,
        });

        const text = response.choices[0]?.message?.content || '';
        logger.info(`Groq API response received (${text.length} chars)`);
        return text;
    } catch (error: any) {
        logger.error('Groq API error:', {
            message: error.message,
            status: error.status,
            code: error.code,
        });
        return null;
    }
}

export async function analyzeWithLLM(
    systemPrompt: string,
    userPrompt: string
): Promise<any> {
    try {
        const text = await generateWithLLM(systemPrompt, userPrompt, { json: true });

        if (!text) {
            logger.warn('LLM returned no response');
            return null;
        }

        // Clean up potential markdown code blocks
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.slice(7);
        }
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.slice(0, -3);
        }

        const parsed = JSON.parse(cleaned.trim());
        logger.info('Successfully parsed LLM response as JSON');
        return parsed;
    } catch (error: any) {
        logger.error('Failed in analyzeWithLLM:', error.message);
        return null;
    }
}

// Keep old function names for backward compatibility
export const generateWithGemini = generateWithLLM;
export const analyzeWithGemini = analyzeWithLLM;
