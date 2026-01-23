import { PrismaClient } from '@prisma/client';
import { GmailService, JobEmail } from './gmail.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface GetTrackedEmailsOptions {
    page: number;
    limit: number;
    status?: string;
}

export class EmailTrackingService {
    private gmailService: GmailService;

    constructor() {
        this.gmailService = new GmailService();
    }

    /**
     * Get email connection status for user
     */
    async getConnectionStatus(userId: string) {
        const connection = await prisma.emailConnection.findUnique({
            where: { userId },
            select: {
                email: true,
                isActive: true,
                lastSyncAt: true,
                createdAt: true
            }
        });

        return connection || { connected: false };
    }

    /**
     * Disconnect email for user
     */
    async disconnectEmail(userId: string): Promise<void> {
        await prisma.emailConnection.update({
            where: { userId },
            data: { isActive: false }
        });

        logger.info(`Email disconnected for user ${userId}`);
    }

    /**
     * Get tracked emails for user
     */
    async getTrackedEmails(userId: string, options: GetTrackedEmailsOptions) {
        const { page, limit, status } = options;
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (status) {
            where.type = status;
        }

        const [emails, total] = await Promise.all([
            prisma.trackedEmail.findMany({
                where,
                orderBy: { receivedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.trackedEmail.count({ where })
        ]);

        return {
            emails,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get specific tracked email
     */
    async getTrackedEmailById(userId: string, id: string) {
        return prisma.trackedEmail.findFirst({
            where: { id, userId }
        });
    }

    /**
     * Sync emails for a user
     */
    async syncEmails(userId: string): Promise<void> {
        logger.info(`Starting email sync for user ${userId}`);

        try {
            const jobEmails = await this.gmailService.scanJobEmails(userId);

            for (const email of jobEmails) {
                await this.upsertTrackedEmail(userId, email);
            }

            // Update last sync time
            await prisma.emailConnection.update({
                where: { userId },
                data: { lastSyncAt: new Date() }
            });

            logger.info(`Email sync completed for user ${userId}: ${jobEmails.length} emails processed`);
        } catch (error) {
            logger.error(`Email sync failed for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Upsert tracked email
     */
    private async upsertTrackedEmail(userId: string, email: JobEmail): Promise<void> {
        await prisma.trackedEmail.upsert({
            where: {
                userId_messageId: {
                    userId,
                    messageId: email.messageId
                }
            },
            update: {
                subject: email.subject,
                sender: email.from,
                snippet: email.snippet,
                type: email.type,
                companyName: email.companyName
            },
            create: {
                userId,
                messageId: email.messageId,
                subject: email.subject,
                sender: email.from,
                snippet: email.snippet,
                type: email.type,
                companyName: email.companyName,
                receivedAt: email.date,
                isRead: false
            }
        });
    }

    /**
     * Sync all active connections
     */
    async syncAllActiveConnections(): Promise<void> {
        const connections = await prisma.emailConnection.findMany({
            where: { isActive: true },
            select: { userId: true }
        });

        logger.info(`Starting bulk email sync for ${connections.length} users`);

        for (const connection of connections) {
            try {
                await this.syncEmails(connection.userId);
            } catch (error) {
                logger.error(`Sync failed for user ${connection.userId}:`, error);
            }
        }
    }
}
