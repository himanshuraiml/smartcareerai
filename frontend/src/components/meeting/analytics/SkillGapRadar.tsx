'use client';

import React from 'react';

interface SkillGapRadarProps {
    scores: {
        technical: number;
        communication: number;
        confidence: number;
        overall: number;
    };
    /** Optional benchmark scores to compare against */
    benchmark?: {
        technical: number;
        communication: number;
        confidence: number;
        overall: number;
    };
    size?: number;
}

const AXES = [
    { key: 'technical', label: 'Technical' },
    { key: 'communication', label: 'Communication' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'overall', label: 'Overall' },
] as const;

export function SkillGapRadar({ scores, benchmark, size = 220 }: SkillGapRadarProps) {
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.33;
    const sides = AXES.length;
    const gridLevels = [25, 50, 75, 100];

    function getPoint(value: number, index: number) {
        const angle = (index * 2 * Math.PI) / sides - Math.PI / 2;
        const dist = (value / 100) * r;
        return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
    }

    function polygonPoints(data: Record<string, number>) {
        return AXES.map((ax, i) => {
            const pt = getPoint(data[ax.key] ?? 0, i);
            return `${pt.x},${pt.y}`;
        }).join(' ');
    }

    const scorePts = polygonPoints(scores as Record<string, number>);
    const benchmarkPts = benchmark ? polygonPoints(benchmark as Record<string, number>) : null;

    return (
        <svg width={size} height={size} className="overflow-visible">
            {/* Grid rings */}
            {gridLevels.map(level => (
                <polygon
                    key={level}
                    points={AXES.map((_, i) => {
                        const pt = getPoint(level, i);
                        return `${pt.x},${pt.y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3f3f46"
                    strokeWidth="1"
                />
            ))}

            {/* Axis lines */}
            {AXES.map((_, i) => {
                const pt = getPoint(100, i);
                return (
                    <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#3f3f46" strokeWidth="1" />
                );
            })}

            {/* Benchmark polygon */}
            {benchmarkPts && (
                <polygon
                    points={benchmarkPts}
                    fill="rgba(234,179,8,0.08)"
                    stroke="#eab308"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                />
            )}

            {/* Score polygon */}
            <polygon
                points={scorePts}
                fill="rgba(139,92,246,0.2)"
                stroke="#8b5cf6"
                strokeWidth="2"
            />

            {/* Score dots */}
            {AXES.map((ax, i) => {
                const pt = getPoint(scores[ax.key] ?? 0, i);
                return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#8b5cf6" />;
            })}

            {/* Axis labels */}
            {AXES.map((ax, i) => {
                const pt = getPoint(118, i);
                return (
                    <text
                        key={i}
                        x={pt.x}
                        y={pt.y}
                        fill="#a1a1aa"
                        fontSize="11"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {ax.label}
                    </text>
                );
            })}

            {/* Score values */}
            {AXES.map((ax, i) => {
                const val = scores[ax.key] ?? 0;
                if (val === 0) return null;
                const pt = getPoint(val, i);
                return (
                    <text
                        key={i}
                        x={pt.x}
                        y={pt.y - 8}
                        fill="#c4b5fd"
                        fontSize="9"
                        textAnchor="middle"
                        fontWeight="600"
                    >
                        {val}
                    </text>
                );
            })}
        </svg>
    );
}
