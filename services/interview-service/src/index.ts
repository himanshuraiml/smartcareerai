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
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { contextMiddleware } from './middleware/context.middleware';


const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(contextMiddleware);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'interview-service' });
});

// Routes
app.use('/', interviewRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🎤 Interview Service running on port ${PORT}`);
});

export default app;
