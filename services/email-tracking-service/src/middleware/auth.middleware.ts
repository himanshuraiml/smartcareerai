import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
    userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Check for user ID header (passed by API gateway after JWT verification)
        const userIdHeader = req.headers['x-user-id'] as string | undefined;
        if (userIdHeader) {
            req.userId = userIdHeader;
            return next();
        }

        // Fallback: verify JWT directly (for direct service calls without gateway)
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            logger.error('JWT_SECRET not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const decoded = jwt.verify(token, secret) as { userId: string; id: string };
        req.userId = decoded.userId || decoded.id;

        next();
    } catch (error) {
        logger.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};
