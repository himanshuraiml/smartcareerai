import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userIdHeader = req.headers['x-user-id'] as string | undefined;
        if (userIdHeader) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                const secret = process.env.JWT_SECRET;
                if (!secret) {
                    loggerError(new Error('JWT_SECRET not configured'));
                    return res.status(500).json({ success: false, error: 'Server configuration error' });
                }
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, secret) as JwtPayload;
                req.user = { ...decoded, id: userIdHeader };
                return next();
            }
            return res.status(401).json({ success: false, error: 'Authentication token required' });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            loggerError(new Error('JWT_SECRET not configured'));
            return res.status(500).json({ success: false, error: 'Server configuration error' });
        }
        const decoded = jwt.verify(token, secret) as JwtPayload;

        req.user = decoded;
        next();
    } catch (error: any) {
        loggerError(error);
        return res.status(401).json({ success: false, error: 'Unauthorized: ' + error.message });
    }
};

function loggerError(error: any) {
    console.error('[Notification Auth Middleware] Error:', error.message);
}
