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
import { panelRouter } from './routes/panel.routes';
import { bgvRouter } from './routes/bgv.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { startSequenceWorker } from './jobs/sequence.worker';


const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
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
app.use('/', sourcingRouter);
app.use('/', panelRouter);
app.use('/', bgvRouter);
app.use('/api/v1/public', publicRouter);

// Error handler
app.use(errorHandler);

// F2: Start BullMQ drip sequence worker
startSequenceWorker();

app.listen(PORT, () => {
    logger.info(`🏢 Recruiter Service running on port ${PORT}`);
});

export default app;
