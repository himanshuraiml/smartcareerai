import { createClient, LiveClient } from '@deepgram/sdk';
import { Readable } from 'stream';

export class TranscriptionService {
    private deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
    private live: LiveClient | null = null;

    constructor(
        private readonly botId: string,
        private readonly onTranscript: (text: string, isFinal: boolean) => void
    ) { }

    async start(audioStream: Readable) {
        console.log(`[${this.botId}] Starting Deepgram transcription stream...`);

        try {
            // Initiate a live transcription connection
            this.live = this.deepgram.listen.live({
                model: 'nova-2',
                language: 'en-US',
                smart_format: true,
                interim_results: true,
                encoding: 'linear16',
                sample_rate: 44100, // Puppeteer stream default is often 44100 or 48000
                channels: 1 // Puppeteer usually mixes down to mono
            });

            this.live.on('open', () => {
                console.log(`[${this.botId}] Deepgram connection opened.`);

                // Pipe the puppeteer audio stream into Deepgram
                audioStream.on('data', (chunk) => {
                    if (this.live && this.live.getReadyState() === 1) { // 1 = OPEN
                        this.live.send(chunk);
                    }
                });

                audioStream.on('end', () => {
                    console.log(`[${this.botId}] Audio stream ended.`);
                    this.stop();
                });
            });

            this.live.on('Results', (data: any) => {
                const transcript = data.channel?.alternatives?.[0]?.transcript;
                if (transcript) {
                    const isFinal = data.is_final;
                    this.onTranscript(transcript, isFinal);
                }
            });

            this.live.on('error', (error: any) => {
                console.error(`[${this.botId}] Deepgram error:`, error);
            });

            this.live.on('close', () => {
                console.log(`[${this.botId}] Deepgram connection closed.`);
            });

        } catch (error) {
            console.error(`[${this.botId}] Failed to start Deepgram:`, error);
        }
    }

    stop() {
        if (this.live) {
            this.live.requestClose();
            this.live = null;
        }
    }
}
