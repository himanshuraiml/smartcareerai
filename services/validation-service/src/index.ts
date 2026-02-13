import dotenv from 'dotenv';
import path from 'path';

// Load env with fallbacks (for both local and Railway deployment)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // Also try default location

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { validationRouter } from './routes/validation.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';


const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check with database verification
app.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', service: 'validation-service', database: 'connected' });
    } catch (error) {
        logger.error('Health check failed - database unreachable', error);
        res.status(503).json({ status: 'unhealthy', service: 'validation-service', database: 'disconnected' });
    }
});

// Routes
app.use('/', validationRouter);

// Error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
    logger.info(`📝 Validation Service running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
    logger.info('Shutting down validation service...');
    server.close(async () => {
        await prisma.$disconnect();
        logger.info('Validation service stopped');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
