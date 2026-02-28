'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { CheckCircle, XCircle, TrendingUp, AlertCircle, Loader2, Clock, Lightbulb } from 'lucide-react';

interface TranscriptChunk {
    text: string;
    isFinal?: boolean;
    timestamp?: string;
}

interface Suggestion {
    text: string;
    timestamp: string;
}

interface PostMortemSummary {
    pros: string[];
    cons: string[];
    verdict: string;
    topics: string[];
    recommendedHire: boolean;
}

interface CopilotData {
    transcript: TranscriptChunk[];
    summary: PostMortemSummary | null;
    suggestions: Suggestion[];
}

export default function PostMortemPage() {
    const params = useParams();
    const interviewId = params?.id as string;

    const [data, setData] = useState<CopilotData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!interviewId) return;

        const fetchData = async () => {
            try {
                const res = await authFetch(`/interviews/sessions/${interviewId}/copilot`);
                if (!res.ok) throw new Error('Failed to load copilot data');
                const json = await res.json();
                setData(json.data);
            } catch (err: any) {
                setError(err.message || 'Failed to load post-mortem data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [interviewId]);

    const fullTranscriptText = data?.transcript?.map(t => t.text).join(' ') ?? '';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading post-mortem analysis...</span>
            </div>
        );
    }

    const isEmpty = !data || (data.transcript.length === 0 && data.suggestions.length === 0 && !data.summary);

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-1">Interview Post-Mortem</h1>
                <p className="text-muted-foreground">Copilot analysis for Interview #{interviewId}</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {isEmpty && !error && (
                <div className="text-center py-16 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No copilot data available yet</p>
                    <p className="text-sm mt-1">The AI Copilot must be active during the interview to generate analysis.</p>
                </div>
            )}

            {/* AI Summary */}
            {data?.summary && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`md:col-span-3 p-5 rounded-lg border ${data.summary.recommendedHire ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {data.summary.recommendedHire
                                ? <CheckCircle className="h-5 w-5 text-emerald-600" />
                                : <XCircle className="h-5 w-5 text-amber-600" />}
                            <span className="font-semibold text-sm uppercase tracking-wide">
                                {data.summary.recommendedHire ? 'Recommended to Hire' : 'Further Review Needed'}
                            </span>
                        </div>
                        <p className="text-sm text-foreground/80">{data.summary.verdict}</p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-5">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" /> Strengths
                        </h3>
                        <ul className="space-y-2">
                            {data.summary.pros.map((pro, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                    <span className="text-emerald-500 mt-0.5">•</span> {pro}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-5">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" /> Concerns
                        </h3>
                        <ul className="space-y-2">
                            {data.summary.cons.map((con, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                    <span className="text-red-400 mt-0.5">•</span> {con}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-5">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" /> Topics Covered
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {data.summary.topics.map((topic, i) => (
                                <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card shadow rounded-lg p-6 border border-border">
                    <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Full Transcript</h2>
                    <div className="h-80 overflow-y-auto pr-2">
                        {fullTranscriptText ? (
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{fullTranscriptText}</p>
                        ) : (
                            <div className="h-full flex items-center justify-center italic text-sm text-muted-foreground text-center">
                                Transcript will appear here after the interview is processed.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-card shadow rounded-lg p-6 border border-border">
                    <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Copilot Insights Surfaced</h2>
                    {data?.suggestions && data.suggestions.length > 0 ? (
                        <ul className="space-y-3 h-80 overflow-y-auto pr-2">
                            {data.suggestions.map((s, i) => (
                                <li key={i} className="p-3 bg-muted/30 border border-primary/20 rounded-md shadow-sm">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(s.timestamp).toLocaleTimeString()}
                                    </span>
                                    <span className="text-sm font-medium">{s.text}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="h-80 flex items-center justify-center italic text-sm text-muted-foreground text-center">
                            Copilot suggestions will appear here after the interview is processed.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
                <button className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted/50 transition-colors">
                    Export to ATS
                </button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                    Complete Review
                </button>
            </div>
        </div>
    );
}
