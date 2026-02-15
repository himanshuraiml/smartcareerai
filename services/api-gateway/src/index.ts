import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { logger } from './utils/logger';
import {
    securityHeaders,
    sanitizeInput,
    sqlInjectionPrevention,
    ipBlocklistCheck,
    suspiciousActivityDetection,
    authRateLimiter,
    aiRateLimiter,
    requestSizeLimits,
} from './middleware/security';


const SERVICE_NAME = 'api-gateway';

// ============================================
// GLOBAL ERROR HANDLERS
// ============================================

// Uncaught Exception Handler
process.on('uncaughtException', (error: Error) => {
    logger.error({
        type: 'UNCAUGHT_EXCEPTION',
        service: SERVICE_NAME,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });

    setTimeout(() => process.exit(1), 1000);
});

// Unhandled Promise Rejection Handler
process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error({
        type: 'UNHANDLED_REJECTION',
        service: SERVICE_NAME,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });
});

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`[${SERVICE_NAME}] Received ${signal}. Starting graceful shutdown...`);

    const shutdownTimeout = setTimeout(() => {
        logger.error(`[${SERVICE_NAME}] Shutdown timeout. Forcing exit.`);
        process.exit(1);
    }, 30000);

    try {
        if (server) {
            await new Promise<void>((resolve) => {
                server.close(() => {
                    logger.info(`[${SERVICE_NAME}] HTTP server closed.`);
                    resolve();
                });
            });
        }

        clearTimeout(shutdownTimeout);
        logger.info(`[${SERVICE_NAME}] Graceful shutdown complete.`);
        process.exit(0);
    } catch (err) {
        logger.error(`[${SERVICE_NAME}] Error during shutdown:`, err);
        process.exit(1);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Railway (and other reverse proxies)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());

// Security middleware - OWASP compliance
app.use(securityHeaders);
app.use(ipBlocklistCheck);
app.use(suspiciousActivityDetection);

// Body parsing with size limits
app.use(express.json({ limit: requestSizeLimits.json }));
app.use(express.urlencoded({ extended: true, limit: requestSizeLimits.urlencoded }));

// Input sanitization and SQL injection prevention
app.use(sanitizeInput);
app.use(sqlInjectionPrevention);
app.use(cookieParser());

// CORS Configuration
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3100', 'http://localhost:3000'];

const corsConfig = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-user-id'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400,
};

app.use(cors(corsConfig));
app.options('*', cors(corsConfig));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Request ID middleware and header cleanup for tracing
app.use((req, _res, next) => {
    (req as any).id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Security: Strip x-user-id from client to prevent spoofing
    delete req.headers['x-user-id'];

    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
});
app.use(limiter);

// Health check with service status
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: SERVICE_NAME,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Version prefix
const API_PREFIX = '/api/v1';

// Service URLs - Phase 1
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const RESUME_SERVICE_URL = process.env.RESUME_SERVICE_URL || 'http://localhost:3002';
const SCORING_SERVICE_URL = process.env.SCORING_SERVICE_URL || 'http://localhost:3003';

// Service URLs - Phase 2
const SKILL_SERVICE_URL = process.env.SKILL_SERVICE_URL || 'http://localhost:3004';
const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL || 'http://localhost:3005';
const APPLICATION_SERVICE_URL = process.env.APPLICATION_SERVICE_URL || 'http://localhost:3006';

// Helper to extract and verify user ID from JWT token
const extractUserIdFromToken = (authHeader: string | undefined): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            logger.error('JWT_SECRET not found in API Gateway environment');
            return null;
        }

        const decoded = jwt.verify(token, secret) as any;
        return decoded.id || decoded.userId || decoded.sub || null;
    } catch (err) {
        logger.error(`JWT verification error in Gateway: ${err}`);
        return null;
    }
};

