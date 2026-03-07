'use client';

import { useRef } from 'react';
import { TranscriptSegment } from '@/hooks/useMeetingTranscript';
import { TranscriptEntry } from './TranscriptEntry';

interface TranscriptPanelProps {
    segments: TranscriptSegment[];
    loading: boolean;
    currentUserId: string;
    /** Pass the ref from useMeetingTranscript for auto-scroll */
    bottomRef: React.MutableRefObject<HTMLDivElement | null>;
    className?: string;
}

export function TranscriptPanel({
    segments,
    loading,
    currentUserId,
    bottomRef,
    className = '',
}: TranscriptPanelProps) {
    return (
        <div className={`flex flex-col h-full bg-zinc-900 rounded-xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
                <h3 className="text-sm font-semibold text-zinc-200">Live Transcript</h3>
                <span className="text-xs text-zinc-500">{segments.length} segment{segments.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Segments */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700">
                {loading && segments.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-zinc-500 text-sm">Loading transcript…</p>
                    </div>
                )}

                {!loading && segments.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                        <span className="text-2xl">🎙️</span>
                        <p className="text-zinc-500 text-sm">
                            Transcript will appear here when recording starts.
                        </p>
                    </div>
                )}

                {segments.map(segment => (
                    <TranscriptEntry
                        key={segment.id}
                        segment={segment}
                        isCurrentUser={segment.speakerId === currentUserId}
                    />
                ))}

                {/* Auto-scroll anchor */}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
