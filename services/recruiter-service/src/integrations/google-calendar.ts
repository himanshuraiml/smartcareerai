import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'crypto';

export class GoogleCalendarService {
    private oauth2Client: OAuth2Client;
    private calendar: calendar_v3.Calendar;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    }

    /**
     * Get the Google OAuth2 authorization URL.
     */
    getAuthUrl(): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/calendar.readonly'
            ],
            state: randomUUID(),
        });
    }

    /**
     * Exchange authorization code for access and refresh tokens.
     */
    async getTokens(code: string) {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    /**
     * Set credentials and handle automatic token refresh.
     */
    setCredentials(tokens: any) {
        this.oauth2Client.setCredentials(tokens);

        // Auto-refresh access tokens when they expire
        this.oauth2Client.on('tokens', (newTokens) => {
            if (newTokens.refresh_token) {
                tokens.refresh_token = newTokens.refresh_token;
            }
            tokens.access_token = newTokens.access_token;
            tokens.expiry_date = newTokens.expiry_date;
        });
    }

    /**
     * Create a calendar event with Google Meet link.
     */
    async createInterviewEvent(
        summary: string,
        description: string,
        startTime: Date,
        endTime: Date,
        attendeeEmails: string[]
    ) {
        const event: calendar_v3.Schema$Event = {
            summary,
            description,
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            attendees: attendeeEmails.map(email => ({ email })),
            conferenceData: {
                createRequest: {
                    requestId: randomUUID(),
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            },
            // Automatic reminders for all attendees
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 24h before
                    { method: 'email', minutes: 2 * 60 },  // 2h before
                    { method: 'popup', minutes: 15 },       // 15min before (popup)
                ],
            },
        };

        const response = await this.calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all',
        });

        return response.data;
    }

    /**
     * Get free/busy information for a list of email addresses.
     * Returns overlapping free slots (at least `minInterviewerCount` people available).
     */
    async getFreeBusy(
        emails: string[],
        timeMin: Date,
        timeMax: Date
    ): Promise<{ start: string; end: string; busyEmails: string[] }[]> {
        const response = await this.calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                items: emails.map(id => ({ id })),
            },
        });

        const calendars = response.data.calendars || {};

        // Collect all busy intervals per email
        const busyByEmail: Record<string, { start: string; end: string }[]> = {};
        for (const email of emails) {
            busyByEmail[email] = (calendars[email]?.busy || []) as { start: string; end: string }[];
        }

        return Object.entries(busyByEmail).flatMap(([email, slots]) =>
            slots.map(slot => ({
                start: slot.start,
                end: slot.end,
                busyEmails: [email],
            }))
        );
    }

    /**
     * Get available 1-hour slots where all specified attendees are free.
     */
    async getAvailableSlots(
        emails: string[],
        timeMin: Date,
        timeMax: Date,
        slotDurationMinutes = 60
    ): Promise<{ start: Date; end: Date }[]> {
        const busyData = await this.getFreeBusy(emails, timeMin, timeMax);

        // Build a sorted list of all busy intervals
        const busyIntervals = busyData
            .map(b => ({ start: new Date(b.start), end: new Date(b.end) }))
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        const slots: { start: Date; end: Date }[] = [];
        const slotMs = slotDurationMinutes * 60 * 1000;

        let cursor = new Date(timeMin);
        cursor.setMinutes(0, 0, 0); // Round to hour

        while (cursor.getTime() + slotMs <= timeMax.getTime()) {
            const slotEnd = new Date(cursor.getTime() + slotMs);
            const isBlocked = busyIntervals.some(
                b => b.start < slotEnd && b.end > cursor
            );

            if (!isBlocked) {
                slots.push({ start: new Date(cursor), end: slotEnd });
            }

            cursor = new Date(cursor.getTime() + slotMs);
        }

        return slots;
    }
}

export const googleCalendarService = new GoogleCalendarService();
