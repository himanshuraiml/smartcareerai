"use client";

import { useState, useEffect } from "react";
import {
    Bookmark,
    Trash2,
    MessageSquare,
    Users,
    Mail,
    ChevronDown,
    Zap,
    ExternalLink
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface SavedCandidate {
    id: string; // The saved record ID
    candidateId: string;
    notes: string;
    status: string;
    savedAt: string;
    candidate: {
        name: string;
        email: string;
        avatarUrl?: string;
        userSkills: Array<{ skill: { name: string } }>;
        targetJobRole?: { title: string };
    };
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
    "SAVED": { label: "Saved for later", bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-700", dot: "bg-gray-400" },
    "CONTACTED": { label: "Contacted", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-500/30", dot: "bg-blue-500" },
    "INTERVIEWING": { label: "Interviewing", bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-500/30", dot: "bg-indigo-500" },
    "OFFERED": { label: "Offer Sent", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30", dot: "bg-emerald-500" },
    "REJECTED": { label: "Not Moving Forward", bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/30", dot: "bg-rose-500" }
};

export default function SavedCandidatesPage() {
    const { user } = useAuthStore();
    const [candidates, setCandidates] = useState<SavedCandidate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const response = await authFetch(`/recruiter/candidates/saved`);

                if (response.ok) {
                    const data = await response.json();
                    setCandidates(data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch saved candidates", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchSaved();
    }, [user]);

    const removeCandidate = async (candidateId: string) => {
        try {
            const response = await authFetch(`/recruiter/candidates/${candidateId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                setCandidates(prev => prev.filter(c => c.candidateId !== candidateId));
            }
        } catch (error) {
            console.error("Failed to remove candidate", error);
        }
    };

    const updateStatus = async (candidateId: string, status: string) => {
        // Optimistic update
        setCandidates(prev => prev.map(c =>
            c.candidateId === candidateId ? { ...c, status } : c
        ));

        try {
            await authFetch(`/recruiter/candidates/${candidateId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert on fail if needed
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin flex items-center justify-center">
                        <Bookmark className="w-4 h-4 text-indigo-500" />
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Pipeline...</p>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.98, y: 10 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
        exit: { opacity: 0, scale: 0.98, x: -20, transition: { duration: 0.2 } }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                        Talent Pipeline
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Manage and track your highest potential candidates.</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#111827] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <span className="text-indigo-600 dark:text-indigo-400 mr-1.5">{candidates.length}</span> Saved {candidates.length === 1 ? 'Candidate' : 'Candidates'}
                    </p>
                </div>
            </div>

            {/* Empty State */}
            {candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] gap-5 text-center px-4 bg-white dark:bg-[#111827] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-2 shadow-inner">
                        <Bookmark className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pipeline is Empty</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                            You haven't saved any candidates yet. Browse the talent directory to start building your hiring pipeline.
                        </p>
                        <Link
                            href="/recruiter"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            <Users className="w-5 h-5" />
                            Browse Talent Directory
                        </Link>
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                >
                    <AnimatePresence>
                        {candidates.map((item) => {
                            const currentStatus = statusConfig[item.status] || statusConfig["SAVED"];
                            const firstInitials = item.candidate.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

                            return (
                                <motion.div
                                    key={item.candidateId}
                                    variants={itemVariants}
                                    layout
                                    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all group flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden"
                                >
                                    {/* Candidate Info Section */}
                                    <div className="flex items-start gap-4 flex-1 w-full">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-inner p-[2px]">
                                            <div className="w-full h-full rounded-xl overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center">
                                                {item.candidate.avatarUrl ? (
                                                    <img src={item.candidate.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500">{firstInitials}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {item.candidate.name}
                                                </h3>
                                                {item.candidate.targetJobRole && (
                                                    <span className="hidden sm:inline-flex text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                                                        {item.candidate.targetJobRole.title}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="truncate">{item.candidate.email}</span>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {item.candidate.userSkills.slice(0, 4).map((skillObj, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[11px] font-bold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20"
                                                    >
                                                        {skillObj.skill.name}
                                                    </span>
                                                ))}
                                                {item.candidate.userSkills.length > 4 && (
                                                    <span className="text-[11px] font-bold px-2 py-1 rounded bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                                                        +{item.candidate.userSkills.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider for mobile */}
                                    <div className="w-full h-px bg-gray-100 dark:bg-gray-800 md:hidden" />

                                    {/* Quick Actions & Status */}
                                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0">

                                        {/* Status Dropdown */}
                                        <div className="relative group/select shrink-0">
                                            <select
                                                value={item.status}
                                                onChange={(e) => updateStatus(item.candidateId, e.target.value)}
                                                className={`appearance-none shrink-0 w-[170px] pl-8 pr-10 py-2.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/30 ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
                                            >
                                                {Object.entries(statusConfig).map(([val, config]) => (
                                                    <option key={val} value={val} className="text-gray-900 bg-white font-medium">
                                                        {config.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${currentStatus.dot} pointer-events-none`} />
                                            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${currentStatus.text}`} />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                title="Message candidate"
                                                className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:text-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all shadow-sm"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>

                                            <Link
                                                href={`/recruiter/candidates/${item.candidateId}`}
                                                title="View Profile"
                                                className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:border-emerald-300 dark:hover:text-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all shadow-sm"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>

                                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

                                            <button
                                                onClick={() => removeCandidate(item.candidateId)}
                                                title="Remove from pipeline"
                                                className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 dark:hover:border-rose-500/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
