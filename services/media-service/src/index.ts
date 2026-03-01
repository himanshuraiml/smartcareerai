import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { meetingRouter } from './routes/meeting.routes';
import { mediaRouter } from './routes/media.routes';
import { errorHandler } from './middleware/error.middleware';
import { contextMiddleware } from './middleware/context.middleware';
import { workerManager } from './services/worker-manager.service';
import { setupSignaling } from './socket/signaling.socket';
import { NetworkMonitorService } from './services/network-monitor.service';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3014;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
app.use(express.json());
app.use(contextMiddleware);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'media-service' });
});

// Routes
app.use('/meetings', meetingRouter);
app.use('/meetings', mediaRouter);

// Error handler
app.use(errorHandler);

// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

// Setup Socket.io signaling
setupSignaling(io);

// Start server
async function start() {
    try {
        await workerManager.init();
        logger.info('MediaSoup workers initialized');

        // Start network quality monitor
        const networkMonitor = new NetworkMonitorService(io);
        networkMonitor.start();

        server.listen(PORT, () => {
            logger.info(`Media Service running on port ${PORT}`);
        });
    } catch (err) {
        logger.error('Failed to start media service:', err);
        process.exit(1);
    }
}

start();

export default app;
