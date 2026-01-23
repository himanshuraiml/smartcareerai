import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class GmailService {
    private oauth2Client: OAuth2Client;

    // Keywords to identify job-related emails
    private readonly JOB_KEYWORDS = [
        'application received',
        'application submitted',
        'thank you for applying',
        'we received your application',
        'application status',
        'interview invitation',
        'interview request',
        'schedule an interview',
        'phone screen',
        'technical interview',
        'offer letter',
        'job offer',
        'congratulations',
        'we are pleased',
        'unfortunately',
        'we regret',
        'position has been filled',
        'not moving forward',
        'other candidates',
        'next steps',
        'background check',
        'onboarding'
    ];

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    /**
     * Generate OAuth URL for user authorization
     */
    getAuthUrl(userId: string): string {
        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.email'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: userId,
            prompt: 'consent'
        });
    }

    /**
     * Handle OAuth callback and store tokens
     */
    async handleCallback(code: string, userId: string): Promise<void> {
        const { tokens } = await this.oauth2Client.getToken(code);

        // Get user's email address
        this.oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        // Store or update connection
        await prisma.emailConnection.upsert({
            where: { userId },
            update: {
                email: email!,
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token || undefined,
                tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                isActive: true,
                lastSyncAt: null
            },
            create: {
                userId,
                email: email!,
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token || undefined,
                tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                isActive: true
            }
        });

        logger.info(`Gmail connected for user ${userId}: ${email}`);
    }

    /**
     * Get Gmail client for a user
     */
    async getGmailClient(userId: string): Promise<gmail_v1.Gmail | null> {
        const connection = await prisma.emailConnection.findUnique({
            where: { userId }
        });

        if (!connection || !connection.isActive) {
            return null;
        }

        // Set credentials
        this.oauth2Client.setCredentials({
            access_token: connection.accessToken,
            refresh_token: connection.refreshToken || undefined,
            expiry_date: connection.tokenExpiry?.getTime()
        });

        // Handle token refresh
        this.oauth2Client.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                await prisma.emailConnection.update({
                    where: { userId },
                    data: {
                        accessToken: tokens.access_token,
                        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
                    }
                });
            }
        });

        return google.gmail({ version: 'v1', auth: this.oauth2Client });
    }

    /**
     * Scan for job-related emails
     */
    async scanJobEmails(userId: string): Promise<JobEmail[]> {
        const gmail = await this.getGmailClient(userId);
        if (!gmail) {
            logger.warn(`No Gmail client available for user ${userId}`);
            return [];
        }

        const jobEmails: JobEmail[] = [];

        try {
            // Search for emails from last 7 days with job-related keywords
            const query = this.JOB_KEYWORDS.map(k => `"${k}"`).join(' OR ');
            const afterDate = new Date();
            afterDate.setDate(afterDate.getDate() - 7);

            const response = await gmail.users.messages.list({
                userId: 'me',
                q: `${query} after:${afterDate.toISOString().split('T')[0]}`,
                maxResults: 50
            });

            const messages = response.data.messages || [];

            for (const message of messages) {
                try {
                    const email = await this.parseEmailMessage(gmail, message.id!);
                    if (email) {
                        jobEmails.push(email);
                    }
                } catch (err) {
                    logger.error(`Error parsing email ${message.id}:`, err);
                }
            }

            logger.info(`Found ${jobEmails.length} job-related emails for user ${userId}`);
            return jobEmails;
        } catch (error) {
            logger.error(`Error scanning emails for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Parse email message to extract relevant info
     */
    private async parseEmailMessage(gmail: gmail_v1.Gmail, messageId: string): Promise<JobEmail | null> {
        const response = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
        });

        const message = response.data;
        const headers = message.payload?.headers || [];

        const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

        const subject = getHeader('Subject');
        const from = getHeader('From');
        const date = getHeader('Date');

        // Extract body
        let body = '';
        if (message.payload?.body?.data) {
            body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
        } else if (message.payload?.parts) {
            const textPart = message.payload.parts.find(p => p.mimeType === 'text/plain');
            if (textPart?.body?.data) {
                body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
        }

        // Detect email type based on content
        const emailType = this.detectEmailType(subject, body);
        const companyName = this.extractCompanyName(from, body);

        return {
            messageId,
            subject,
            from,
            date: new Date(date),
            snippet: message.snippet || '',
            type: emailType,
            companyName
        };
    }

    /**
     * Detect the type of job email
     */
    private detectEmailType(subject: string, body: string): EmailType {
        const content = `${subject} ${body}`.toLowerCase();

        if (content.includes('offer') && (content.includes('congratulations') || content.includes('pleased'))) {
            return 'OFFER';
        }
        if (content.includes('interview') && (content.includes('schedule') || content.includes('invitation'))) {
            return 'INTERVIEW';
        }
        if (content.includes('unfortunately') || content.includes('regret') || content.includes('not moving forward')) {
            return 'REJECTION';
        }
        if (content.includes('received your application') || content.includes('application submitted')) {
            return 'APPLICATION_RECEIVED';
        }
        if (content.includes('next steps') || content.includes('status update')) {
            return 'UPDATE';
        }

        return 'OTHER';
    }

    /**
     * Extract company name from email
     */
    private extractCompanyName(from: string, body: string): string {
        // Try to extract from email domain
        const emailMatch = from.match(/@([a-zA-Z0-9.-]+)\./);
        if (emailMatch) {
            const domain = emailMatch[1];
            // Skip common email providers
            if (!['gmail', 'yahoo', 'hotmail', 'outlook', 'mail'].includes(domain.toLowerCase())) {
                return domain.charAt(0).toUpperCase() + domain.slice(1);
            }
        }

        // Try to extract from sender name
        const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
        if (nameMatch) {
            return nameMatch[1].trim();
        }

        return 'Unknown Company';
    }
}

// Types
export type EmailType = 'APPLICATION_RECEIVED' | 'INTERVIEW' | 'OFFER' | 'REJECTION' | 'UPDATE' | 'OTHER';

export interface JobEmail {
    messageId: string;
    subject: string;
    from: string;
    date: Date;
    snippet: string;
    type: EmailType;
    companyName: string;
}
