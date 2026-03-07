'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Bot, Lightbulb } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface AiSuggestion {
    text: string;
    timestamp: string;
}

interface AiInsightsPanelProps {
    meetingId: string;
    socketRef: React.MutableRefObject<Socket | null>;
}

export function AiInsightsPanel({ meetingId, socketRef }: AiInsightsPanelProps) {
    const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
    const [analysisReady, setAnalysisReady] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const handleAnalysisReady = () => setAnalysisReady(true);
        const handleAnalysisStarted = () => {
            setSuggestions(prev => [
                ...prev,
                { text: '🔄 Post-meeting AI analysis has started…', timestamp: new Date().toISOString() },
            ]);
        };

        socket.on('meeting:analysis-ready', handleAnalysisReady);
        socket.on('meeting:analysis-started', handleAnalysisStarted);

        return () => {
            socket.off('meeting:analysis-ready', handleAnalysisReady);
            socket.off('meeting:analysis-started', handleAnalysisStarted);
        };
    }, [socketRef]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [suggestions]);

    return (
        <div className="flex flex-col h-full bg-zinc-900 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-zinc-700 bg-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-semibold text-zinc-100">AI Copilot</span>
                </div>
                {suggestions.length > 0 && (
                    <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                        {suggestions.length}
                    </span>
                )}
            </div>

            {analysisReady && (
                <div className="mx-3 mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-300">
                        Post-meeting analysis is ready.{' '}
                        <a
                            href={`/dashboard/meetings/${meetingId}/analysis`}
                            className="underline font-medium"
                        >
                            View report →
                        </a>
                    </span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {suggestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-4">
                        <Bot className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-xs text-center">
                            AI Copilot is listening…
                            <br />
                            Events and analysis notifications will appear here.
                        </p>
                    </div>
                ) : (
                    suggestions.map((s, i) => (
                        <div
                            key={i}
                            className="p-3 bg-zinc-800 border border-violet-500/10 rounded-md hover:border-violet-500/30 transition-colors"
                        >
                            <p className="text-xs text-zinc-500 mb-1">
                                {new Date(s.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                            <p className="text-sm text-zinc-200">{s.text}</p>
                        </div>
                    ))
                )}
                <div ref={endRef} />
            </div>
        </div>
    );
}
