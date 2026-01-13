import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './error.middleware';

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
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw createError('No token provided', 401, 'NO_TOKEN');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        req.user = decoded;
        next();
    } catch (error) {
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
