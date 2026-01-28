import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { logger } from './logger';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    /**
     * Get SMTP configuration from database settings
     */
    private async getSmtpConfig() {
        try {
            const settings = await prisma.systemSettings.findMany({
                where: {
                    settingKey: {
                        in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']
                    }
                }
            });

            const config: Record<string, any> = {};
            settings.forEach(s => {
                config[s.settingKey] = s.settingValue;
            });

            return config;
        } catch (error) {
            logger.error('Failed to get SMTP config:', error);
            return null;
        }
    }

    /**
     * Create or get transporter
     */
    private async getTransporter() {
        const config = await this.getSmtpConfig();

        if (!config?.smtp_host || !config?.smtp_user) {
            // Fallback to environment variables
            const host = process.env.SMTP_HOST;
            const port = parseInt(process.env.SMTP_PORT || '587');
            const user = process.env.SMTP_USER;
            const pass = process.env.SMTP_PASS;

            if (!host || !user) {
                logger.warn('SMTP not configured');
                return null;
            }

            return nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass }
            });
        }

        return nodemailer.createTransport({
            host: config.smtp_host as string,
            port: parseInt(config.smtp_port as string) || 587,
            secure: parseInt(config.smtp_port as string) === 465,
            auth: {
                user: config.smtp_user as string,
                pass: config.smtp_pass as string
            }
        });
    }

    /**
     * Send an email
     */
    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            const transporter = await this.getTransporter();
            if (!transporter) {
                logger.warn('Email not sent - SMTP not configured');
                return false;
            }

            const config = await this.getSmtpConfig();
            const from = (config?.smtp_from as string) || process.env.SMTP_FROM || 'noreply@smartcareer.ai';

            await transporter.sendMail({
                from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            });

            logger.info(`Email sent to ${options.to}`);
            return true;
        } catch (error) {
            logger.error('Failed to send email:', error);
            return false;
        }
    }

    /**
     * Send institution admin invitation email
     */
    async sendAdminInvite(
        email: string,
        institutionName: string,
        inviteToken: string,
        tempPassword: string
    ): Promise<boolean> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
        const inviteLink = `${frontendUrl}/admin-invite?token=${inviteToken}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Institution Admin Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f1a;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SmartCareerAI</h1>
                <p style="color: #a855f7; margin: 8px 0 0; font-size: 14px;">Institution Admin Invitation</p>
            </div>

            <!-- Content -->
            <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                <p>Hello,</p>
                <p>You have been invited to become an <strong style="color: #a855f7;">Institution Administrator</strong> for <strong style="color: #ffffff;">${institutionName}</strong> on SmartCareerAI.</p>

                <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 12px; color: #a855f7; font-weight: 600;">Your Temporary Credentials:</p>
                    <p style="margin: 4px 0; color: #e5e5e5;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 4px 0; color: #e5e5e5;"><strong>Temporary Password:</strong> <code style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px;">${tempPassword}</code></p>
                </div>

                <p>Click the button below to accept your invitation and set up your account:</p>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Accept Invitation
                    </a>
                </div>

                <p style="color: #9ca3af; font-size: 14px;">Or copy this link: <a href="${inviteLink}" style="color: #a855f7; word-break: break-all;">${inviteLink}</a></p>

                <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">This invitation expires in 7 days. If you did not expect this invitation, please ignore this email.</p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} SmartCareerAI. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        const text = `
You have been invited to become an Institution Administrator for ${institutionName} on SmartCareerAI.

Your Temporary Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

Accept your invitation here: ${inviteLink}

This invitation expires in 7 days.
        `;

        return this.sendEmail({
            to: email,
            subject: `You're invited to manage ${institutionName} on SmartCareerAI`,
            html,
            text
        });
    }
}

export const emailService = new EmailService();
