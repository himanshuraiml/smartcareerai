import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';
import Groq from 'groq-sdk';
import { predictiveService } from './predictive.service';

const prisma = new PrismaClient();

const AI_MODEL = process.env.AI_MODEL_NAME || 'llama-3.3-70b-versatile';

let groq: Groq | null = null;
function getGroq(): Groq | null {
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY;
        if (apiKey) {
            groq = new Groq({ apiKey });
        } else {
            logger.warn('GROQ_API_KEY not set — AI interview features will use fallback.');
        }
    }
    return groq;
}

function cleanJson(text: string): string {
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

// ── Types ────────────────────────────────────────────────────────────
export interface AIInterviewConfig {
    enabled: boolean;
    questionCount: number;                         // 3 – 10
    interviewType: 'TECHNICAL' | 'BEHAVIORAL' | 'MIXED' | 'HR';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    timeLimitMinutes: number;                      // per question
    customInstructions?: string;
    hasCodingQuestions?: boolean;                  // Adds algorithmic or debugging questions
    questions?: GeneratedQuestion[];               // stored after generation
    generatedAt?: string;
}

export interface GeneratedQuestion {
    id: string;
    questionText: string;
    type: string;                                  // 'technical' | 'behavioral' | 'hr'
    expectedKeyPoints: string[];
    idealAnswer?: string;
    isCodingChallenge?: boolean;
    starterCode?: string;
}

export interface CandidateInterviewSubmission {
    questionId: string;
    answer: string;
}

export interface InterviewEvaluation {
    questionId: string;
    questionText: string;
    answer: string;
    score: number;
    feedback: string;
    keyPointsCovered: string[];
    improvementSuggestions: string[];
    evidenceSnippets: string[]; // Phase 2 Explainability
    riskFlags: string[];        // Phase 2 Explainability
    biasFlags: string[];        // Phase 3 Bias Detection
}

export interface InterviewResult {
    overallScore: number;
    evaluations: InterviewEvaluation[];
    recommendation: 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'NO_HIRE';
    summaryFeedback: string;
    scoringWeights: ScoringWeights;
    dimensionScores: DimensionScores;
    confidenceScore?: number;                 // Phase 2 Explainability
    skillScoreBreakdown?: Record<string, number>; // Phase 2 Explainability
}

export interface ScoringWeights {
    technical: number;       // 0-100, sums to 100 with others
    communication: number;
    problemSolving: number;
    cultural: number;
}

export interface DimensionScores {
    technical: number;
    communication: number;
    problemSolving: number;
    cultural: number;
}

// Default scoring weights
const DEFAULT_WEIGHTS: ScoringWeights = {
    technical: 40,
    communication: 25,
    problemSolving: 25,
    cultural: 10,
};

// ── Service ──────────────────────────────────────────────────────────
export class AIInterviewService {

    /**
     * Generate interview questions from a job's JD and save config
     */
    async generateAndSaveConfig(
        jobId: string,
        recruiterId: string,
        config: Omit<AIInterviewConfig, 'questions' | 'generatedAt'>
    ): Promise<AIInterviewConfig> {
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
        });
        if (!job) throw createError('Job not found', 404, 'JOB_NOT_FOUND');

        // Generate questions from JD
        const questions = await this.generateQuestionsFromJD(
            job.title,
            job.description,
            job.requiredSkills,
            config
        );

        const fullConfig: AIInterviewConfig = {
            ...config,
            questions,
            generatedAt: new Date().toISOString(),
        };

        await prisma.recruiterJob.update({
            where: { id: jobId },
            data: { aiInterviewConfig: fullConfig as any },
        });

        logger.info(`Saved AI interview config for job ${jobId} with ${questions.length} questions`);
        return fullConfig;
    }

    /**
     * Get the stored AI interview config for a job
     */
    async getConfig(jobId: string, recruiterId: string): Promise<AIInterviewConfig | null> {
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
            select: { aiInterviewConfig: true },
        });
        if (!job) throw createError('Job not found', 404, 'JOB_NOT_FOUND');
        return job.aiInterviewConfig as AIInterviewConfig | null;
    }

    /**
     * Evaluate a candidate's answers against the job's interview config
     */
    async evaluateCandidate(
        jobId: string,
        recruiterId: string,
        applicationId: string,
        submissions: CandidateInterviewSubmission[],
        scoringWeights?: ScoringWeights
    ): Promise<InterviewResult> {
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
            select: { aiInterviewConfig: true, title: true, requiredSkills: true },
        });
        if (!job) throw createError('Job not found', 404, 'JOB_NOT_FOUND');

        const cfg = job.aiInterviewConfig as AIInterviewConfig | null;
        if (!cfg?.questions?.length) {
            throw createError('No AI interview configured for this job', 400, 'NO_INTERVIEW_CONFIG');
        }

        // Verify application exists
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, jobId },
        });
        if (!application) throw createError('Application not found', 404, 'APPLICATION_NOT_FOUND');

        const weights = scoringWeights || DEFAULT_WEIGHTS;

        // Evaluate each answer
        const evaluations: InterviewEvaluation[] = await Promise.all(
            submissions.map(async (sub) => {
                const question = cfg.questions!.find(q => q.id === sub.questionId);
                if (!question) {
                    return {
                        questionId: sub.questionId,
                        questionText: 'Unknown question',
                        answer: sub.answer,
                        score: 50,
                        feedback: 'Question not found in config',
                        keyPointsCovered: [],
                        improvementSuggestions: [],
                        evidenceSnippets: [],
                        riskFlags: [],
                        biasFlags: [],
                    };
                }
                return this.evaluateAnswer(question, sub.answer, job.title, cfg.interviewType);
            })
        );

        // Calculate dimension scores
        const dimensionScores = this.calculateDimensionScores(evaluations, cfg.interviewType);

        // Weighted overall score
        const overallScore = Math.round(
            (dimensionScores.technical * weights.technical +
                dimensionScores.communication * weights.communication +
                dimensionScores.problemSolving * weights.problemSolving +
                dimensionScores.cultural * weights.cultural) / 100
        );

        const recommendation = this.getRecommendation(overallScore);
        const { summaryFeedback, confidenceScore, skillScoreBreakdown } = await this.generateDeepInsights(
            job.title,
            evaluations,
            overallScore,
            recommendation,
            job.requiredSkills
        );

        const result: InterviewResult = {
            overallScore,
            evaluations,
            recommendation,
            summaryFeedback,
            scoringWeights: weights,
            dimensionScores,
            confidenceScore,
            skillScoreBreakdown,
        };

        const allBiasFlags = Array.from(new Set(evaluations.flatMap(e => e.biasFlags || [])));

        // Persist to applicant record
        await prisma.recruiterJobApplicant.update({
            where: { id: applicationId },
            data: {
                overallScore,
                aiEvaluation: result as any,
                status: overallScore >= 70 ? 'SCREENING' : application.status,
                biasFlags: allBiasFlags,
            },
        });

        const recruiter = await prisma.recruiter.findUnique({ where: { id: recruiterId } });
        if (recruiter && recruiter.organizationId) {
            await prisma.activityLog.create({
                data: {
                    userId: recruiter.userId,
                    type: 'EVALUATION_RUN',
                    message: `Ran AI evaluation resulting in score ${overallScore}`,
                    metadata: { jobId: jobId, candidateId: application.candidateId, overallScore, recommendation }
                }
            });
        }

        // Update predictive ranking metrics async
        predictiveService.computeMetricsForApplicant(applicationId).catch(err =>
            logger.error(`Failed to compute predictive metrics for applicant ${applicationId}: ${err.message}`)
        );

        logger.info(`Evaluated candidate ${applicationId} for job ${jobId}: score=${overallScore}`);
        return result;
    }

    /**
     * Get all evaluation results for a job (for analytics)
     */
    async getJobAnalytics(jobId: string, recruiterId: string) {
        const job = await prisma.recruiterJob.findFirst({
            where: { id: jobId, recruiterId },
        });
        if (!job) throw createError('Job not found', 404, 'JOB_NOT_FOUND');

        const applicants = await prisma.recruiterJobApplicant.findMany({
            where: { jobId },
            select: {
                id: true,
                status: true,
                overallScore: true,
                aiEvaluation: true,
                appliedAt: true,
                updatedAt: true,
                candidateId: true,
            },
        });

        const evaluated = applicants.filter(a => a.overallScore !== null);
        const avgScore = evaluated.length > 0
            ? Math.round(evaluated.reduce((s, a) => s + (a.overallScore || 0), 0) / evaluated.length)
            : null;

        const stageCounts = applicants.reduce((acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate Average Skill Scores
        const skillTotals: Record<string, { sum: number; count: number }> = {};
        evaluated.forEach(a => {
            const evalData = a.aiEvaluation as any;
            if (evalData && evalData.skillScoreBreakdown) {
                Object.entries(evalData.skillScoreBreakdown).forEach(([skill, score]: [string, any]) => {
                    if (!skillTotals[skill]) skillTotals[skill] = { sum: 0, count: 0 };
                    skillTotals[skill].sum += Number(score);
                    skillTotals[skill].count += 1;
                });
            }
        });

        const averageSkillScores = Object.fromEntries(
            Object.entries(skillTotals).map(([skill, data]) => [
                skill,
                Math.round(data.sum / data.count)
            ])
        );

        // Calculate Time to Shortlist (in days)
        const shortlisted = applicants.filter(a => ['SHORTLISTED', 'INTERVIEWING', 'OFFER_MADE', 'HIRED'].includes(a.status));
        const timeToShortlistDays = shortlisted.length > 0
            ? shortlisted.reduce((acc, a) => {
                const diffTime = Math.abs(new Date(a.updatedAt).getTime() - new Date(a.appliedAt).getTime());
                return acc + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }, 0) / shortlisted.length
            : null;

        const completionRate = applicants.length > 0 ? Math.round((evaluated.length / applicants.length) * 100) : 0;

        return {
            jobId,
            totalApplicants: applicants.length,
            evaluated: evaluated.length,
            completionRate,
            dropoutRate: applicants.length > 0 ? 100 - completionRate : 0,
            avgScore,
            averageSkillScores,
            timeToShortlistDays: timeToShortlistDays ? Math.round(timeToShortlistDays) : null,
            stageCounts,
            topCandidates: evaluated
                .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
                .slice(0, 5)
                .map(a => ({
                    applicationId: a.id,
                    overallScore: a.overallScore,
                    status: a.status,
                    recommendation: (a.aiEvaluation as any)?.recommendation || null,
                })),
        };
    }

    // ── Private Helpers ────────────────────────────────────────────────

    private async generateQuestionsFromJD(
        jobTitle: string,
        description: string,
        requiredSkills: string[],
        config: Omit<AIInterviewConfig, 'questions' | 'generatedAt'>
    ): Promise<GeneratedQuestion[]> {
        const client = getGroq();
        if (!client) {
            return this.getFallbackQuestions(jobTitle, config.questionCount, config.interviewType);
        }

        const systemPrompt = `You are an expert technical recruiter. Generate targeted interview questions based on a job description.
Return a JSON object with a "questions" array. Each question must have:
{
  "id": "q1", "q2" etc,
  "questionText": "the interview question",
  "type": "technical|behavioral|hr",
  "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"],
  "idealAnswer": "what an excellent answer would include",
  "isCodingChallenge": true/false (Set to true ONLY if you are providing an algorithmic, data structure, or debugging challenge that requires writing code),
  "starterCode": "Optional code snippet to start the candidate off (e.g. function signature). Omit if not a coding challenge."
}`;

        const userPrompt = `Generate ${config.questionCount} ${config.difficulty.toLowerCase()} ${config.interviewType.toLowerCase()} interview questions for this role:

Job Title: ${jobTitle}
Required Skills: ${requiredSkills.join(', ')}
Job Description: ${description.slice(0, 1500)}

Interview Type: ${config.interviewType}
Difficulty: ${config.difficulty}
${config.hasCodingQuestions ? 'CRITICAL INSTRUCTION: Include at least 1-2 coding challenges (e.g. debugging, algorithms, or practical implementation) that the candidate must write actual code for.' : ''}
${config.customInstructions ? `Special Instructions: ${config.customInstructions}` : ''}

Generate questions directly testing the required skills and experience for THIS specific role.
Return ONLY the JSON object.`;

        try {
            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 3000,
                response_format: { type: 'json_object' },
            });

            const text = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(cleanJson(text));
            const questions: GeneratedQuestion[] = (parsed.questions || []).map((q: any, i: number) => ({
                id: q.id || `q${i + 1}`,
                questionText: q.questionText || q.question || '',
                type: q.type || 'technical',
                expectedKeyPoints: q.expectedKeyPoints || q.keyPoints || [],
                idealAnswer: q.idealAnswer || '',
                isCodingChallenge: !!q.isCodingChallenge,
                starterCode: q.starterCode || undefined,
            }));

            logger.info(`Generated ${questions.length} AI interview questions for "${jobTitle}"`);
            return questions.slice(0, config.questionCount);
        } catch (err) {
            logger.error('Failed to generate AI questions:', err);
            return this.getFallbackQuestions(jobTitle, config.questionCount, config.interviewType);
        }
    }

    private async evaluateAnswer(
        question: GeneratedQuestion,
        answer: string,
        jobTitle: string,
        interviewType: string
    ): Promise<InterviewEvaluation> {
        const client = getGroq();

        if (!client || !answer.trim()) {
            return {
                questionId: question.id,
                questionText: question.questionText,
                answer,
                score: answer.trim() ? 50 : 0,
                feedback: answer.trim() ? 'Answer recorded, AI evaluation unavailable.' : 'No answer provided.',
                keyPointsCovered: [],
                improvementSuggestions: question.expectedKeyPoints,
                evidenceSnippets: [],
                riskFlags: [],
                biasFlags: [],
            };
        }

        const systemPrompt = `You are an expert recruiter evaluating a candidate's interview answer.
Return JSON: {
  "score": 0-100,
  "feedback": "2-3 sentences of constructive feedback",
  "keyPointsCovered": ["covered key point 1", ...],
  "improvementSuggestions": ["suggestion 1", ...],
  "evidenceSnippets": ["exact quote from candidate proving point"],
  "riskFlags": ["any red flag like contradiction, vagueness, or confusion"],
  "biasFlags": ["any biased, discriminatory, or highly opinionated language that could unfairly influence a human recruiter"]
}`;

        const userPrompt = `Evaluate this answer for a ${jobTitle} position:

Question: ${question.questionText}
Expected Key Points: ${question.expectedKeyPoints.join(', ')}
Ideal Answer Outline: ${question.idealAnswer || 'Not specified'}

Candidate's Answer: "${answer}"

Score from 0-100 based on:
- Coverage of expected key points
- Technical accuracy
- Clarity and structure
- Depth of knowledge

Return ONLY the JSON.`;

        try {
            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 600,
                response_format: { type: 'json_object' },
            });

            const text = response.choices[0]?.message?.content || '{}';
            const result = JSON.parse(cleanJson(text));

            return {
                questionId: question.id,
                questionText: question.questionText,
                answer,
                score: Math.min(100, Math.max(0, result.score || 50)),
                feedback: result.feedback || 'Good response.',
                keyPointsCovered: result.keyPointsCovered || [],
                improvementSuggestions: result.improvementSuggestions || [],
                evidenceSnippets: result.evidenceSnippets || [],
                riskFlags: result.riskFlags || [],
                biasFlags: result.biasFlags || [],
            };
        } catch {
            return {
                questionId: question.id,
                questionText: question.questionText,
                answer,
                score: 60,
                feedback: 'Answer recorded.',
                keyPointsCovered: [],
                improvementSuggestions: question.expectedKeyPoints,
                evidenceSnippets: [],
                riskFlags: [],
                biasFlags: [],
            };
        }
    }

    private calculateDimensionScores(
        evaluations: InterviewEvaluation[],
        interviewType: string
    ): DimensionScores {
        if (evaluations.length === 0) {
            return { technical: 0, communication: 0, problemSolving: 0, cultural: 0 };
        }

        const avg = evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length;

        // In absence of per-dimension scoring from LLM, derive from overall avg with variance
        const isTechnical = ['TECHNICAL', 'MIXED'].includes(interviewType);
        return {
            technical: isTechnical ? Math.min(100, avg + 5) : Math.max(0, avg - 10),
            communication: Math.max(0, avg - 5),
            problemSolving: isTechnical ? avg : Math.max(0, avg - 8),
            cultural: Math.min(100, avg + 10),
        };
    }

    private getRecommendation(score: number): InterviewResult['recommendation'] {
        if (score >= 85) return 'STRONG_HIRE';
        if (score >= 70) return 'HIRE';
        if (score >= 55) return 'MAYBE';
        return 'NO_HIRE';
    }

    private async generateDeepInsights(
        jobTitle: string,
        evaluations: InterviewEvaluation[],
        overallScore: number,
        recommendation: string,
        requiredSkills: string[]
    ): Promise<{ summaryFeedback: string; confidenceScore: number; skillScoreBreakdown: Record<string, number> }> {
        const fallback = {
            summaryFeedback: this.getBasicSummary(overallScore, recommendation),
            confidenceScore: 75,
            skillScoreBreakdown: requiredSkills.reduce((acc, skill) => ({ ...acc, [skill]: overallScore }), {})
        };

        const client = getGroq();
        if (!client) {
            return fallback;
        }

        try {
            const questionSummary = evaluations
                .map(e => `Q: ${e.questionText}\nScore: ${e.score}/100\nFeedback: ${e.feedback}\nFlags: ${e.riskFlags.join(',')}`)
                .join('\n\n');

            const systemPrompt = `You are an expert technical hiring manager analyzing interview results.
Return JSON: {
  "summaryFeedback": "3-sentence hiring summary suitable for a report.",
  "confidenceScore": 0-100 (how confident you are in this evaluation based on depth of answers),
  "skillScoreBreakdown": { "Skill 1": 0-100, "Skill 2": 0-100 }
}`;

            const response = await client.chat.completions.create({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user', content: `Analyze this candidate for ${jobTitle}:
Overall Score: ${overallScore}/100
Recommendation: ${recommendation}
Required Skills: ${requiredSkills.join(', ')}

Interview Highlights & Flags:
${questionSummary}

Provide the precise JSON object.`
                    },
                ],
                temperature: 0.3,
                max_tokens: 600,
                response_format: { type: 'json_object' },
            });

            const text = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(cleanJson(text));
            return {
                summaryFeedback: parsed.summaryFeedback || fallback.summaryFeedback,
                confidenceScore: parsed.confidenceScore || fallback.confidenceScore,
                skillScoreBreakdown: parsed.skillScoreBreakdown || fallback.skillScoreBreakdown,
            };
        } catch (err) {
            logger.error('Failed to generate deep insights:', err);
            return fallback;
        }
    }

    private getBasicSummary(score: number, recommendation: string): string {
        const recs: Record<string, string> = {
            STRONG_HIRE: `Outstanding candidate (${score}/100). Strongly recommended for hire — demonstrated excellent depth across all evaluated areas.`,
            HIRE: `Strong candidate (${score}/100). Recommended for hire — solid performance with minor areas to grow.`,
            MAYBE: `Average candidate (${score}/100). May be suitable depending on team needs — gaps in some areas require consideration.`,
            NO_HIRE: `Below threshold (${score}/100). Does not meet minimum requirements for this role at this time.`,
        };
        return recs[recommendation] || `Score: ${score}/100.`;
    }

    private getFallbackQuestions(
        jobTitle: string,
        count: number,
        interviewType: string
    ): GeneratedQuestion[] {
        const pool: GeneratedQuestion[] = [
            { id: 'q1', questionText: `What are your core strengths relevant to the ${jobTitle} role?`, type: 'behavioral', expectedKeyPoints: ['relevant skills', 'role alignment', 'examples'], idealAnswer: 'Candidate should link specific strengths to job requirements with concrete examples.' },
            { id: 'q2', questionText: 'Describe a challenging project you led and the outcome.', type: 'behavioral', expectedKeyPoints: ['project complexity', 'leadership', 'measurable outcome'], idealAnswer: 'Use STAR method with quantifiable impact.' },
            { id: 'q3', questionText: 'How do you approach debugging a complex technical issue?', type: 'technical', expectedKeyPoints: ['systematic approach', 'tooling', 'documentation'], idealAnswer: 'Should mention isolation, reproduction, logging, testing, and root cause analysis.' },
            { id: 'q4', questionText: 'How do you prioritize tasks when facing multiple deadlines?', type: 'behavioral', expectedKeyPoints: ['prioritization framework', 'communication', 'delivery'], idealAnswer: 'Should mention stakeholder communication, impact assessment, and tool usage.' },
            { id: 'q5', questionText: `What recent developments in the ${jobTitle} field excite you most?`, type: 'technical', expectedKeyPoints: ['awareness', 'learning mindset', 'relevance'], idealAnswer: 'Shows that candidate stays current and applies knowledge practically.' },
            { id: 'q6', questionText: 'Tell me about a time you had to learn a new technology quickly.', type: 'behavioral', expectedKeyPoints: ['learning speed', 'resourcefulness', 'outcome'], idealAnswer: 'Clear example with timeline and successful application.' },
            { id: 'q7', questionText: 'How do you handle disagreements with teammates?', type: 'hr', expectedKeyPoints: ['conflict resolution', 'empathy', 'professionalism'], idealAnswer: 'Shows communication skills and collaborative mindset.' },
        ];

        return pool.slice(0, Math.min(count, pool.length));
    }
}

export const aiInterviewService = new AIInterviewService();
