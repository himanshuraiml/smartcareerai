/**
 * Twilio NTS – TURN/STUN Credential Service
 *
 * Twilio Network Traversal Service (NTS) provides temporary TURN/STUN credentials
 * that expire every 24 hours. We must fetch fresh credentials before each WebRTC
 * session, not hardcode them.
 *
 * Twilio free tier: 1 GB / month of TURN relay traffic. Sufficient for early users.
 * Docs: https://www.twilio.com/docs/stun-turn
 */

interface IceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}

interface TwilioToken {
    ice_servers: Array<{
        url: string;
        urls?: string;
        username?: string;
        credential?: string;
    }>;
    date_updated: string;
    account_sid: string;
    ttl: string;
    date_created: string;
    username: string;
    password: string;
}

// Simple in-memory cache to avoid hammering the Twilio API
// Credentials are valid for 24h (86400s), we refresh every 20h to be safe
const CACHE_TTL_MS = 20 * 60 * 60 * 1000; // 20 hours

let cachedServers: IceServer[] | null = null;
let cacheExpiry = 0;

/**
 * Fetch fresh ICE servers (STUN + TURN) from Twilio NTS.
 *
 * Returns a list of ICE server objects compatible with the WebRTC RTCIceServer interface.
 * Results are cached for 20 hours to avoid excessive API calls.
 */
export async function getTwilioIceServers(): Promise<IceServer[]> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // If Twilio is not configured, fall back to Google STUN only
    if (!accountSid || !authToken) {
        return [{ urls: 'stun:stun.l.google.com:19302' }];
    }

    // Return cached servers if still valid
    if (cachedServers && Date.now() < cacheExpiry) {
        return cachedServers;
    }

    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`;
        const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            throw new Error(`Twilio API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json() as TwilioToken;

        // Map Twilio's format to standard RTCIceServer format
        const iceServers: IceServer[] = data.ice_servers.map((s) => ({
            urls: s.urls ?? s.url,
            ...(s.username && { username: s.username }),
            ...(s.credential && { credential: s.credential }),
        }));

        // Cache the result
        cachedServers = iceServers;
        cacheExpiry = Date.now() + CACHE_TTL_MS;

        return iceServers;
    } catch (err) {
        console.error('[TurnCredentials] Failed to fetch Twilio ICE servers:', err);
        // Graceful degradation — return Google STUN only
        return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
}

/**
 * Invalidate the ICE server cache (call this if you suspect stale credentials).
 */
export function invalidateTurnCache(): void {
    cachedServers = null;
    cacheExpiry = 0;
}
