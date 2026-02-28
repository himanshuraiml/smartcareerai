import { Request, Response, NextFunction } from 'express';
import { integrationService } from '../services/integration.service';
import { googleCalendarService } from '../integrations/google-calendar';
import { outlookCalendarService } from '../integrations/outlook-calendar';
import ical, { ICalCalendarMethod } from 'ical-generator';

function orgCheck(recruiter: any, orgId: string, res: Response): boolean {
    if (recruiter.organizationId !== orgId) {
        res.status(403).json({ error: 'Forbidden' });
        return false;
    }
    return true;
}

export class IntegrationController {
    // ─── ATS integrations ──────────────────────────────────────────────────

    async setupIntegration(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;
            const { platform, webhookUrl, webhookSecret } = req.body;
            if (!platform) return res.status(400).json({ error: 'Platform is required' }) as any;
            const result = await integrationService.setupIntegration(orgId, platform, webhookUrl, webhookSecret);
            res.status(201).json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async getIntegrations(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;
            const integrations = await integrationService.getIntegrations(orgId);
            res.json({ success: true, data: integrations });
        } catch (error) { next(error); }
    }

    async disableIntegration(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId, integrationId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;
            await integrationService.disableIntegration(integrationId, orgId);
            res.json({ success: true, message: 'Integration disabled' });
        } catch (error) { next(error); }
    }

    // ─── Google Calendar ────────────────────────────────────────────────────

    async getGoogleCalendarAuthUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;
            const url = googleCalendarService.getAuthUrl();
            res.json({ success: true, url });
        } catch (error) { next(error); }
    }

    async googleCalendarCallback(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            const { code } = req.body;
            if (!orgCheck(req.recruiter!, orgId, res)) return;
            if (!code) return res.status(400).json({ error: 'Authorization code is required' }) as any;

            const tokens = await googleCalendarService.getTokens(code);
            await integrationService.saveCalendarTokens(orgId, { ...tokens, platform: 'google' });

            res.json({ success: true, message: 'Google Calendar connected successfully' });
        } catch (error) { next(error); }
    }

    async getCalendarStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;
            const integration = await integrationService.getCalendarIntegration(orgId);
            res.json({
                success: true,
                data: {
                    connected: !!(integration?.isActive && integration?.accessToken),
                    platform: integration?.platform || null,
                }
            });
        } catch (error) { next(error); }
    }

    async scheduleInterviewGoogle(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;

            const { summary, description, startTime, endTime, attendeeEmails } = req.body;
            if (!summary || !startTime || !endTime || !Array.isArray(attendeeEmails)) {
                return res.status(400).json({ error: 'summary, startTime, endTime, attendeeEmails are required' }) as any;
            }

            const integration = await integrationService.getCalendarIntegration(orgId);
            if (!integration?.isActive || !integration?.accessToken) {
                return res.status(400).json({ error: 'Google Calendar not connected. Connect it in Settings > Integrations.' }) as any;
            }

            googleCalendarService.setCredentials({
                access_token: integration.accessToken,
                refresh_token: integration.refreshToken,
                expiry_date: integration.expiryDate ? Number(integration.expiryDate) : undefined,
            });

            const event = await googleCalendarService.createInterviewEvent(
                summary,
                description || 'Interview scheduled via SmartCareerAI',
                new Date(startTime),
                new Date(endTime),
                attendeeEmails
            );

            const cal = ical({ name: 'SmartCareerAI Interview' });
            cal.method(ICalCalendarMethod.REQUEST);
            cal.createEvent({
                start: new Date(startTime),
                end: new Date(endTime),
                summary,
                description: description || '',
                attendees: attendeeEmails.map((email: string) => ({ email })),
                url: event.htmlLink || undefined,
            });

            const meetLink = event.conferenceData?.entryPoints?.find(
                (e: any) => e.entryPointType === 'video'
            )?.uri || null;

            res.json({
                success: true,
                data: {
                    eventId: event.id,
                    eventLink: event.htmlLink,
                    meetLink,
                    icsBase64: Buffer.from(cal.toString()).toString('base64'),
                }
            });
        } catch (error) { next(error); }
    }

    async getAvailabilityGoogle(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;

            const { emails, timeMin, timeMax, slotDurationMinutes } = req.body;
            if (!emails || !timeMin || !timeMax) {
                return res.status(400).json({ error: 'emails, timeMin, timeMax are required' }) as any;
            }

            const integration = await integrationService.getCalendarIntegration(orgId);
            if (!integration?.isActive || !integration?.accessToken) {
                return res.status(400).json({ error: 'Google Calendar not connected' }) as any;
            }

            googleCalendarService.setCredentials({
                access_token: integration.accessToken,
                refresh_token: integration.refreshToken,
                expiry_date: integration.expiryDate ? Number(integration.expiryDate) : undefined,
            });

            const slots = await googleCalendarService.getAvailableSlots(
                emails,
                new Date(timeMin),
                new Date(timeMax),
                slotDurationMinutes || 60
            );

            res.json({ success: true, data: { slots } });
        } catch (error) { next(error); }
    }

    // ─── Microsoft Outlook / Office 365 ────────────────────────────────────

    async getOutlookAuthUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;
            const url = outlookCalendarService.getAuthUrl(orgId);
            res.json({ success: true, url });
        } catch (error) { next(error); }
    }

    async outlookCallback(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            const { code } = req.body;
            if (!orgCheck(req.recruiter!, orgId, res)) return;
            if (!code) return res.status(400).json({ error: 'Authorization code is required' }) as any;

            const tokens = await outlookCalendarService.getTokens(code);
            await integrationService.saveCalendarTokens(orgId, {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: Date.now() + tokens.expires_in * 1000,
                platform: 'outlook',
            });

            res.json({ success: true, message: 'Microsoft 365 Calendar connected successfully' });
        } catch (error) { next(error); }
    }

    async scheduleInterviewOutlook(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;

            const { summary, description, startTime, endTime, attendeeEmails } = req.body;
            if (!summary || !startTime || !endTime || !Array.isArray(attendeeEmails)) {
                return res.status(400).json({ error: 'summary, startTime, endTime, attendeeEmails are required' }) as any;
            }

            const integration = await integrationService.getCalendarIntegration(orgId);
            if (!integration?.isActive || !integration?.accessToken || integration.platform !== 'outlook') {
                return res.status(400).json({ error: 'Microsoft 365 Calendar not connected.' }) as any;
            }

            const event = await outlookCalendarService.createInterviewEvent(
                integration.accessToken,
                summary,
                description || 'Interview scheduled via SmartCareerAI',
                new Date(startTime),
                new Date(endTime),
                attendeeEmails
            );

            const cal = ical({ name: 'SmartCareerAI Interview' });
            cal.method(ICalCalendarMethod.REQUEST);
            cal.createEvent({
                start: new Date(startTime),
                end: new Date(endTime),
                summary,
                description: description || '',
                attendees: attendeeEmails.map((email: string) => ({ email })),
            });

            res.json({
                success: true,
                data: {
                    eventId: event.id,
                    teamsLink: event.onlineMeeting?.joinUrl || null,
                    icsBase64: Buffer.from(cal.toString()).toString('base64'),
                }
            });
        } catch (error) { next(error); }
    }

    async getAvailabilityOutlook(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            if (!orgCheck(req.recruiter!, orgId, res)) return;

            const { emails, timeMin, timeMax, slotDurationMinutes } = req.body;
            if (!emails || !timeMin || !timeMax) {
                return res.status(400).json({ error: 'emails, timeMin, timeMax are required' }) as any;
            }

            const integration = await integrationService.getCalendarIntegration(orgId);
            if (!integration?.isActive || !integration?.accessToken || integration.platform !== 'outlook') {
                return res.status(400).json({ error: 'Microsoft 365 Calendar not connected' }) as any;
            }

            const slots = await outlookCalendarService.getAvailableSlots(
                integration.accessToken,
                emails,
                new Date(timeMin),
                new Date(timeMax),
                slotDurationMinutes || 60
            );

            res.json({ success: true, data: { slots } });
        } catch (error) { next(error); }
    }
}

export const integrationController = new IntegrationController();
