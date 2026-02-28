import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';
import Groq from 'groq-sdk';

const prisma = new PrismaClient();

const AI_MODEL = process.env.AI_MODEL_NAME || 'llama-3.3-70b-versatile';

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

    // Auto Job Description Generation API
    async generateJobDescription(title: string, keywords: string[], recruiterId: string) {
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

    // Salary Band Recommendation API
    async suggestSalaryBand(title: string, location: string, experienceLevel: string) {
        const client = getGroq();
        if (!client) {
            return { min: 50000, max: 90000, currency: 'USD', reasoning: 'Fallback recommendation.' };
        }

        const prompt = `You are an expert compensation analyst. Suggest a competitive salary band for a "${title}" role.
Location: ${location || 'Remote/Global'}
Experience Level: ${experienceLevel || 'Mid-Level'}
Return a JSON object containing:
{
  "salaryBandMin": numeric min value,
  "salaryBandMax": numeric max value,
  "currency": "USD" or relevant currency,
  "reasoning": "Brief explanation of the recommendation based on market trends"
}`;

        try {
            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                response_format: { type: 'json_object' }
            });

            const text = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(cleanJson(text));
            return {
                min: parsed.salaryBandMin || 0,
                max: parsed.salaryBandMax || 0,
                currency: parsed.currency || 'USD',
                reasoning: parsed.reasoning || ''
            };
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
}

export const aiAssistantService = new AIAssistantService();
