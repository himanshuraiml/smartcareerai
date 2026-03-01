'use client';

/**
 * useIceServers — fetches fresh TURN/STUN credentials from Twilio NTS via the media-service.
 *
 * Twilio TURN credentials expire every 24 hours, so we must fetch them fresh
 * before each WebRTC session. This hook handles the fetch, loading state, and
 * falls back to Google STUN-only if the fetch fails.
 *
 * Usage:
 *   const { iceServers, loading } = useIceServers();
 *   // Pass iceServers to your mediasoup Device / RTCPeerConnection config
 */

import { useState, useEffect, useCallback } from 'react';

interface IceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}

const GOOGLE_STUN_FALLBACK: IceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

export function useIceServers() {
    const [iceServers, setIceServers] = useState<IceServer[]>(GOOGLE_STUN_FALLBACK);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIceServers = useCallback(async () => {
        setLoading(true);
        setError(null);

        const mediaServiceUrl =
            process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || 'http://localhost:3014';

        try {
            const res = await fetch(`${mediaServiceUrl}/meetings/ice-servers`, {
                signal: AbortSignal.timeout(8000),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json() as { iceServers: IceServer[] };

            if (data.iceServers && data.iceServers.length > 0) {
                setIceServers(data.iceServers);
            } else {
                setIceServers(GOOGLE_STUN_FALLBACK);
            }
        } catch (err) {
            console.warn('[useIceServers] Could not fetch TURN credentials, using STUN fallback:', err);
            setError('Failed to fetch TURN credentials');
            setIceServers(GOOGLE_STUN_FALLBACK); // degrade gracefully
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIceServers();
    }, [fetchIceServers]);

    return { iceServers, loading, error, refetch: fetchIceServers };
}
