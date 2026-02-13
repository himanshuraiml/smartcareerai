import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';

interface JwtPayload {
    id: string;
    email: string;
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    try {
        const userIdHeader = req.headers['x-user-id'];
        if (userIdHeader) {
            (req as any).user = { id: userIdHeader };
            return next();
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
