import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { whatsappService } from './whatsapp.service';
import nodemailer from 'nodemailer';

export type NotificationType = 'streak' | 'league' | 'challenge' | 'mastery' | 'community' | 'system' | 'general';
export type NotificationCategory = 'info' | 'success' | 'warning' | 'urgent';
export type DeliveryChannel = 'in_app' | 'email' | 'whatsapp' | 'push';

export interface NotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
    channels: DeliveryChannel[];
    category?: NotificationCategory;
    expiresInDays?: number;
}

// Nodemailer SMTP Transporter
function getSMTPTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        return nodemailer.createTransport({
            host,
            port,
            secure: port === 465 || process.env.SMTP_SECURE === 'true',
            auth: { user, pass }
        });
    }
    return null;
}

const smtpTransporter = getSMTPTransporter();
const EMAIL_FROM = process.env.EMAIL_FROM || 'PlaceNxt <noreply@placenxt.com>';

export class NotificationService {
    /**
     * Dispatch a notification checking user opt-in/opt-out preferences and quiet hours.
     */
    async send(params: NotificationParams): Promise<any> {
        const { userId, type, title, message, metadata, channels, category = 'info', expiresInDays = 30 } = params;

        logger.info(`Dispatching notification for user ${userId}: [${type}] ${title}`);

        // 1. Ensure user has preferences, create default if not
        let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
        if (!prefs) {
            prefs = await prisma.notificationPreference.create({
                data: { userId }
            });
        }

        // 2. Check if this category is enabled
        const isCategoryEnabled = this.isCategoryEnabled(type, prefs);
        if (!isCategoryEnabled) {
            logger.info(`Notification category [${type}] is disabled for user ${userId}. Skipping.`);
            return null;
        }

        // 3. Check quiet hours (unless it's urgent)
        if (category !== 'urgent' && this.isInQuietHours(prefs)) {
            logger.info(`User ${userId} is currently in Quiet Hours. Delaying/Skipping non-urgent notification.`);
            return null;
        }

        const deliveryLog: Record<string, string | boolean> = {};
        let notificationRecord: any = null;

        // 4. Send to In-App channel if enabled and requested
        if (channels.includes('in_app') && prefs.inAppEnabled) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);

