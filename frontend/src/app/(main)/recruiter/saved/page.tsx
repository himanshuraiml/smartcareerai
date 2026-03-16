"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Bookmark, Trash2, MessageSquare, Users, Mail, ChevronDown,
    ExternalLink, RefreshCw, Sparkles, Clock, Search, X,
    CheckCircle, AlertTriangle, TrendingUp, Filter, StickyNote,
    RotateCcw, Loader2
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────
interface SavedCandidate {
    id: string;
    candidateId: string;
    notes: string | null;
    tags: string[];
    status: string;
    savedAt: string;
    candidate: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        userSkills: Array<{ skill: { name: string } }>;
        targetJobRole?: { title: string } | null;
    };
}

// ── Status config (lowercase to match DB schema default) ──────────────────
const STATUS_CONFIG: Record<string, {
    label: string; bg: string; text: string; dot: string; border: string; ring: string;
}> = {
    saved:        { label: "Saved",           bg: "bg-gray-50 dark:bg-white/[0.03]",    text: "text-gray-600 dark:text-gray-300",    border: "border-gray-200 dark:border-gray-700",        dot: "bg-gray-400",    ring: "ring-gray-400/20" },
    contacted:    { label: "Contacted",       bg: "bg-blue-50 dark:bg-blue-500/10",     text: "text-blue-700 dark:text-blue-400",    border: "border-blue-200 dark:border-blue-500/30",     dot: "bg-blue-500",    ring: "ring-blue-500/20" },
    interviewing: { label: "Interviewing",    bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-400",border: "border-violet-200 dark:border-violet-500/30", dot: "bg-violet-500",  ring: "ring-violet-500/20" },
    hired:        { label: "Hired",           bg: "bg-emerald-50 dark:bg-emerald-500/10",text: "text-emerald-700 dark:text-emerald-400",border: "border-emerald-200 dark:border-emerald-500/30",dot: "bg-emerald-500",ring: "ring-emerald-500/20" },
    rejected:     { label: "Not Moving Fwd",  bg: "bg-rose-50 dark:bg-rose-500/10",     text: "text-rose-700 dark:text-rose-400",    border: "border-rose-200 dark:border-rose-500/30",     dot: "bg-rose-500",    ring: "ring-rose-500/20" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

function daysSince(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// ── Sub-components ────────────────────────────────────────────────────────
function StatPill({ count, label, color }: { count: number; label: string; color: string }) {
    return (
        <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 min-w-[70px]">
            <span className={`text-xl font-black ${color}`}>{count}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</span>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function SavedCandidatesPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    const [candidates, setCandidates] = useState<SavedCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const fetchSaved = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await authFetch("/recruiter/candidates/saved");
            const data = await res.json();
            if (res.ok) setCandidates(data.data || []);
        } catch {
            showToast("Failed to load saved candidates", "error");
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => { fetchSaved(); }, [fetchSaved]);

    const removeCandidate = async (candidateId: string) => {
        setRemovingId(candidateId);
        try {
            const res = await authFetch(`/recruiter/candidates/${candidateId}`, { method: "DELETE" });
            if (res.ok) {
                setCandidates(prev => prev.filter(c => c.candidateId !== candidateId));
                showToast("Removed from pipeline");
            } else throw new Error();
        } catch {
            showToast("Failed to remove candidate", "error");
        } finally {
            setRemovingId(null);
        }
    };

    const updateStatus = async (candidateId: string, status: string) => {
        setUpdatingId(candidateId);
        setCandidates(prev => prev.map(c => c.candidateId === candidateId ? { ...c, status } : c));
        try {
            await authFetch(`/recruiter/candidates/${candidateId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            showToast(`Status updated to "${STATUS_CONFIG[status]?.label ?? status}"`);
        } catch {
            showToast("Failed to update status", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    // ── Derived stats ──
    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        candidates.forEach(c => { counts[c.status] = (counts[c.status] ?? 0) + 1; });
        return counts;
    }, [candidates]);

    const filtered = useMemo(() => {
        let list = candidates;
        if (statusFilter !== "all") list = list.filter(c => c.status === statusFilter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                c.candidate.name.toLowerCase().includes(q) ||
                c.candidate.email.toLowerCase().includes(q) ||
                c.candidate.userSkills.some(s => s.skill.name.toLowerCase().includes(q)) ||
                c.candidate.targetJobRole?.title.toLowerCase().includes(q)
            );
        }
        return list;
    }, [candidates, statusFilter, search]);

    const rejectedForReengagement = candidates.filter(c => c.status === "rejected");

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin flex items-center justify-center">
                        <Bookmark className="w-4 h-4 text-indigo-500" />
                    </div>
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Pipeline...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
                    >
                        {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> Warm Pipeline
                    </p>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        Saved Candidates
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Track and re-engage your highest-potential talent.
                    </p>
                </div>
                <button
                    onClick={fetchSaved}
                    className="self-start sm:self-auto p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* ── Stats bar ── */}
            {candidates.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-3">
                    <StatPill count={candidates.length} label="Total" color="text-gray-900 dark:text-white" />
                    {ALL_STATUSES.map(s => (
                        (stats[s] ?? 0) > 0 && (
                            <StatPill key={s} count={stats[s]!} label={STATUS_CONFIG[s]!.label} color={STATUS_CONFIG[s]!.text} />
                        )
                    ))}
                </motion.div>
            )}

            {/* ── Filter + Search bar ── */}
            {candidates.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Status filter tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-white/5 flex-wrap">
                        {[{ id: "all", label: "All" }, ...ALL_STATUSES.map(s => ({ id: s, label: STATUS_CONFIG[s]!.label }))].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${statusFilter === tab.id
                                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                            >
                                {tab.label}
                                {tab.id !== "all" && stats[tab.id] ? ` (${stats[tab.id]})` : ""}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, skill, or role..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Re-engagement Banner ── */}
            <AnimatePresence>
                {rejectedForReengagement.length > 0 && statusFilter === "all" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/20 flex items-center gap-3">
                            <RotateCcw className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                                    {rejectedForReengagement.length} candidate{rejectedForReengagement.length > 1 ? "s" : ""} marked &ldquo;Not Moving Forward&rdquo;
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                    These candidates may be a great fit for future openings. Consider re-engaging them.
                                </p>
                            </div>
                            <button
                                onClick={() => setStatusFilter("rejected")}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors flex-shrink-0"
                            >
                                Review
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Empty state ── */}
            {candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] gap-5 text-center px-4 bg-white dark:bg-[#111827] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-2 shadow-inner">
                        <Bookmark className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pipeline is Empty</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                            Save candidates from the talent directory to build your warm pipeline.
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
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5">
                    <Filter className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-semibold text-gray-500">No candidates match your filter.</p>
                    <button onClick={() => { setStatusFilter("all"); setSearch(""); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Clear filters</button>
                </div>
            ) : (
                <motion.div layout className="space-y-3">
                    <AnimatePresence initial={false}>
                        {filtered.map((item) => {
                            const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG["saved"]!;
                            const initials = item.candidate.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                            const days = daysSince(item.savedAt);
                            const isUpdating = updatingId === item.candidateId;
                            const isRemoving = removingId === item.candidateId;

                            return (
                                <motion.div
                                    key={item.candidateId}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-indigo-500/20 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                        {/* Avatar + info */}
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                {item.candidate.avatarUrl ? (
                                                    <img src={item.candidate.avatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                ) : (
                                                    <span className="text-white font-bold text-sm">{initials}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {item.candidate.name}
                                                    </h3>
                                                    {item.candidate.targetJobRole && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                                                            {item.candidate.targetJobRole.title}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-3 h-3" /> {item.candidate.email}
                                                </p>

                                                {/* Skills */}
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {item.candidate.userSkills.slice(0, 4).map((sk, i) => (
                                                        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                                            {sk.skill.name}
                                                        </span>
                                                    ))}
                                                    {item.candidate.userSkills.length > 4 && (
                                                        <span className="text-[10px] text-gray-400">+{item.candidate.userSkills.length - 4}</span>
                                                    )}
                                                </div>

                                                {/* Notes */}
                                                {item.notes && (
                                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5 bg-gray-50 dark:bg-white/[0.02] rounded-lg px-2 py-1.5 border border-gray-100 dark:border-white/5">
                                                        <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" />
                                                        {item.notes}
                                                    </p>
                                                )}

                                                {/* Saved timestamp */}
                                                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    Saved {days === 0 ? "today" : `${days}d ago`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full h-px bg-gray-100 dark:bg-white/5 md:hidden" />

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                                            {/* Status dropdown */}
                                            <div className="relative">
                                                <select
                                                    value={item.status}
                                                    onChange={e => updateStatus(item.candidateId, e.target.value)}
                                                    disabled={isUpdating}
                                                    className={`appearance-none pl-7 pr-8 py-2 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset transition-colors ${cfg.bg} ${cfg.text} ${cfg.border}`}
                                                >
                                                    {ALL_STATUSES.map(s => (
                                                        <option key={s} value={s} className="text-gray-900 bg-white font-medium">
                                                            {STATUS_CONFIG[s]!.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${cfg.dot} pointer-events-none`} />
                                                {isUpdating
                                                    ? <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin pointer-events-none" />
                                                    : <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${cfg.text}`} />
                                                }
                                            </div>

                                            {/* Icon actions */}
                                            <div className="flex items-center gap-1.5">
                                                <Link
                                                    href={`/recruiter/messages?candidateId=${item.candidateId}`}
                                                    title="Message"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/recruiter/candidates/${item.candidateId}`}
                                                    title="View Profile"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>

                                                {/* Re-engage for rejected candidates */}
                                                {item.status === "rejected" && (
                                                    <button
                                                        onClick={() => updateStatus(item.candidateId, "contacted")}
                                                        title="Re-engage"
                                                        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-transparent hover:border-amber-200 dark:hover:border-amber-500/20 transition-all"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                )}

                                                <div className="w-px h-5 bg-gray-200 dark:bg-white/10" />

                                                <button
                                                    onClick={() => removeCandidate(item.candidateId)}
                                                    disabled={isRemoving}
                                                    title="Remove"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all"
                                                >
                                                    {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
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
