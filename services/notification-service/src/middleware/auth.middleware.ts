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
                const token = authHeader.split(' ')[1];
                const decoded = jwt.decode(token) as JwtPayload | null;
                if (decoded) {
                    req.user = { ...decoded, id: userIdHeader };
                    return next();
                }
            }
            req.user = { id: userIdHeader, email: '', role: '' } as JwtPayload;
            return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'fallback_secret';
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
