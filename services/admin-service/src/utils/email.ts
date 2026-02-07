import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { logger } from './logger';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    userId?: string;
    emailType?: string;
    templateId?: string;
    metadata?: any;
    sentBy?: string;
}

interface BulkEmailOptions {
    recipients: Array<{ email: string; userId?: string; variables?: Record<string, string> }>;
    templateId: string;
    sentBy: string;
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

            logger.info(`Found ${settings.length} SMTP settings in database`);

            const config: Record<string, any> = {};
            settings.forEach(s => {
                // settingValue is stored as JSON, so we need to handle it properly
                let value = s.settingValue;
                // If the value is a JSON string that's been double-encoded, parse it
                if (typeof value === 'string') {
                    try {
                        value = JSON.parse(value);
                    } catch {
                        // It's a plain string, use as-is
                    }
                }
                config[s.settingKey] = value;
                logger.debug(`SMTP Config: ${s.settingKey} = ${s.settingKey.includes('pass') ? '***' : value}`);
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

        logger.info('SMTP config loaded:', {
            hasHost: !!config?.smtp_host,
            hasUser: !!config?.smtp_user,
            hasPass: !!config?.smtp_pass,
            hasPort: !!config?.smtp_port,
            hasFrom: !!config?.smtp_from
        });

        if (!config?.smtp_host || !config?.smtp_user) {
            // Fallback to environment variables
            logger.info('Falling back to environment variables for SMTP');
            const host = process.env.SMTP_HOST;
            const port = parseInt(process.env.SMTP_PORT || '587');
            const user = process.env.SMTP_USER;
            const pass = process.env.SMTP_PASS;

            if (!host || !user) {
                logger.warn('SMTP not configured - no host or user in DB or env');
                return null;
            }

            logger.info(`Creating transporter with env config: ${host}:${port}`);
            return nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass }
            });
        }

        const smtpPort = parseInt(config.smtp_port as string) || 587;
        logger.info(`Creating transporter with DB config: ${config.smtp_host}:${smtpPort}`);

        return nodemailer.createTransport({
            host: config.smtp_host as string,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: config.smtp_user as string,
                pass: config.smtp_pass as string
            }
        });
    }

    /**
     * Log email to database
     */
    private async logEmail(options: {
        templateId?: string;
        recipientId?: string;
        recipientEmail: string;
        subject: string;
        emailType: string;
        status: 'PENDING' | 'SENT' | 'FAILED';
        errorMessage?: string;
        metadata?: any;
        sentBy?: string;
    }) {
        try {
            await prisma.emailLog.create({
                data: {
                    templateId: options.templateId,
                    recipientId: options.recipientId,
                    recipientEmail: options.recipientEmail,
                    subject: options.subject,
                    emailType: options.emailType as any,
                    status: options.status,
                    errorMessage: options.errorMessage,
                    metadata: options.metadata,
                    sentBy: options.sentBy,
                    sentAt: options.status === 'SENT' ? new Date() : null
                }
            });
        } catch (error) {
            logger.error('Failed to log email:', error);
        }
    }

    /**
     * Send an email with logging
     */
    async sendEmail(options: EmailOptions): Promise<boolean> {
        const emailType = options.emailType || 'OTHER';

        try {
            const transporter = await this.getTransporter();
            if (!transporter) {
                await this.logEmail({
                    templateId: options.templateId,
                    recipientId: options.userId,
                    recipientEmail: options.to,
                    subject: options.subject,
                    emailType,
                    status: 'FAILED',
                    errorMessage: 'SMTP not configured',
                    metadata: options.metadata,
                    sentBy: options.sentBy
                });
                logger.warn('Email not sent - SMTP not configured');
                return false;
            }

            const config = await this.getSmtpConfig();
            const from = (config?.smtp_from as string) || process.env.SMTP_FROM || 'noreply@placenxt.com';

            await transporter.sendMail({
                from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            });

            await this.logEmail({
                templateId: options.templateId,
                recipientId: options.userId,
                recipientEmail: options.to,
                subject: options.subject,
                emailType,
                status: 'SENT',
                metadata: options.metadata,
                sentBy: options.sentBy
            });

            logger.info(`Email sent to ${options.to}`);
            return true;
        } catch (error: any) {
            await this.logEmail({
                templateId: options.templateId,
                recipientId: options.userId,
                recipientEmail: options.to,
                subject: options.subject,
                emailType,
                status: 'FAILED',
                errorMessage: error.message,
                metadata: options.metadata,
                sentBy: options.sentBy
            });
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
        tempPassword: string,
        sentBy?: string
    ): Promise<boolean> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
        const inviteLink = `${frontendUrl}/admin-invite?token=${inviteToken}`;

        const html = this.getInstitutionAdminInviteTemplate(email, institutionName, tempPassword, inviteLink);
        const text = `
You have been invited to become an Institution Administrator for ${institutionName} on PlaceNxt.

Your Temporary Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

Accept your invitation here: ${inviteLink}

This invitation expires in 7 days.
        `;

        return this.sendEmail({
            to: email,
            subject: `You're invited to manage ${institutionName} on PlaceNxt`,
            html,
            text,
            emailType: 'INSTITUTION_ADMIN_INVITE',
            metadata: { institutionName, inviteLink },
            sentBy
        });
    }

    /**
     * Send newsletter email
     */
    async sendNewsletter(
        email: string,
        userName: string,
        subject: string,
        content: string,
        userId?: string,
        sentBy?: string,
        templateId?: string
    ): Promise<boolean> {
        const html = this.getNewsletterTemplate(userName, subject, content);

        return this.sendEmail({
            to: email,
            subject,
            html,
            text: content,
            userId,
            emailType: 'NEWSLETTER',
            templateId,
            metadata: { userName },
            sentBy
        });
    }

    /**
     * Send promotional email
     */
    async sendPromotionalEmail(
        email: string,
        userName: string,
        subject: string,
        headline: string,
        content: string,
        ctaText: string,
        ctaLink: string,
        userId?: string,
        sentBy?: string,
        templateId?: string
    ): Promise<boolean> {
        const html = this.getPromotionalTemplate(userName, headline, content, ctaText, ctaLink);

        return this.sendEmail({
            to: email,
            subject,
            html,
            text: `${headline}\n\n${content}\n\n${ctaText}: ${ctaLink}`,
            userId,
            emailType: 'PROMOTIONAL',
            templateId,
            metadata: { userName, headline, ctaText, ctaLink },
            sentBy
        });
    }

    /**
     * Send welcome email to students
     */
    async sendStudentWelcome(
        email: string,
        userName: string,
        institutionName?: string,
        sentBy?: string
    ): Promise<boolean> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
        const html = this.getStudentWelcomeTemplate(userName, institutionName, frontendUrl);

        return this.sendEmail({
            to: email,
            subject: `Welcome to PlaceNxt - Start Your Career Journey!`,
            html,
            text: `Welcome to PlaceNxt, ${userName}! Start building your career today.`,
            emailType: 'STUDENT_WELCOME',
            metadata: { userName, institutionName },
            sentBy
        });
    }

    /**
     * Send welcome email to recruiters
     */
    async sendRecruiterWelcome(
        email: string,
        userName: string,
        companyName: string,
        sentBy?: string
    ): Promise<boolean> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
        const html = this.getRecruiterWelcomeTemplate(userName, companyName, frontendUrl);

        return this.sendEmail({
            to: email,
            subject: `Welcome to PlaceNxt Recruiting Platform!`,
            html,
            text: `Welcome to PlaceNxt, ${userName}! Start finding talented candidates for ${companyName}.`,
            emailType: 'RECRUITER_WELCOME',
            metadata: { userName, companyName },
            sentBy
        });
    }

    /**
     * Send bulk email using template
     */
    async sendBulkEmail(options: BulkEmailOptions): Promise<{ success: number; failed: number }> {
        const template = await prisma.emailTemplate.findUnique({
            where: { id: options.templateId }
        });

        if (!template) {
            throw new Error('Template not found');
        }

        let success = 0;
        let failed = 0;

        for (const recipient of options.recipients) {
            let html = template.htmlContent;
            let subject = template.subject;

            // Replace variables
            if (recipient.variables) {
                for (const [key, value] of Object.entries(recipient.variables)) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    html = html.replace(regex, value);
                    subject = subject.replace(regex, value);
                }
            }

            const sent = await this.sendEmail({
                to: recipient.email,
                subject,
                html,
                text: template.textContent || undefined,
                userId: recipient.userId,
                emailType: 'BULK',
                templateId: options.templateId,
                metadata: { variables: recipient.variables },
                sentBy: options.sentBy
            });

            if (sent) {
                success++;
            } else {
                failed++;
            }
        }

        return { success, failed };
    }

    // ============================================
    // EMAIL TEMPLATES
    // ============================================

    private getBaseTemplate(content: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f1a;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PlaceNxt</h1>
            </div>

            ${content}

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} PlaceNxt. All rights reserved.</p>
                <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3100'}/unsubscribe" style="color: #6366f1; text-decoration: none;">Unsubscribe</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    }

    private getInstitutionAdminInviteTemplate(email: string, institutionName: string, tempPassword: string, inviteLink: string): string {
        const content = `
            <p style="color: #6366f1; margin: 8px 0 0; font-size: 14px; text-align: center;">Institution Admin Invitation</p>

            <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin-top: 24px;">
                <p>Hello,</p>
                <p>You have been invited to become an <strong style="color: #6366f1;">Institution Administrator</strong> for <strong style="color: #ffffff;">${institutionName}</strong> on PlaceNxt.</p>

                <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 12px; color: #6366f1; font-weight: 600;">Your Temporary Credentials:</p>
                    <p style="margin: 4px 0; color: #e5e5e5;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 4px 0; color: #e5e5e5;"><strong>Temporary Password:</strong> <code style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px;">${tempPassword}</code></p>
                </div>

                <p>Click the button below to accept your invitation and set up your account:</p>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Accept Invitation
                    </a>
                </div>

                <p style="color: #9ca3af; font-size: 14px;">Or copy this link: <a href="${inviteLink}" style="color: #6366f1; word-break: break-all;">${inviteLink}</a></p>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">This invitation expires in 7 days. If you did not expect this invitation, please ignore this email.</p>
            </div>
        `;
        return this.getBaseTemplate(content);
    }

    private getNewsletterTemplate(userName: string, title: string, content: string): string {
        const templateContent = `
            <p style="color: #6366f1; margin: 8px 0 0; font-size: 14px; text-align: center;">Newsletter</p>

            <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin-top: 24px;">
                <p>Hi ${userName},</p>

                <h2 style="color: #ffffff; font-size: 20px; margin: 24px 0 16px;">${title}</h2>

                <div style="color: #e5e5e5;">
                    ${content}
                </div>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3100'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Visit Dashboard
                    </a>
                </div>
            </div>
        `;
        return this.getBaseTemplate(templateContent);
    }

    private getPromotionalTemplate(userName: string, headline: string, content: string, ctaText: string, ctaLink: string): string {
        const templateContent = `
            <p style="color: #ec4899; margin: 8px 0 0; font-size: 14px; text-align: center;">Special Offer</p>

            <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin-top: 24px;">
                <p>Hi ${userName},</p>

                <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                    <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px;">${headline}</h2>
                    <p style="color: #e5e5e5; margin: 0;">${content}</p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="${ctaLink}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 18px;">
                        ${ctaText}
                    </a>
                </div>

                <p style="color: #9ca3af; font-size: 14px; text-align: center;">Limited time offer. Don't miss out!</p>
            </div>
        `;
        return this.getBaseTemplate(templateContent);
    }

    private getStudentWelcomeTemplate(userName: string, institutionName: string | undefined, frontendUrl: string): string {
        const institutionText = institutionName ? ` from ${institutionName}` : '';
        const templateContent = `
            <p style="color: #22c55e; margin: 8px 0 0; font-size: 14px; text-align: center;">Welcome to PlaceNxt!</p>

            <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin-top: 24px;">
                <p>Hi ${userName}${institutionText},</p>

                <p>Welcome to <strong style="color: #6366f1;">PlaceNxt</strong> - your AI-powered career companion! We're excited to help you kickstart your career journey.</p>

                <div style="margin: 24px 0;">
                    <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 16px;">Here's what you can do:</h3>
                    <div style="background: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #22c55e; font-weight: 600;">ATS Resume Scoring</p>
                        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 14px;">Get instant feedback on your resume's ATS compatibility</p>
                    </div>
                    <div style="background: rgba(168, 85, 247, 0.1); border-left: 4px solid #6366f1; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #6366f1; font-weight: 600;">AI Interview Practice</p>
                        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 14px;">Practice with AI-powered mock interviews</p>
                    </div>
                    <div style="background: rgba(236, 72, 153, 0.1); border-left: 4px solid #ec4899; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #ec4899; font-weight: 600;">Skill Validation</p>
                        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 14px;">Earn verified badges for your skills</p>
                    </div>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="${frontendUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Go to Dashboard
                    </a>
                </div>

                <p style="color: #9ca3af; font-size: 14px;">Need help getting started? Check out our <a href="${frontendUrl}/help" style="color: #6366f1;">getting started guide</a>.</p>
            </div>
        `;
        return this.getBaseTemplate(templateContent);
    }

    private getRecruiterWelcomeTemplate(userName: string, companyName: string, frontendUrl: string): string {
        const templateContent = `
            <p style="color: #3b82f6; margin: 8px 0 0; font-size: 14px; text-align: center;">Recruiter Account Activated</p>

            <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin-top: 24px;">
                <p>Hi ${userName},</p>

                <p>Welcome to <strong style="color: #6366f1;">PlaceNxt Recruiting</strong>! Your recruiter account for <strong style="color: #ffffff;">${companyName}</strong> is now active.</p>

                <div style="margin: 24px 0;">
                    <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 16px;">What you can do:</h3>
                    <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #3b82f6; font-weight: 600;">Search Candidates</p>
                        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 14px;">Find pre-vetted candidates with verified skills</p>
                    </div>
                    <div style="background: rgba(168, 85, 247, 0.1); border-left: 4px solid #6366f1; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #6366f1; font-weight: 600;">Post Jobs</p>
                        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 14px;">Create job listings to attract top talent</p>
                    </div>
                    <div style="background: rgba(236, 72, 153, 0.1); border-left: 4px solid #ec4899; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #ec4899; font-weight: 600;">Message Candidates</p>
                        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 14px;">Directly connect with potential hires</p>
                    </div>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="${frontendUrl}/recruiter" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Go to Recruiter Dashboard
                    </a>
                </div>
            </div>
        `;
        return this.getBaseTemplate(templateContent);
    }

    /**
     * Get notification template for general announcements
     */
    getNotificationTemplate(userName: string, title: string, message: string, ctaText?: string, ctaLink?: string): string {
        const ctaButton = ctaText && ctaLink ? `
            <div style="text-align: center; margin: 32px 0;">
                <a href="${ctaLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    ${ctaText}
                </a>
            </div>
        ` : '';

        const templateContent = `
            <p style="color: #f59e0b; margin: 8px 0 0; font-size: 14px; text-align: center;">Notification</p>

            <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin-top: 24px;">
                <p>Hi ${userName},</p>

                <h2 style="color: #ffffff; font-size: 20px; margin: 24px 0 16px;">${title}</h2>

                <p>${message}</p>

                ${ctaButton}
            </div>
        `;
        return this.getBaseTemplate(templateContent);
    }
}

export const emailService = new EmailService();
