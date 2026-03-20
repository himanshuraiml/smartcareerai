'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';

interface ProctoringCameraState {
    cameraActive: boolean;
    snapshotCount: number;
    lastSnapshotAt: string | null;
    error: string | null;
}

export function useProctoringCamera(attemptId: string | null, intervalMs = 30000) {
    const [state, setState] = useState<ProctoringCameraState>({
        cameraActive: false,
        snapshotCount: 0,
        lastSnapshotAt: null,
        error: null,
    });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startCamera = useCallback(async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120 } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setState(prev => ({ ...prev, cameraActive: true, error: null }));
            return true;
        } catch {
            setState(prev => ({ ...prev, cameraActive: false, error: 'Camera permission denied' }));
            return false;
        }
    }, []);

    const captureSnapshot = useCallback(async () => {
        if (!videoRef.current || !attemptId) return;

        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, 160, 120);
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        const timestamp = new Date().toISOString();

        try {
            await authFetch(`/assessments/attempts/${attemptId}/snapshots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timestamp, imageData }),
            });
            setState(prev => ({ ...prev, snapshotCount: prev.snapshotCount + 1, lastSnapshotAt: timestamp }));
        } catch {
            // Non-critical — continue without blocking
        }
    }, [attemptId]);

    const startInterval = useCallback(() => {
        if (intervalRef.current) return;
        intervalRef.current = setInterval(captureSnapshot, intervalMs);
    }, [captureSnapshot, intervalMs]);

    const stopCamera = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setState(prev => ({ ...prev, cameraActive: false }));
    }, []);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return {
        state,
        videoRef,
        startCamera,
        captureSnapshot,
        startInterval,
        stopCamera,
    };
}

export default useProctoringCamera;
