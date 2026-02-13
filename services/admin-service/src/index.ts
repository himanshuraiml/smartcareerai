import dotenv from 'dotenv';
import path from 'path';
if (process.env.NODE_ENV !== 'production') {
    const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });
    if (result.error) {
        console.error('❌ [AdminService] Failed to load .env file:', result.error);
    }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { adminRouter } from './routes/admin.routes';
import { institutionRouter } from './routes/institution.routes';
import { settingsRouter } from './routes/settings.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

const SERVICE_NAME = 'admin-service';

// ============================================
// GLOBAL ERROR HANDLERS
// ============================================

// Uncaught Exception Handler
process.on('uncaughtException', (error: Error) => {
    logger.error({
        type: 'UNCAUGHT_EXCEPTION',
        service: SERVICE_NAME,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });

    // Give time for logs to flush, then exit
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// Unhandled Promise Rejection Handler
process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error({
        type: 'UNHANDLED_REJECTION',
        service: SERVICE_NAME,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });
});

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`[${SERVICE_NAME}] Received ${signal}. Starting graceful shutdown...`);

    // Set a timeout for forced exit
    const shutdownTimeout = setTimeout(() => {
        logger.error(`[${SERVICE_NAME}] Shutdown timeout. Forcing exit.`);
        process.exit(1);
    }, 30000);

    try {
        // Close server connections
        if (server) {
            await new Promise<void>((resolve) => {
                server.close(() => {
                    logger.info(`[${SERVICE_NAME}] HTTP server closed.`);
                    resolve();
                });
            });
        }

        clearTimeout(shutdownTimeout);
        logger.info(`[${SERVICE_NAME}] Graceful shutdown complete.`);
        process.exit(0);
    } catch (err) {
        logger.error(`[${SERVICE_NAME}] Error during shutdown:`, err);
        process.exit(1);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();
const PORT = process.env.PORT || 3011;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request ID middleware for tracing
app.use((req, _res, next) => {
    (req as any).id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    next();
});

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: SERVICE_NAME,
        timestamp: new Date().toISOString(),
    });
});

// Routes
// Public route for listing institutions (used in registration)
app.get('/institutions', async (_req, res, next) => {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const institutions = await prisma.institution.findMany({
            select: { id: true, name: true }
        });
        res.json({ success: true, data: institutions });
    } catch (error) {
        next(error);
    }
});

// IMPORTANT: Institution routes must be mounted FIRST because they use institutionAdminMiddleware
// If adminRouter (which uses adminMiddleware requiring ADMIN role) is mounted first at '/',
// it will intercept /institution/* requests and reject them with 403.
app.use('/institution', institutionRouter);
app.use('/settings', settingsRouter);
app.use('/', adminRouter);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    logger.info(`👑 ${SERVICE_NAME} running on port ${PORT}`);
    logger.info(`[${SERVICE_NAME}] Process error handlers initialized.`);
});

export default app;

