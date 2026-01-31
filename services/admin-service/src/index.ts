import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { adminRouter } from './routes/admin.routes';
import { institutionRouter } from './routes/institution.routes';
import { settingsRouter } from './routes/settings.routes';
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

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`👑 Admin Service running on port ${PORT}`);
});

export default app;
