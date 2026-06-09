import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { notificationRouter } from './routes/notification.routes';

// Import Crons
import { setupStreakAlertCron } from './cron/streak-alert.cron';
import { setupLeagueWarningCron } from './cron/league-warning.cron';
import { setupWeeklyDigestCron } from './cron/weekly-digest.cron';
import { setupInactivityCron } from './cron/inactivity.cron';

// Catch startup errors
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err.message, err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Rejection:', reason);
    process.exit(1);
});

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3019;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/notifications', notificationRouter);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'notification-service' });
});

// Setup background cron jobs
setupStreakAlertCron();
setupLeagueWarningCron();
setupWeeklyDigestCron();
setupInactivityCron();

app.listen(PORT, () => {
    logger.info(`🚀 Notification Service running on port ${PORT}`);
});
