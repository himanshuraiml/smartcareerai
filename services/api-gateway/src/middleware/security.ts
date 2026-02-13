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
    max: 50, // 50 attempts per window (covers login, register, refresh, leaderboard)
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

    // Cross-Origin policies for Google Sign-in popups
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');

    // Permissions policy - allow camera/microphone for interview features
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');

    // Content Security Policy
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; " +
        "img-src 'self' data: https:; " +
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

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key] as string);
            }
        });
    }

    // Sanitize body (for non-file uploads)
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    next();
};

function sanitizeString(str: string): string {
    // Remove potential XSS vectors
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string' ? sanitizeString(item) :
                    typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) :
                        item
            );
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

// ============================================
// SQL INJECTION PREVENTION
// ============================================

export const sqlInjectionPrevention = (req: Request, res: Response, next: NextFunction): void => {
    const sqlInjectionPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
        /((\%27)|(\'))union/i,
        /exec(\s|\+)+(s|x)p\w+/i,
    ];

    const checkValue = (value: string): boolean => {
        return sqlInjectionPatterns.some(pattern => pattern.test(value));
    };

    const checkObject = (obj: unknown): boolean => {
        if (typeof obj === 'string') {
            return checkValue(obj);
        }
        if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).some(checkObject);
        }
        return false;
    };

    if (checkObject(req.query) || checkObject(req.body) || checkObject(req.params)) {
        logger.warn({
            type: 'SQL_INJECTION_ATTEMPT',
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString(),
        });
        res.status(400).json({ error: 'Invalid input detected' });
        return;
    }

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
