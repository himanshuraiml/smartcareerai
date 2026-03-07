import Groq from 'groq-sdk';
import { logger } from '../utils/logger';

export type InterviewPhase = 'intro' | 'technical' | 'behavioral' | 'wrapup' | 'ended';

export interface TranscriptSegment {
    speakerId: string;
    speakerName: string;
    text: string;
    startTime: number;
}

export interface PhaseConfig {
    maxQuestions: number;
}

const PHASE_CONFIGS: Record<InterviewPhase, PhaseConfig> = {
    intro: { maxQuestions: parseInt(process.env.MAX_INTRO_QUESTIONS || '2') },
    technical: { maxQuestions: parseInt(process.env.MAX_TECHNICAL_QUESTIONS || '5') },
    behavioral: { maxQuestions: parseInt(process.env.MAX_BEHAVIORAL_QUESTIONS || '3') },
    wrapup: { maxQuestions: parseInt(process.env.MAX_WRAPUP_QUESTIONS || '1') },
    ended: { maxQuestions: 0 },
};

const PHASE_ORDER: InterviewPhase[] = ['intro', 'technical', 'behavioral', 'wrapup', 'ended'];

/**
 * QuestionOrchestratorService drives the interview conversation for an AI-hosted session.
 *
 * Responsibilities:
 *  - Track interview phase and question count per phase
 *  - Analyse transcript and decide when to ask next question
 *  - Generate contextually appropriate questions via Groq LLM
 *  - Detect silence (no candidate response) and re-prompt
 */
export class QuestionOrchestratorService {
    private groq: Groq;
    private model: string;
    private jobRole: string;
    private jobDescription: string;
    private phase: InterviewPhase = 'intro';
    private phaseQuestionCount = 0;
    private conversationHistory: { role: 'assistant' | 'user'; content: string }[] = [];
    private lastCandidateResponseAt = Date.now();
    private silenceCheckTimer: ReturnType<typeof setInterval> | null = null;
    private onQuestion: (text: string) => Promise<void>;

    constructor(
        jobRole: string,
        jobDescription: string,
        onQuestion: (text: string) => Promise<void>
    ) {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        this.jobRole = jobRole;
        this.jobDescription = jobDescription;
        this.onQuestion = onQuestion;
    }

    /** Start the interview by delivering the opening message. */
    async start(): Promise<void> {
        const opening = await this._generateQuestion('opening');
        this.conversationHistory.push({ role: 'assistant', content: opening });
        await this.onQuestion(opening);
        this._startSilenceMonitor();
    }

    /**
     * Feed a new transcript segment from the candidate.
     * Decides whether to generate the next question immediately.
     */
    async onTranscriptSegment(segment: TranscriptSegment): Promise<void> {
        if (this.phase === 'ended') return;

        // Only act on candidate speech (not AI's own transcript echo)
        this.lastCandidateResponseAt = Date.now();
        this.conversationHistory.push({ role: 'user', content: segment.text });

        // Let the candidate finish speaking; wait for isFinal + brief pause
        // The silence monitor handles prompting after a delay
    }

    /**
     * Called by the silence monitor or directly when we want to advance.
     * Generates the next question and advances phase when limit reached.
     */
    async askNextQuestion(): Promise<void> {
        if (this.phase === 'ended') return;

        this.phaseQuestionCount++;
        const config = PHASE_CONFIGS[this.phase];

        // Advance phase if we've asked enough questions
        if (this.phaseQuestionCount > config.maxQuestions) {
            this._advancePhase();
            // Re-read phase into a string var to bypass TS narrowing from
            // the early return guard at the top of this function.
            const nextPhase: string = this.phase;
            if (nextPhase === 'ended') {
                await this._deliverClosing();
                return;
            }
            this.phaseQuestionCount = 1;
        }

        const question = await this._generateQuestion(this.phase);
        this.conversationHistory.push({ role: 'assistant', content: question });
        await this.onQuestion(question);
    }

    /** Stop the orchestrator and silence monitor. */
    stop(): void {
        if (this.silenceCheckTimer) {
            clearInterval(this.silenceCheckTimer);
            this.silenceCheckTimer = null;
        }
        this.phase = 'ended';
    }

    getPhase(): InterviewPhase {
        return this.phase;
    }

    private _advancePhase(): void {
        const currentIndex = PHASE_ORDER.indexOf(this.phase);
        if (currentIndex < PHASE_ORDER.length - 1) {
            this.phase = PHASE_ORDER[currentIndex + 1];
            logger.info(`Interview phase advanced to: ${this.phase}`);
        }
    }

    private _startSilenceMonitor(): void {
        const silenceThreshold = parseInt(process.env.SILENCE_THRESHOLD_SECONDS || '8') * 1000;

        this.silenceCheckTimer = setInterval(async () => {
            if (this.phase === 'ended') return;
            const silentMs = Date.now() - this.lastCandidateResponseAt;
            if (silentMs >= silenceThreshold) {
                this.lastCandidateResponseAt = Date.now(); // reset to avoid double-trigger
                await this.askNextQuestion();
            }
        }, 2000); // poll every 2 seconds
    }

    private async _generateQuestion(context: string): Promise<string> {
        const systemPrompt = `You are a professional AI interviewer conducting a ${this.jobRole} interview.
Job Description: ${this.jobDescription}

Interview phase: ${context}
Phase guide:
- intro: Greet the candidate warmly, ask them to introduce themselves.
- technical: Ask specific, job-relevant technical questions one at a time.
- behavioral: Use STAR-method questions about past experience.
- wrapup: Thank the candidate, invite their questions, close gracefully.
- opening: Deliver a warm, professional greeting and your first intro question.

Rules:
- Ask exactly ONE question per turn. Never stack multiple questions.
- Keep responses under 60 words.
- Be natural, encouraging, and professional.
- Reference previous answers when relevant to show you're listening.
- Do not say "Great answer!" repeatedly — vary affirmations.`;

        const messages: Groq.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory.slice(-10), // keep last 10 turns for context
        ];

        try {
            const completion = await this.groq.chat.completions.create({
                model: this.model,
                messages,
                max_tokens: 150,
                temperature: 0.7,
            });

            return completion.choices[0]?.message?.content?.trim() ?? this._fallbackQuestion(context);
        } catch (err) {
            logger.error('Groq question generation failed:', err);
            return this._fallbackQuestion(context);
        }
    }

    private async _deliverClosing(): Promise<void> {
        const closing = `Thank you so much for your time today. It was a pleasure learning about your background. We'll be in touch soon with next steps. Have a great day!`;
        this.conversationHistory.push({ role: 'assistant', content: closing });
        await this.onQuestion(closing);
    }

    private _fallbackQuestion(context: string): string {
        const fallbacks: Record<string, string> = {
            opening: `Hello! Welcome to your interview for the ${this.jobRole} position. Could you start by telling me a bit about yourself and your background?`,
            intro: 'What motivated you to apply for this role?',
            technical: 'Can you walk me through a technical challenge you solved recently?',
            behavioral: 'Tell me about a time you had to work under pressure. How did you handle it?',
            wrapup: 'Do you have any questions for me about the role or the company?',
        };
        return fallbacks[context] ?? fallbacks['technical'];
    }
}
