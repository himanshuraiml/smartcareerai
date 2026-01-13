import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3100',
    credentials: true,
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting - relaxed for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health', // Skip health checks
});
app.use(limiter);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Helper to extract user ID from JWT token (simple decode, no verification - services do that)
const extractUserIdFromToken = (authHeader: string | undefined): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.substring(7);
        const payload = token.split('.')[1];
        // Handle base64url encoding
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        // Auth service uses 'id' field in JWT payload
        const userId = decoded.id || decoded.userId || decoded.sub || null;
        logger.info(`JWT decoded: userId=${userId}`);
        return userId;
    } catch (err) {
        logger.error(`JWT decode error: ${err}`);
        return null;
    }
};

// Proxy options factory
const createProxyOptions = (target: string, pathRewrite: Record<string, string>): Options => ({
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
        logger.error(`Proxy error to ${target}: ${err.message}`);
        if (res && 'status' in res) {
            (res as express.Response).status(502).json({ error: 'Service unavailable', message: err.message });
        }
    },
    onProxyReq: (proxyReq, req) => {
        // Extract user ID from JWT and forward to service (handle case-insensitive headers)
        const authHeader = req.headers['authorization'] || req.headers['Authorization'] as string | undefined;
        const userId = extractUserIdFromToken(authHeader);
        if (userId) {
            proxyReq.setHeader('x-user-id', userId);
        }
        logger.info(`Proxying ${req.method} ${req.url} -> ${target} (user: ${userId || 'anonymous'})`);
    },
    onProxyRes: (proxyRes, req) => {
        logger.info(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    },
});

// ============================================
// PHASE 1 SERVICES
// ============================================

// Auth Service Routes
app.use(
    `${API_PREFIX}/auth`,
    createProxyMiddleware(createProxyOptions(AUTH_SERVICE_URL, { [`^${API_PREFIX}/auth`]: '' }))
);

// Resume Service Routes
app.use(
    `${API_PREFIX}/resumes`,
    createProxyMiddleware(createProxyOptions(RESUME_SERVICE_URL, { [`^${API_PREFIX}/resumes`]: '' }))
);

// Scoring Service Routes
app.use(
    `${API_PREFIX}/scores`,
    createProxyMiddleware(createProxyOptions(SCORING_SERVICE_URL, { [`^${API_PREFIX}/scores`]: '' }))
);

// Job Roles - Route to skill service (has DB access)
app.use(
    `${API_PREFIX}/job-roles`,
    createProxyMiddleware(createProxyOptions(SKILL_SERVICE_URL, { [`^${API_PREFIX}/job-roles`]: '/job-roles' }))
);

// ============================================
// PHASE 2 SERVICES
// ============================================

// Skill Service Routes
app.use(
    `${API_PREFIX}/skills`,
    createProxyMiddleware(createProxyOptions(SKILL_SERVICE_URL, { [`^${API_PREFIX}/skills`]: '' }))
);

// Job Service Routes
app.use(
    `${API_PREFIX}/jobs`,
    createProxyMiddleware(createProxyOptions(JOB_SERVICE_URL, { [`^${API_PREFIX}/jobs`]: '' }))
);

// Application Service Routes
app.use(
    `${API_PREFIX}/applications`,
    createProxyMiddleware(createProxyOptions(APPLICATION_SERVICE_URL, { [`^${API_PREFIX}/applications`]: '' }))
);

// ============================================
// PHASE 3 SERVICES
// ============================================

const INTERVIEW_SERVICE_URL = process.env.INTERVIEW_SERVICE_URL || 'http://localhost:3007';

// Interview Service Routes
app.use(
    `${API_PREFIX}/interviews`,
    createProxyMiddleware(createProxyOptions(INTERVIEW_SERVICE_URL, { [`^${API_PREFIX}/interviews`]: '' }))
);

const VALIDATION_SERVICE_URL = process.env.VALIDATION_SERVICE_URL || 'http://localhost:3008';

// Validation Service Routes (Tests & Badges)
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

// Billing Service Routes (Subscriptions & Credits)
app.use(
    `${API_PREFIX}/billing`,
    createProxyMiddleware(createProxyOptions(BILLING_SERVICE_URL, { [`^${API_PREFIX}/billing`]: '' }))
);

// Admin Service Routes (User Management & Analytics)
app.use(
    `${API_PREFIX}/admin`,
    createProxyMiddleware(createProxyOptions(ADMIN_SERVICE_URL, { [`^${API_PREFIX}/admin`]: '' }))
);

// Recruiter Service Routes (Candidate Search & Job Postings)
app.use(
    `${API_PREFIX}/recruiter`,
    createProxyMiddleware(createProxyOptions(RECRUITER_SERVICE_URL, { [`^${API_PREFIX}/recruiter`]: '' }))
);

// JSON parsing for non-proxy routes
app.use(express.json());

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    logger.info(`🚀 API Gateway running on port ${PORT}`);
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
});

export default app;
