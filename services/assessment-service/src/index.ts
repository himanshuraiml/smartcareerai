import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import assessmentRoutes from './routes/assessment.routes';
import { logger } from './utils/logger';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3015;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Allow base64 snapshot images

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'assessment-service' });
});

// Main Routes
app.use('/api/v1/assessments', assessmentRoutes);

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

app.listen(PORT, () => {
    logger.info(`Assessment Service running on port ${PORT}`);
});
