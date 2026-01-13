import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { validationRouter } from './routes/validation.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

// Load env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'validation-service' });
});

// Routes
app.use('/', validationRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`📝 Validation Service running on port ${PORT}`);
});

export default app;
