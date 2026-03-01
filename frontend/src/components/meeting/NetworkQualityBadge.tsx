const BAR_COLORS: Record<number, string> = {
    1: 'bg-red-500',
    2: 'bg-orange-400',
    3: 'bg-yellow-400',
    4: 'bg-green-400',
    5: 'bg-green-500',
};

const LABELS: Record<number, string> = {
    1: 'Very poor',
    2: 'Poor',
    3: 'Fair',
    4: 'Good',
    5: 'Excellent',
};

interface NetworkQualityBadgeProps {
    quality: number; // 1-5
    className?: string;
}

export function NetworkQualityBadge({ quality, className }: NetworkQualityBadgeProps) {
    const color = BAR_COLORS[quality] ?? 'bg-gray-500';
    const label = LABELS[quality] ?? 'Unknown';

    return (
        <div
            className={`flex items-end gap-px ${className ?? ''}`}
            title={`Network: ${label}`}
            aria-label={`Network quality: ${label}`}
        >
            {[1, 2, 3, 4, 5].map((bar) => (
                <div
                    key={bar}
                    className={`w-1 rounded-sm transition-colors duration-300 ${
                        bar <= quality ? color : 'bg-gray-600'
                    }`}
                    style={{ height: `${bar * 3 + 3}px` }}
                />
            ))}
        </div>
    );
}
