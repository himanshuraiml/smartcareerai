import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Configure VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@placenxt.com';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export class PushNotificationService {

    async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
        // Upsert by endpoint
        const existing = await prisma.pushSubscription.findFirst({ where: { userId, endpoint: subscription.endpoint } });
        if (existing) return existing;

        return prisma.pushSubscription.create({
            data: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });
    }

    async unsubscribe(userId: string, endpoint: string) {
        return prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    }

    async sendPushToUser(userId: string, notification: { title: string; body: string; url?: string }) {
        if (!vapidPublicKey || !vapidPrivateKey) {
            logger.warn('VAPID keys not configured — push notifications disabled');
            return;
        }

        const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            url: notification.url || '/recruiter',
        });

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload,
                );
            } catch (error: any) {
                if (error.statusCode === 410) {
                    // Subscription expired — clean up
                    await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                } else {
                    logger.error('Failed to send push notification:', error);
                }
            }
        }
    }
}

export const pushNotificationService = new PushNotificationService();
