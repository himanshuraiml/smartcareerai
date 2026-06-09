import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';

export interface WhatsAppSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export class WhatsAppService {
    // In-memory store for verification OTPs
    private pendingOtps = new Map<string, { otp: string; phone: string; expiresAt: number }>();

    /**
     * Send template message to user (Mocked to Console Logging)
     */
    async sendTemplate(params: {
        phone: string;
        templateName: string;
        templateParams: string[];
        language?: string;
    }): Promise<WhatsAppSendResult> {
        const { phone, templateName, templateParams } = params;

        try {
            logger.info('📱 [MOCK WHATSAPP SEND] Sending Template Notification:', {
                to: phone,
                template: templateName,
                parameters: templateParams
            });

            // Simulate slight delay and return success
            await new Promise((resolve) => setTimeout(resolve, 100));

            return {
                success: true,
                messageId: `wamid.mock_${Math.random().toString(36).substring(2, 11)}`
            };
        } catch (error: any) {
            logger.error('Failed to send WhatsApp template:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start the WhatsApp opt-in OTP verification flow.
     */
    async sendVerificationOtp(userId: string, phone: string): Promise<string> {
        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        this.pendingOtps.set(userId, { otp, phone, expiresAt });

        logger.info(`🔑 [MOCK WHATSAPP OTP] Verification OTP generated for user ${userId} (${phone}): ${otp}`);

        // Send OTP via Mock WhatsApp message
        await this.sendTemplate({
            phone,
            templateName: 'verification_otp',
            templateParams: [otp]
        });

        return otp;
    }

    /**
     * Verify the OTP and activate WhatsApp notifications.
     */
    async verifyOtp(userId: string, otpInput: string): Promise<boolean> {
        const record = this.pendingOtps.get(userId);

        if (!record) {
            logger.warn(`Verification failed: No pending OTP record for user ${userId}`);
            return false;
        }

        if (Date.now() > record.expiresAt) {
            logger.warn(`Verification failed: OTP expired for user ${userId}`);
            this.pendingOtps.delete(userId);
            return false;
        }

        if (record.otp !== otpInput) {
            logger.warn(`Verification failed: OTP mismatch for user ${userId}. Got ${otpInput}, expected ${record.otp}`);
            return false;
        }

        // OTP matches! Update user notification preferences
        await prisma.notificationPreference.upsert({
            where: { userId },
            create: {
                userId,
                whatsappEnabled: true,
                whatsappPhone: record.phone,
                whatsappOptInAt: new Date()
            },
            update: {
                whatsappEnabled: true,
                whatsappPhone: record.phone,
                whatsappOptInAt: new Date()
            }
        });

        // Update main user record phone if empty
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user && !user.phone) {
            await prisma.user.update({
                where: { id: userId },
                data: { phone: record.phone }
            });
        }

        this.pendingOtps.delete(userId);
        logger.info(`✅ User ${userId} successfully opted in to WhatsApp notifications with number ${record.phone}`);
        return true;
    }

    /**
     * Handle incoming webhooks (Meta API calls).
     * Mocked for sandbox webhook simulations.
     */
    async handleWebhook(body: any): Promise<void> {
        logger.info('📱 [MOCK WHATSAPP WEBHOOK] Event received:', JSON.stringify(body, null, 2));
    }
}

export const whatsappService = new WhatsAppService();
