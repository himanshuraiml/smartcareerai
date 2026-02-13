import dotenv from 'dotenv';
import path from 'path';
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes';
import { adminRouter } from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';


const app = express();
const PORT = process.env.PORT || 3001;

import cookieParser from 'cookie-parser';

// ...

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Allow Gateway
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

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
