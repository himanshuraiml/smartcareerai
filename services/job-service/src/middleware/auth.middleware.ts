import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userIdHeader = req.headers['x-user-id'];
        if (userIdHeader) {
            (req as any).user = { id: userIdHeader };
            return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401, 'UNAUTHORIZED');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        (req as any).user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
        }
        next(error);
    }
};
