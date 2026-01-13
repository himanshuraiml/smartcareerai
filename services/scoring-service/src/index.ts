import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { scoringRouter } from './routes/scoring.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

// Load env from service directory first (use __dirname for correct path when run via workspace)
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Service's .env (src/../.env)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Root .env as fallback

// Debug: Log if Groq API key is present
logger.info(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? 'Present (' + process.env.GROQ_API_KEY.substring(0, 10) + '...)' : 'MISSING'}`);
logger.info(`Loaded from: ${path.resolve(__dirname, '../.env')}`);

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'scoring-service' });
});

// Routes
app.use('/', scoringRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`📊 Scoring Service running on port ${PORT}`);
});

export default app;
