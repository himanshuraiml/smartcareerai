'use client';

import React from 'react';

interface SpeakerRatio {
    name: string;
    percentage: number;
}

interface SpeakingRatioChartProps {
    data: Record<string, SpeakerRatio>;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

export function SpeakingRatioChart({ data }: SpeakingRatioChartProps) {
    const speakers = Object.values(data).sort((a, b) => b.percentage - a.percentage);

    if (speakers.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
                No speaking data available.
            </div>
        );
    }

    // Simple SVG pie chart
    const size = 120;
    const cx = size / 2;
    const cy = size / 2;
    const r = 45;

    let cumulativePercent = 0;
    const slices = speakers.map((speaker, i) => {
        const startPercent = cumulativePercent;
        cumulativePercent += speaker.percentage / 100;
        const startAngle = startPercent * 2 * Math.PI - Math.PI / 2;
        const endAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;
        const largeArc = speaker.percentage > 50 ? 1 : 0;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        return { speaker, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: COLORS[i % COLORS.length] };
    });

    return (
        <div className="flex items-center gap-6">
            {/* Pie */}
            <svg width={size} height={size} className="shrink-0">
                {slices.map(({ path, color, speaker }, i) => (
                    <path key={i} d={path} fill={color} opacity={0.85}>
                        <title>{speaker.name}: {speaker.percentage.toFixed(1)}%</title>
                    </path>
                ))}
            </svg>

            {/* Legend */}
            <div className="space-y-2 flex-1">
                {speakers.map((speaker, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-zinc-300 truncate">{speaker.name}</span>
                                <span className="text-zinc-400 ml-2">{speaker.percentage.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${speaker.percentage}%`,
                                        backgroundColor: COLORS[i % COLORS.length],
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