            notificationRecord = await prisma.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    message,
                    metadata: metadata ? (metadata as any) : undefined,
                    category,
                    channels: ['in_app'],
                    expiresAt
                }
            });
            deliveryLog.in_app = new Date().toISOString();
        }

        // 5. Send to WhatsApp if enabled and requested
        if (channels.includes('whatsapp') && prefs.whatsappEnabled && prefs.whatsappPhone) {
            // Map type to WhatsApp templates
            let templateName = 'general_alert';
            let templateParams = [title, message];

            if (type === 'streak') {
                templateName = 'streak_at_risk';
                // Params: name, streakCount, CTA
                templateParams = [
                    (await prisma.user.findUnique({ where: { id: userId } }))?.name || 'Student',
                    String(metadata?.streakCount || 0),
                    'http://localhost:3100/dashboard/daily'
                ];
            } else if (type === 'league') {
                templateName = 'league_demotion_warning';
                // Params: name, rank, tier, xpNeeded, CTA
                templateParams = [
                    (await prisma.user.findUnique({ where: { id: userId } }))?.name || 'Student',
                    String(metadata?.rank || 0),
                    metadata?.tier || 'Bronze',
                    String(metadata?.xpNeeded || 50),
                    'http://localhost:3100/dashboard/daily'
                ];
            }

            const waResult = await whatsappService.sendTemplate({
                phone: prefs.whatsappPhone,
                templateName,
                templateParams
            });

            if (waResult.success) {
                deliveryLog.whatsapp = new Date().toISOString();
            } else {
                deliveryLog.whatsapp = `FAILED: ${waResult.error}`;
            }
        }

        // 6. Send to Email if enabled and requested
        if (channels.includes('email') && prefs.emailEnabled) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && user.email) {
                const mailSent = await this.sendEmail(user.email, title, message);
                if (mailSent) {
                    deliveryLog.email = new Date().toISOString();
                } else {
                    deliveryLog.email = 'FAILED: SMTP send error';
                }
            }
        }

        // 7. Update deliveredAt log on in-app record
        if (notificationRecord && Object.keys(deliveryLog).length > 0) {
            await prisma.notification.update({
                where: { id: notificationRecord.id },
                data: { deliveredAt: deliveryLog }
            });
        }

        return notificationRecord;
    }

    /**
     * Helper to send a simple transactional email
     */
    private async sendEmail(to: string, subject: string, bodyText: string): Promise<boolean> {
        if (!smtpTransporter) {
            logger.warn(`SMTP is not configured. Could not send email to ${to}: ${subject}`);
            return false;
        }

        try {
            await smtpTransporter.sendMail({
                from: EMAIL_FROM,
                to,
                subject,
                text: bodyText,
                html: `
                <div style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
                    <h2>SmartCareerAI Alert</h2>
                    <p style="font-size: 16px;">${bodyText}</p>
                    <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #666;">This email was sent automatically. Manage your email preferences in settings.</p>
                </div>`
            });
            logger.info(`Email successfully sent to ${to}: ${subject}`);
            return true;
        } catch (error: any) {
            logger.error(`SMTP sending failed to ${to}: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if a notification category is toggled on in the user's settings.
     */
    private isCategoryEnabled(type: NotificationType, prefs: any): boolean {
        switch (type) {
            case 'streak': return prefs.streakAlerts;
            case 'league': return prefs.leagueAlerts;
            case 'challenge': return prefs.challengeAlerts;
            case 'mastery': return prefs.masteryAlerts;
            case 'community': return prefs.communityAlerts;
            case 'system': return prefs.systemAlerts;
            default: return true;
        }
    }

    /**
     * Check if user is currently inside their configured quiet hours window.
     */
    private isInQuietHours(prefs: any): boolean {
        if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

        try {
            const tz = prefs.timezone || 'Asia/Kolkata';
            const now = new Date();
            
            // Format current local time in target timezone
            const localTimeString = now.toLocaleTimeString('en-US', {
                timeZone: tz,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });

            const [currentHour, currentMin] = localTimeString.split(':').map(Number);
            const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
            const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);

            const currentTime = currentHour * 60 + currentMin;
            const startTime = startHour * 60 + startMin;
            const endTime = endHour * 60 + endMin;

            if (startTime < endTime) {
                // Interval within same day (e.g. 22:00 to 08:00? No, that crosses midnight. 08:00 to 17:00 does not cross midnight)
                return currentTime >= startTime && currentTime <= endTime;
            } else {
                // Interval crosses midnight (e.g. 22:00 to 08:00)
                return currentTime >= startTime || currentTime <= endTime;
            }
        } catch (error) {
            logger.error('Error computing quiet hours window:', error);
            return false;
        }
    }

    /**
     * Get paginated notifications for user.
     */
    async getUserNotifications(userId: string, options: { page?: number; limit?: number; unreadOnly?: boolean }) {
        const { page = 1, limit = 20, unreadOnly = false } = options;
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (unreadOnly) {
            where.isRead = false;
        }

        const [items, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.notification.count({ where })
        ]);

        return {
            items,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Mark single notification as read.
     */
    async markAsRead(userId: string, notificationId: string) {
        await prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    }

    /**
     * Mark all notifications as read for user.
     */
    async markAllAsRead(userId: string) {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    }

    /**
     * Get unread count.
     */
    async getUnreadCount(userId: string): Promise<number> {
        return prisma.notification.count({
            where: { userId, isRead: false }
        });
    }

    /**
     * Get preferences.
     */
    async getPreferences(userId: string) {
        let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
        if (!prefs) {
            prefs = await prisma.notificationPreference.create({
                data: { userId }
            });
        }
        return prefs;
    }

    /**
     * Update preferences.
     */
    async updatePreferences(userId: string, data: any) {
        await prisma.notificationPreference.upsert({
            where: { userId },
            create: {
                userId,
                ...data
            },
            update: data
        });
    }
}

export const notificationService = new NotificationService();
