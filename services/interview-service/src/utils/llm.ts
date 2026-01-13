import Groq from 'groq-sdk';
import { logger } from './logger';

// Initialize Groq lazily to ensure env is loaded first
let groq: Groq | null = null;
let initialized = false;

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
            model: 'llama-3.1-70b-versatile',
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

// Evaluate a candidate's answer
export async function evaluateAnswer(
    question: string,
    answer: string,
    targetRole: string,
    interviewType: string
): Promise<{ score: number; feedback: string }> {
    const systemPrompt = `You are an expert interviewer evaluating candidate responses.
Score from 0-100 and provide constructive feedback.
Return JSON: {"score": number, "feedback": "string"}`;

    const userPrompt = `Evaluate this answer for a ${targetRole} ${interviewType} interview:

Question: ${question}

Candidate's Answer: ${answer}

Evaluate based on:
1. Relevance and accuracy
2. Depth of knowledge
3. Communication clarity
4. Use of examples (if applicable)

Return JSON with score (0-100) and specific, constructive feedback.`;

    try {
        const client = getGroq();
        if (!client) {
            return { score: 70, feedback: 'Answer recorded. Detailed evaluation requires AI configuration.' };
        }

        const response = await client.chat.completions.create({
            model: 'llama-3.1-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 500,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(text);

        return {
            score: Math.min(100, Math.max(0, result.score || 70)),
            feedback: result.feedback || 'Good response.',
        };
    } catch (error) {
        logger.error('Failed to evaluate answer:', error);
        return { score: 70, feedback: 'Answer recorded. Please review manually.' };
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
            model: 'llama-3.1-70b-versatile',
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

function getBasicFeedback(score: number): string {
    if (score >= 80) {
        return `Excellent performance! You demonstrated strong knowledge and communication skills. Continue practicing to maintain this level. Focus on polishing specific technical areas for even better results.`;
    } else if (score >= 60) {
        return `Good performance overall. You showed solid foundational knowledge. Areas to improve: provide more specific examples and deepen technical explanations. Keep practicing and reviewing core concepts.`;
    } else {
        return `There's room for improvement. Focus on: 1) Reviewing fundamental concepts, 2) Practicing structured answers (STAR method), 3) Building more project experience. Consider mock interviews to build confidence.`;
    }
}
