'use client';

import React from 'react';
import { FileText, CheckSquare, Lightbulb, Users, BarChart2, Clock } from 'lucide-react';
import { CandidateScorecard } from './CandidateScorecard';
import { SentimentTimeline } from './SentimentTimeline';
import { SpeakingRatioChart } from './SpeakingRatioChart';

export interface MeetingAnalysisData {
    id: string;
    meetingId: string;
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    candidateScores: {
        technical: number;
        communication: number;
        confidence: number;
        overall: number;
    };
    sentimentTimeline: Array<{
        timeWindow: string;
        startTime: number;
        endTime: number;
        sentiment: 'positive' | 'neutral' | 'negative' | 'confident';
        confidence: number;
        dominantSpeaker: string;
    }>;
    speakingRatio: Record<string, { name: string; percentage: number }>;
    fillerWordAnalysis: Record<string, { speakerName: string; total: number; words: Record<string, number> }>;
    recommendations: string[];
    hiringRecommendation: string;
    hiringJustification: string;
    processingStatus: string;
    createdAt: string;
}

interface PostMeetingAnalysisProps {
    analysis: MeetingAnalysisData;
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
                {icon}
                <h3 className="font-semibold text-zinc-100">{title}</h3>
            </div>
            {children}
        </div>
    );
}

export function PostMeetingAnalysis({ analysis }: PostMeetingAnalysisProps) {
    const topFillers = Object.entries(analysis.fillerWordAnalysis)
        .flatMap(([, info]) =>
            Object.entries(info.words).map(([word, count]) => ({ speaker: info.speakerName, word, count }))
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    return (
        <div className="space-y-6">
            {/* Summary */}
            <Section icon={<FileText className="h-5 w-5 text-violet-400" />} title="Meeting Summary">
                <p className="text-zinc-300 leading-relaxed">{analysis.summary}</p>
            </Section>

            {/* Candidate Scorecard */}
            <Section icon={<BarChart2 className="h-5 w-5 text-cyan-400" />} title="Candidate Assessment">
                <CandidateScorecard
                    scores={analysis.candidateScores}
                    hiringRecommendation={analysis.hiringRecommendation}
                    hiringJustification={analysis.hiringJustification}
                />
            </Section>

            {/* Key Points + Action Items side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section icon={<Lightbulb className="h-5 w-5 text-amber-400" />} title="Key Observations">
                    {analysis.keyPoints.length > 0 ? (
                        <ul className="space-y-2">
                            {analysis.keyPoints.map((pt, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-500 text-sm">No key points recorded.</p>
                    )}
                </Section>

                <Section icon={<CheckSquare className="h-5 w-5 text-emerald-400" />} title="Action Items">
                    {analysis.actionItems.length > 0 ? (
                        <ul className="space-y-2">
                            {analysis.actionItems.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                    <span className="text-emerald-400 mt-0.5">☐</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-500 text-sm">No action items.</p>
                    )}
                </Section>
            </div>

            {/* Sentiment Timeline */}
            {analysis.sentimentTimeline.length > 0 && (
                <Section icon={<Clock className="h-5 w-5 text-pink-400" />} title="Sentiment Timeline">
                    <SentimentTimeline data={analysis.sentimentTimeline} />
                </Section>
            )}

            {/* Speaking Ratio */}
            {Object.keys(analysis.speakingRatio).length > 0 && (
                <Section icon={<Users className="h-5 w-5 text-blue-400" />} title="Speaking Distribution">
                    <SpeakingRatioChart data={analysis.speakingRatio} />
                </Section>
            )}

            {/* Filler Words */}
            {topFillers.length > 0 && (
                <Section icon={<BarChart2 className="h-5 w-5 text-orange-400" />} title="Filler Word Analysis">
                    <div className="flex flex-wrap gap-2">
                        {topFillers.map((f, i) => (
                            <span
                                key={i}
                                className="text-xs px-2 py-1 bg-zinc-700 border border-zinc-600 rounded-full text-zinc-300"
                            >
                                &ldquo;{f.word}&rdquo; × {f.count}
                                <span className="text-zinc-500 ml-1">({f.speaker})</span>
                            </span>
                        ))}
                    </div>
                </Section>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
                <Section icon={<Lightbulb className="h-5 w-5 text-violet-400" />} title="Recommendations">
                    <ul className="space-y-2">
                        {analysis.recommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                <span className="text-violet-400 mt-0.5">→</span>
                                {r}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </div>
    );
}
