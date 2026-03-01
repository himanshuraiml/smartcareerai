import { Clock } from 'lucide-react';

interface MeetingTimerProps {
    seconds: number;
    className?: string;
}

export function MeetingTimer({ seconds, className }: MeetingTimerProps) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    const display = h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;

    return (
        <div className={`flex items-center gap-1.5 text-gray-300 ${className ?? ''}`}>
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-mono text-sm tabular-nums">{display}</span>
        </div>
    );
}
