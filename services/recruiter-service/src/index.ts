import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { recruiterRouter } from './routes/recruiter.routes';
import { messageRouter } from './routes/message.routes';
import { organizationRouter } from './routes/organization.routes';
import { publicRouter } from './routes/public.routes';
import { sourcingRouter } from './routes/sourcing.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';


const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'recruiter-service' });
});

// Routes
app.use('/', recruiterRouter);
app.use('/organization', organizationRouter);
app.use('/messages', messageRouter);
app.use('/sourcing', sourcingRouter);
app.use('/api/v1/public', publicRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🏢 Recruiter Service running on port ${PORT}`);
});

export default app;
