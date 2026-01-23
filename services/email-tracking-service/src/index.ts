import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { emailRoutes } from './routes/email.routes';
import { logger } from './utils/logger';
import { startEmailScanJob } from './jobs/email-scan.job';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3013;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'email-tracking-service' });
});

// Routes
app.use('/api/v1/email', emailRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    logger.info(`Email Tracking Service running on port ${PORT}`);

    // Start cron job for email scanning
    startEmailScanJob();
});

export default app;
