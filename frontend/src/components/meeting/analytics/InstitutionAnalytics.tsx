'use client';

import React from 'react';
import { Users, BarChart2, TrendingUp, Award } from 'lucide-react';
import { MeetingHeatmap } from './MeetingHeatmap';
import { SkillGapRadar } from './SkillGapRadar';

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

const REC_STYLE: Record<string, string> = {
    STRONG_YES: 'text-emerald-400',
    YES: 'text-green-400',
    MAYBE: 'text-amber-400',
    NO: 'text-red-400',
};

const HIRING_COLORS: Record<string, string> = {
    STRONG_YES: 'bg-emerald-500',
    YES: 'bg-green-500',
    MAYBE: 'bg-amber-500',
    NO: 'bg-red-500',
};

interface InstitutionAnalyticsProps {
    data: InstitutionDashboardData;
}

export function InstitutionAnalytics({ data }: InstitutionAnalyticsProps) {
    const totalHiring = Object.values(data.hiringBreakdown).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Students', value: data.totalStudents, icon: <Users className="h-5 w-5 text-blue-400" /> },
                    { label: 'Total Interviews', value: data.totalMeetings, icon: <BarChart2 className="h-5 w-5 text-violet-400" /> },
                    { label: 'Analyses Complete', value: data.completedAnalyses, icon: <TrendingUp className="h-5 w-5 text-emerald-400" /> },
                    { label: 'Avg Overall Score', value: data.avgScores.overall > 0 ? `${data.avgScores.overall}/100` : '—', icon: <Award className="h-5 w-5 text-amber-400" /> },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 bg-zinc-700/50 rounded-lg">{stat.icon}</div>
                        <div>
                            <p className="text-xs text-zinc-500">{stat.label}</p>
                            <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skill gap radar */}
                <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
                    <h3 className="font-semibold text-zinc-200 mb-4">Average Skill Profile</h3>
                    {data.avgScores.overall > 0 ? (
                        <div className="flex justify-center">
                            <SkillGapRadar scores={data.avgScores} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
                            No completed analyses yet.
                        </div>
                    )}
                </div>

                {/* Hiring breakdown */}
                <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
                    <h3 className="font-semibold text-zinc-200 mb-4">Hiring Outcomes</h3>
                    {totalHiring > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(data.hiringBreakdown).map(([rec, count]) => (
                                <div key={rec} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className={`font-medium ${REC_STYLE[rec] ?? 'text-zinc-400'}`}>
                                            {rec.replace('_', ' ')}
                                        </span>
                                        <span className="text-zinc-400">{count} ({totalHiring > 0 ? Math.round((count / totalHiring) * 100) : 0}%)</span>
                                    </div>
                                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${HIRING_COLORS[rec] ?? 'bg-zinc-500'}`}
                                            style={{ width: `${totalHiring > 0 ? (count / totalHiring) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
                            No completed analyses yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Top candidates */}
            {data.topCandidates.length > 0 && (
                <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
                    <h3 className="font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-400" />
                        Top Performers
                    </h3>
                    <div className="space-y-2">
                        {data.topCandidates.map((c, i) => (
                            <div key={c.meetingId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/40 transition-colors">
                                <span className="w-6 text-center text-sm font-bold text-zinc-500">#{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-zinc-200 font-medium truncate">{c.name}</p>
                                    <p className="text-zinc-500 text-xs truncate">{c.email}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-semibold text-zinc-100">{c.overall}/100</p>
                                    <p className={`text-xs ${REC_STYLE[c.hiringRecommendation] ?? 'text-zinc-500'}`}>
                                        {c.hiringRecommendation.replace('_', ' ')}
                                    </p>
                                </div>
                                <a
                                    href={`/dashboard/meetings/${c.meetingId}/analysis`}
                                    className="text-violet-400 hover:text-violet-300 text-xs transition-colors shrink-0"
                                >
                                    View →
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Meeting heatmap */}
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
                <h3 className="font-semibold text-zinc-200 mb-4">Interview Activity</h3>
                <MeetingHeatmap data={data.meetingsByDate} />
            </div>
        </div>
    );
}
