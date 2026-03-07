'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, BarChart2, RefreshCw, AlertCircle } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { InstitutionAnalytics } from '@/components/meeting/analytics/InstitutionAnalytics';

interface InstitutionDashboardData {
    institutionName: string;
    totalStudents: number;
    totalMeetings: number;
    completedAnalyses: number;
    avgScores: { technical: number; communication: number; confidence: number; overall: number };
    hiringBreakdown: Record<string, number>;
    topCandidates: Array<{
        userId: string;
        name: string;
        email: string;
        overall: number;
        hiringRecommendation: string;
        meetingId: string;
    }>;
    meetingsByDate: Record<string, number>;
}

export default function InstitutionAdminAnalyticsPage() {
    const [data, setData] = useState<InstitutionDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch('/api/v1/meeting-analysis/institution/dashboard');
            if (!res.ok) throw new Error('Failed to load dashboard');
            const body = await res.json();
            setData(body.data);
        } catch (e: any) {
            setError(e.message ?? 'Unknown error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart2 className="h-6 w-6 text-violet-400" />
                            Interview Analytics
                            {data && (
                                <span className="text-sm font-normal text-zinc-400 ml-2">
                                    — {data.institutionName}
                                </span>
                            )}
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            Aggregate interview outcomes for your institution&apos;s students
                        </p>
                    </div>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {loading && (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                        <p className="text-zinc-400">{error}</p>
                        <button
                            onClick={load}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && data && (
                    <InstitutionAnalytics data={data} />
                )}

                {!loading && !error && !data && (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                        <BarChart2 className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm">No analytics data available.</p>
                        <p className="text-xs mt-1 text-zinc-600">
                            Data appears once students participate in recorded interviews.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
