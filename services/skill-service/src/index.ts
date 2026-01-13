import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { skillRouter } from './routes/skill.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

// Load env from service directory first (use __dirname for correct path when run via workspace)
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Service's .env (src/../.env)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Root .env as fallback

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
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
