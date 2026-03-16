"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, TrendingUp, Users, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface NPSResponse {
    npsScore: number;
    ease: string;
    feedback: string;
    submittedAt: string;
}

interface NPSData {
    count: number;
    avgNps: number;
    npsIndex: number;
    promoters: number;
    passives: number;
    detractors: number;
    responses: NPSResponse[];
}

interface Props {
    jobId: string;
}

function NPSGauge({ value }: { value: number }) {
    const color = value < 0 ? "text-rose-500" : value < 30 ? "text-amber-500" : "text-emerald-500";
    const label = value < 0 ? "Needs Improvement" : value < 30 ? "Moderate" : "Excellent";
    return (
        <div className="flex flex-col items-center py-6">
            <div className={`text-6xl font-black leading-none ${color}`}>{value}</div>
            <div className={`text-xs font-bold mt-1 ${color}`}>{label}</div>
            <div className="text-xs text-gray-400 mt-0.5">NPS Score</div>
        </div>
    );
}

function ScoreChip({ score }: { score: number }) {
    const color = score <= 6 ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
        : score <= 8 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    return (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black border ${color}`}>
            {score}
        </span>
    );
}

export default function CandidateNPSPanel({ jobId }: Props) {
    const [data, setData] = useState<NPSData | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/recruiter/jobs/${jobId}/surveys`);
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [jobId]);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!data || data.count === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">No Survey Responses Yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
                    Send NPS surveys to candidates from their profile page to start collecting feedback.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Candidate NPS
                </h3>
                <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* NPS score card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-4">
                <NPSGauge value={data.npsIndex} />

                <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{data.promoters}</div>
                        <div className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mt-0.5">Promoters</div>
                        <div className="text-[10px] text-gray-400">9–10</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400">{data.passives}</div>
                        <div className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider mt-0.5">Passives</div>
                        <div className="text-[10px] text-gray-400">7–8</div>
                    </div>
                    <div className="text-center p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20">
                        <div className="text-xl font-black text-rose-600 dark:text-rose-400">{data.detractors}</div>
                        <div className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-wider mt-0.5">Detractors</div>
                        <div className="text-[10px] text-gray-400">1–6</div>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between px-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {data.count} response{data.count !== 1 ? "s" : ""}</span>
                    <span>Avg NPS: <span className="font-bold text-gray-600 dark:text-gray-300">{data.avgNps.toFixed(1)}/10</span></span>
                </div>
            </div>

            {/* Responses list */}
            {data.responses.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Recent Responses
                    </h4>
                    <div className="space-y-3">
                        {data.responses.slice(0, 8).map((r, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-xl p-3.5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <ScoreChip score={r.npsScore} />
                                    <div className="flex items-center gap-2 text-right">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{r.ease}</span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(r.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                        </span>
                                    </div>
                                </div>
                                {r.feedback && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                        "{r.feedback.length > 140 ? r.feedback.slice(0, 140) + "…" : r.feedback}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
