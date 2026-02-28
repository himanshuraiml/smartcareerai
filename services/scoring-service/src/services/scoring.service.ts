import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { analyzeWithGemini } from '../utils/gemini';
import { ATS_SCORING_PROMPT } from '../prompts/ats.prompts';
import { cacheGet, cacheSet, normalizeSkillList } from '@smartcareer/shared';

interface ScoreDeduction {
    category: string;
    points: number;
    reason: string;
}

interface IndustryBenchmark {
    estimatedPercentile: number;
    averageScoreForRole: number;
    competitiveLevel: string;
}

interface ATSAnalysisResult {
    overallScore: number;
    keywordMatchPercent: number;
    formattingScore: number;
    experienceScore: number;
    educationScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    formattingIssues: string[];
    suggestions: string[];
    scoreDeductions: ScoreDeduction[];
    scoreExplanation: string;
    industryBenchmark: IndustryBenchmark;
    transparencyNote: string;
    biasFlags: string[];
}

export class ScoringService {

    async analyzeResume(
        userId: string,
        resumeId: string,
        jobRole: string,
        jobDescription?: string
    ) {
        // Get resume
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId },
        });

        if (!resume) {
            throw new AppError('Resume not found', 404);
        }

        if (resume.status !== 'PARSED' || !resume.parsedText) {
            throw new AppError('Resume has not been parsed yet', 400);
        }

        // Get job role info for context (cached)
        const roleCacheKey = `job-role:title:${jobRole.toLowerCase().trim()}`;
        let roleInfo = await cacheGet<any>(roleCacheKey);
        if (!roleInfo) {
            roleInfo = await prisma.jobRole.findFirst({
                where: { title: { contains: jobRole, mode: 'insensitive' } },
            });
            if (roleInfo) {
                await cacheSet(roleCacheKey, roleInfo, 3600); // 1 hour
            }
        }

        // Perform LLM analysis
        const analysis = await this.performATSAnalysis(
            resume.parsedText,
            jobRole,
            jobDescription,
            roleInfo
        );

        // Save score
        const score = await prisma.atsScore.create({
            data: {
                userId,
                resumeId,
                jobRole,
                jobDescription,
                overallScore: analysis.overallScore,
                keywordMatchPercent: analysis.keywordMatchPercent,
                formattingScore: analysis.formattingScore,
                experienceScore: analysis.experienceScore,
                educationScore: analysis.educationScore,
                matchedKeywords: analysis.matchedKeywords,
                missingKeywords: analysis.missingKeywords,
                formattingIssues: analysis.formattingIssues,
                suggestions: analysis.suggestions,
                rawAnalysis: analysis as any,
            },
        });

        // Extract matched keywords as user skills
        await this.saveExtractedSkills(userId, analysis.matchedKeywords);

        return this.formatScore(score);
    }

    async getScoreHistory(userId: string) {
        const scores = await prisma.atsScore.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                resume: {
                    select: { fileName: true },
                },
            },
        });

        return scores.map((score) => ({
            ...this.formatScore(score),
            resumeName: score.resume.fileName,
        }));
    }

    async getScoreById(scoreId: string, userId: string) {
        const score = await prisma.atsScore.findFirst({
            where: { id: scoreId, userId },
            include: {
                resume: {
                    select: { fileName: true, parsedText: true },
                },
            },
        });

        if (!score) {
            throw new AppError('Score not found', 404);
        }

        return {
            ...this.formatScore(score),
            resumeName: score.resume.fileName,
        };
    }

    async getJobRoles() {
        const cacheKey = 'scoring:job-roles';
        const cached = await cacheGet<any[]>(cacheKey);
        if (cached) return cached;

        const roles = await prisma.jobRole.findMany({
            where: { isActive: true },
            select: {
                id: true,
                title: true,
                category: true,
                requiredSkills: true,
            },
            orderBy: { title: 'asc' },
        });

        await cacheSet(cacheKey, roles, 3600); // 1 hour
        return roles;
    }

    private async performATSAnalysis(
        resumeText: string,
        jobRole: string,
        jobDescription?: string,
        roleInfo?: any
    ): Promise<ATSAnalysisResult> {
        const roleContext = roleInfo
            ? `Required Skills: ${roleInfo.requiredSkills.join(', ')}\nPreferred Skills: ${roleInfo.preferredSkills.join(', ')}\nKeywords: ${roleInfo.keywords.join(', ')}`
            : '';

        const prompt = ATS_SCORING_PROMPT
            .replace('{{RESUME_TEXT}}', resumeText)
            .replace('{{JOB_ROLE}}', jobRole)
            .replace('{{JOB_DESCRIPTION}}', jobDescription || 'Not provided')
            .replace('{{ROLE_CONTEXT}}', roleContext);

        try {
            const systemPrompt = 'You are an expert ATS (Applicant Tracking System) analyzer. Analyze resumes and provide detailed scoring. Return JSON only.';

            const result = await analyzeWithGemini(systemPrompt, prompt);

            // If Gemini failed, use fallback
            if (!result) {
                logger.warn('Gemini returned null, using fallback analysis');
                return this.performBasicAnalysis(resumeText, jobRole, roleInfo);
            }

            return {
                overallScore: Math.min(100, Math.max(0, result.overallScore || 50)),
                keywordMatchPercent: Math.min(100, Math.max(0, result.keywordMatchPercent || 0)),
                formattingScore: Math.min(100, Math.max(0, result.formattingScore || 50)),
                experienceScore: Math.min(100, Math.max(0, result.experienceScore || 50)),
                educationScore: Math.min(100, Math.max(0, result.educationScore || 50)),
                matchedKeywords: result.matchedKeywords || [],
                missingKeywords: result.missingKeywords || [],
                formattingIssues: result.formattingIssues || [],
                suggestions: result.suggestions || [],
                scoreDeductions: Array.isArray(result.scoreDeductions) ? result.scoreDeductions : [],
                scoreExplanation: result.scoreExplanation || 'Score breakdown not available.',
                industryBenchmark: result.industryBenchmark || {
                    estimatedPercentile: 50,
                    averageScoreForRole: 60,
                    competitiveLevel: 'average',
                },
                transparencyNote: result.transparencyNote || 'ATS scores vary across platforms (LinkedIn, Indeed, Workday) because each uses different keyword weighting and parsing algorithms. Our score focuses on keyword relevance, formatting compliance, and content depth.',
                biasFlags: result.biasFlags || [],
            };
        } catch (error) {
            logger.error('LLM analysis failed', error);
            // Fallback to basic analysis
            return this.performBasicAnalysis(resumeText, jobRole, roleInfo);
        }
    }

    private performBasicAnalysis(
        resumeText: string,
        jobRole: string,
        roleInfo?: any
    ): ATSAnalysisResult {
        const text = resumeText.toLowerCase();
        const requiredSkills = roleInfo?.requiredSkills || [];
        const keywords = roleInfo?.keywords || [];

        const matchedKeywords = [...requiredSkills, ...keywords].filter((skill: string) =>
            text.includes(skill.toLowerCase())
        );
        const missingKeywords = requiredSkills.filter(
            (skill: string) => !text.includes(skill.toLowerCase())
        );

        const keywordMatchPercent =
            requiredSkills.length > 0
                ? (matchedKeywords.length / requiredSkills.length) * 100
                : 50;

        // Basic formatting checks
        const formattingIssues: string[] = [];
        if (!resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
            formattingIssues.push('No email address found');
        }
        if (!resumeText.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)) {
            formattingIssues.push('No phone number found');
        }
        if (resumeText.length < 500) {
            formattingIssues.push('Resume appears too short');
        }
        if (!text.includes('experience') && !text.includes('work history')) {
            formattingIssues.push('No clear work experience section found');
        }
        if (!text.includes('education') && !text.includes('degree') && !text.includes('university')) {
            formattingIssues.push('No clear education section found');
        }

        const formattingScore = Math.max(0, 100 - formattingIssues.length * 15);

        // Generate dynamic suggestions based on actual analysis
        const suggestions: string[] = [];

        // Suggestions based on missing keywords
        if (missingKeywords.length > 0) {
            const topMissing = missingKeywords.slice(0, 3);
            suggestions.push(`Add these key skills for ${jobRole}: ${topMissing.join(', ')}`);
        }

        // Suggestions based on formatting issues
        if (formattingIssues.includes('No email address found')) {
            suggestions.push('Add a professional email address to your contact section');
        }
        if (formattingIssues.includes('No phone number found')) {
            suggestions.push('Include a phone number for recruiters to reach you');
        }
        if (formattingIssues.includes('Resume appears too short')) {
            suggestions.push('Expand your resume with more detailed project descriptions and achievements');
        }

        // General improvements based on content analysis
        if (!text.includes('achieved') && !text.includes('increased') && !text.includes('improved') && !text.includes('reduced')) {
            suggestions.push('Quantify your achievements (e.g., "Increased sales by 20%", "Reduced load time by 50%")');
        }
        if (!text.includes('led') && !text.includes('managed') && !text.includes('coordinated')) {
            suggestions.push('Highlight leadership experiences and team collaboration');
        }
        if (!text.includes('github') && !text.includes('portfolio') && !text.includes('linkedin')) {
            suggestions.push('Add links to your GitHub, portfolio, or LinkedIn profile');
        }
        if (keywordMatchPercent < 50) {
            suggestions.push(`Your resume matches only ${Math.round(keywordMatchPercent)}% of keywords for ${jobRole} - consider tailoring it more`);
        }

        // Ensure at least 3 suggestions
        if (suggestions.length < 3) {
            if (!suggestions.some(s => s.includes('action verbs'))) {
                suggestions.push('Use strong action verbs like "developed", "implemented", "designed", "optimized"');
            }
        }

        const overallScore = Math.round((keywordMatchPercent + formattingScore) / 2);
        const experienceScore = text.includes('experience') ? 70 : 40;
        const educationScore = text.includes('education') || text.includes('degree') ? 70 : 40;

        // Generate transparency: score deductions
        const scoreDeductions: ScoreDeduction[] = [];
        if (missingKeywords.length > 0) {
            scoreDeductions.push({
                category: 'Keywords',
                points: Math.round(100 - keywordMatchPercent),
                reason: `Missing ${missingKeywords.length} key skills: ${missingKeywords.slice(0, 3).join(', ')}${missingKeywords.length > 3 ? '...' : ''}`,
            });
        }
        if (formattingIssues.length > 0) {
            scoreDeductions.push({
                category: 'Formatting',
                points: 100 - formattingScore,
                reason: formattingIssues.join('; '),
            });
        }
        if (experienceScore < 70) {
            scoreDeductions.push({
                category: 'Experience',
                points: 30,
                reason: 'No clear work experience section detected in resume',
            });
        }
        if (educationScore < 70) {
            scoreDeductions.push({
                category: 'Education',
                points: 30,
                reason: 'No clear education section detected in resume',
            });
        }

        // Generate transparency: explanation
        const topIssues = scoreDeductions.slice(0, 2).map(d => d.reason).join('. ');
        const scoreExplanation = `Your resume scored ${overallScore}/100 for ${jobRole}. ${topIssues ? `Key areas for improvement: ${topIssues}.` : 'The resume covers the main requirements well.'}`;

        // Generate transparency: industry benchmark
        const competitiveLevel = overallScore >= 80 ? 'excellent' : overallScore >= 65 ? 'above_average' : overallScore >= 45 ? 'average' : 'below_average';
        const industryBenchmark: IndustryBenchmark = {
            estimatedPercentile: Math.min(95, Math.max(5, overallScore + Math.round((overallScore - 50) * 0.3))),
            averageScoreForRole: 58,
            competitiveLevel,
        };

        return {
            overallScore,
            keywordMatchPercent: Math.round(keywordMatchPercent),
            formattingScore,
            experienceScore,
            educationScore,
            matchedKeywords,
            missingKeywords,
            formattingIssues,
            suggestions: suggestions.slice(0, 5),
            scoreDeductions,
            scoreExplanation,
            industryBenchmark,
            transparencyNote: 'ATS scores vary across platforms (LinkedIn, Indeed, Workday) because each uses different keyword weighting and parsing algorithms. Our score focuses on keyword relevance, formatting compliance, and content depth.',
            biasFlags: [],
        };
    }

    private formatScore(score: any) {
        // Extract transparency data from rawAnalysis if available
        const raw = score.rawAnalysis || {};
        return {
            id: score.id,
            resumeId: score.resumeId,
            jobRole: score.jobRole,
            overallScore: score.overallScore,
            keywordMatchPercent: score.keywordMatchPercent,
            formattingScore: score.formattingScore,
            experienceScore: score.experienceScore,
            educationScore: score.educationScore,
            matchedKeywords: score.matchedKeywords,
            missingKeywords: score.missingKeywords,
            formattingIssues: score.formattingIssues,
            suggestions: score.suggestions,
            // Transparency fields
            scoreDeductions: raw.scoreDeductions || [],
            scoreExplanation: raw.scoreExplanation || null,
            industryBenchmark: raw.industryBenchmark || null,
            transparencyNote: raw.transparencyNote || 'ATS scores vary across platforms. Our score focuses on keyword relevance, formatting compliance, and content depth.',
            biasFlags: raw.biasFlags || [],
            createdAt: score.createdAt.toISOString(),
        };
    }

    // Save extracted skills to user profile (with normalization)
    private async saveExtractedSkills(userId: string, keywords: string[]) {
        if (!keywords || keywords.length === 0) return;

        // Normalize and deduplicate before saving
        const normalizedKeywords = normalizeSkillList(keywords);

        for (const keyword of normalizedKeywords) {
            try {
                // Find or create the skill using normalized name
                let skill = await prisma.skill.findFirst({
                    where: { name: { equals: keyword, mode: 'insensitive' } },
                });

                if (!skill) {
                    skill = await prisma.skill.create({
                        data: {
                            name: keyword,
                            category: 'Extracted',
                            demandScore: 50,
                        },
                    });
                }

                // Add to user skills if not exists
                await prisma.userSkill.upsert({
                    where: {
                        userId_skillId: { userId, skillId: skill.id },
                    },
                    create: {
                        userId,
                        skillId: skill.id,
                        proficiencyLevel: 'intermediate',
                        source: 'resume',
                    },
                    update: {}, // Don't update if exists
                });
            } catch (error) {
                logger.error(`Failed to save skill ${keyword}:`, error);
            }
        }

        logger.info(`Saved ${normalizedKeywords.length} normalized skills (from ${keywords.length} raw) for user ${userId}`);
    }
}

