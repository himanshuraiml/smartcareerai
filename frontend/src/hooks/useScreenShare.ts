'use client';

import { useState, useRef, useCallback } from 'react';
import type { Producer } from 'mediasoup-client/types';

interface UseScreenShareOptions {
    /** Publish a track on the mediasoup send transport and return the producer */
    publishTrack: (track: MediaStreamTrack, appData: Record<string, unknown>) => Promise<Producer>;
    /** Close a mediasoup producer by id */
    closeProducer: (producerId: string) => void;
    /** Called when a screen producer is created so the socket can notify peers */
    onStarted?: (producerId: string) => void;
    /** Called when screen sharing stops so the socket can notify peers */
    onStopped?: (producerId: string) => void;
}

export function useScreenShare({
    publishTrack,
    closeProducer,
    onStarted,
    onStopped,
}: UseScreenShareOptions) {
    const [isSharing, setIsSharing] = useState(false);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const producerRef = useRef<Producer | null>(null);

    const stopScreenShare = useCallback(() => {
        if (producerRef.current) {
            const id = producerRef.current.id;
            closeProducer(id);
            onStopped?.(id);
            producerRef.current = null;
        }
        screenStream?.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
        setIsSharing(false);
    }, [screenStream, closeProducer, onStopped]);

    const startScreenShare = useCallback(async () => {
        if (isSharing) return;
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 15 } },
                audio: false,
            });

            const track = stream.getVideoTracks()[0];

            const producer = await publishTrack(track, { type: 'screen' });
            producerRef.current = producer;
            setScreenStream(stream);
            setIsSharing(true);
            onStarted?.(producer.id);

            // Handle user stopping via browser stop-sharing button
            track.addEventListener('ended', () => stopScreenShare());
        } catch (err: unknown) {
            // User cancelled getDisplayMedia — ignore
            if ((err as Error)?.name !== 'NotAllowedError') {
                console.error('Screen share error:', err);
            }
        }
    }, [isSharing, publishTrack, onStarted, stopScreenShare]);

    return { isSharing, screenStream, startScreenShare, stopScreenShare };
}
