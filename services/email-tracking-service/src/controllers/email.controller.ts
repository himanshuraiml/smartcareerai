import { Request, Response } from 'express';
import { GmailService } from '../services/gmail.service';
import { EmailTrackingService } from '../services/email-tracking.service';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
    userId?: string;
}

export class EmailController {
    private gmailService: GmailService;
    private trackingService: EmailTrackingService;

    constructor() {
        this.gmailService = new GmailService();
        this.trackingService = new EmailTrackingService();
    }

    /**
     * Get OAuth URL for Gmail authorization
     */
    getOAuthUrl = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId!;
            const url = this.gmailService.getAuthUrl(userId);
            res.json({ success: true, data: { url } });
        } catch (error) {
            logger.error('Error generating OAuth URL:', error);
            res.status(500).json({ error: 'Failed to generate OAuth URL' });
        }
    };

    /**
     * Handle OAuth callback from Google
     */
    handleOAuthCallback = async (req: Request, res: Response) => {
        try {
            const { code, state } = req.query;

            if (!code || !state) {
                return res.status(400).json({ error: 'Missing code or state parameter' });
            }

            const userId = state as string;
            await this.gmailService.handleCallback(code as string, userId);

            // Redirect to frontend success page
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            res.redirect(`${frontendUrl}/dashboard/settings?email_connected=true`);
        } catch (error) {
            logger.error('OAuth callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            res.redirect(`${frontendUrl}/dashboard/settings?email_error=true`);
        }
    };

    /**
     * Get email connection status
     */
    getConnectionStatus = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId!;
            const connection = await this.trackingService.getConnectionStatus(userId);
            res.json({ success: true, data: connection });
        } catch (error) {
            logger.error('Error getting connection status:', error);
            res.status(500).json({ error: 'Failed to get connection status' });
        }
    };

    /**
     * Disconnect email
     */
    disconnectEmail = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId!;
            await this.trackingService.disconnectEmail(userId);
            res.json({ success: true, message: 'Email disconnected successfully' });
        } catch (error) {
            logger.error('Error disconnecting email:', error);
            res.status(500).json({ error: 'Failed to disconnect email' });
        }
    };

    /**
     * Get tracked emails for user
     */
    getTrackedEmails = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId!;
            const { page = 1, limit = 20, status } = req.query;

            const emails = await this.trackingService.getTrackedEmails(userId, {
                page: Number(page),
                limit: Number(limit),
                status: status as string | undefined
            });

            res.json({ success: true, data: emails });
        } catch (error) {
            logger.error('Error getting tracked emails:', error);
            res.status(500).json({ error: 'Failed to get tracked emails' });
        }
    };

    /**
     * Get specific tracked email
     */
    getTrackedEmailById = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId!;
            const { id } = req.params;

            const email = await this.trackingService.getTrackedEmailById(userId, id);

            if (!email) {
                return res.status(404).json({ error: 'Email not found' });
            }

            res.json({ success: true, data: email });
        } catch (error) {
            logger.error('Error getting tracked email:', error);
            res.status(500).json({ error: 'Failed to get tracked email' });
        }
    };

    /**
     * Trigger manual sync
     */
    triggerSync = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId!;
            await this.trackingService.syncEmails(userId);
            res.json({ success: true, message: 'Sync triggered successfully' });
        } catch (error) {
            logger.error('Error triggering sync:', error);
            res.status(500).json({ error: 'Failed to trigger sync' });
        }
    };
}
