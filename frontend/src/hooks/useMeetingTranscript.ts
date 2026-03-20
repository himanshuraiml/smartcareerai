'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '@/lib/auth-fetch';

export interface TranscriptSegment {
    id: string;
    meetingId: string;
    speakerId: string;
    speakerName: string;
    text: string;
    startTime: number;
    endTime: number;
    wordCount: number;
    isFinal: boolean;
}

interface UseMeetingTranscriptOptions {
    meetingId: string;
    /** Pass the socketRef from useMeetingSocket to subscribe to live events */
    socketRef: React.RefObject<import('socket.io-client').Socket | null>;
}

export function useMeetingTranscript({ meetingId, socketRef }: UseMeetingTranscriptOptions) {
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    // Load existing transcript on mount
    useEffect(() => {
        if (!meetingId) return;

        authFetch(`/meeting-analysis/${meetingId}/transcript`)
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    setSegments(data.data);
                }
            })
            .catch(() => { /* transcript may not exist yet */ })
            .finally(() => setLoading(false));
    }, [meetingId]);

    // Subscribe to live transcript-segment events via the existing socket
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const handleSegment = (segment: TranscriptSegment) => {
            if (segment.meetingId !== meetingId) return;
            setSegments(prev => {
                // Avoid duplicate entries
                if (prev.some(s => s.id === segment.id)) return prev;
                return [...prev, segment];
            });
        };

        socket.on('transcript-segment', handleSegment);
        return () => { socket.off('transcript-segment', handleSegment); };
    }, [meetingId, socketRef]);

    // Auto-scroll to bottom when new segments arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [segments]);

    const clearTranscript = useCallback(() => setSegments([]), []);

    return { segments, loading, bottomRef, clearTranscript };
}
