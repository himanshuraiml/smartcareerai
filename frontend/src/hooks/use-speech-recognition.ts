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
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const startTimeRef = useRef<number | null>(null);
    const wordCountRef = useRef<number>(0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    let currentTranscript = '';
                    for (let i = 0; i < event.results.length; i++) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    setTranscript(currentTranscript);

                    // Calculate WPM
                    const words = currentTranscript.trim().split(/\s+/);
                    const count = words.length;
                    wordCountRef.current = count;

                    if (startTimeRef.current && count > 0) {
                        const durationInMinutes = (Date.now() - startTimeRef.current) / 60000;
                        if (durationInMinutes > 0.1) { // Wait 6 seconds before calc to stabilize
                            setWpm(Math.round(count / durationInMinutes));
                        }
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setError(event.error);
                };
            } else {
                setError('Browser does not support Speech Recognition');
            }
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                startTimeRef.current = Date.now();
                setError(null);
            } catch (err) {
                console.error('Error starting speech recognition:', err);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop();
                setIsListening(false);
                startTimeRef.current = null;
            } catch (err) {
                console.error('Error stopping speech recognition:', err);
            }
        }
    }, [isListening]);

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
