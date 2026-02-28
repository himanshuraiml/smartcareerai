'use client';

import React, { useEffect, useRef } from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface Suggestion {
    text: string;
    timestamp: string;
}

interface CopilotSuggestionsProps {
    suggestions: Suggestion[];
}

export function CopilotSuggestions({ suggestions }: CopilotSuggestionsProps) {
    const endOfListRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to newest suggestion
    useEffect(() => {
        endOfListRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [suggestions]);

    if (suggestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-foreground/50 p-6">
                <Bot className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm text-center">AI Copilot is listening to the interview...</p>
                <p className="text-xs text-center mt-2">Suggestions for follow-up questions will appear here dynamically based on the conversation context.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Copilot Suggestions</h3>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{suggestions.length} items</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {suggestions.map((suggestion, idx) => {
                    const timeStr = new Date(suggestion.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                        <div
                            key={idx}
                            className="p-3 bg-muted/20 border border-primary/10 rounded-md shadow-sm hover:border-primary/30 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs text-muted-foreground">{timeStr}</span>
                            </div>
                            <p className="text-sm text-foreground/90">{suggestion.text}</p>

                            <div className="mt-3 flex gap-2">
                                <button className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors">
                                    Ask this
                                </button>
                                <button className="text-xs font-medium bg-muted/40 text-muted-foreground px-2 py-1 rounded hover:bg-muted/60 transition-colors">
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    );
                })}
                <div ref={endOfListRef} />
            </div>
        </div>
    );
}