// Proxy options factory with retry-friendly error handling
const createProxyOptions = (target: string, pathRewrite: Record<string, string>): Options => ({
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
        const isRetryable = ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].some(code =>
            err.message.includes(code)
        );

        logger.error({
            type: 'PROXY_ERROR',
            service: SERVICE_NAME,
            target,
            path: req.url,
            error: err.message,
            retryable: isRetryable,
            timestamp: new Date().toISOString(),
        });

        if (res && 'status' in res) {
            const response = res as express.Response;
            const origin = (req as express.Request).headers.origin;
            if (origin) {
                response.setHeader('Access-Control-Allow-Origin', origin);
                response.setHeader('Access-Control-Allow-Credentials', 'true');
            }
            response.status(502).json({
                error: 'Service unavailable',
                message: err.message,
                retryable: isRetryable,
            });
        }
    },
    onProxyReq: (proxyReq, req) => {
        let authHeader = req.headers['authorization'] || req.headers['Authorization'] as string | undefined;

        // Check for cookie if header is missing
        if (!authHeader && req.cookies && req.cookies.accessToken) {
            authHeader = `Bearer ${req.cookies.accessToken}`;
            proxyReq.setHeader('Authorization', authHeader);
        }

        const userId = extractUserIdFromToken(authHeader);
        if (userId) {
            proxyReq.setHeader('x-user-id', userId);
        }
        // Add request ID for tracing
        proxyReq.setHeader('x-request-id', (req as any).id || 'unknown');

        // Re-stream body if it was already parsed by express.json()
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req) => {
        // Strip upstream CORS headers to let Gateway's cors() middleware handle it
        delete proxyRes.headers['access-control-allow-origin'];
        delete proxyRes.headers['access-control-allow-methods'];
        delete proxyRes.headers['access-control-allow-headers'];
        delete proxyRes.headers['access-control-allow-credentials'];

        // Add request ID for tracing
        proxyRes.headers['x-request-id'] = (req as any).id || 'unknown';
    },
});

// ============================================
// PHASE 1 SERVICES
// ============================================

// Apply stricter rate limiting for auth endpoints
app.use(`${API_PREFIX}/auth`, authRateLimiter);
app.use(
    `${API_PREFIX}/auth`,
    createProxyMiddleware(createProxyOptions(AUTH_SERVICE_URL, { [`^${API_PREFIX}/auth`]: '' }))
);

app.use(
    `${API_PREFIX}/users`,
    createProxyMiddleware(createProxyOptions(AUTH_SERVICE_URL, { [`^${API_PREFIX}/users`]: '' }))
);

app.use(
    `${API_PREFIX}/resumes`,
    createProxyMiddleware(createProxyOptions(RESUME_SERVICE_URL, { [`^${API_PREFIX}/resumes`]: '' }))
);

// Apply AI rate limiting for scoring endpoints (expensive operations)
app.use(`${API_PREFIX}/scores`, aiRateLimiter);
app.use(
    `${API_PREFIX}/scores`,
    createProxyMiddleware(createProxyOptions(SCORING_SERVICE_URL, { [`^${API_PREFIX}/scores`]: '' }))
);

app.use(
    `${API_PREFIX}/job-roles`,
    createProxyMiddleware(createProxyOptions(SKILL_SERVICE_URL, { [`^${API_PREFIX}/job-roles`]: '/job-roles' }))
);

// ============================================
// PHASE 2 SERVICES
// ============================================

app.use(
    `${API_PREFIX}/skills`,
    createProxyMiddleware(createProxyOptions(SKILL_SERVICE_URL, { [`^${API_PREFIX}/skills`]: '' }))
);

app.use(
    `${API_PREFIX}/jobs`,
    createProxyMiddleware(createProxyOptions(JOB_SERVICE_URL, { [`^${API_PREFIX}/jobs`]: '' }))
);

app.use(
    `${API_PREFIX}/applications`,
    createProxyMiddleware(createProxyOptions(APPLICATION_SERVICE_URL, { [`^${API_PREFIX}/applications`]: '' }))
);

// ============================================
// PHASE 3 SERVICES
// ============================================

