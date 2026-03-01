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

/**
 * Resolves the public IP for MediaSoup's announcedAddress.
 *
 * On Railway (and other PaaS platforms) there is no static IP, so we fetch
 * the current outbound IP at startup. We try two providers as fallback.
 *
 * If MEDIASOUP_ANNOUNCED_IP is already set (e.g. a VPS with a known static IP),
 * that value is used as-is and no network call is made.
 */
async function resolveAnnouncedIp(): Promise<string> {
    // Already configured — use it (static VPS or manual override)
    if (process.env.MEDIASOUP_ANNOUNCED_IP && process.env.MEDIASOUP_ANNOUNCED_IP !== '0.0.0.0') {
        logger.info(`MEDIASOUP_ANNOUNCED_IP set explicitly: ${process.env.MEDIASOUP_ANNOUNCED_IP}`);
        return process.env.MEDIASOUP_ANNOUNCED_IP;
    }

    const providers = [
        'https://api.ipify.org?format=json',
        'https://api4.my-ip.io/ip.json',
    ];

    for (const url of providers) {
        try {
            logger.info(`Fetching public IP from ${url}...`);
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) continue;
            const data = await res.json() as { ip?: string; IPv4?: string };
            const ip = data.ip ?? data.IPv4;
            if (ip) {
                logger.info(`Resolved public IP for MediaSoup: ${ip}`);
                return ip;
            }
        } catch {
            logger.warn(`IP lookup failed for ${url}, trying next...`);
        }
    }

    logger.warn('Could not resolve public IP — falling back to 127.0.0.1 (local only).');
    return '127.0.0.1';
}

// Start server
async function start() {
    try {
        // ── Step 1: Resolve public IP before any MediaSoup config is used ──
        const announcedIp = await resolveAnnouncedIp();
        process.env.MEDIASOUP_ANNOUNCED_IP = announcedIp;

        // ── Step 2: Patch the already-imported config with the resolved IP ──
        // mediasoup.config.ts is evaluated when worker-manager is first imported
        // (before resolveAnnouncedIp runs), so we override the values directly.
        const { mediasoupConfig } = await import('./config/mediasoup.config');
        for (const info of mediasoupConfig.webRtcTransport.listenInfos) {
            info.announcedAddress = announcedIp;
        }

        // ── Step 3: Start MediaSoup workers ──
        await workerManager.init();
        logger.info('MediaSoup workers initialized');

        // Start network quality monitor
        const networkMonitor = new NetworkMonitorService(io);
        networkMonitor.start();

        server.listen(PORT, () => {
            logger.info(`Media Service running on port ${PORT}`);
            logger.info(`MediaSoup announced IP: ${announcedIp}`);
        });
    } catch (err) {
        logger.error('Failed to start media service:', err);
        process.exit(1);
    }
}

start();

export default app;
