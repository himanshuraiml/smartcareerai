import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { resumeRouter } from './routes/resume.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { contextMiddleware } from './middleware/context.middleware';


const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(contextMiddleware);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'resume-service' });
});

// Routes
app.use('/', resumeRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`📄 Resume Service running on port ${PORT}`);
});

export default app;
