import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export class ActivityController {
    /**
     * Get paginated activity logs
     */
    async getActivityLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                page = '1',
                limit = '20',
                type,
                status,
                search,
                startDate,
                endDate
            } = req.query;

            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const where: any = {};

            if (type && type !== 'ALL') {
                where.type = type;
            }

            if (status) {
                where.status = status;
            }

            if (search) {
                where.OR = [
                    { message: { contains: search as string, mode: 'insensitive' } },
                    { userEmail: { contains: search as string, mode: 'insensitive' } }
                ];
            }

            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate as string);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate as string);
                }
            }

            const [logs, total] = await Promise.all([
                prisma.activityLog.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limitNum
                }),
                prisma.activityLog.count({ where })
            ]);

            res.json({
                success: true,
                data: logs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            });
        } catch (error) {
            logger.error('Error fetching activity logs:', error);
            next(error);
        }
    }

    /**
     * Get activity statistics
     */
    async getActivityStats(req: Request, res: Response, next: NextFunction) {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const [
                totalToday,
                totalWeek,
                byType,
                byStatus,
                recentActivity
            ] = await Promise.all([
                prisma.activityLog.count({
                    where: { createdAt: { gte: today } }
                }),
                prisma.activityLog.count({
                    where: { createdAt: { gte: sevenDaysAgo } }
                }),
                prisma.activityLog.groupBy({
                    by: ['type'],
                    _count: { id: true },
                    where: { createdAt: { gte: sevenDaysAgo } },
                    orderBy: { _count: { id: 'desc' } },
                    take: 5
                }),
                prisma.activityLog.groupBy({
                    by: ['status'],
                    _count: { id: true },
                    where: { createdAt: { gte: sevenDaysAgo } }
                }),
                prisma.activityLog.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 10
                })
            ]);

            res.json({
                success: true,
                data: {
                    totalToday,
                    totalWeek,
                    byType: byType.map(t => ({
                        type: t.type,
                        count: t._count.id
                    })),
                    byStatus: byStatus.map(s => ({
                        status: s.status,
                        count: s._count.id
                    })),
                    recentActivity
                }
            });
        } catch (error) {
            logger.error('Error fetching activity stats:', error);
            next(error);
        }
    }

    /**
     * Get compliance and audit logs
     */
    async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = '1', limit = '20', search } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const where: any = {
                type: {
                    in: ['GDPR_EXPORT', 'GDPR_DELETE', 'COMPLIANCE_AUDIT']
                }
            };

            if (search) {
                where.OR = [
                    { message: { contains: search as string, mode: 'insensitive' } },
                    { userEmail: { contains: search as string, mode: 'insensitive' } }
                ];
            }

            const [logs, total] = await Promise.all([
                prisma.activityLog.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limitNum
                }),
                prisma.activityLog.count({ where })
            ]);

            res.json({
                success: true,
                data: logs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            });
        } catch (error) {
            logger.error('Error fetching audit logs:', error);
            next(error);
        }
    }

    /**
     * Log a new activity (internal use)
     */
    static async log(data: {
        type: string;
        message: string;
        userId?: string;
        userEmail?: string;
        metadata?: any;
        ipAddress?: string;
        status?: 'SUCCESS' | 'WARNING' | 'ERROR';
    }) {
        try {
            await prisma.activityLog.create({
                data: {
                    type: data.type as any,
                    message: data.message,
                    userId: data.userId,
                    userEmail: data.userEmail,
                    metadata: data.metadata,
                    ipAddress: data.ipAddress,
                    status: (data.status as any) || 'SUCCESS'
                }
            });
        } catch (error) {
            logger.error('Failed to log activity:', error);
        }
    }
}

export const activityController = new ActivityController();
