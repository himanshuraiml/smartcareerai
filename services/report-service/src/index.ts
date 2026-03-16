import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import reportRoutes from './routes/report.routes';
import { logger } from './utils/logger';

import path from 'path';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
} else {
    dotenv.config();
}

const app = express();
// Force port 4010 explicitly instead of process.env.PORT to bypass global conflicts
const port = process.env.REPORT_SERVICE_PORT || 4010;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/', reportRoutes);
app.use('/api/v1/reports', reportRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'report-service' });
});

// Start Server
app.listen(port, () => {
    logger.info(`Report Service started on port ${port}`);
});
