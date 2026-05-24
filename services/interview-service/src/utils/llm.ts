import Groq from 'groq-sdk';
import { logger } from './logger';

// Configurable AI model - switch between high quality and fast/free models
const AI_MODEL_NAME = process.env.AI_MODEL_NAME || 'llama-3.3-70b-versatile';

// Initialize Groq lazily to ensure env is loaded first
let groq: Groq | null = null;
let initialized = false;

// Clean JSON response from LLM (handles markdown code blocks and whitespace)
function cleanJsonResponse(text: string): string {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleaned = cleaned.trim();
    return cleaned;
}

// Enhanced evaluation result with metrics and improved answer
export interface EvaluationResult {
    score: number;
    feedback: string;
    improvedAnswer: string;
    // Bundled from the evaluation call — no separate API round-trip needed
    followUpQuestion: string | null;
    isFallback?: boolean;
    metrics: {
        clarity: number;
        relevance: number;
        confidence: number;
        wpm?: number;
        sentiment?: string;
    };
    // STAR Method Analysis (for behavioral/HR interviews)
    starAnalysis?: {
        situation: { present: boolean; feedback: string };
        task: { present: boolean; feedback: string };
        action: { present: boolean; feedback: string };
        result: { present: boolean; feedback: string };
        overallStructure: string;
    };
    framingTip?: string;
}

function getGroq(): Groq | null {
    if (!initialized) {
        const apiKey = process.env.GROQ_API_KEY;
        if (apiKey) {
            groq = new Groq({ apiKey });
            logger.info('Groq API initialized for interview evaluation');
        } else {
            logger.warn('GROQ_API_KEY not found - interview evaluation will use fallback');
        }
        initialized = true;
    }
    return groq;
}

interface GeneratedQuestion {
    question: string;
    type: string;
}

