import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { skillRouter } from './routes/skill.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';


const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'skill-service' });
});

// Routes
app.use('/', skillRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🎯 Skill Service running on port ${PORT}`);
});

export default app;
