import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { recruiterRouter } from './routes/recruiter.routes';
import { messageRouter } from './routes/message.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3012;

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
app.use('/messages', messageRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🏢 Recruiter Service running on port ${PORT}`);
});

export default app;
