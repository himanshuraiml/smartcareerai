const SCOPES = ['https://graph.microsoft.com/Calendars.ReadWrite', 'https://graph.microsoft.com/User.Read'];
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export class OutlookCalendarService {
    constructor() {}

    /**
     * Get the Microsoft OAuth2 authorization URL.
     */
    getAuthUrl(state?: string): string {
        const redirectUri = process.env.MS_REDIRECT_URI || 'http://localhost:3000/oauth/outlook/callback';
        const params = new URLSearchParams({
            client_id: process.env.MS_CLIENT_ID || '',
            response_type: 'code',
            redirect_uri: redirectUri,
            scope: SCOPES.join(' ') + ' offline_access',
            response_mode: 'query',
            ...(state ? { state } : {}),
        });
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens via Microsoft Graph.
     */
    async getTokens(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
        const redirectUri = process.env.MS_REDIRECT_URI || 'http://localhost:3000/oauth/outlook/callback';

        const body = new URLSearchParams({
            client_id: process.env.MS_CLIENT_ID || '',
            client_secret: process.env.MS_CLIENT_SECRET || '',
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            scope: SCOPES.join(' ') + ' offline_access',
        });

        const res = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`MS token exchange failed: ${err}`);
        }

        return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number }>;
    }

    /**
     * Refresh an expired access token.
     */
    async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
        const body = new URLSearchParams({
            client_id: process.env.MS_CLIENT_ID || '',
            client_secret: process.env.MS_CLIENT_SECRET || '',
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            scope: SCOPES.join(' ') + ' offline_access',
        });

        const res = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`MS token refresh failed: ${err}`);
        }

        return res.json() as Promise<{ access_token: string; expires_in: number }>;
    }

    /**
     * Create an interview event in Outlook Calendar with Teams meeting link.
     */
    async createInterviewEvent(
        accessToken: string,
        summary: string,
        description: string,
        startTime: Date,
        endTime: Date,
        attendeeEmails: string[]
    ) {
        const event = {
            subject: summary,
            body: { contentType: 'HTML', content: description },
            start: { dateTime: startTime.toISOString(), timeZone: 'UTC' },
            end: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
            attendees: attendeeEmails.map(email => ({
                emailAddress: { address: email },
                type: 'required',
            })),
            isOnlineMeeting: true,
            onlineMeetingProvider: 'teamsForBusiness',
        };

        const res = await fetch(`${GRAPH_BASE}/me/events`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to create Outlook event: ${err}`);
        }

        return res.json();
    }

    /**
     * Get free/busy information for a set of emails using Microsoft Graph.
     */
    async getFreeBusy(
        accessToken: string,
        emails: string[],
        timeMin: Date,
        timeMax: Date
    ): Promise<{ email: string; busy: { start: string; end: string }[] }[]> {
        const body = {
            schedules: emails,
            startTime: { dateTime: timeMin.toISOString(), timeZone: 'UTC' },
            endTime: { dateTime: timeMax.toISOString(), timeZone: 'UTC' },
            availabilityViewInterval: 60,
        };

        const res = await fetch(`${GRAPH_BASE}/me/calendar/getSchedule`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to get Outlook free/busy: ${err}`);
        }

        const data: any = await res.json();
        return (data.value || []).map((schedule: any) => ({
            email: schedule.scheduleId,
            busy: (schedule.busyHours || []).map((b: any) => ({
                start: b.start.dateTime,
                end: b.end.dateTime,
            })),
        }));
    }

    /**
     * Get available 1-hour slots where all specified attendees are free.
     */
    async getAvailableSlots(
        accessToken: string,
        emails: string[],
        timeMin: Date,
        timeMax: Date,
        slotDurationMinutes = 60
    ): Promise<{ start: Date; end: Date }[]> {
        const freeBusyData = await this.getFreeBusy(accessToken, emails, timeMin, timeMax);

        const allBusy = freeBusyData.flatMap(d =>
            d.busy.map(b => ({ start: new Date(b.start), end: new Date(b.end) }))
        ).sort((a, b) => a.start.getTime() - b.start.getTime());

        const slots: { start: Date; end: Date }[] = [];
        const slotMs = slotDurationMinutes * 60 * 1000;

        let cursor = new Date(timeMin);
        cursor.setMinutes(0, 0, 0);

        while (cursor.getTime() + slotMs <= timeMax.getTime()) {
            const slotEnd = new Date(cursor.getTime() + slotMs);
            const isBlocked = allBusy.some(b => b.start < slotEnd && b.end > cursor);

            if (!isBlocked) {
                slots.push({ start: new Date(cursor), end: slotEnd });
            }
            cursor = new Date(cursor.getTime() + slotMs);
        }

        return slots;
    }
}

export const outlookCalendarService = new OutlookCalendarService();
