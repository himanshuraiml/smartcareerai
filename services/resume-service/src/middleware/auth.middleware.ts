import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';

interface JwtPayload {
    id: string;
    email: string;
    role?: string;
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    try {
        // Check for user ID header (passed by API gateway after JWT verification)
        const userIdHeader = req.headers['x-user-id'];
        if (userIdHeader) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                if (!process.env.JWT_SECRET) throw new AppError('Server configuration error', 500);
                const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET) as JwtPayload;
                (req as any).user = { id: userIdHeader, role: decoded.role, email: decoded.email };
                return next();
            }
            throw new AppError('Authentication token required', 401);
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const JWT_SECRET = process.env.JWT_SECRET;

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        (req as any).user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError('Invalid token', 401));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new AppError('Token expired', 401));
        } else {
            next(error);
        }
    }
};