const INTERVIEW_SERVICE_URL = process.env.INTERVIEW_SERVICE_URL || 'http://localhost:3007';

// Apply AI rate limiting ONLY for POST/PUT requests (expensive AI operations)
// GET requests (session reads, polling) should not be rate-limited this aggressively
app.use(`${API_PREFIX}/interviews`, (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        return aiRateLimiter(req, res, next);
    }
    next();
});
app.use(
    `${API_PREFIX}/interviews`,
    createProxyMiddleware(createProxyOptions(INTERVIEW_SERVICE_URL, { [`^${API_PREFIX}/interviews`]: '' }))
);

const VALIDATION_SERVICE_URL = process.env.VALIDATION_SERVICE_URL || 'http://localhost:3008';

app.use(
    `${API_PREFIX}/validation`,
    createProxyMiddleware(createProxyOptions(VALIDATION_SERVICE_URL, { [`^${API_PREFIX}/validation`]: '' }))
);

// ============================================
// PHASE 4 SERVICES
// ============================================

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3010';
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3011';
const RECRUITER_SERVICE_URL = process.env.RECRUITER_SERVICE_URL || 'http://localhost:3012';

app.use(
    `${API_PREFIX}/billing`,
    createProxyMiddleware(createProxyOptions(BILLING_SERVICE_URL, { [`^${API_PREFIX}/billing`]: '' }))
);

app.use(
    `${API_PREFIX}/institutions`,
    createProxyMiddleware(createProxyOptions(ADMIN_SERVICE_URL, { [`^${API_PREFIX}/institutions`]: '/institutions' }))
);

app.use(
    `${API_PREFIX}/admin`,
    createProxyMiddleware(createProxyOptions(ADMIN_SERVICE_URL, { [`^${API_PREFIX}/admin`]: '' }))
);

app.use(
    `${API_PREFIX}/messages`,
    createProxyMiddleware(createProxyOptions(RECRUITER_SERVICE_URL, { [`^${API_PREFIX}/messages`]: '/messages' }))
);

app.use(
    `${API_PREFIX}/recruiter`,
    createProxyMiddleware(createProxyOptions(RECRUITER_SERVICE_URL, { [`^${API_PREFIX}/recruiter`]: '' }))
);

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3013';

app.use(
    `${API_PREFIX}/email`,
    createProxyMiddleware(createProxyOptions(EMAIL_SERVICE_URL, { [`^${API_PREFIX}/email`]: '' }))
);

// Note: JSON parsing already configured above with size limits

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        timestamp: new Date().toISOString(),
    });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({
        type: 'EXPRESS_ERROR',
        service: SERVICE_NAME,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        requestId: (req as any).id,
        timestamp: new Date().toISOString(),
    });
    res.status(500).json({
        error: 'Internal server error',
        requestId: (req as any).id,
    });
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
    logger.info(`[${SERVICE_NAME}] Process error handlers initialized.`);
    logger.info(`📡 Auth Service: ${AUTH_SERVICE_URL}`);
    logger.info(`📄 Resume Service: ${RESUME_SERVICE_URL}`);
    logger.info(`📊 Scoring Service: ${SCORING_SERVICE_URL}`);
    logger.info(`🎯 Skill Service: ${SKILL_SERVICE_URL}`);
    logger.info(`💼 Job Service: ${JOB_SERVICE_URL}`);
    logger.info(`📋 Application Service: ${APPLICATION_SERVICE_URL}`);
    logger.info(`🎙️ Interview Service: ${INTERVIEW_SERVICE_URL}`);
    logger.info(`✅ Validation Service: ${VALIDATION_SERVICE_URL}`);
    logger.info(`💳 Billing Service: ${BILLING_SERVICE_URL}`);
    logger.info(`👑 Admin Service: ${ADMIN_SERVICE_URL}`);
    logger.info(`🏢 Recruiter Service: ${RECRUITER_SERVICE_URL}`);
    logger.info(`📧 Email Tracking Service: ${EMAIL_SERVICE_URL}`);
});

export default app;

