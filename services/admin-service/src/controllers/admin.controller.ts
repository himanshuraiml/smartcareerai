import { Request, Response, NextFunction } from 'express';
import { userService, UserFilters } from '../services/user.service';
import { analyticsService } from '../services/analytics.service';
import { UserRole } from '@prisma/client';
import { logger } from '../utils/logger';

export class AdminController {
    // ============================================
    // User Management
    // ============================================

    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const filters: UserFilters = {
                search: req.query.search as string,
                role: req.query.role as UserRole,
                isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
                institutionId: req.query.institution as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };

            const result = await userService.getUsers(filters);

            res.json({
                success: true,
                data: result.users,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await userService.getUserById(req.params.id);

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUserRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { role } = req.body;
            const user = await userService.updateUserRole(req.params.id, role);

            logger.info(`Updated role for user ${req.params.id} to ${role}`);

            res.json({
                success: true,
                data: user,
                message: `User role updated to ${role}`,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            await userService.deleteUser(req.params.id);

            res.json({
                success: true,
                message: 'User deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async toggleUserVerification(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await userService.toggleVerification(req.params.id);

            res.json({
                success: true,
                data: user,
                message: `User verification ${user.isVerified ? 'enabled' : 'disabled'}`,
            });
        } catch (error) {
            next(error);
        }
    }

    async resetUserData(req: Request, res: Response, next: NextFunction) {
        try {
            await userService.resetUserData(req.params.id);

            res.json({
                success: true,
                message: 'User data has been reset successfully. Progress cleared.',
            });
        } catch (error) {
            next(error);
        }
    }

    async exportUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const filters: UserFilters = {
                search: req.query.search as string,
                role: req.query.role as UserRole,
                isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
                institutionId: req.query.institution as string,
            };

            const users = await userService.getAllUsersForExport(filters);
            const Workbook = require('exceljs').Workbook;
            const workbook = new Workbook();
            const worksheet = workbook.addWorksheet('Users');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Role', key: 'role', width: 15 },
                { header: 'Verified', key: 'isVerified', width: 10 },
                { header: 'Institution Name', key: 'institutionName', width: 30 },
                { header: 'Institution Domain', key: 'institutionDomain', width: 25 },
                { header: 'Created At', key: 'createdAt', width: 20 },
            ];

            users.forEach((user: any) => {
                worksheet.addRow({
                    id: user.id,
                    name: user.name || '',
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified ? 'Yes' : 'No',
                    institutionName: user.institution?.name || '',
                    institutionDomain: user.institution?.domain || '',
                    createdAt: user.createdAt.toISOString().split('T')[0],
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=users_export.xlsx');

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // Analytics
    // ============================================

    async getOverview(req: Request, res: Response, next: NextFunction) {
        try {
            const overview = await analyticsService.getOverview();

            res.json({
                success: true,
                data: overview,
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserGrowth(req: Request, res: Response, next: NextFunction) {
        try {
            const days = parseInt(req.query.days as string) || 30;
            const growth = await analyticsService.getUserGrowth(days);

            res.json({
                success: true,
                data: growth,
            });
        } catch (error) {
            next(error);
        }
    }

    async getSubscriptionDistribution(req: Request, res: Response, next: NextFunction) {
        try {
            const distribution = await analyticsService.getSubscriptionDistribution();

            res.json({
                success: true,
                data: distribution,
            });
        } catch (error) {
            next(error);
        }
    }

    async getFeatureUsage(req: Request, res: Response, next: NextFunction) {
        try {
            const days = parseInt(req.query.days as string) || 30;
            const usage = await analyticsService.getFeatureUsage(days);

            res.json({
                success: true,
                data: usage,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTopJobRoles(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const roles = await analyticsService.getTopJobRoles(limit);

            res.json({
                success: true,
                data: roles,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const adminController = new AdminController();
