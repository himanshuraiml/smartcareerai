'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface ProctoringState {
    cameraAllowed: boolean;
    micAllowed: boolean;
    screenShareActive: boolean;
    isEntireScreen: boolean;
    isFullscreen: boolean;
    violations: number;
    violationLog: { type: string; timestamp: Date }[];
}

export interface ProctoringControls {
    requestCamera: () => Promise<boolean>;
    requestMic: () => Promise<boolean>;
    requestScreenShare: () => Promise<boolean>;
    enterFullscreen: () => Promise<boolean>;
    exitFullscreen: () => Promise<void>;
    stopAllStreams: () => void;
    resetViolations: () => void;
}

export function useProctoring() {
    const [state, setState] = useState<ProctoringState>({
        cameraAllowed: false,
        micAllowed: false,
        screenShareActive: false,
        isEntireScreen: false,
        isFullscreen: false,
        violations: 0,
        violationLog: [],
    });

    const cameraStreamRef = useRef<MediaStream | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    // Track violations
    const addViolation = useCallback((type: string) => {
        setState(prev => ({
            ...prev,
            violations: prev.violations + 1,
            violationLog: [...prev.violationLog, { type, timestamp: new Date() }],
        }));
    }, []);

    // Request camera permission
    const requestCamera = useCallback(async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraStreamRef.current = stream;
            setState(prev => ({ ...prev, cameraAllowed: true }));
            return true;
        } catch (error) {
            console.error('Camera permission denied:', error);
            setState(prev => ({ ...prev, cameraAllowed: false }));
            return false;
        }
    }, []);

    // Request microphone permission
    const requestMic = useCallback(async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;
            setState(prev => ({ ...prev, micAllowed: true }));
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            setState(prev => ({ ...prev, micAllowed: false }));
            return false;
        }
    }, []);

    // Request screen share with entire screen detection
    const requestScreenShare = useCallback(async (): Promise<boolean> => {
        try {
            // Stop any existing screen share
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });

            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();

            // Check if entire screen is shared (displaySurface === 'monitor')
            // Note: This property may not be available in all browsers
            const displaySurface = (settings as any).displaySurface;
            const isEntireScreen = displaySurface === 'monitor';

            if (!isEntireScreen) {
                // User didn't share entire screen
                stream.getTracks().forEach(track => track.stop());
                setState(prev => ({
                    ...prev,
                    screenShareActive: false,
                    isEntireScreen: false
                }));
                return false;
            }

            screenStreamRef.current = stream;

            // Handle screen share ending
            videoTrack.onended = () => {
                setState(prev => ({
                    ...prev,
                    screenShareActive: false,
                    isEntireScreen: false
                }));
                addViolation('screen_share_ended');
            };

            setState(prev => ({
                ...prev,
                screenShareActive: true,
                isEntireScreen: true
            }));
            return true;
        } catch (error) {
            console.error('Screen share denied:', error);
            setState(prev => ({
                ...prev,
                screenShareActive: false,
                isEntireScreen: false
            }));
            return false;
        }
    }, [addViolation]);

    // Enter fullscreen mode
    const enterFullscreen = useCallback(async (): Promise<boolean> => {
        try {
            await document.documentElement.requestFullscreen();
            setState(prev => ({ ...prev, isFullscreen: true }));
            return true;
        } catch (error) {
            console.error('Fullscreen request failed:', error);
            return false;
        }
    }, []);

    // Exit fullscreen mode
    const exitFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            setState(prev => ({ ...prev, isFullscreen: false }));
        } catch (error) {
            console.error('Exit fullscreen failed:', error);
        }
    }, []);

    // Stop all media streams
    const stopAllStreams = useCallback(() => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        setState(prev => ({
            ...prev,
            cameraAllowed: false,
            micAllowed: false,
            screenShareActive: false,
            isEntireScreen: false,
        }));
    }, []);

    // Reset violations
    const resetViolations = useCallback(() => {
        setState(prev => ({ ...prev, violations: 0, violationLog: [] }));
    }, []);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFullscreen = !!document.fullscreenElement;
            setState(prev => {
                if (prev.isFullscreen && !isFullscreen) {
                    // User exited fullscreen - this is a violation
                    return {
                        ...prev,
                        isFullscreen,
                        violations: prev.violations + 1,
                        violationLog: [...prev.violationLog, { type: 'fullscreen_exit', timestamp: new Date() }],
                    };
                }
                return { ...prev, isFullscreen };
            });
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Listen for visibility changes (tab switches)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && state.isFullscreen) {
                addViolation('tab_switch');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [state.isFullscreen, addViolation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAllStreams();
        };
    }, [stopAllStreams]);

    const controls: ProctoringControls = {
        requestCamera,
        requestMic,
        requestScreenShare,
        enterFullscreen,
        exitFullscreen,
        stopAllStreams,
        resetViolations,
    };

    // Check if all requirements are met
    const allRequirementsMet =
        state.cameraAllowed &&
        state.micAllowed &&
        state.isEntireScreen;

    return {
        state,
        controls,
        allRequirementsMet,
        cameraStream: cameraStreamRef.current,
        micStream: micStreamRef.current,
        screenStream: screenStreamRef.current,
    };
}

export default useProctoring;
