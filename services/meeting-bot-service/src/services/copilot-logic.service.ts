import Groq from 'groq-sdk';
import { io } from 'socket.io-client';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const INTERVIEW_SERVICE_URL = process.env.INTERVIEW_SERVICE_URL || 'http://localhost:3007';

export class CopilotLogicService {
    private transcriptBuffer: string[] = [];
    private fullTranscript: string[] = []; // Accumulate all final transcript chunks
    private processingTimer: NodeJS.Timeout | null = null;
    private apiGatewaySocket: any; // Used to forward suggestions to recruiters

    constructor(
        private readonly botId: string,
        private readonly interviewId: string,
        private readonly apiGatewayUrl: string = process.env.API_GATEWAY_URL || 'http://localhost:3000'
    ) {
        // Connect to API Gateway to broadcast events
        this.apiGatewaySocket = io(this.apiGatewayUrl);

        this.apiGatewaySocket.on('connect', () => {
            console.log(`[${this.botId}] Connected to API Gateway for broadcasting.`);
        });
    }

    handleTranscript(text: string, isFinal: boolean) {
        // Send raw transcript to API Gateway for RealtimeTranscript component
        this.apiGatewaySocket.emit('copilot:transcript', {
            interviewId: this.interviewId,
            text,
            isFinal,
            timestamp: new Date().toISOString()
        });

        if (isFinal) {
            this.transcriptBuffer.push(text);
            this.fullTranscript.push(text); // Track full transcript for post-mortem
            this.scheduleProcessing();
        }
    }

    private scheduleProcessing() {
        if (this.processingTimer) return; // Already scheduled

        // Wait a few seconds to accumulate context before triggering the LLM
        this.processingTimer = setTimeout(() => {
            this.processTranscriptBuffer();
            this.processingTimer = null;
        }, 8000); // 8 second rolling window delay
    }

    private async processTranscriptBuffer() {
        if (this.transcriptBuffer.length === 0) return;

        const contextToProcess = this.transcriptBuffer.join(' ');
        const chunksToSave = [...this.transcriptBuffer];

        // Keep the last few sentences for sliding window context, clear the rest
        this.transcriptBuffer = this.transcriptBuffer.slice(-2);

        console.log(`[${this.botId}] Processing transcript chunk for suggestions...`);

        try {
            const prompt = `
            You are an expert AI Interview Copilot assisting a human recruiter.
            Below is the latest segment of a live technical interview transcript.
            Based on the context, provide 1-2 suggested follow-up questions to probe deeper or verify a technical claim.
            Keep them concise. Only return the questions, nothing else.

            Transcript segment:
            "${contextToProcess}"
            `;

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant', // Fast, cheap model
                temperature: 0.5,
                max_tokens: 150,
            });

            const rawResponse = completion.choices[0]?.message?.content || '';
            const suggestions = rawResponse
                .split('\n')
                .map(s => s.trim().replace(/^[-*0-9.]+\s*/, '')) // Clean up bullets/numbers
                .filter(s => s.length > 5);

            if (suggestions.length > 0) {
                // Send suggestions to API Gateway for Recruiter Dashboard (real-time)
                this.apiGatewaySocket.emit('copilot:suggestions', {
                    interviewId: this.interviewId,
                    suggestions,
                    timestamp: new Date().toISOString()
                });
                console.log(`[${this.botId}] Sent ${suggestions.length} suggestions.`);

                // Persist suggestions + transcript chunk to interview-service
                await this.persistToInterviewService(suggestions, chunksToSave);
            }

        } catch (error) {
            console.error(`[${this.botId}] Error getting Groq suggestions:`, error);
        }
    }

    private async persistToInterviewService(suggestions: string[], transcriptChunks: string[], summary?: string) {
        try {
            const res = await fetch(`${INTERVIEW_SERVICE_URL}/sessions/${this.interviewId}/copilot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suggestions, transcriptChunks, summary }),
            });
            if (!res.ok) {
                console.error(`[${this.botId}] Failed to persist copilot data: ${res.status}`);
            }
        } catch (err) {
            console.error(`[${this.botId}] Error persisting copilot data:`, err);
        }
    }

    private async generatePostMortemSummary(): Promise<string | null> {
        if (this.fullTranscript.length === 0) return null;

        const fullText = this.fullTranscript.join(' ');
        console.log(`[${this.botId}] Generating post-mortem summary...`);

        try {
            const prompt = `
            You are an expert AI HR analyst. Below is the complete transcript of a live technical interview.
            Generate a structured post-mortem analysis in JSON format with these exact keys:
            - pros: array of positive observations about the candidate (3-5 points)
            - cons: array of concerns or weaknesses observed (2-4 points)
            - verdict: a short 2-3 sentence overall assessment
            - topics: array of key topics/technologies discussed during the interview
            - recommendedHire: boolean (true/false)

            Return ONLY valid JSON, no markdown or explanation.

            Full Interview Transcript:
            "${fullText.substring(0, 4000)}"
            `;

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant',
                temperature: 0.3,
                max_tokens: 500,
            });

            const raw = completion.choices[0]?.message?.content || '';
            // Validate it's parseable JSON
            JSON.parse(raw);
            return raw;
        } catch (error) {
            console.error(`[${this.botId}] Error generating post-mortem summary:`, error);
            return null;
        }
    }

    async stop() {
        if (this.processingTimer) clearTimeout(this.processingTimer);

        // Generate AI post-mortem summary before disconnecting
        const summary = await this.generatePostMortemSummary();
        if (summary) {
            await this.persistToInterviewService([], [], summary);
            console.log(`[${this.botId}] Post-mortem summary saved.`);
        }

        this.apiGatewaySocket.disconnect();
    }
}
