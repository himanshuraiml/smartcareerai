import { useState, useEffect, useRef, useCallback } from 'react';

export interface SpeechRecognitionResult {
    transcript: string;
    isListening: boolean;
    wpm: number;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [wpm, setWpm] = useState(0);
    const [error, setError] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        return SR ? null : 'Browser does not support Speech Recognition';
    });

    const recognitionRef = useRef<any>(null);
    const startTimeRef = useRef<number | null>(null);
    const wordCountRef = useRef<number>(0);
    const isListeningRef = useRef(false);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Track if we've had a fatal error (mic denied etc.) — stop retrying in that case
    const fatalErrorRef = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const createAndStart = () => {
            if (!isListeningRef.current || fatalErrorRef.current) return;

            // Abort any existing instance before creating a new one
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (_) { /* ok */ }
            }

            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';

            rec.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);

                const words = currentTranscript.trim().split(/\s+/);
                const count = words.filter(Boolean).length;
                wordCountRef.current = count;

                if (startTimeRef.current && count > 0) {
                    const durationInMinutes = (Date.now() - startTimeRef.current) / 60000;
                    if (durationInMinutes > 0.05) {
                        setWpm(Math.round(count / durationInMinutes));
                    }
                }
            };

            rec.onerror = (event: any) => {
                // Fatal errors — mic denied or browser policy
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    fatalErrorRef.current = true;
                    setError('Microphone access denied. Please allow microphone and refresh.');
                    setIsListening(false);
                    isListeningRef.current = false;
                    return;
                }
                // Transient errors (no-speech, network, aborted) — onend will restart
            };

            rec.onend = () => {
                // Always restart unless the user explicitly stopped or a fatal error occurred
                if (!isListeningRef.current || fatalErrorRef.current) return;

                // Small delay to avoid hammering the API
                retryTimeoutRef.current = setTimeout(() => {
                    createAndStart();
                }, 300);
            };

            recognitionRef.current = rec;
            try {
                rec.start();
            } catch (err: any) {
                // InvalidStateError: already started — onend will handle restart
                if (err?.name !== 'InvalidStateError') {
                    console.warn('Speech recognition start error:', err);
                }
            }
        };

        // Expose createAndStart so startListening can call it
        (recognitionRef as any)._createAndStart = createAndStart;

        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, []);

    const startListening = useCallback(() => {
        if (isListeningRef.current) return; // already running
        fatalErrorRef.current = false;
        isListeningRef.current = true;
        setIsListening(true);
        setError(null);
        startTimeRef.current = Date.now();

        // Trigger the create-and-start cycle
        const fn = (recognitionRef as any)._createAndStart;
        if (fn) fn();
    }, []);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (_) { /* ok */ }
        }
        setIsListening(false);
        startTimeRef.current = null;
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setWpm(0);
        wordCountRef.current = 0;
    }, []);

    return { transcript, isListening, wpm, error, startListening, stopListening, resetTranscript };
}
