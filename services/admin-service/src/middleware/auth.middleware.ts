import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './error.middleware';

interface JwtPayload {
    id: string;
    email: string;
    role: string;
    adminForInstitutionId?: string;
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
        // Check for user ID header (passed by API gateway after JWT verification)
        const userIdHeader = req.headers['x-user-id'] as string | undefined;
        if (userIdHeader) {
            // Gateway already verified the JWT — decode (without verification) for role/email info
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

        // Fallback: verify JWT directly (for direct service calls without gateway)
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw createError('No token provided', 401, 'NO_TOKEN');
        }

        const token = authHeader.split(' ')[1];
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ [AdminService] Auth Error:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            next(createError('Invalid token', 401, 'INVALID_TOKEN'));
        } else {
            next(error);
        }
    }
};

export const adminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'ADMIN') {
        return next(createError('Admin access required', 403, 'FORBIDDEN'));
    }
    next();
};

export const institutionAdminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'INSTITUTION_ADMIN') {
        return next(createError('Institution admin access required', 403, 'FORBIDDEN'));
    }
    if (!req.user?.adminForInstitutionId) {
        return next(createError('No institution assigned to this admin', 403, 'NO_INSTITUTION'));
    }
    next();
};

