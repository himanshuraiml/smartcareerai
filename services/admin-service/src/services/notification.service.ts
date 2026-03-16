import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { emailService } from '../utils/email';

export enum NotificationChannel {
    EMAIL = 'EMAIL',
    WHATSAPP = 'WHATSAPP',
    PUSH = 'PUSH',
    IN_APP = 'IN_APP'
}

export interface BroadcastOptions {
    institutionId: string;
    title: string;
    message: string;
    targetGroup: 'STUDENTS' | 'FACULTY' | 'ALL';
    channels: NotificationChannel[];
    metadata?: any;
    ctaText?: string;
    ctaLink?: string;
}

class NotificationService {
    /**
     * Send professional communication to a group of users
     */
    async broadcast(options: BroadcastOptions) {
        const { institutionId, title, message, targetGroup, channels } = options;

        // Find recipient users
        const where: any = { institutionId };
        if (targetGroup === 'STUDENTS') {
            where.role = 'USER';
        } else if (targetGroup === 'FACULTY') {
            where.role = 'INSTITUTION_ADMIN';
        }

        const users = await prisma.user.findMany({
            where,
            select: { id: true, email: true, name: true }
        });

        logger.info(`Starting broadcast for ${users.length} users in ${institutionId}`);

        const results = {
            total: users.length,
            success: 0,
            failed: 0,
            channelResults: {} as Record<string, number>
        };

        // 1. In-App Notifications (always bulk)
        if (channels.includes(NotificationChannel.IN_APP)) {
            const notifications = users.map(user => ({
                userId: user.id,
                type: 'BROADCAST',
                title,
                message,
                metadata: options.metadata || {}
            }));

            await prisma.notification.createMany({
                data: notifications,
                skipDuplicates: true
            });
            results.channelResults[NotificationChannel.IN_APP] = users.length;
        }

        // 2. Email Notifications
        if (channels.includes(NotificationChannel.EMAIL)) {
            let emailCount = 0;
            // Send in batches to avoid overwhelming
            for (const user of users) {
                if (user.email) {
                    const html = emailService.getNotificationTemplate(user.name || 'User', title, message, options.ctaText, options.ctaLink);
                    const sent = await emailService.sendEmail({
                        to: user.email,
                        subject: title,
                        html,
                        userId: user.id,
                        emailType: 'BROADCAST'
                    });
                    if (sent) emailCount++;
                }
            }
            results.channelResults[NotificationChannel.EMAIL] = emailCount;
        }

        // 3. Mock WhatsApp / Push (Future Expansion)
        if (channels.includes(NotificationChannel.WHATSAPP)) {
            logger.info('WhatsApp broadcast requested - mock implementation');
            results.channelResults[NotificationChannel.WHATSAPP] = users.length;
        }

        if (channels.includes(NotificationChannel.PUSH)) {
            logger.info('Push broadcast requested - mock implementation');
            results.channelResults[NotificationChannel.PUSH] = users.length;
        }

        return results;
    }

    async getInstitutionNotifications(institutionId: string) {
        // Find all notifications sent to users of this institution
        return prisma.notification.findMany({
            where: {
                user: { institutionId }
            },
            include: {
                user: { select: { name: true, email: true } }
            },
            take: 50,
            orderBy: { createdAt: 'desc' }
        });
    }
}

export const notificationService = new NotificationService();
