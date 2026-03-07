'use client';

import React from 'react';
import { TrendingUp, MessageSquare, Zap, Star } from 'lucide-react';

interface CandidateScores {
    technical: number;
    communication: number;
    confidence: number;
    overall: number;
}

interface CandidateScorecardProps {
    scores: CandidateScores;
    hiringRecommendation: string;
    hiringJustification: string;
}

const RECOMMENDATION_STYLE: Record<string, { label: string; className: string }> = {
    STRONG_YES: { label: 'Strong Yes', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    YES: { label: 'Yes', className: 'bg-green-500/20 text-green-300 border-green-500/40' },
    MAYBE: { label: 'Maybe', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    NO: { label: 'No', className: 'bg-red-500/20 text-red-300 border-red-500/40' },
};

function ScoreBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    const color = value >= 75 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-zinc-300">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="font-semibold" style={{ color }}>{value}/100</span>
            </div>
            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

export function CandidateScorecard({
    scores,
    hiringRecommendation,
    hiringJustification,
}: CandidateScorecardProps) {
    const rec = RECOMMENDATION_STYLE[hiringRecommendation] ?? RECOMMENDATION_STYLE.MAYBE;

    return (
        <div className="space-y-5">
            {/* Overall score ring */}
            <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3" />
                        <circle
                            cx="18" cy="18" r="15.9" fill="none"
                            stroke={scores.overall >= 75 ? '#22c55e' : scores.overall >= 50 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="3"
                            strokeDasharray={`${scores.overall} 100`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-zinc-100">{scores.overall}</span>
                        <span className="text-xs text-zinc-500">overall</span>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-zinc-200">Hiring Recommendation</span>
                    </div>
                    <span className={`inline-block text-sm px-3 py-0.5 rounded-full border font-medium ${rec.className}`}>
                        {rec.label}
                    </span>
                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{hiringJustification}</p>
                </div>
            </div>

            {/* Score bars */}
            <div className="space-y-3">
                <ScoreBar label="Technical" value={scores.technical} icon={<TrendingUp className="h-3.5 w-3.5 text-violet-400" />} />
                <ScoreBar label="Communication" value={scores.communication} icon={<MessageSquare className="h-3.5 w-3.5 text-cyan-400" />} />
                <ScoreBar label="Confidence" value={scores.confidence} icon={<Zap className="h-3.5 w-3.5 text-amber-400" />} />
            </div>
        </div>
    );
}
