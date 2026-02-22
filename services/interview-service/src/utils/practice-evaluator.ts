import { logger } from './logger';

/**
 * Practice Interview Evaluator - Zero LLM Cost
 * 
 * Evaluates user answers against ideal answers from the question bank
 * using keyword matching, phrase overlap, and heuristic scoring.
 * No LLM calls are made — this is designed for free-tier practice interviews.
 */

interface PracticeEvaluationResult {
    score: number;
    feedback: string;
    keywordsMatched: string[];
    keywordsMissed: string[];
    metrics: {
        clarity: number;
        relevance: number;
        completeness: number;
        wordCount: number;
    };
}

/**
 * Tokenize text: lowercase, remove punctuation, split by whitespace
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2); // ignore very short words
}

/**
 * Extract key phrases (2-3 word n-grams) from text
 */
function extractPhrases(text: string): string[] {
    const words = tokenize(text);
    const phrases: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
        phrases.push(`${words[i]} ${words[i + 1]}`);
        if (i < words.length - 2) {
            phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
        }
    }
    return phrases;
}

/**
 * Common stop words to ignore in keyword analysis
 */
const STOP_WORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'them',
    'than', 'its', 'over', 'such', 'that', 'this', 'with', 'will', 'each',
    'from', 'they', 'been', 'said', 'what', 'when', 'where', 'which', 'their',
    'would', 'there', 'about', 'could', 'other', 'into', 'more', 'also',
    'should', 'very', 'just', 'being', 'those', 'still', 'these', 'most',
    'because', 'does', 'like', 'well', 'make', 'made', 'know', 'many',
    'answer', 'question', 'example', 'use', 'using', 'used',
]);

/**
 * Extract significant keywords from the ideal answer
 */
function extractKeywords(text: string): string[] {
    const words = tokenize(text);
    const wordFreq = new Map<string, number>();

    for (const word of words) {
        if (!STOP_WORDS.has(word)) {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
    }

    // Sort by frequency, take top keywords
    return Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);
}

/**
 * Calculate Jaccard similarity between two sets of words
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Evaluate a practice answer against the ideal answer
 * Returns a score and feedback without any LLM calls
 */
export function evaluatePracticeAnswer(
    questionText: string,
    userAnswer: string,
    idealAnswer: string,
    questionType: string
): PracticeEvaluationResult {
    try {
        const userTokens = new Set(tokenize(userAnswer));
        const idealTokens = new Set(tokenize(idealAnswer));
        const userPhrases = new Set(extractPhrases(userAnswer));
        const idealPhrases = new Set(extractPhrases(idealAnswer));

        // Extract key concepts from ideal answer
        const idealKeywords = extractKeywords(idealAnswer);
        const matchedKeywords = idealKeywords.filter(kw => userTokens.has(kw));
        const missedKeywords = idealKeywords.filter(kw => !userTokens.has(kw));

        // Score Components (each 0-100)

        // 1. Word Overlap Score (Jaccard similarity * 100)
        const wordOverlap = jaccardSimilarity(userTokens, idealTokens) * 100;

        // 2. Keyword Coverage Score
        const keywordCoverage = idealKeywords.length > 0
            ? (matchedKeywords.length / idealKeywords.length) * 100
            : 50;

        // 3. Phrase Overlap Score (checks for multi-word concept matches)
        const phraseOverlap = jaccardSimilarity(userPhrases, idealPhrases) * 100;

        // 4. Length Adequacy Score
        const idealLength = idealTokens.size;
        const userLength = userTokens.size;
        const lengthRatio = idealLength > 0 ? userLength / idealLength : 0;
        // Penalize too short (< 30% of ideal) or too long (> 200% of ideal)
        let lengthScore: number;
        if (lengthRatio < 0.3) {
            lengthScore = lengthRatio * 100; // Very short
        } else if (lengthRatio > 2.0) {
            lengthScore = Math.max(40, 100 - (lengthRatio - 2) * 30); // Diminishing returns
        } else if (lengthRatio >= 0.5 && lengthRatio <= 1.5) {
            lengthScore = 100; // Sweet spot
        } else {
            lengthScore = 70 + (1 - Math.abs(1 - lengthRatio)) * 30; // Good range
        }

        // 5. Structure Score (checks for sentence count, paragraphing)
        const sentenceCount = userAnswer.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
        const structureScore = Math.min(100, sentenceCount * 20); // At least 5 sentences = 100

        // Weighted composite score
        const compositeScore = Math.round(
            wordOverlap * 0.2 +
            keywordCoverage * 0.35 +
            phraseOverlap * 0.15 +
            lengthScore * 0.15 +
            structureScore * 0.15
        );

        // Clamp to 0-100
        const finalScore = Math.min(100, Math.max(0, compositeScore));

        // Generate feedback
        const feedback = generatePracticeFeedback(
            finalScore,
            matchedKeywords,
            missedKeywords,
            userLength,
            idealLength,
            sentenceCount,
            questionType
        );

        // Metrics breakdown
        const clarity = Math.round(structureScore * 0.6 + lengthScore * 0.4);
        const relevance = Math.round(keywordCoverage * 0.7 + wordOverlap * 0.3);
        const completeness = Math.round(keywordCoverage * 0.5 + lengthScore * 0.3 + phraseOverlap * 0.2);

        return {
            score: finalScore,
            feedback,
            keywordsMatched: matchedKeywords.slice(0, 10),
            keywordsMissed: missedKeywords.slice(0, 10),
            metrics: {
                clarity: Math.min(100, Math.max(0, clarity)),
                relevance: Math.min(100, Math.max(0, relevance)),
                completeness: Math.min(100, Math.max(0, completeness)),
                wordCount: userAnswer.split(/\s+/).length,
            },
        };
    } catch (error) {
        logger.error('Practice evaluation error:', error);
        return {
            score: 50,
            feedback: 'Your answer has been recorded. Review the ideal answer to improve.',
            keywordsMatched: [],
            keywordsMissed: [],
            metrics: {
                clarity: 50,
                relevance: 50,
                completeness: 50,
                wordCount: userAnswer.split(/\s+/).length,
            },
        };
    }
}

