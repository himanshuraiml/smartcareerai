import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';
import Groq from 'groq-sdk';
import Redis from 'ioredis';
import { generateJDForVertical, VERTICAL_PROMPTS } from '../utils/llm';

const prisma = new PrismaClient();

const AI_MODEL = process.env.AI_MODEL_NAME || 'llama-3.3-70b-versatile';

let redis: Redis | null = null;
function getRedis(): Redis | null {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        try {
            redis = new Redis(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
            redis.on('error', () => { /* ignore */ });
        } catch {
            redis = null;
        }
    }
    return redis;
}

let groq: Groq | null = null;
function getGroq(): Groq | null {
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY;
        if (apiKey) {
            groq = new Groq({ apiKey });
        } else {
            logger.warn('GROQ_API_KEY not set — AI assistant features will use fallback.');
        }
    }
    return groq;
}

function cleanJson(text: string): string {
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export class AIAssistantService {

    // Auto Job Description Generation API (F12: supports vertical)
    async generateJobDescription(title: string, keywords: string[], recruiterId: string, vertical?: string) {
        // F12: If a valid vertical is provided, use vertical-specific generation
        if (vertical && VERTICAL_PROMPTS[vertical]) {
            try {
                const result = await generateJDForVertical(title, keywords, vertical);
                return { title, ...result, vertical };
            } catch (error) {
                logger.error('Failed to generate vertical JD, falling back to generic:', error);
            }
        }

        const client = getGroq();
        if (!client) {
            return {
                title,
                description: `This is a fallback generated job description for ${title}. Required skills include: ${keywords.join(', ')}.`,
                requiredSkills: keywords
            };
        }

        const prompt = `You are an expert technical recruiter. Generate a professional and appealing job description for a "${title}" position.
Incorporate these keywords/skills: ${keywords.join(', ')}.
Return a JSON object containing:
{
  "description": "Full markdown-formatted job description (including About, Responsibilities, Requirements)",
  "requiredSkills": ["skill 1", "skill 2"]
}`;

        try {
            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            });

            const text = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(cleanJson(text));
            return {
                title,
                description: parsed.description || '',
                requiredSkills: parsed.requiredSkills || keywords
            };
        } catch (error) {
            logger.error('Failed to generate JD:', error);
            throw createError('Failed to generate Job Description', 500);
        }
    }

    // Salary Band Recommendation API (F9: enhanced with P25/P50/P75 percentiles + Redis cache)
    async suggestSalaryBand(title: string, location: string, experienceLevel: string) {
        const cacheKey = `salary:${(title || '').toLowerCase()}:${(location || '').toLowerCase()}`;
        const CACHE_TTL = 604800; // 7 days in seconds

        // Try cache first
        const r = getRedis();
        if (r) {
            try {
                const cached = await r.get(cacheKey);
                if (cached) {
                    logger.info(`Salary band cache hit: ${cacheKey}`);
                    return JSON.parse(cached);
                }
            } catch { /* cache miss — continue */ }
        }

        const client = getGroq();
        if (!client) {
            return { min: 50000, max: 90000, p25: 45000, p50: 65000, p75: 90000, currency: 'USD', reasoning: 'Fallback recommendation.', source: 'fallback', lastUpdated: new Date().toISOString() };
        }

        const prompt = `You are an expert compensation analyst. Provide a comprehensive salary analysis for a "${title}" role.
Location: ${location || 'Remote/Global'}
Experience Level: ${experienceLevel || 'Mid-Level'}
Return a JSON object containing:
{
  "salaryBandMin": numeric overall min value,
  "salaryBandMax": numeric overall max value,
  "p25": numeric 25th percentile (entry/below average for this role),
  "p50": numeric 50th percentile (median market rate),
  "p75": numeric 75th percentile (top-of-market for this role),
  "currency": "USD", "INR", or relevant currency code,
  "reasoning": "Brief explanation of the recommendation based on market trends",
  "source": "market data estimate"
}
Use realistic current market data. For Indian roles use INR values.`;

        try {
            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                response_format: { type: 'json_object' }
            });

            const text = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(cleanJson(text));
            const result = {
                min: parsed.salaryBandMin || 0,
                max: parsed.salaryBandMax || 0,
                p25: parsed.p25 || Math.round((parsed.salaryBandMin || 0) * 0.85),
                p50: parsed.p50 || Math.round(((parsed.salaryBandMin || 0) + (parsed.salaryBandMax || 0)) / 2),
                p75: parsed.p75 || parsed.salaryBandMax || 0,
                currency: parsed.currency || 'USD',
                reasoning: parsed.reasoning || '',
                source: parsed.source || 'AI market estimate',
                lastUpdated: new Date().toISOString(),
            };

            // Cache the result
            if (r) {
                try { await r.setex(cacheKey, CACHE_TTL, JSON.stringify(result)); } catch { /* ignore */ }
            }

            return result;
        } catch (error) {
            logger.error('Failed to suggest salary band:', error);
            throw createError('Failed to suggest salary band', 500);
        }
    }

    // Interview Question Suggestion API (Direct suggestion, not config)
    async suggestInterviewQuestions(jobId: string, recruiterId: string, count: number = 5) {
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId }
        });
        if (!job) throw createError('Job not found', 404);

        const client = getGroq();
        if (!client) {
            return [{ question: 'Fallback technical question?', type: 'TECHNICAL' }];
        }

        const prompt = `You are an expert technical interviewer. Suggest ${count} targeted interview questions for the following job:
Title: ${job.title}
Skills: ${job.requiredSkills.join(', ')}

Return a JSON object containing an array "questions":
{
  "questions": [
    {
      "question": "The question text",
      "type": "TECHNICAL or BEHAVIORAL or HR",
      "expectedAnswer": "Brief description of what a good answer entails"
    }
  ]
}`;

        try {
            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            });

            const text = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(cleanJson(text));
            return parsed.questions || [];
        } catch (error) {
            logger.error('Failed to suggest interview questions:', error);
            throw createError('Failed to suggest interview questions', 500);
        }
    }

    // Candidate 5-Line Summary Generation
    async generateCandidateSummary(applicationId: string, recruiterId: string) {
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
            include: {
                candidate: {
                    include: {
                        userSkills: { include: { skill: true } },
                        resumes: { orderBy: { createdAt: 'desc' }, take: 1 }
                    }
                },
                job: true
            }
        });
        if (!application) throw createError('Application not found', 404);

        const client = getGroq();
        if (!client) {
            const fallbackSummary = "Candidate has relevant skills but AI summary is unavailable.";
            await prisma.recruiterJobApplicant.update({
                where: { id: applicationId },
                data: { candidateSummary: fallbackSummary }
            });
            return { summary: fallbackSummary };
        }

        const candidateSkills = application.candidate.userSkills.map(s => s.skill.name).join(', ');
        const resumeText = application.candidate.resumes[0]?.parsedText || 'No resume data available';

        const prompt = `You are an expert technical recruiter summarizing a candidate for a hiring manager.
Job Title: ${application.job.title}
Candidate Skills: ${candidateSkills}
Resume Extract: ${JSON.stringify(resumeText)}

Generate a punchy, 5-line summary of this candidate's fit for the role. Focus on experience, top skills, and overall alignment.
Return a JSON object:
{
  "summary": "The 5-line summary here"
}`;

        try {
            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                response_format: { type: 'json_object' }
            });

            const text = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(cleanJson(text));
            const summary = parsed.summary || 'Summary unavailable.';

            await prisma.recruiterJobApplicant.update({
                where: { id: applicationId },
                data: { candidateSummary: summary }
            });

            return { summary };
        } catch (error) {
            logger.error('Failed to generate candidate summary:', error);
            throw createError('Failed to generate summary', 500);
        }
    }

    // Shortlist Justification Brief Generation
    async generateShortlistJustification(applicationId: string, recruiterId: string) {
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
            include: {
                candidate: {
                    include: {
                        userSkills: { include: { skill: true } }
                    }
                },
                job: true
            }
        });
        if (!application) throw createError('Application not found', 404);

        const client = getGroq();
        if (!client) {
            const fallbackJustification = "Candidate meets minimum criteria based on fallback evaluate.";
            await prisma.recruiterJobApplicant.update({
                where: { id: applicationId },
                data: { shortlistJustification: fallbackJustification }
            });
            return { justification: fallbackJustification };
        }

        const candidateSkills = application.candidate.userSkills.map(s => s.skill.name).join(', ');
        const evaluation = application.aiEvaluation ? JSON.stringify(application.aiEvaluation) : 'No AI evaluation done yet.';

        const prompt = `You are recommending a candidate to be shortlisted for the role of "${application.job.title}".
Candidate Skills: ${candidateSkills}
AI Evaluation Results: ${evaluation}

Write a professional, 1-paragraph justification (approx 3-4 sentences) explaining why this candidate should be shortlisted. Highlight their strengths from the evaluation and skills matching the job.
Return a JSON object:
{
  "justification": "The justification paragraph here"
}`;

        try {
            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                response_format: { type: 'json_object' }
            });

            const text = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(cleanJson(text));
            const justification = parsed.justification || 'Justification unavailable.';

            await prisma.recruiterJobApplicant.update({
                where: { id: applicationId },
                data: { shortlistJustification: justification }
            });

            return { justification };
        } catch (error) {
            logger.error('Failed to generate shortlist justification:', error);
            throw createError('Failed to generate justification', 500);
        }
    }

    // F4: JD Bias & SEO Scoring
    async analyzeJobDescription(jdText: string) {
        // Compute a rough Flesch-Kincaid reading ease estimate
        const words = jdText.split(/\s+/).filter(Boolean).length;
        const sentences = (jdText.match(/[.!?]+/g) || []).length || 1;
        const syllables = jdText.split(/[aeiouAEIOU]/).length - 1;
        const fkGrade = Math.max(0, Math.round(0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59));

        const client = getGroq();
        if (!client) {
            return {
                biasScore: 50,
                readabilityScore: fkGrade,
                genderCoding: 'neutral',
                flaggedWords: [],
                seoKeywords: [],
                suggestions: ['AI analysis unavailable — please configure GROQ_API_KEY.'],
            };
        }

        const prompt = `You are an expert job description analyst specialising in bias detection and SEO optimisation.
Analyse the following job description and return a JSON object ONLY:
{
  "biasScore": number (0-100, higher = more biased language present),
  "genderCoding": "masculine" | "feminine" | "neutral",
  "flaggedWords": [
    { "word": "exact word or phrase found", "type": "bias" | "complex", "suggestion": "neutral alternative" }
  ],
  "seoKeywords": ["keyword1", "keyword2"],
  "suggestions": ["Actionable improvement tip 1", "Actionable improvement tip 2"]
}

Masculine-coded bias words: aggressive, competitive, ninja, rockstar, dominant, dominate, driven, ambitious, strong, decisive, independent, analytical, rational, stubborn, fearless, assertive, hierarchical.
Feminine-coded bias words: collaborative, support, nurturing, interpersonal, inclusive, empathetic, compassionate, community, trust, share.
Complex words that reduce readability should go in flaggedWords with type "complex".
SEO keywords are the top role-specific skills and job titles that help this post rank in search.
Keep flaggedWords to the top 6 most important. Keep seoKeywords to the top 8. Keep suggestions to 3-5.

Job Description:
${jdText.substring(0, 3000)}`;

        try {
            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
                max_tokens: 1500,
                response_format: { type: 'json_object' },
            });

            const text = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(cleanJson(text));

            return {
                biasScore: Math.min(100, Math.max(0, parsed.biasScore ?? 50)),
                readabilityScore: fkGrade,
                genderCoding: ['masculine', 'feminine', 'neutral'].includes(parsed.genderCoding) ? parsed.genderCoding : 'neutral',
                flaggedWords: Array.isArray(parsed.flaggedWords) ? parsed.flaggedWords.slice(0, 10) : [],
                seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords.slice(0, 10) : [],
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
            };
        } catch (error) {
            logger.error('Failed to analyze job description:', error);
            throw createError('Failed to analyze job description', 500);
        }
    }
}

export const aiAssistantService = new AIAssistantService();
