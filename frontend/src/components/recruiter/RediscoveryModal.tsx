"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Search, UserCheck, Star, Briefcase, Zap, UserPlus } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface RecommendedCandidate {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    skills: string[];
    matchScore: number;
}

interface RediscoveryModalProps {
    jobId: string;
    onClose: () => void;
    onInvite: (candidate: RecommendedCandidate) => void;
}

export default function RediscoveryModal({ jobId, onClose, onInvite }: RediscoveryModalProps) {
    const [candidates, setCandidates] = useState<RecommendedCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRecommendations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/recruiter/jobs/${jobId}/rediscover`);
            if (!res.ok) throw new Error("Failed to search AI memory");
            const data = await res.json();
            setCandidates(data.data || []);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-3xl bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Search className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">AI Talent Sourcing</h2>
                            <p className="text-sm font-medium text-gray-500">Discovering matching candidates from your database</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:bg-gray-800 transition shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30 dark:bg-gray-900/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-pulse flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-indigo-500" />
                                </div>
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Scanning Talent Pool...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-4">
                                <X className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Search Failed</h3>
                            <p className="text-gray-500 max-w-sm mb-6">{error}</p>
                            <button
                                onClick={fetchRecommendations}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Matches Found</h3>
                            <p className="text-gray-500 max-w-sm">We couldn't find any candidates in your database that strongly match this job description.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                Found {candidates.length} Recommended Candidates
                            </div>
                            {candidates.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                                        {candidate.avatarUrl ? (
                                            <img src={candidate.avatarUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                                        ) : (
                                            candidate.name.charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate pr-4">{candidate.name}</h3>
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${candidate.matchScore >= 80 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                                                    candidate.matchScore >= 60 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20' :
                                                        'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                                }`}>
                                                <Star className="w-3.5 h-3.5" fill="currentColor" />
                                                {candidate.matchScore}% Match
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{candidate.email}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {candidate.skills.slice(0, 5).map(skill => (
                                                <span key={skill} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skills.length > 5 && (
                                                <span className="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-400">
                                                    +{candidate.skills.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onInvite(candidate)}
                                        className="shrink-0 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                        title="Move to Pipeline"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
