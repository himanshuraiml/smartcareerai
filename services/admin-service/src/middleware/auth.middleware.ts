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
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw createError('No token provided', 401, 'NO_TOKEN');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        console.log('🔐 [AdminService] Decoded Token:', JSON.stringify(decoded, null, 2));

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
    console.log('👮 [AdminService] Checking Role:', req.user?.role);
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
    console.log('🏫 [AdminService] Middleware Check');
    console.log('   User Role:', req.user?.role);
    console.log('   Institution ID:', req.user?.adminForInstitutionId);

    if (req.user?.role !== 'INSTITUTION_ADMIN') {
        console.log('❌ Role Mismatch');
        return next(createError('Institution admin access required', 403, 'FORBIDDEN'));
    }
    if (!req.user?.adminForInstitutionId) {
        console.log('❌ Missing Institution ID in Token');
        return next(createError('No institution assigned to this admin', 403, 'NO_INSTITUTION'));
    }
    console.log('✅ Access Granted');
    next();
};
