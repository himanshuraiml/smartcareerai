'use client';

import { useState, useRef, useCallback } from 'react';

interface UseVideoRecorderOptions {
    maxDuration?: number; // in seconds
    onRecordingComplete?: (blob: Blob) => void;
}

interface UseVideoRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    recordingTime: number;
    videoBlob: Blob | null;
    videoUrl: string | null;
    previewStream: MediaStream | null;
    startPreview: () => Promise<void>;
    stopPreview: () => void;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    resetRecording: () => void;
    error: string | null;
}

export function useVideoRecorder(options: UseVideoRecorderOptions = {}): UseVideoRecorderReturn {
    const { maxDuration = 180, onRecordingComplete } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startPreview = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: true,
            });
            streamRef.current = stream;
            setPreviewStream(stream);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
            setError(errorMessage);
            console.error('Camera access error:', err);
        }
    }, []);

    const stopPreview = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setPreviewStream(null);
        }
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            resetRecording();

            // Use existing stream or create new one
            if (!streamRef.current) {
                await startPreview();
            }

            if (!streamRef.current) {
                throw new Error('Failed to get media stream');
            }

            const mediaRecorder = new MediaRecorder(streamRef.current, {
                mimeType: 'video/webm;codecs=vp9,opus',
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setVideoBlob(blob);
                setVideoUrl(url);

                if (onRecordingComplete) {
                    onRecordingComplete(blob);
                }
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= maxDuration) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
            setError(errorMessage);
            console.error('Recording error:', err);
        }
    }, [maxDuration, onRecordingComplete, startPreview]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            // Don't stop preview yet - user might want to re-record
        }
    }, [isRecording]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [isRecording, isPaused]);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= maxDuration) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
    }, [isRecording, isPaused, maxDuration, stopRecording]);

    const resetRecording = useCallback(() => {
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }
        setVideoBlob(null);
        setVideoUrl(null);
        setRecordingTime(0);
        setError(null);
        chunksRef.current = [];
    }, [videoUrl]);

    return {
        isRecording,
        isPaused,
        recordingTime,
        videoBlob,
        videoUrl,
        previewStream,
        startPreview,
        stopPreview,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
        error,
    };
}

// Format seconds to MM:SS (reusing from audio recorder)
export function formatVideoTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
