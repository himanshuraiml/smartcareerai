'use client';

import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderOptions {
    maxDuration?: number; // in seconds
    onRecordingComplete?: (blob: Blob) => void;
}

interface UseAudioRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    recordingTime: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    resetRecording: () => void;
    error: string | null;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
    const { maxDuration = 300, onRecordingComplete } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            resetRecording();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);

                if (onRecordingComplete) {
                    onRecordingComplete(blob);
                }

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
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
        } catch (err: any) {
            setError(err.message || 'Failed to start recording');
            console.error('Recording error:', err);
        }
    }, [maxDuration, onRecordingComplete]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
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
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setError(null);
        chunksRef.current = [];
    }, [audioUrl]);

    return {
        isRecording,
        isPaused,
        recordingTime,
        audioBlob,
        audioUrl,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
        error,
    };
}

// Format seconds to MM:SS
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
