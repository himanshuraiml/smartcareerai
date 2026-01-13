import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { subscriptionRouter } from './routes/subscription.routes';
import { creditRouter } from './routes/credit.routes';
import { webhookRouter } from './routes/webhook.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(helmet());
app.use(cors());

// Webhook route needs raw body for signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

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
