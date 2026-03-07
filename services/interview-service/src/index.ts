import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { interviewRouter } from './routes/interview.routes';
import { practiceRouter } from './routes/practice.routes';
import { codingRouter } from './routes/coding.routes';
import { meetingAnalysisRouter } from './routes/meeting-analysis.routes';
import { meetingAnalyticsRouter } from './routes/meeting-analytics.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { contextMiddleware } from './middleware/context.middleware';


const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 10MB for base64 audio chunks
app.use(contextMiddleware);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'interview-service' });
});

// Routes
app.use('/', interviewRouter);
app.use('/practice', practiceRouter);
app.use('/coding', codingRouter);
// Analytics routes mounted BEFORE meeting-analysis to prevent /:meetingId wildcard from matching /recruiter/* paths
app.use('/meeting-analysis', meetingAnalyticsRouter);
app.use('/meeting-analysis', meetingAnalysisRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🎤 Interview Service running on port ${PORT}`);
});

export default app;
