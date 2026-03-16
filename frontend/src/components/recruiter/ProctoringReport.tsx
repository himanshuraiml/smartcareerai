'use client';

import React, { useState } from 'react';
import { Flag, Loader2, AlertTriangle, Clock, Check } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface ProctoringReportProps {
    report: {
        hasAttempt: boolean;
        application: { candidateName: string; jobTitle: string };
        attempt?: {
            id: string;
            status: string;
            startedAt: string;
            completedAt: string | null;
            proctoringScore: number | null;
            snapshotCount: number;
            recruiterFlagged?: boolean;
            flagReason?: string | null;
        };
        violations?: Array<{ type: string; timestamp: string; metadata?: any }>;
    };
}

const VIOLATION_LABELS: Record<string, string> = {
    tab_switch: 'Tab Switch',
    TAB_SWITCH: 'Tab Switch',
    fullscreen_exit: 'Fullscreen Exit',
    FULLSCREEN_EXIT: 'Fullscreen Exit',
    FACE_NOT_DETECTED: 'Face Not Detected',
    MULTIPLE_FACES: 'Multiple Faces',
    screen_share_ended: 'Screen Share Ended',
};

function scoreColor(score: number | null) {
    if (score === null) return 'text-gray-400 dark:text-gray-600';
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
}

function scoreBg(score: number | null) {
    if (score === null) return 'bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5';
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20';
    if (score >= 50) return 'bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20';
    return 'bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20';
}

export default function ProctoringReport({ report }: ProctoringReportProps) {
    const [flagged, setFlagged] = useState(report.attempt?.recruiterFlagged ?? false);
    const [flagReason, setFlagReason] = useState(report.attempt?.flagReason ?? '');
    const [flagging, setFlagging] = useState(false);
    const [showFlagInput, setShowFlagInput] = useState(false);

    const toggleFlag = async (newFlagged: boolean) => {
        if (!report.attempt?.id) return;
        setFlagging(true);
        try {
            const res = await authFetch(`/api/v1/assessments/attempts/${report.attempt.id}/flag`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flagged: newFlagged, reason: newFlagged ? flagReason : undefined }),
            });
            if (res.ok) {
                setFlagged(newFlagged);
                if (!newFlagged) setFlagReason('');
                setShowFlagInput(false);
            }
        } catch {}
        setFlagging(false);
    };

    if (!report.hasAttempt) {
        return (
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                <p className="text-lg font-bold">No assessment attempt found</p>
                <p className="text-sm mt-1">This candidate has not started an assessment for this job.</p>
            </div>
        );
    }

    const { attempt, violations = [] } = report;
    const ps = attempt?.proctoringScore ?? null;

    return (
        <div className="space-y-6">
            {/* Flag Banner */}
            {flagged && (
                <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Flagged for Review</p>
                        {flagReason && <p className="text-xs text-rose-500 dark:text-rose-400/80 mt-0.5 font-medium">{flagReason}</p>}
                    </div>
                    <button
                        onClick={() => toggleFlag(false)}
                        disabled={flagging}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white font-black px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 transition-all active:scale-95"
                    >
                        {flagging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'REMOVE FLAG'}
                    </button>
                </div>
            )}

            {/* Flag action (when not flagged) */}
            {!flagged && (
                <div className="flex justify-end">
                    {showFlagInput ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={flagReason}
                                onChange={e => setFlagReason(e.target.value)}
                                placeholder="Reason (optional)"
                                className="px-4 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 w-48 transition-all"
                            />
                            <button
                                onClick={() => toggleFlag(true)}
                                disabled={flagging}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                            >
                                {flagging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
                                Confirm Flag
                            </button>
                            <button onClick={() => setShowFlagInput(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white px-3 transition-colors">Cancel</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowFlagInput(true)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-black text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/30 rounded-xl transition-all active:scale-95 uppercase tracking-widest"
                        >
                            <Flag className="w-3.5 h-3.5" />
                            Flag for Review
                        </button>
                    )}
                </div>
            )}

            {/* Score banner */}
            <div className={`rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-8 ${scoreBg(ps)}`}>
                <div className="text-center min-w-[100px]">
                    <div className={`text-5xl font-black leading-none ${scoreColor(ps)}`}>
                        {ps !== null ? ps : '—'}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-3">Proctoring Score</div>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-6 w-full text-sm">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Status</span>
                        <span className="font-bold text-gray-900 dark:text-white capitalize text-base">{attempt?.status?.toLowerCase()}</span>
                    </div>
                    <div className="flex flex-col border-x border-gray-100 dark:border-white/10 px-6 text-center">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Violations</span>
                        <span className={`font-black text-base ${violations.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {violations.length}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Snapshots</span>
                        <span className="font-bold text-gray-900 dark:text-white text-base">{attempt?.snapshotCount ?? 0}</span>
                    </div>
                </div>
            </div>

            {/* Attempt metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50/50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl p-5 group hover:border-indigo-500/30 transition-all">
                    <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Started At
                    </div>
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {attempt?.startedAt ? new Date(attempt.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </div>
                </div>
                <div className="bg-gray-50/50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl p-5 group hover:border-indigo-500/30 transition-all">
                    <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5" /> Completed At
                    </div>
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {attempt?.completedAt ? new Date(attempt.completedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'In progress'}
                    </div>
                </div>
            </div>

            {/* Violations timeline */}
            <div>
                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Violation Timeline</h3>
                {violations.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-600 bg-gray-50/50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
                        <p className="text-sm font-bold">No violations recorded</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {violations.map((v, i) => (
                            <div key={i} className="flex items-center gap-4 bg-gray-50/50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl px-5 py-4 group hover:border-rose-500/30 transition-all">
                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] flex-shrink-0 animate-pulse" />
                                <div className="flex-1 flex items-center justify-between">
                                    <span className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                                        {VIOLATION_LABELS[v.type] || v.type.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs font-black text-gray-400 dark:text-gray-500 bg-white dark:bg-black/20 px-2 py-1 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
                                        {new Date(v.timestamp).toLocaleTimeString(undefined, { hour12: false })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
