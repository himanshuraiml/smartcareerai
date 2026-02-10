import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes';
import { adminRouter } from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
});

// Routes
app.use('/', authRouter);
app.use('/admin', adminRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🔐 Auth Service running on port ${PORT}`);
});

export default app;