/**
 * Generate human-readable feedback based on evaluation metrics
 */
function generatePracticeFeedback(
    score: number,
    matchedKeywords: string[],
    missedKeywords: string[],
    userLength: number,
    idealLength: number,
    sentenceCount: number,
    questionType: string
): string {
    const parts: string[] = [];

    // Overall performance
    if (score >= 80) {
        parts.push('Excellent answer! You covered most of the key concepts well.');
    } else if (score >= 60) {
        parts.push('Good answer with room for improvement. You touched on several important points.');
    } else if (score >= 40) {
        parts.push('Your answer covers some basics but misses several key concepts.');
    } else {
        parts.push('Your answer needs significant improvement. Review the ideal answer carefully.');
    }

    // Keyword feedback
    if (matchedKeywords.length > 0) {
        parts.push(`You correctly mentioned: ${matchedKeywords.slice(0, 5).join(', ')}.`);
    }

    if (missedKeywords.length > 0 && score < 80) {
        parts.push(`Consider including these key concepts: ${missedKeywords.slice(0, 5).join(', ')}.`);
    }

    // Length feedback
    if (userLength < idealLength * 0.3) {
        parts.push('Your answer is quite brief. Try to elaborate more with examples and explanations.');
    } else if (userLength > idealLength * 2) {
        parts.push('Your answer is very detailed. Consider being more concise while keeping key points.');
    }

    // Structure feedback
    if (sentenceCount < 3) {
        parts.push('Try structuring your answer with more distinct points or sentences.');
    }

    // Type-specific tips
    if (questionType === 'BEHAVIORAL' || questionType === 'HR') {
        if (score < 70) {
            parts.push('Tip: Use the STAR method (Situation, Task, Action, Result) to structure behavioral answers.');
        }
    } else if (questionType === 'TECHNICAL') {
        if (score < 70) {
            parts.push('Tip: Include specific technical terms, trade-offs, and practical examples to strengthen your answer.');
        }
    }

    return parts.join(' ');
}

/**
 * Generate basic overall feedback for the practice session
 * No LLM call — purely algorithmic
 */
export function generatePracticeFeedbackSummary(
    targetRole: string,
    interviewType: string,
    questions: Array<{
        questionText: string;
        userAnswer: string | null;
        score: number | null;
        questionType: string;
    }>,
    overallScore: number
): string {
    const answered = questions.filter(q => q.userAnswer);
    const unanswered = questions.length - answered.length;
    const highScoreCount = answered.filter(q => (q.score || 0) >= 80).length;
    const lowScoreCount = answered.filter(q => (q.score || 0) < 40).length;

    const parts: string[] = [];

    // Overall summary
    parts.push(`## Practice Interview Summary\n`);
    parts.push(`**Role:** ${targetRole} | **Type:** ${interviewType} | **Score:** ${overallScore}/100\n`);

    if (overallScore >= 80) {
        parts.push(`### 🎉 Excellent Performance!\nYou demonstrated strong knowledge across the ${interviewType.toLowerCase()} questions. Your answers covered key concepts well.\n`);
    } else if (overallScore >= 60) {
        parts.push(`### 👍 Good Performance\nYou showed solid foundational knowledge. There are some areas where deeper explanations could improve your score.\n`);
    } else if (overallScore >= 40) {
        parts.push(`### 📝 Room for Improvement\nYou covered some basics but missed several key concepts. Review the ideal answers to understand what was expected.\n`);
    } else {
        parts.push(`### 💪 Keep Practicing\nThis is a good start! Focus on reviewing the ideal answers and practice articulating concepts more clearly.\n`);
    }

    // Stats
    parts.push(`### Key Stats\n`);
    parts.push(`- **Questions answered:** ${answered.length}/${questions.length}`);
    parts.push(`- **High-scoring answers (80+):** ${highScoreCount}`);
    if (lowScoreCount > 0) {
        parts.push(`- **Answers needing improvement (<40):** ${lowScoreCount}`);
    }
    if (unanswered > 0) {
        parts.push(`- **Unanswered questions:** ${unanswered}`);
    }
    parts.push('');

    // Recommendations
    parts.push(`### Recommendations\n`);
    if (overallScore < 60) {
        parts.push(`1. Review all ideal answers to understand expected depth`);
        parts.push(`2. Practice explaining concepts using specific examples`);
        parts.push(`3. Work on covering all key terms and concepts`);
    } else if (overallScore < 80) {
        parts.push(`1. Focus on the questions where you scored below 60`);
        parts.push(`2. Include more technical details and real-world examples`);
        parts.push(`3. Practice structuring your answers clearly`);
    } else {
        parts.push(`1. Great job! Try harder difficulty to challenge yourself`);
        parts.push(`2. Consider the Audio/Video mock interview for a more realistic experience`);
        parts.push(`3. Focus on time management and conciseness`);
    }

    if (interviewType === 'BEHAVIORAL' || interviewType === 'HR') {
        parts.push(`4. Master the STAR method for behavioral questions`);
    }

    parts.push(`\n> 💡 **Tip:** This was a practice interview using our question bank. For AI-powered evaluation with personalized feedback, try our Mock Interview feature with audio/video mode.`);

    return parts.join('\n');
}
