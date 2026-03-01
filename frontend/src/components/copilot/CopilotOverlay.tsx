'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RealtimeTranscript } from './RealtimeTranscript';
import { CopilotSuggestions } from './CopilotSuggestions';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, MicOff, Wifi, WifiOff } from 'lucide-react';

interface CopilotOverlayProps {
    interviewId: string;
    meetingUrl: string;
}

// Declare SpeechRecognition types for browser compatibility
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
    error: string;
    message: string;
}

export function CopilotOverlay({ interviewId, meetingUrl }: CopilotOverlayProps) {
    const [transcript, setTranscript] = useState<{ text: string; isFinal: boolean; timestamp: string }[]>([]);
    const [suggestions, setSuggestions] = useState<{ text: string; timestamp: string }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false);

    // Connect to socket.io on mount
    useEffect(() => {
        const gatewayUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api\/v1\/?$/, '');
        const newSocket = io(gatewayUrl, { withCredentials: true });
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('join_interview', interviewId);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Listen for transcript broadcasts (in case multiple tabs)
        newSocket.on('copilot:transcript', (data) => {
            setTranscript((prev) => {
                const newTranscript = [...prev];
                if (newTranscript.length > 0 && !newTranscript[newTranscript.length - 1].isFinal && !data.isFinal) {
                    newTranscript[newTranscript.length - 1] = { ...data };
                } else {
                    newTranscript.push(data);
                }
                return newTranscript;
            });
        });

        newSocket.on('copilot:suggestions', (data) => {
            setSuggestions((prev) => {
                const newItems = data.suggestions.map((text: string) => ({
                    text,
                    timestamp: data.timestamp,
                }));
                return [...prev, ...newItems];
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, [interviewId]);

    const startListening = useCallback(() => {
        setError(null);

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;
                const isFinal = result.isFinal;
                const timestamp = new Date().toISOString();

                // Emit via socket.io so the gateway broadcasts and processes it
                socketRef.current?.emit('copilot:transcript', {
                    interviewId,
                    text,
                    isFinal,
                    timestamp,
                });
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone access and try again.');
                setIsListening(false);
            } else if (event.error === 'no-speech') {
                // Ignore no-speech errors — just means silence
            } else {
                setError(`Speech recognition error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            // Auto-restart if still supposed to be listening (browser stops after silence)
            if (isListeningRef.current) {
                try {
                    recognition.start();
                } catch {
                    // Already started
                }
            }
        };

        recognitionRef.current = recognition;
        isListeningRef.current = true;
        recognition.start();
        setIsListening(true);
    }, [interviewId]);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);

        // Tell gateway to generate the post-mortem summary
        socketRef.current?.emit('copilot:stop', { interviewId });
    }, [interviewId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isListeningRef.current = false;
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border">
                <div>
                    <h2 className="text-lg font-semibold">AI Interview Copilot</h2>
                    <p className="text-sm text-muted-foreground">
                        {isListening
                            ? 'Listening via your microphone — keep this tab open during the meeting.'
                            : 'Start listening to capture the interview audio from your microphone.'}
                    </p>
                    {meetingUrl && (
                        <a
                            href={meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                            Open meeting in new tab
                        </a>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {/* Connection status */}
                    <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>

                    {!isListening ? (
                        <Button onClick={startListening} disabled={!isConnected}>
                            <Mic className="mr-2 h-4 w-4" />
                            Start Listening
                        </Button>
                    ) : (
                        <Button variant="destructive" onClick={stopListening}>
                            <MicOff className="mr-2 h-4 w-4" />
                            Stop Listening
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                </div>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
                <RealtimeTranscript transcript={transcript} />
                <CopilotSuggestions suggestions={suggestions} />
            </div>
        </div>
    );
}
