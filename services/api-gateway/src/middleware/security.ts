import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * OWASP Security Middleware
 * Implements security best practices for production
 */

// ============================================
// RATE LIMITERS (Granular per endpoint type)
// ============================================

// Strict rate limit for authentication endpoints
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 50 : 500, // 50 in prod, 500 in dev
    message: {
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use IP + user agent for better accuracy
        return `${req.ip}-${req.headers['user-agent'] || 'unknown'}`;
    },
    handler: (req, res) => {
        logger.warn({
            type: 'RATE_LIMIT_AUTH',
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString(),
        });
        res.status(429).json({
            error: 'Too many authentication attempts. Please try again later.',
            retryAfter: 15 * 60
        });
    }
});

// Rate limit for password reset
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        error: 'Too many password reset requests. Please try again later.',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limit for file uploads
export const uploadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
        error: 'Upload limit exceeded. Please try again later.',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limit for AI-powered endpoints (expensive operations)
export const aiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 AI requests per hour
    message: {
        error: 'AI processing limit exceeded. Please try again later.',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// SECURITY HEADERS (OWASP Compliance)
// ============================================

export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy - allow Google to receive referrer for auth
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

    // Cross-Origin policies — intentionally omitted here; handled by helmet config
    // in the gateway to avoid conflicting with CORS.

    // Permissions policy - allow camera/microphone for interview features
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');

    // Content Security Policy
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; " +
        "img-src 'self' data: https: blob: http://localhost:*; " +
        "font-src 'self' data: https://fonts.gstatic.com; " +
        "connect-src 'self' http://localhost:* https:; " +
        "frame-src https://accounts.google.com; " +
        "frame-ancestors 'none';"
    );

    // Strict Transport Security (HSTS)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
};

// ============================================
// INPUT SANITIZATION
// ============================================

// Body mutation removed: Prisma's parameterized queries prevent SQLi natively,
// React's JSX escaping and DOMPurify (used at render sites) prevent XSS.
// Regex-based body rewriting caused false positives on legitimate content
// (apostrophes, code snippets, CSS) and gave a false sense of security
// without blocking encoded or attribute-based payloads.
export const sanitizeInput = (_req: Request, _res: Response, next: NextFunction): void => {
    next();
};

// ============================================
// SQL INJECTION PREVENTION
// ============================================
// Regex-based SQL injection filtering is removed: all database access goes
// through Prisma's parameterized queries which prevent injection natively.
// Regex patterns were causing false positives on legitimate input such as
// apostrophes in names ("O'Brien"), C# in search queries, and job descriptions.

export const sqlInjectionPrevention = (_req: Request, _res: Response, next: NextFunction): void => {
    next();
};

// ============================================
// REQUEST SIZE LIMITS
// ============================================

export const requestSizeLimits = {
    json: '10mb',
    urlencoded: '10mb',
    raw: '50mb', // For file uploads
};

// ============================================
// IP BLOCKLIST CHECK
// ============================================

const blockedIPs = new Set<string>();

export const ipBlocklistCheck = (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.socket.remoteAddress || '';

    if (blockedIPs.has(clientIP)) {
        logger.warn({
            type: 'BLOCKED_IP_ACCESS',
            ip: clientIP,
            path: req.path,
            timestamp: new Date().toISOString(),
        });
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    next();
};

export const addToBlocklist = (ip: string): void => {
    blockedIPs.add(ip);
    logger.info(`IP ${ip} added to blocklist`);
};

export const removeFromBlocklist = (ip: string): void => {
    blockedIPs.delete(ip);
    logger.info(`IP ${ip} removed from blocklist`);
};

// ============================================
// SUSPICIOUS ACTIVITY DETECTION
// ============================================

const suspiciousActivityTracker = new Map<string, { count: number; firstSeen: number }>();

export const suspiciousActivityDetection = (req: Request, _res: Response, next: NextFunction): void => {
    const clientIP = req.ip || '';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const threshold = 100; // 100 requests per minute triggers alert

    const activity = suspiciousActivityTracker.get(clientIP);

    if (activity) {
        if (now - activity.firstSeen > windowMs) {
            // Reset window
            suspiciousActivityTracker.set(clientIP, { count: 1, firstSeen: now });
        } else {
            activity.count++;
            if (activity.count > threshold) {
                logger.warn({
                    type: 'SUSPICIOUS_ACTIVITY',
                    ip: clientIP,
                    requestCount: activity.count,
                    path: req.path,
                    timestamp: new Date().toISOString(),
                });
            }
        }
    } else {
        suspiciousActivityTracker.set(clientIP, { count: 1, firstSeen: now });
    }

    next();
};

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    const windowMs = 60 * 1000;

    for (const [ip, activity] of suspiciousActivityTracker.entries()) {
        if (now - activity.firstSeen > windowMs) {
            suspiciousActivityTracker.delete(ip);
        }
    }
}, 60 * 1000);
