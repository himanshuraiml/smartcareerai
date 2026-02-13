import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { applicationRouter } from './routes/application.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';


const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'application-service' });
});

app.use('/', applicationRouter);
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`📋 Application Service running on port ${PORT}`);
});

export default app;
