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
        overallStructure: string; // e.g., "Your answer covers S and A but lacks a measurable Result."
    };
    // Natural framing tip to avoid sounding scripted
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

// Evaluate a candidate's answer with enhanced metrics and improved answer
export async function evaluateAnswer(
    question: string,
    answer: string,
    targetRole: string,
    interviewType: string,
    metrics?: { wpm?: number; eyeContactScore?: number; sentiment?: string }
): Promise<EvaluationResult> {
    // Determine if this is a behavioral/HR interview needing STAR analysis
    const isBehavioral = ['BEHAVIORAL', 'HR', 'behavioral', 'hr'].includes(interviewType);

    const systemPrompt = isBehavioral
        ? `You are an expert HR interviewer evaluating behavioral responses using the STAR method.
Provide comprehensive evaluation with STAR component detection, natural framing suggestions, and metrics.
Return JSON: {
  "score": number (0-100),
  "feedback": "constructive feedback string",
  "improved_answer": "a better version using natural STAR structure, NOT scripted",
  "detailed_metrics": {
    "clarity": number (0-100),
    "relevance": number (0-100),
    "confidence": number (0-100)
  },
  "star_analysis": {
    "situation": {"present": boolean, "feedback": "what was good or what's missing about setting the scene"},
    "task": {"present": boolean, "feedback": "did they explain their specific responsibility?"},
    "action": {"present": boolean, "feedback": "did they describe concrete actions they took?"},
    "result": {"present": boolean, "feedback": "did they share a measurable outcome or impact?"},
    "overall_structure": "1-2 sentence summary of STAR adherence"
  },
  "framing_tip": "A natural way to rephrase part of the answer so it sounds conversational, not rehearsed. Example: Instead of 'In the Situation phase, I encountered...' say 'So what happened was...'"
}`
        : `You are an expert interviewer evaluating candidate responses.
Provide comprehensive evaluation with score, feedback, improved answer, and detailed metrics.
Return JSON: {
  "score": number (0-100),
  "feedback": "constructive feedback string",
  "improved_answer": "a better version of the candidate's answer demonstrating ideal response",
  "detailed_metrics": {
    "clarity": number (0-100, how clear and well-structured the answer is),
    "relevance": number (0-100, how relevant the answer is to the question),
    "confidence": number (0-100, how confident the response appears)
  }
}`;

    let metricContext = '';
    if (metrics) {
        if (metrics.wpm) metricContext += `- Speaking Pace: ${metrics.wpm} words per minute (Ideal: 120-160)\n`;
        if (metrics.eyeContactScore) metricContext += `- Eye Contact Score: ${metrics.eyeContactScore}/100\n`;
        if (metrics.sentiment) metricContext += `- Detected Sentiment: ${metrics.sentiment}\n`;
    }

    const userPrompt = isBehavioral
        ? `Evaluate this behavioral answer for a ${targetRole} ${interviewType} interview:

Question: ${question}

Candidate's Answer: "${answer}"

${metricContext ? `Delivery Metrics:\n${metricContext}` : ''}

Analyze the answer for STAR method adherence:
1. Did the candidate set the SCENE (Situation)?
2. Did they explain their RESPONSIBILITY (Task)?
3. Did they describe CONCRETE ACTIONS they took?
4. Did they share a MEASURABLE RESULT or outcome?

Also evaluate:
- Relevance and accuracy for ${targetRole}
- Communication clarity and natural tone
- Whether the answer sounds authentic or scripted

Provide a "framing_tip" that helps the candidate express the same idea more naturally and conversationally.

Return ONLY the JSON object.`
        : `Evaluate this answer for a ${targetRole} ${interviewType} interview:

Question: ${question}

Candidate's Answer: "${answer}"

${metricContext ? `Delivery Metrics:\n${metricContext}` : ''}

Evaluate based on:
1. Relevance and accuracy
2. Depth of knowledge
3. Communication clarity
4. Use of examples (if applicable)

Provide:
- A score from 0-100
- Specific, constructive feedback
- An improved "model answer" showing how the candidate could have answered better
- Detailed metrics for clarity, relevance, and confidence

Return ONLY the JSON object.`;

    // Default fallback result
    const fallbackResult: EvaluationResult = {
        score: 70,
        feedback: 'Answer recorded. Detailed evaluation requires AI configuration.',
        improvedAnswer: '',
        metrics: {
            clarity: 70,
            relevance: 70,
            confidence: 70,
            wpm: metrics?.wpm,
            sentiment: metrics?.sentiment,
        },
    };

    try {
        const client = getGroq();
        if (!client) {
            return fallbackResult;
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const cleanedText = cleanJsonResponse(text);
        const result = JSON.parse(cleanedText);

        const evaluationResult: EvaluationResult = {
            score: Math.min(100, Math.max(0, result.score || 70)),
            feedback: result.feedback || 'Good response.',
            improvedAnswer: result.improved_answer || '',
            metrics: {
                clarity: Math.min(100, Math.max(0, result.detailed_metrics?.clarity || 70)),
                relevance: Math.min(100, Math.max(0, result.detailed_metrics?.relevance || 70)),
                confidence: Math.min(100, Math.max(0, result.detailed_metrics?.confidence || 70)),
                wpm: metrics?.wpm,
                sentiment: metrics?.sentiment,
            },
        };

        // Add STAR analysis for behavioral/HR interviews
        if (isBehavioral && result.star_analysis) {
            evaluationResult.starAnalysis = {
                situation: result.star_analysis.situation || { present: false, feedback: 'Not detected' },
                task: result.star_analysis.task || { present: false, feedback: 'Not detected' },
                action: result.star_analysis.action || { present: false, feedback: 'Not detected' },
                result: result.star_analysis.result || { present: false, feedback: 'Not detected' },
                overallStructure: result.star_analysis.overall_structure || 'STAR analysis not available.',
            };
            evaluationResult.framingTip = result.framing_tip || undefined;
        }

        return evaluationResult;
    } catch (error) {
        logger.error('Failed to evaluate answer:', error);
        return {
            ...fallbackResult,
            feedback: 'Answer recorded. Please review manually.',
        };
    }
}

// Generate dynamic follow-up question based on answer
export async function generateFollowUpQuestion(
    originalQuestion: string,
    answer: string,
    targetRole: string
): Promise<{ hasFollowUp: boolean; question?: string }> {
    const systemPrompt = `You are an expert interviewer. Based on the candidate's answer to the original question, determine if a follow-up question is necessary to probe deeper, clarify vague points, or challenge their assumptions.
Return JSON: {"hasFollowUp": boolean, "question": "the follow-up question string (or empty if none)"}`;

    const userPrompt = `Role: ${targetRole}
Original Question: "${originalQuestion}"
Candidate Answer: "${answer}"

Does this answer warrant a follow-up question? If it's too brief, vague, or mentions something interesting that needs elaboration, generate a single, highly specific follow-up question.
If the answer is comprehensive and solid, set hasFollowUp to false.

Return ONLY the JSON.`;

    try {
        const client = getGroq();
        if (!client) {
            return { hasFollowUp: false };
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
        const cleanedText = cleanJsonResponse(text);
        const result = JSON.parse(cleanedText);

        return {
            hasFollowUp: !!result.hasFollowUp && !!result.question,
            question: result.question || undefined,
        };
    } catch (error) {
        logger.error('Failed to generate follow-up question:', error);
        return { hasFollowUp: false };
    }
}

// Generate overall interview feedback
export async function generateFeedback(
    targetRole: string,
    interviewType: string,
    questions: Array<{ questionText: string; userAnswer: string | null; score: number | null }>,
    overallScore: number
): Promise<string> {
    const systemPrompt = `You are a career coach providing interview feedback.
Be constructive, specific, and encouraging while noting areas for improvement.`;

    const questionsContext = questions
        .filter(q => q.userAnswer)
        .map((q, i) => `Q${i + 1}: ${q.questionText}\nAnswer: ${q.userAnswer}\nScore: ${q.score}/100`)
        .join('\n\n');

    const userPrompt = `Provide overall feedback for this ${interviewType} interview for ${targetRole}:

${questionsContext}

Overall Score: ${overallScore}/100

Provide:
1. Summary of performance (2-3 sentences)
2. Key strengths (2-3 points)
3. Areas for improvement (2-3 points)
4. Specific recommendations for next steps

Be encouraging but honest.`;

    try {
        const client = getGroq();
        if (!client) {
            return getBasicFeedback(overallScore);
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 800,
        });

        return response.choices[0]?.message?.content || getBasicFeedback(overallScore);
    } catch (error) {
        logger.error('Failed to generate feedback:', error);
        return getBasicFeedback(overallScore);
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

// Analyze sentiment from answer text
export async function analyzeSentiment(
    answerText: string
): Promise<{ sentiment: 'positive' | 'neutral' | 'negative' | 'confident'; confidence: number; feedback: string }> {
    const systemPrompt = `Analyze the sentiment and confidence level of interview answers.
Return JSON: {"sentiment": "positive|neutral|negative|confident", "confidence": 0-100, "feedback": "brief observation"}`;

    const userPrompt = `Analyze the sentiment and confidence in this interview answer:

"${answerText}"

Consider:
- Tone and language used
- Confidence level in statements
- Positive vs negative framing
- Professional communication style

Return ONLY the JSON.`;

    try {
        const client = getGroq();
        if (!client) {
            return { sentiment: 'neutral', confidence: 70, feedback: 'Analysis requires AI configuration.' };
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 200,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(text);

        return {
            sentiment: result.sentiment || 'neutral',
            confidence: Math.min(100, Math.max(0, result.confidence || 70)),
            feedback: result.feedback || 'Response recorded.',
        };
    } catch (error) {
        logger.error('Failed to analyze sentiment:', error);
        return { sentiment: 'neutral', confidence: 70, feedback: 'Analysis unavailable.' };
    }
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
