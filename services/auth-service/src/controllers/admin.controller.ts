import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AdminController {

    // Get all users with pagination and filtering
    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string;
            const role = req.query.role as string;

            const skip = (page - 1) * limit;

            const where: any = {};

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (role && role !== 'ALL') {
                where.role = role;
            }

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isVerified: true,
                        createdAt: true,
                    }
                }),
                prisma.user.count({ where }),
            ]);

            res.json({
                success: true,
                data: users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update user role
    async updateUserRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!['USER', 'ADMIN', 'RECRUITER'].includes(role)) {
                throw new AppError('Invalid role', 400);
            }

            const user = await prisma.user.update({
                where: { id },
                data: { role },
                select: { id: true, email: true, role: true }
            });

            logger.info(`User role updated: ${user.email} -> ${role}`);

            res.json({
                success: true,
                data: user,
                message: 'User role updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete user
    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Prevent deleting self (though frontend should also block this)
            const requesterId = (req as any).user.id;
            if (id === requesterId) {
                throw new AppError('Cannot delete your own admin account', 400);
            }

            await prisma.user.delete({
                where: { id }
            });

            logger.info(`User deleted by admin: ${id}`);

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}
