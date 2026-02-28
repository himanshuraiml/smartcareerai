import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GoogleMeetBot } from './google-meet-bot';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // We'll restrict this in prod
        methods: ['GET', 'POST']
    }
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'meeting-bot-service' });
});

// Store active bots in memory (in production use Redis + worker processes)
const activeBots: Record<string, GoogleMeetBot> = {};

// Start a bot
app.post('/api/bot/join', async (req, res) => {
    try {
        const { meetingUrl, interviewId } = req.body;

        if (!meetingUrl) {
            return res.status(400).json({ error: 'meetingUrl is required' });
        }

        const botId = interviewId || `bot_${Date.now()}`;

        // Ensure we don't start duplicate bots for the same meeting
        if (activeBots[botId]) {
            return res.status(409).json({ error: 'Bot already active for this interview' });
        }

        // Start Puppeteer to join meetingUrl
        const bot = new GoogleMeetBot(meetingUrl, interviewId || botId, 'SmartCareerAI Copilot');

        // Start in background
        bot.start().catch(err => {
            console.error(`Bot ${botId} crashed:`, err);
            delete activeBots[botId];
        });

        activeBots[botId] = bot;

        res.status(202).json({
            success: true,
            message: 'Bot initiated',
            meetingUrl,
            botId
        });
    } catch (error) {
        console.error('Failed to start bot:', error);
        res.status(500).json({ error: 'Failed to start bot' });
    }
});

// Stop a bot
app.post('/api/bot/leave', async (req, res) => {
    try {
        const { botId } = req.body;

        if (!botId || !activeBots[botId]) {
            return res.status(404).json({ error: 'Bot not found' });
        }

        await activeBots[botId].stop();
        delete activeBots[botId];

        res.json({ success: true, message: 'Bot stopped successfully' });
    } catch (error) {
        console.error('Failed to stop bot:', error);
        res.status(500).json({ error: 'Failed to stop bot' });
    }
});

const PORT = process.env.PORT || 3013;

httpServer.listen(PORT, () => {
    console.log(`🤖 Meeting Bot Service running on port ${PORT}`);
});
