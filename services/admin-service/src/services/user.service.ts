import { PrismaClient, UserRole } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface UserFilters {
    search?: string;
    role?: UserRole;
    isVerified?: boolean;
    page?: number;
    limit?: number;
}

export class UserService {
    /**
     * Get all users with pagination and filters
     */
    async getUsers(filters: UserFilters) {
        const { search, role, isVerified, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (isVerified !== undefined) {
            where.isVerified = isVerified;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatarUrl: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    subscription: {
                        include: { plan: true },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get user by ID with full details
     */
    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                subscription: {
                    include: { plan: true },
                },
                credits: true,
                resumes: {
                    select: { id: true, fileName: true, createdAt: true },
                },
                atsScores: {
                    select: { id: true, overallScore: true, jobRole: true, createdAt: true },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
                interviews: {
                    select: { id: true, type: true, status: true, overallScore: true, createdAt: true },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            throw createError('User not found', 404, 'USER_NOT_FOUND');
        }

        return user;
    }

    /**
     * Update user role
     */
    async updateUserRole(userId: string, role: UserRole) {
        return prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
    }

    /**
     * Delete user and all related data
     */
    async deleteUser(userId: string) {
        // Prisma cascade will handle related data deletion
        await prisma.user.delete({
            where: { id: userId },
        });

        logger.info(`Deleted user: ${userId}`);
    }

    /**
     * Toggle user verification
     */
    async toggleVerification(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isVerified: true },
        });

        if (!user) {
            throw createError('User not found', 404, 'USER_NOT_FOUND');
        }

        return prisma.user.update({
            where: { id: userId },
            data: { isVerified: !user.isVerified },
            select: {
                id: true,
                email: true,
                isVerified: true,
            },
        });
    }
}

export const userService = new UserService();
