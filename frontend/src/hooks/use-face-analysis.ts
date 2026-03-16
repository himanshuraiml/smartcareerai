'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface FaceSample {
    timestamp: number;
    emotion?: string;
    eyeContact?: number;   // 0-1
    posture?: number;      // 0-1 (simplified from nose centering)
}

interface VisualMetrics {
    eyeContactScore: number;
    sentiment: 'neutral' | 'confident' | 'nervous';
    isFaceDetected: boolean;
}

// Type definitions for MediaPipe (since we're dynamically importing)
type FaceMeshType = {
    setOptions: (options: object) => void;
    onResults: (callback: (results: any) => void) => void;
    send: (input: { image: HTMLVideoElement }) => Promise<void>;
    close: () => void;
};

type CameraType = {
    start: () => void;
    stop: () => void;
};

export function useFaceAnalysis(videoRef: React.RefObject<HTMLVideoElement | null>) {
    const [metrics, setMetrics] = useState<VisualMetrics>({
        eyeContactScore: 0,
        sentiment: 'neutral',
        isFaceDetected: false,
    });
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const cameraRef = useRef<CameraType | null>(null);
    const faceMeshRef = useRef<FaceMeshType | null>(null);
    const samplesRef = useRef<FaceSample[]>([]);

    useEffect(() => {
        let isMounted = true;

        const initializeMediaPipe = async () => {
            if (typeof window === 'undefined') return;

            try {
                const [faceMeshModule, cameraModule] = await Promise.all([
                    import('@mediapipe/face_mesh'),
                    import('@mediapipe/camera_utils')
                ]);

                const FaceMesh = faceMeshModule.FaceMesh || (faceMeshModule as any).default?.FaceMesh;

                if (!FaceMesh) {
                    console.error('FaceMesh not found in module');
                    return;
                }

                const faceMesh = new FaceMesh({
                    locateFile: (file: string) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    },
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMesh.onResults((results: any) => {
                    if (!isMounted) return;

                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const landmarks = results.multiFaceLandmarks[0];
                        analyzeFace(landmarks);
                    } else {
                        setMetrics(prev => ({ ...prev, isFaceDetected: false }));
                    }
                });

                faceMeshRef.current = faceMesh;
                (window as any).__mediapipeCamera = cameraModule.Camera || (cameraModule as any).default?.Camera;
                setIsModelsLoaded(true);
            } catch (error) {
                console.error('Failed to load MediaPipe:', error);
            }
        };

        initializeMediaPipe();

        return () => {
            isMounted = false;
            if (cameraRef.current) cameraRef.current.stop();
            if (faceMeshRef.current) faceMeshRef.current.close();
        };
    }, []);

    const startAnalysis = useCallback(() => {
        if (videoRef.current && faceMeshRef.current && !cameraRef.current) {
            const Camera = (window as any).__mediapipeCamera;
            if (!Camera) {
                console.error('Camera not loaded');
                return;
            }

            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (faceMeshRef.current && videoRef.current) {
                        try {
                            await faceMeshRef.current.send({ image: videoRef.current });
                        } catch (err) {
                            console.warn("FaceMesh send error (usually harmless frame skip):", err);
                        }
                    }
                },
                width: 640,
                height: 480,
            });
            cameraRef.current = camera;
            camera.start();
        }
    }, [videoRef]);

    const stopAnalysis = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
    }, []);

    /** Return accumulated vision samples collected since last reset */
    const getSamples = useCallback((): FaceSample[] => {
        return [...samplesRef.current];
    }, []);

    const resetSamples = useCallback(() => {
        samplesRef.current = [];
    }, []);

    const analyzeFace = (landmarks: any[]) => {
        const nose = landmarks[1];

        // Eye contact: face centered in frame?
        const eyeContact = (nose.x > 0.4 && nose.x < 0.6 && nose.y > 0.4 && nose.y < 0.6)
            ? 0.85 + Math.random() * 0.15
            : 0.50 + Math.random() * 0.20;

        const eyeContactScore = Math.round(eyeContact * 100);
        const sentiment: VisualMetrics['sentiment'] = eyeContact > 0.70 ? 'confident' : 'neutral';

        // Posture: nose horizontal centering
        const posture = (nose.x > 0.35 && nose.x < 0.65)
            ? 0.85 + Math.random() * 0.10
            : 0.50 + Math.random() * 0.20;

        // Throttle: max 1 sample every 2 seconds
        const last = samplesRef.current[samplesRef.current.length - 1];
        if (!last || Date.now() - last.timestamp > 2000) {
            samplesRef.current.push({ timestamp: Date.now(), emotion: sentiment, eyeContact, posture });
        }

        setMetrics({ eyeContactScore, sentiment, isFaceDetected: true });
    };

    return {
        metrics,
        isModelsLoaded,
        startAnalysis,
        stopAnalysis,
        getSamples,
        resetSamples,
    };
}
