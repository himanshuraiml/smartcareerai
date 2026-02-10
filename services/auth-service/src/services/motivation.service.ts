import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export class MotivationService {
    async getDailyQuote() {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const settingKey = `daily_quote_${today}`;

        try {
            // Check if quote already exists
            const existing = await prisma.systemSettings.findUnique({
                where: { settingKey },
            });

            if (existing) {
                return existing.settingValue;
            }

            // Generate new quote
            let quote = {
                text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                author: "Winston Churchill"
            };

            if (GROQ_API_KEY) {
                try {
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${GROQ_API_KEY}`
                        },
                        body: JSON.stringify({
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a helpful assistant that provides short, punchy motivational quotes for career growth and tech professionals. Return ONLY the quote JSON object in this format: {\"text\": \"Quote text\", \"author\": \"Author Name\"}."
                                },
                                {
                                    role: "user",
                                    content: "Give me a unique motivational quote for today."
                                }
                            ],
                            model: "llama3-8b-8192",
                            temperature: 0.7,
                            max_tokens: 150,
                            response_format: { type: "json_object" }
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const content = data.choices[0]?.message?.content;
                        if (content) {
                            const parsed = JSON.parse(content);
                            if (parsed.text && parsed.author) {
                                quote = parsed;
                            }
                        }
                    } else {
                        logger.error('Groq API Error: ' + await response.text());
                    }
                } catch (error) {
                    logger.error('Failed to fetch quote from LLM: ' + error);
                }
            }

            // Save to DB
            await prisma.systemSettings.create({
                data: {
                    settingKey,
                    settingValue: quote,
                    description: `Daily motivation quote for ${today}`
                }
            });

            return quote;
        } catch (error) {
            logger.error('Error in getDailyQuote: ' + error);
            // Fallback
            return {
                text: "The only way to do great work is to love what you do.",
                author: "Steve Jobs"
            };
        }
    }
}

export const motivationService = new MotivationService();
