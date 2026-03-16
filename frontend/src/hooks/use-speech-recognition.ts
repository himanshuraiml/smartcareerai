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
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 5;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const createRecognition = () => {
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
                        retryCountRef.current = 0; // reset on successful result

                        const words = currentTranscript.trim().split(/\s+/);
                        const count = words.length;
                        wordCountRef.current = count;

                        if (startTimeRef.current && count > 0) {
                            const durationInMinutes = (Date.now() - startTimeRef.current) / 60000;
                            if (durationInMinutes > 0.1) {
                                setWpm(Math.round(count / durationInMinutes));
                            }
                        }
                    };

                    rec.onerror = (event: any) => {
                        // 'network' and 'no-speech' are transient — don't surface as fatal errors
                        if (event.error === 'network' || event.error === 'no-speech') {
                            return; // onend will handle restart
                        }
                        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                            setError('Microphone access denied');
                            setIsListening(false);
                            isListeningRef.current = false;
                            return;
                        }
                        console.error('Speech recognition error:', event.error);
                        setError(event.error);
                    };

                    rec.onend = () => {
                        // Restart automatically if we're still supposed to be listening
                        if (isListeningRef.current && retryCountRef.current < MAX_RETRIES) {
                            retryCountRef.current += 1;
                            const delay = Math.min(500 * retryCountRef.current, 3000);
                            retryTimeoutRef.current = setTimeout(() => {
                                if (isListeningRef.current) {
                                    try {
                                        recognitionRef.current = createRecognition();
                                        recognitionRef.current.start();
                                    } catch (_) { /* already started */ }
                                }
                            }, delay);
                        } else if (retryCountRef.current >= MAX_RETRIES) {
                            setError('Speech recognition unavailable. Please check your connection.');
                            setIsListening(false);
                            isListeningRef.current = false;
                        }
                    };

                    return rec;
                };

                recognitionRef.current = createRecognition();
            }
        }

        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListeningRef.current) {
            try {
                retryCountRef.current = 0;
                isListeningRef.current = true;
                recognitionRef.current.start();
                setIsListening(true);
                startTimeRef.current = Date.now();
                setError(null);
            } catch (err) {
                console.error('Error starting speech recognition:', err);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (_) { /* already stopped */ }
        }
        setIsListening(false);
        startTimeRef.current = null;
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setWpm(0);
        wordCountRef.current = 0;
    }, []);

    return {
        transcript,
        isListening,
        wpm,
        error,
        startListening,
        stopListening,
        resetTranscript
    };
}
