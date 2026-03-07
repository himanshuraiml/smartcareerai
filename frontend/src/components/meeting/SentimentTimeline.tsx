'use client';

import React from 'react';

interface SentimentWindow {
    timeWindow: string;
    startTime: number;
    endTime: number;
    sentiment: 'positive' | 'neutral' | 'negative' | 'confident';
    confidence: number;
    dominantSpeaker: string;
}

interface SentimentTimelineProps {
    data: SentimentWindow[];
}

const SENTIMENT_COLORS: Record<string, string> = {
    positive: '#22c55e',
    confident: '#8b5cf6',
    neutral: '#6b7280',
    negative: '#ef4444',
};

const SENTIMENT_BG: Record<string, string> = {
    positive: 'bg-green-500/20 text-green-300 border-green-500/30',
    confident: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    neutral: 'bg-zinc-600/30 text-zinc-400 border-zinc-600/30',
    negative: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export function SentimentTimeline({ data }: SentimentTimelineProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
                No sentiment data available.
            </div>
        );
    }

    const maxConfidence = 1;
    const chartHeight = 120;

    return (
        <div className="space-y-4">
            {/* Bar chart */}
            <div className="flex items-end gap-1 h-32 px-1">
                {data.map((w, i) => {
                    const height = Math.max(8, (w.confidence / maxConfidence) * chartHeight);
                    const color = SENTIMENT_COLORS[w.sentiment] ?? SENTIMENT_COLORS.neutral;
                    return (
                        <div
                            key={i}
                            className="group relative flex-1 flex flex-col items-center justify-end"
                            style={{ height: chartHeight }}
                        >
                            <div
                                className="w-full rounded-t transition-all"
                                style={{ height, backgroundColor: color, opacity: 0.8 }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-36 p-2 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 shadow-lg">
                                <p className="font-medium">{w.timeWindow}</p>
                                <p className="capitalize">{w.sentiment}</p>
                                <p className="text-zinc-500">{w.dominantSpeaker}</p>
                                <p className="text-zinc-500">{(w.confidence * 100).toFixed(0)}% confidence</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* X-axis labels */}
            <div className="flex gap-1 px-1">
                {data.map((w, i) => (
                    <div key={i} className="flex-1 text-center text-xs text-zinc-600 truncate">
                        {i % 2 === 0 ? w.timeWindow.split('–')[0] : ''}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(SENTIMENT_COLORS).map(([s, color]) => (
                    <span
                        key={s}
                        className={`text-xs px-2 py-0.5 rounded-full border capitalize ${SENTIMENT_BG[s]}`}
                    >
                        {s}
                    </span>
                ))}
            </div>
        </div>
    );
}
