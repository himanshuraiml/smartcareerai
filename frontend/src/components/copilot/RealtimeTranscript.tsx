'use client';

import React, { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';

interface TranscriptLine {
    text: string;
    isFinal: boolean;
    timestamp: string;
}

interface RealtimeTranscriptProps {
    transcript: TranscriptLine[];
}

export function RealtimeTranscript({ transcript }: RealtimeTranscriptProps) {
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Live Transcript</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
                {transcript.length === 0 ? (
                    <div className="text-muted-foreground text-center italic mt-10">
                        Awaiting audio stream...
                    </div>
                ) : (
                    transcript.map((line, idx) => (
                        <div key={idx} className={`p-2 rounded ${line.isFinal ? 'text-foreground' : 'text-foreground/50 italic bg-muted/20'}`}>
                            <span className="text-xs text-muted-foreground mr-2 select-none">
                                [{new Date(line.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                            </span>
                            {line.text}
                        </div>
                    ))
                )}
                <div ref={transcriptEndRef} />
            </div>
        </div>
    );
}