// Generate interview questions based on role and type
export async function generateQuestions(
    interviewType: string,
    targetRole: string,
    difficulty: string,
    count: number
): Promise<GeneratedQuestion[]> {
    const systemPrompt = `You are an expert technical interviewer. Generate interview questions for candidates.
Return a JSON array of questions in this format:
[{"question": "...", "type": "technical|behavioral|situational"}]`;

    const userPrompt = `Generate ${count} ${difficulty.toLowerCase()} ${interviewType.toLowerCase()} interview questions for a ${targetRole} position.

Requirements:
- Questions should be appropriate for the ${difficulty} difficulty level
- Mix of theoretical and practical questions
- Clear and concise questions
- For TECHNICAL: focus on skills, coding concepts, problem-solving
- For BEHAVIORAL: use STAR method scenarios
- For HR: focus on motivation, teamwork, career goals

Return ONLY the JSON array, no other text.`;

    try {
        const client = getGroq();
        if (!client) {
            logger.warn('Groq not configured, using fallback questions');
            return getFallbackQuestions(interviewType, targetRole, count);
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 2048,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '[]';
        const parsed = JSON.parse(text);
        const questions = parsed.questions || parsed;

        logger.info(`Generated ${questions.length} questions for ${targetRole}`);
        return Array.isArray(questions) ? questions : getFallbackQuestions(interviewType, targetRole, count);
    } catch (error) {
        logger.error('Failed to generate questions:', error);
        return getFallbackQuestions(interviewType, targetRole, count);
    }
}

// Hint provided by the service layer from Tier-1 NLP scoring
interface EvaluationHint {
    quickScore?: number;        // NLP pre-score (0-100) — helps calibrate LLM score
    missingKeywords?: string[]; // Concepts absent in the answer — LLM focuses feedback here
    idealAnswer?: string;       // Bank ideal answer — LLM uses as reference, avoids generating from scratch
}

// Evaluate a candidate's answer — prompts are compressed and follow-up is bundled
// into one API call instead of two.
export async function evaluateAnswer(
    question: string,
    answer: string,
    targetRole: string,
    interviewType: string,
    metrics?: { wpm?: number; eyeContactScore?: number; sentiment?: string },
    hint?: EvaluationHint
): Promise<EvaluationResult> {
    const isBehavioral = ['BEHAVIORAL', 'HR', 'behavioral', 'hr'].includes(interviewType);

    // Compressed system prompts: ~130 tokens (behavioral) / ~100 tokens (technical)
    // vs. prior ~300 tokens each. follow_up_question and star_missing are bundled here.
    const systemPrompt = isBehavioral
        ? `You are an expert HR interviewer. Evaluate STAR method adherence. Return JSON only:
{"score":0-100,"feedback":"2-3 sentences on quality and STAR adherence","improved_answer":"1 natural STAR paragraph","follow_up_question":"one probing question OR null if answer is thorough","star_missing":["situation","task","action","result"],"framing_tip":"natural conversational rephrase tip"}`
        : `You are an expert technical interviewer. Return JSON only:
{"score":0-100,"feedback":"2-3 sentences on accuracy depth clarity","improved_answer":"model answer paragraph","follow_up_question":"one probing follow-up OR null if answer is thorough"}`;

    // Compact delivery context
    const metricParts: string[] = [];
    if (metrics?.wpm) metricParts.push(`WPM: ${metrics.wpm} (ideal 120-160)`);
    if (metrics?.eyeContactScore) metricParts.push(`Eye contact: ${metrics.eyeContactScore}/100`);
    if (metrics?.sentiment) metricParts.push(`Tone: ${metrics.sentiment}`);

    // Hint lines help the LLM focus without re-discovering what the NLP already found
    const hintParts: string[] = [];
    if (hint?.quickScore !== undefined) hintParts.push(`NLP pre-score: ${hint.quickScore}/100`);
    if (hint?.missingKeywords?.length) hintParts.push(`Missing concepts: ${hint.missingKeywords.join(', ')}`);
    if (hint?.idealAnswer) hintParts.push(`Reference: "${hint.idealAnswer.substring(0, 250)}"`);

    const userPrompt = [
        `Role: ${targetRole} | Type: ${interviewType}`,
        `Q: "${question}"`,
        `A: "${answer}"`,
        metricParts.length ? `Delivery: ${metricParts.join('. ')}` : '',
        ...hintParts,
    ].filter(Boolean).join('\n');

    const fallbackResult: EvaluationResult = {
        score: 0,
        feedback: 'AI evaluation is temporarily unavailable. Your answer has been recorded for manual review.',
        improvedAnswer: hint?.idealAnswer || '',
        followUpQuestion: null,
        isFallback: true,
        metrics: {
            clarity: 0,
            relevance: 0,
            confidence: 0,
            wpm: metrics?.wpm,
            sentiment: metrics?.sentiment,
        },
    };

    try {
        const client = getGroq();
        if (!client) return fallbackResult;

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            // Reduced from 1500 → 700/500. Compact JSON schema + reference answer eliminates
            // the need for the LLM to generate verbose output from scratch.
            max_tokens: isBehavioral ? 700 : 500,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(cleanJsonResponse(text));

        const baseScore = hint?.quickScore !== undefined
            ? Math.round((result.score + hint.quickScore) / 2)  // blend NLP + LLM for accuracy
            : result.score;

        const evaluationResult: EvaluationResult = {
            score: Math.min(100, Math.max(0, baseScore || 70)),
            feedback: result.feedback || 'Good response.',
            improvedAnswer: result.improved_answer || hint?.idealAnswer || '',
            followUpQuestion: result.follow_up_question || null,
            metrics: {
                clarity: Math.min(100, Math.max(0, hint?.quickScore ?? 70)),
                relevance: Math.min(100, Math.max(0, result.score || 70)),
                confidence: Math.min(100, Math.max(0, 70)),
                wpm: metrics?.wpm,
                sentiment: metrics?.sentiment,
            },
        };

        if (isBehavioral) {
            // star_missing is a compact array — reconstruct the full starAnalysis object
            // so the frontend interface stays unchanged.
            const starMissing: string[] = Array.isArray(result.star_missing) ? result.star_missing : [];
            const componentFeedback = (
                component: string,
                presentMsg: string,
                missingMsg: string
            ) => ({
                present: !starMissing.includes(component),
                feedback: starMissing.includes(component) ? missingMsg : presentMsg,
            });
            evaluationResult.starAnalysis = {
                situation: componentFeedback('situation', 'Good context-setting.', 'Set the scene — briefly describe the situation.'),
                task: componentFeedback('task', 'Clear ownership stated.', 'Clarify your specific responsibility in that situation.'),
                action: componentFeedback('action', 'Concrete actions described.', 'Describe the concrete steps you personally took.'),
                result: componentFeedback('result', 'Impact communicated.', 'Share a measurable outcome or what you learned.'),
                overallStructure: starMissing.length === 0
                    ? 'Strong STAR structure.'
                    : `Missing components: ${starMissing.join(', ')}.`,
            };
            evaluationResult.framingTip = result.framing_tip || undefined;
        }

        return evaluationResult;
    } catch (error) {
        logger.error('Failed to evaluate answer:', error);
        return { ...fallbackResult, isFallback: true };
    }
}

// Generate overall interview feedback from a compressed session summary.
// Accepts scores[] + keyGaps[] accumulated during the interview instead of
// re-sending all Q&A text — saves ~600 tokens on the final call.
export async function generateFeedback(
    targetRole: string,
    interviewType: string,
    summary: { scores: number[]; keyGaps: string[]; overallScore: number }
): Promise<string> {
    const systemPrompt = `Career coach providing interview feedback. Be specific, encouraging, and actionable.`;

    const userPrompt = `Interview: ${targetRole} | ${interviewType}
Scores: [${summary.scores.join(', ')}] | Overall: ${summary.overallScore}/100
Key gaps: ${summary.keyGaps.length > 0 ? summary.keyGaps.join(', ') : 'none identified'}
Provide: 1-2 sentence performance summary, 2 specific strengths, 2 improvement areas with concrete tips, 1 next step.`;

    try {
        const client = getGroq();
        if (!client) return getBasicFeedback(summary.overallScore);

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 450,
        });

        return response.choices[0]?.message?.content || getBasicFeedback(summary.overallScore);
    } catch (error) {
        logger.error('Failed to generate feedback:', error);
        return getBasicFeedback(summary.overallScore);
    }
}

