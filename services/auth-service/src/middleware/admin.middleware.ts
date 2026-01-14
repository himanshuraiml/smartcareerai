import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { prisma } from '../utils/prisma';

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = (req as any).user;

        if (!userData || !userData.id) {
            throw new AppError('Not authenticated', 401);
        }

        // Fetch full user to verify role
        const user = await prisma.user.findUnique({
            where: { id: userData.id }
        });

        if (!user || user.role !== 'ADMIN') {
            throw new AppError('Access denied. Admin privileges required.', 403);
        }

        // optional: attach full user to req for downstream controllers
        (req as any).user = user;

        next();
    } catch (error) {
        next(error);
    }
};
