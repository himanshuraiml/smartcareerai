import puppeteer, { Browser, Page } from 'puppeteer';
import { getStream } from 'puppeteer-stream';
import { TranscriptionService } from './services/transcription.service';
import { CopilotLogicService } from './services/copilot-logic.service';

export class GoogleMeetBot {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private copilotLogic: CopilotLogicService;

    constructor(
        private readonly meetingUrl: string,
        private readonly interviewId: string,
        private readonly botName: string = 'SmartCareerAI Copilot'
    ) {
        this.copilotLogic = new CopilotLogicService(botName, interviewId);
    }

    async start() {
        try {
            console.log(`Starting bot for meeting: ${this.meetingUrl}`);

            this.browser = await puppeteer.launch({
                headless: true, // Need true for server deployment, false for local debugging
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--use-fake-ui-for-media-stream',
                    '--use-fake-device-for-media-stream',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process'
                ],
                // Require specific executable path if deploying to Alpine/Docker
            });

            this.page = await this.browser.newPage();

            // Allow permissions for microphone/camera (even if using fake ones)
            const context = this.browser.defaultBrowserContext();
            await context.overridePermissions('https://meet.google.com', ['microphone', 'camera', 'notifications']);

            console.log('Navigating to Google Meet URL...');
            await this.page.goto(this.meetingUrl, { waitUntil: 'networkidle2' });

            // Wait for the "What's your name?" input field (for unauthenticated guests)
            console.log('Waiting for name input...');
            const nameInputSelector = 'input[type="text"]'; // Google Meet guest name input
            await this.page.waitForSelector(nameInputSelector, { timeout: 15000 });
            await this.page.type(nameInputSelector, this.botName);

            // Turn off camera and mic before joining (optional but recommended for strictly listening bots)
            // Note: Selectors for these buttons change frequently. A more robust way is sending keyboard shortcuts (Ctrl+E, Ctrl+D)
            console.log('Muting mic and camera...');
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('d'); // Toggle mic
            await this.page.keyboard.press('e'); // Toggle camera
            await this.page.keyboard.up('Control');

            // Click "Ask to join" or "Join now"
            console.log('Clicking Join button...');
            const joinButtonSelector = 'button:has-text("Ask to join"), button:has-text("Join now")';
            // We use XPath or evaluate to find the button since exact classes change
            await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const joinBtn = buttons.find(b => b.innerText.includes('Ask to join') || b.innerText.includes('Join now'));
                if (joinBtn) joinBtn.click();
            });

            console.log('Waiting to be admitted to the meeting...');
            // Wait for the participant list or meeting controls to appear, indicating successful join
            await this.page.waitForSelector('[aria-label="Meeting details"]', { timeout: 60000 }); // Wait up to 60s to be admitted
            console.log('Successfully joined the meeting!');

            // Start extracting audio
            await this.extractAudio();

        } catch (error) {
            console.error('Error starting Google Meet bot:', error);
            await this.stop();
        }
    }

    private async extractAudio() {
        if (!this.page) return;

        console.log('Starting audio extraction via puppeteer-stream...');
        try {
            // Using puppeteer-stream to capture the tab's audio
            const stream = await getStream(this.page, { audio: true, video: false });

            const transcriptionService = new TranscriptionService(
                this.botName, // or better, pass in the unique `botId`
                (text, isFinal) => {
                    this.copilotLogic.handleTranscript(text, isFinal);
                    if (isFinal) {
                        console.log(`[Transcript Final] ${text}`);
                    }
                }
            );

            await transcriptionService.start(stream);

        } catch (error) {
            console.error('Failed to capture audio stream:', error);
        }
    }

    async stop() {
        console.log('Stopping bot and closing browser...');
        await this.copilotLogic.stop();
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}
