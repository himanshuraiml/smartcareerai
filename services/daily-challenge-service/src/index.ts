import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { dailyChallengeRouter } from './routes/daily-challenge.routes';
import { communityRouter } from './routes/community.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.DAILY_CHALLENGE_SERVICE_PORT || process.env.PORT || 3017;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'daily-challenge-service' });
});

// Routes
app.use('/', dailyChallengeRouter);
app.use('/community', communityRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🚀 Daily Challenge Service running on port ${PORT}`);
});

export default app;
