import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { aiInterviewRouter } from './routes/ai-interview.routes';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3016;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ai-interviewer-service' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/ai-interviews', aiInterviewRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    logger.info(`AI Interviewer Service running on port ${PORT}`);
    logger.info(`Groq model: ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}`);
    logger.info(`TTS voice: ${process.env.TTS_VOICE || 'nova'}`);
});

export default app;
