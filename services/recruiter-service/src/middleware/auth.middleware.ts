import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from './error.middleware';

const prisma = new PrismaClient();

interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
            recruiter?: any;
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

/**
 * Lightweight middleware: verifies the user has RECRUITER (or ADMIN) role.
 * Does NOT require a Recruiter profile record to exist in the DB.
 * Use for routes that work with req.user.id directly (e.g. organization CRUD).
 */
export const recruiterRoleMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw createError('Authentication required', 401, 'NO_AUTH');
        }
        if (req.user.role !== 'RECRUITER' && req.user.role !== 'ADMIN') {
            throw createError('Recruiter access required', 403, 'FORBIDDEN');
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const recruiterMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw createError('Authentication required', 401, 'NO_AUTH');
        }

        // Check if user has recruiter role and profile
        if (req.user.role !== 'RECRUITER' && req.user.role !== 'ADMIN') {
            throw createError('Recruiter access required', 403, 'FORBIDDEN');
        }

        // Get recruiter profile
        const recruiter = await prisma.recruiter.findUnique({
            where: { userId: req.user.id },
        });

        if (!recruiter && req.user.role !== 'ADMIN') {
            throw createError('Recruiter profile not found', 404, 'RECRUITER_NOT_FOUND');
        }

        req.recruiter = recruiter;
        next();
    } catch (error) {
        next(error);
    }
};
