import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { adminRouter } from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3011;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'admin-service' });
});

// Routes
app.use('/', adminRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`👑 Admin Service running on port ${PORT}`);
});

export default app;
