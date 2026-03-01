interface RaiseHandIndicatorProps {
    raised: boolean;
    className?: string;
}

export function RaiseHandIndicator({ raised, className }: RaiseHandIndicatorProps) {
    if (!raised) return null;
    return (
        <div
            className={`flex items-center gap-1 bg-yellow-500/90 text-yellow-900 rounded-full px-2 py-0.5 text-xs font-semibold animate-bounce ${className ?? ''}`}
        >
            ✋ Hand Raised
        </div>
    );
}
