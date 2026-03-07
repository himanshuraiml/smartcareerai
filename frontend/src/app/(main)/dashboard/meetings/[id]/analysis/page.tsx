'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { PostMeetingAnalysis, MeetingAnalysisData } from '@/components/meeting/PostMeetingAnalysis';

type Status = 'loading' | 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';

export default function MeetingAnalysisPage() {
    const { id: meetingId } = useParams<{ id: string }>();
    const router = useRouter();

    const [analysis, setAnalysis] = useState<MeetingAnalysisData | null>(null);
    const [status, setStatus] = useState<Status>('loading');

    const fetchAnalysis = async () => {
        try {
            const res = await authFetch(`/api/v1/meeting-analysis/${meetingId}/result`);
            if (res.status === 404) {
                setStatus('not_found');
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch');

            const body = await res.json();
            const data: MeetingAnalysisData = body.data;
            setAnalysis(data);

            if (data.processingStatus === 'COMPLETED') {
                setStatus('completed');
            } else if (data.processingStatus === 'PROCESSING') {
                setStatus('processing');
            } else if (data.processingStatus === 'FAILED') {
                setStatus('failed');
            } else {
                setStatus('pending');
            }
        } catch {
            setStatus('failed');
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, [meetingId]);

    // Auto-poll while processing
    useEffect(() => {
        if (status !== 'processing') return;
        const interval = setInterval(fetchAnalysis, 8000);
        return () => clearInterval(interval);
    }, [status, meetingId]);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-zinc-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Post-Meeting Analysis</h1>
                            <p className="text-zinc-500 text-sm mt-0.5">Meeting ID: {meetingId}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={fetchAnalysis}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                        {analysis && (
                            <a
                                href={`/dashboard/meetings/${meetingId}/replay`}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors text-sm font-medium"
                            >
                                Watch Replay
                            </a>
                        )}
                    </div>
                </div>

                {/* States */}
                {status === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                        <p className="text-zinc-400">Loading analysis…</p>
                    </div>
                )}

                {status === 'not_found' && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <AlertCircle className="h-8 w-8 text-zinc-500" />
                        <p className="text-zinc-400 text-center">
                            No analysis found for this meeting.
                            <br />
                            Analysis is triggered automatically when a recording is stopped.
                        </p>
                    </div>
                )}

                {status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                        <p className="text-zinc-300 font-medium">AI Analysis in progress…</p>
                        <p className="text-zinc-500 text-sm text-center">
                            This typically takes 30–60 seconds.
                            <br />
                            The page will refresh automatically.
                        </p>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                        <p className="text-zinc-300 font-medium">Analysis failed</p>
                        <p className="text-zinc-500 text-sm text-center">
                            The AI analysis could not be completed.
                            <br />
                            This may happen if the transcript was too short.
                        </p>
                        <button
                            onClick={fetchAnalysis}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {status === 'completed' && analysis && (
                    <PostMeetingAnalysis analysis={analysis} />
                )}
            </div>
        </div>
    );
}