// Generate AI hint/tip for a specific interview question
export async function generateQuestionHint(
    questionText: string,
    targetRole: string,
    interviewType: string
): Promise<{ hint: string; keyPoints: string[] }> {
    const systemPrompt = `You are an expert interview coach helping candidates prepare for interviews.
Provide helpful hints and key points to address for interview questions.
Return JSON: {"hint": "brief strategic tip", "keyPoints": ["point1", "point2", "point3"]}`;

    const userPrompt = `Provide a helpful hint for answering this ${interviewType} interview question for a ${targetRole} position:

Question: "${questionText}"

Requirements:
- Give a brief, actionable hint (1-2 sentences) on how to approach this question
- List 3 key points the candidate should address
- Be encouraging but specific
- For behavioral questions, mention STAR method if appropriate
- For technical questions, suggest structuring the answer logically

Return ONLY the JSON, no other text.`;

    try {
        const client = getGroq();
        if (!client) {
            return getFallbackHint(interviewType);
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 300,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(text);

        return {
            hint: result.hint || 'Focus on providing specific examples and clear explanations.',
            keyPoints: result.keyPoints || ['Be specific', 'Use examples', 'Stay structured'],
        };
    } catch (error) {
        logger.error('Failed to generate question hint:', error);
        return getFallbackHint(interviewType);
    }
}

// Pure-JS sentiment analysis — no LLM call, no API cost.
// Replaces the previous Groq-based analyzeSentiment (200-400 tokens saved per call).
export function analyzeSentiment(
    answerText: string
): { sentiment: 'positive' | 'neutral' | 'negative' | 'confident'; confidence: number; feedback: string } {
    const words = answerText.toLowerCase().split(/\s+/);

    const positiveWords = ['excellent', 'great', 'successful', 'achieved', 'improved', 'led', 'managed', 'solved', 'created', 'built', 'delivered', 'strong', 'effective', 'innovative', 'accomplished'];
    const negativeWords = ['failed', 'difficult', 'struggled', 'problem', 'mistake', 'error', 'issue', 'bad', 'wrong', 'unclear', 'unsure', 'confused', 'unable'];
    const confidentWords = ['definitely', 'certainly', 'absolutely', 'confident', 'proven', 'demonstrated', 'expert', 'proficient', 'skilled', 'experienced', 'consistently'];

    let posCount = 0, negCount = 0, confCount = 0;
    for (const word of words) {
        if (positiveWords.some(pw => word.includes(pw))) posCount++;
        if (negativeWords.some(nw => word.includes(nw))) negCount++;
        if (confidentWords.some(cw => word.includes(cw))) confCount++;
    }

    let sentiment: 'positive' | 'neutral' | 'negative' | 'confident';
    let feedback: string;

    if (confCount >= 2) {
        sentiment = 'confident';
        feedback = 'Answer projects strong confidence and expertise.';
    } else if (posCount > negCount + 1) {
        sentiment = 'positive';
        feedback = 'Answer has a positive, constructive tone.';
    } else if (negCount > posCount) {
        sentiment = 'negative';
        feedback = 'Consider framing challenges as learning opportunities.';
    } else {
        sentiment = 'neutral';
        feedback = 'Answer is measured and professional.';
    }

    const confidence = Math.min(95, Math.max(30, 65 + (posCount + confCount - negCount) * 5));
    return { sentiment, confidence, feedback };
}

// Fallback hint when LLM is not available
function getFallbackHint(interviewType: string): { hint: string; keyPoints: string[] } {
    if (interviewType === 'BEHAVIORAL') {
        return {
            hint: 'Use the STAR method: Situation, Task, Action, Result. Focus on specific examples.',
            keyPoints: ['Describe a specific situation', 'Explain your actions clearly', 'Highlight the positive outcome'],
        };
    } else if (interviewType === 'TECHNICAL') {
        return {
            hint: 'Structure your answer logically. Start with concepts, then provide examples or implementation details.',
            keyPoints: ['Explain the concept clearly', 'Mention trade-offs or alternatives', 'Give a practical example if possible'],
        };
    }
    return {
        hint: 'Be specific and provide concrete examples from your experience.',
        keyPoints: ['Stay focused on the question', 'Use specific examples', 'Be concise but thorough'],
    };
}

// Fallback questions when LLM is not available
function getFallbackQuestions(interviewType: string, targetRole: string, count: number): GeneratedQuestion[] {
    const technicalQuestions = [
        { question: `What are the key skills needed for a ${targetRole}?`, type: 'technical' },
        { question: 'Describe a challenging technical problem you solved.', type: 'technical' },
        { question: 'How do you stay updated with industry trends?', type: 'technical' },
        { question: 'Explain your approach to debugging complex issues.', type: 'technical' },
        { question: 'What development tools and methodologies do you prefer?', type: 'technical' },
        { question: 'How do you ensure code quality in your projects?', type: 'technical' },
        { question: 'Describe your experience with version control systems.', type: 'technical' },
        { question: 'How do you handle technical disagreements in a team?', type: 'technical' },
        { question: 'What is your approach to learning new technologies?', type: 'technical' },
        { question: 'Describe a project you are most proud of.', type: 'technical' },
    ];

    const behavioralQuestions = [
        { question: 'Tell me about a time you faced a difficult deadline.', type: 'behavioral' },
        { question: 'Describe a situation where you had to work with a difficult team member.', type: 'behavioral' },
        { question: 'Give an example of when you showed leadership.', type: 'behavioral' },
        { question: 'Tell me about a time you failed and what you learned.', type: 'behavioral' },
        { question: 'Describe a situation where you had to adapt to change.', type: 'behavioral' },
        { question: 'How do you prioritize when you have multiple tasks?', type: 'behavioral' },
        { question: 'Tell me about a time you received constructive criticism.', type: 'behavioral' },
        { question: 'Describe a situation where you went above and beyond.', type: 'behavioral' },
    ];

    const hrQuestions = [
        { question: 'Why are you interested in this role?', type: 'hr' },
        { question: 'Where do you see yourself in 5 years?', type: 'hr' },
        { question: 'What are your salary expectations?', type: 'hr' },
        { question: 'Why are you leaving your current position?', type: 'hr' },
        { question: 'What motivates you at work?', type: 'hr' },
        { question: 'How do you handle work-life balance?', type: 'hr' },
        { question: 'What are your greatest strengths and weaknesses?', type: 'hr' },
        { question: 'Why should we hire you?', type: 'hr' },
    ];

    let questions: GeneratedQuestion[];
    switch (interviewType) {
        case 'TECHNICAL':
            questions = technicalQuestions;
            break;
        case 'BEHAVIORAL':
            questions = behavioralQuestions;
            break;
        case 'HR':
            questions = hrQuestions;
            break;
        default:
            questions = [...technicalQuestions.slice(0, 3), ...behavioralQuestions.slice(0, 2), ...hrQuestions.slice(0, 2)];
    }

    return questions.slice(0, count);
}

// ============================================
// PHASE 4: Code Evaluation (Technical Simulations)
// ============================================

export interface CodeEvaluationResult {
    score: number;            // 0-100
    feedback: string;         // Human-readable overall feedback
    timeComplexity: string;   // e.g. "O(n log n)"
    spaceComplexity: string;  // e.g. "O(n)"
    improvements: string[];   // Actionable suggestions
    codeQuality: {
        readability: number;  // 0-100
        efficiency: number;   // 0-100
        correctness: number;  // 0-100
    };
    alternativeApproach?: string; // Brief description of a better approach if one exists
}

/**
 * Use the LLM to qualitatively evaluate a code submission.
 * testResults contains the automated pass/fail output from Piston.
 */
export async function evaluateCode(
    problem: string,
    language: string,
    code: string,
    testResults: { passed: number; total: number; error?: string }
): Promise<CodeEvaluationResult> {
    const passRate = testResults.total > 0 ? (testResults.passed / testResults.total) * 100 : 0;

    const systemPrompt = `You are an expert software engineer evaluating a coding challenge submission.
Analyze the code for correctness, time/space complexity, readability, and efficiency.
Return JSON only:
{
  "score": number (0-100, weight: 60% test pass rate + 40% code quality),
  "feedback": "2-3 sentence overall assessment",
  "time_complexity": "Big-O notation e.g. O(n log n)",
  "space_complexity": "Big-O notation e.g. O(n)",
  "improvements": ["actionable suggestion 1", "actionable suggestion 2"],
  "code_quality": {
    "readability": number (0-100),
    "efficiency": number (0-100),
    "correctness": number (0-100)
  },
  "alternative_approach": "Optional: brief description of a more optimal approach if the submitted solution is suboptimal"
}`;

    const userPrompt = `Problem Statement:
${problem}

Language: ${language}

Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Automated Test Results: ${testResults.passed}/${testResults.total} test cases passed (${passRate.toFixed(0)}%)
${testResults.error ? `Execution Error: ${testResults.error}` : ''}

Evaluate the solution and return ONLY the JSON object.`;

    const fallback: CodeEvaluationResult = {
        score: Math.round(passRate * 0.6 + 40 * 0.4),
        feedback: `Your solution passed ${testResults.passed} out of ${testResults.total} test cases.`,
        timeComplexity: 'Unknown',
        spaceComplexity: 'Unknown',
        improvements: ['Review edge cases', 'Consider time complexity'],
        codeQuality: { readability: 70, efficiency: 60, correctness: Math.round(passRate) },
    };

    try {
        const client = getGroq();
        if (!client) return fallback;

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(cleanJsonResponse(text));

        return {
            score: Math.min(100, Math.max(0, result.score ?? fallback.score)),
            feedback: result.feedback || fallback.feedback,
            timeComplexity: result.time_complexity || 'Unknown',
            spaceComplexity: result.space_complexity || 'Unknown',
            improvements: Array.isArray(result.improvements) ? result.improvements : fallback.improvements,
            codeQuality: {
                readability: Math.min(100, Math.max(0, result.code_quality?.readability ?? 70)),
                efficiency: Math.min(100, Math.max(0, result.code_quality?.efficiency ?? 60)),
                correctness: Math.min(100, Math.max(0, result.code_quality?.correctness ?? Math.round(passRate))),
            },
            alternativeApproach: result.alternative_approach || undefined,
        };
    } catch (error) {
        logger.error('Failed to evaluate code:', error);
        return fallback;
    }
}

// Generate real-time copilot suggestions from a transcript segment
export async function generateCopilotSuggestionsFromTranscript(transcriptText: string): Promise<string[]> {
    const systemPrompt = `You are an expert AI Interview Copilot assisting a human recruiter during a live interview.
Based on the transcript segment, provide 1-2 suggested follow-up questions to probe deeper or verify a technical claim.
Keep them concise. Return JSON: {"suggestions": ["question1", "question2"]}`;

    const userPrompt = `Transcript segment:\n"${transcriptText.substring(0, 2000)}"`;

    try {
        const client = getGroq();
        if (!client) {
            return [];
        }

        const response = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant', // Fast model for real-time suggestions
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 200,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(cleanJsonResponse(text));
        const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
        return suggestions.filter((s: string) => s && s.length > 5);
    } catch (error) {
        logger.error('Failed to generate copilot suggestions:', error);
        return [];
    }
}

function getBasicFeedback(score: number): string {
    if (score >= 80) {
        return `Excellent performance! You demonstrated strong knowledge and communication skills. Continue practicing to maintain this level. Focus on polishing specific technical areas for even better results.`;
    } else if (score >= 60) {
        return `Good performance overall. You showed solid foundational knowledge. Areas to improve: provide more specific examples and deepen technical explanations. Keep practicing and reviewing core concepts.`;
    } else {
        return `There's room for improvement. Focus on: 1) Reviewing fundamental concepts, 2) Practicing structured answers (STAR method), 3) Building more project experience. Consider mock interviews to build confidence.`;
    }
}

// Generate an automated summary of a live interview based on its transcript
export async function generateInterviewSummary(
    transcriptChunks: string[],
    targetRole?: string
): Promise<string> {
    const systemPrompt = `You are an expert technical recruiter summarizing an interview.
Provide a concise, professional executive summary of the interview based on the raw transcript.
Focus on the candidate's communication skills, technical confidence, and overall performance.
Keep the summary to 3-5 sentences. Do not use conversational filler.`;

    const transcriptText = transcriptChunks.join('\n\n').substring(0, 8000); // cap to avoid token limits

    const userPrompt = `Target Role: ${targetRole || 'Unknown'}
Transcript:
"""
${transcriptText}
"""

Provide the executive summary.`;

    try {
        const client = getGroq();
        if (!client) {
            return 'Summary generation unavailable (AI not configured).';
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 300,
        });

        return response.choices[0]?.message?.content || 'Unable to generate summary.';
    } catch (error) {
        logger.error('Failed to generate interview summary:', error);
        return 'An error occurred while generating the summary.';
    }
}
