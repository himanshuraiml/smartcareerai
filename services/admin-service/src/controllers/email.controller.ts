import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { emailService } from '../utils/email';
import { logger } from '../utils/logger';

export class EmailController {
    /**
     * Get email logs with pagination and filters
     */
    async getEmailLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                page = '1',
                limit = '20',
                emailType,
                status,
                search,
                startDate,
                endDate
            } = req.query;

            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const where: any = {};

            if (emailType) {
                where.emailType = emailType;
            }

            if (status) {
                where.status = status;
            }

            if (search) {
                where.OR = [
                    { recipientEmail: { contains: search as string, mode: 'insensitive' } },
                    { subject: { contains: search as string, mode: 'insensitive' } }
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
                prisma.emailLog.findMany({
                    where,
                    include: {
                        template: {
                            select: { name: true, category: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limitNum
                }),
                prisma.emailLog.count({ where })
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
            next(error);
        }
    }

    /**
     * Get email statistics
     */
    async getEmailStats(req: Request, res: Response, next: NextFunction) {
        try {
            const [
                totalSent,
                totalFailed,
                byType,
                recentActivity
            ] = await Promise.all([
                prisma.emailLog.count({ where: { status: 'SENT' } }),
                prisma.emailLog.count({ where: { status: 'FAILED' } }),
                prisma.emailLog.groupBy({
                    by: ['emailType'],
                    _count: { id: true },
                    where: { status: 'SENT' }
                }),
                prisma.emailLog.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        recipientEmail: true,
                        subject: true,
                        emailType: true,
                        status: true,
                        createdAt: true
                    }
                })
            ]);

            // Get stats for last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const dailyStats = await prisma.emailLog.groupBy({
                by: ['status'],
                _count: { id: true },
                where: {
                    createdAt: { gte: sevenDaysAgo }
                }
            });

            res.json({
                success: true,
                data: {
                    totalSent,
                    totalFailed,
                    byType: byType.map(t => ({
                        type: t.emailType,
                        count: t._count.id
                    })),
                    recentActivity,
                    weeklyStats: dailyStats.map(s => ({
                        status: s.status,
                        count: s._count.id
                    }))
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all email templates
     */
    async getTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const templates = await prisma.emailTemplate.findMany({
                orderBy: { createdAt: 'desc' }
            });

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new email template
     */
    async createTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, subject, htmlContent, textContent, category, variables } = req.body;
            const userId = req.headers['x-user-id'] as string;

            const existing = await prisma.emailTemplate.findUnique({ where: { name } });
            if (existing) {
                throw new AppError('Template with this name already exists', 400);
            }

            const template = await prisma.emailTemplate.create({
                data: {
                    name,
                    subject,
                    htmlContent,
                    textContent,
                    category: category || 'GENERAL',
                    variables: variables || [],
                    createdBy: userId
                }
            });

            res.status(201).json({
                success: true,
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an email template
     */
    async updateTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name, subject, htmlContent, textContent, category, variables, isActive } = req.body;

            const template = await prisma.emailTemplate.findUnique({ where: { id } });
            if (!template) {
                throw new AppError('Template not found', 404);
            }

            const updated = await prisma.emailTemplate.update({
                where: { id },
                data: {
                    name,
                    subject,
                    htmlContent,
                    textContent,
                    category,
                    variables,
                    isActive
                }
            });

            res.json({
                success: true,
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete an email template
     */
    async deleteTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const template = await prisma.emailTemplate.findUnique({ where: { id } });
            if (!template) {
                throw new AppError('Template not found', 404);
            }

            await prisma.emailTemplate.delete({ where: { id } });

            res.json({
                success: true,
                message: 'Template deleted'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Send bulk email to users
     */
    async sendBulkEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const { templateId, recipientType, customRecipients, subject, content } = req.body;
            const userId = req.headers['x-user-id'] as string;

            let recipients: Array<{ email: string; userId?: string; variables?: Record<string, string> }> = [];

            // Get recipients based on type
            if (recipientType === 'all_students') {
                const users = await prisma.user.findMany({
                    where: { role: 'USER', isVerified: true },
                    select: { id: true, email: true, name: true }
                });
                recipients = users.map(u => ({
                    email: u.email,
                    userId: u.id,
                    variables: { userName: u.name || 'Student' }
                }));
            } else if (recipientType === 'all_recruiters') {
                const users = await prisma.user.findMany({
                    where: { role: 'RECRUITER', isVerified: true },
                    select: { id: true, email: true, name: true }
                });
                recipients = users.map(u => ({
                    email: u.email,
                    userId: u.id,
                    variables: { userName: u.name || 'Recruiter' }
                }));
            } else if (recipientType === 'all_institution_admins') {
                const users = await prisma.user.findMany({
                    where: { role: 'INSTITUTION_ADMIN', isVerified: true },
                    select: { id: true, email: true, name: true }
                });
                recipients = users.map(u => ({
                    email: u.email,
                    userId: u.id,
                    variables: { userName: u.name || 'Admin' }
                }));
            } else if (recipientType === 'custom' && customRecipients) {
                recipients = customRecipients.map((r: any) => ({
                    email: r.email,
                    userId: r.userId,
                    variables: { userName: r.name || 'User' }
                }));
            } else {
                throw new AppError('Invalid recipient type or missing recipients', 400);
            }

            if (recipients.length === 0) {
                throw new AppError('No recipients found', 400);
            }

            // If using a template
            if (templateId) {
                const result = await emailService.sendBulkEmail({
                    recipients,
                    templateId,
                    sentBy: userId
                });

                res.json({
                    success: true,
                    message: `Sent to ${result.success} recipients, ${result.failed} failed`,
                    data: result
                });
            } else if (subject && content) {
                // Direct send without template
                let success = 0;
                let failed = 0;

                for (const recipient of recipients) {
                    const sent = await emailService.sendNewsletter(
                        recipient.email,
                        recipient.variables?.userName || 'User',
                        subject,
                        content,
                        recipient.userId,
                        userId
                    );
                    if (sent) success++;
                    else failed++;
                }

                res.json({
                    success: true,
                    message: `Sent to ${success} recipients, ${failed} failed`,
                    data: { success, failed }
                });
            } else {
                throw new AppError('Either templateId or subject+content required', 400);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Send a single test email
     */
    async sendTestEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, templateId, emailType, subject, content } = req.body;
            const userId = req.headers['x-user-id'] as string;

            if (!email) {
                throw new AppError('Email address required', 400);
            }

            let sent = false;

            if (templateId) {
                const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
                if (!template) {
                    throw new AppError('Template not found', 404);
                }

                // Replace test variables
                let html = template.htmlContent
                    .replace(/{{userName}}/g, 'Test User')
                    .replace(/{{companyName}}/g, 'Test Company')
                    .replace(/{{institutionName}}/g, 'Test Institution');

                sent = await emailService.sendEmail({
                    to: email,
                    subject: template.subject.replace(/{{.*?}}/g, 'Test'),
                    html,
                    text: template.textContent || undefined,
                    emailType: 'OTHER',
                    metadata: { isTest: true },
                    sentBy: userId
                });
            } else if (emailType === 'newsletter' && subject && content) {
                sent = await emailService.sendNewsletter(email, 'Test User', subject, content, undefined, userId);
            } else if (emailType === 'promotional' && subject && content) {
                sent = await emailService.sendPromotionalEmail(
                    email,
                    'Test User',
                    subject,
                    'Test Headline',
                    content,
                    'Learn More',
                    'https://placenxt.com',
                    undefined,
                    userId
                );
            } else if (emailType === 'student_welcome') {
                sent = await emailService.sendStudentWelcome(email, 'Test User', 'Test Institution', userId);
            } else if (emailType === 'recruiter_welcome') {
                sent = await emailService.sendRecruiterWelcome(email, 'Test User', 'Test Company', userId);
            } else {
                throw new AppError('Invalid email type or missing content', 400);
            }

            if (sent) {
                res.json({
                    success: true,
                    message: `Test email sent to ${email}`
                });
            } else {
                throw new AppError('Failed to send test email. Check SMTP settings.', 500);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get pending invitation emails (institution admin invites)
     */
    async getPendingInvites(req: Request, res: Response, next: NextFunction) {
        try {
            const invites = await prisma.emailLog.findMany({
                where: {
                    emailType: 'INSTITUTION_ADMIN_INVITE'
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            // Get associated user verification status
            const emails = invites.map(i => i.recipientEmail);
            const users = await prisma.user.findMany({
                where: {
                    email: { in: emails },
                    role: 'INSTITUTION_ADMIN'
                },
                select: {
                    email: true,
                    isVerified: true,
                    name: true,
                    adminForInstitution: {
                        select: { name: true }
                    }
                }
            });

            const userMap = new Map(users.map(u => [u.email, u]));

            const enrichedInvites = invites.map(invite => ({
                ...invite,
                user: userMap.get(invite.recipientEmail) || null,
                isAccepted: userMap.get(invite.recipientEmail)?.isVerified || false
            }));

            res.json({
                success: true,
                data: enrichedInvites
            });
        } catch (error) {
            next(error);
        }
    }
}

export const emailController = new EmailController();
