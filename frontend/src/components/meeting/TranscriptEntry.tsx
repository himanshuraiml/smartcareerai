'use client';

import { TranscriptSegment } from '@/hooks/useMeetingTranscript';

interface TranscriptEntryProps {
    segment: TranscriptSegment;
    isCurrentUser: boolean;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

/** Returns a consistent color for a speaker based on their userId */
function speakerColor(userId: string): string {
    const colors = [
        'text-blue-400',
        'text-emerald-400',
        'text-violet-400',
        'text-amber-400',
        'text-rose-400',
        'text-cyan-400',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
}

export function TranscriptEntry({ segment, isCurrentUser }: TranscriptEntryProps) {
    return (
        <div className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg ${isCurrentUser ? 'bg-zinc-800' : 'bg-transparent'}`}>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${speakerColor(segment.speakerId)}`}>
                    {segment.speakerName}
                    {isCurrentUser && <span className="text-zinc-500 font-normal ml-1">(you)</span>}
                </span>
                <span className="text-zinc-600 text-xs ml-auto">{formatTime(segment.startTime)}</span>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">{segment.text}</p>
        </div>
    );
}
