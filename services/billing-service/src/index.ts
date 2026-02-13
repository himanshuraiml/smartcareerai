import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { subscriptionRouter } from './routes/subscription.routes';
import { creditRouter } from './routes/credit.routes';
import { webhookRouter } from './routes/webhook.routes';
import { errorHandler } from './middleware/error.middleware';
import { contextMiddleware } from './middleware/context.middleware';
import { logger } from './utils/logger';

// Catch startup errors that would otherwise cause silent SIGTERM
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err.message, err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Rejection:', reason);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(helmet());
app.use(cors());

// Webhook route needs raw body for signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(contextMiddleware);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'billing-service' });
});

// Routes
app.use('/subscriptions', subscriptionRouter);
app.use('/credits', creditRouter);
app.use('/webhook', webhookRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`💳 Billing Service running on port ${PORT}`);
});

export default app;
