"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity, User, Briefcase, FileText, CheckCircle, AlertCircle,
    XCircle, RefreshCw, Filter, LogIn, LogOut, CreditCard,
    Settings, AlertTriangle, Calendar, Clock
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

interface ActivityLog {
    id: string; type: string; message: string;
    userId?: string; userEmail?: string; metadata?: any;
    ipAddress?: string; status: 'SUCCESS' | 'WARNING' | 'ERROR';
    createdAt: string;
}
interface ActivityStats {
    totalToday: number; totalWeek: number;
    byType: Array<{ type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    recentActivity: ActivityLog[];
}

const EVENT_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
    USER_REGISTER: { icon: User, color: "text-indigo-500", bg: "bg-indigo-500/15 dark:bg-indigo-500/20" },
    USER_LOGIN: { icon: LogIn, color: "text-emerald-500", bg: "bg-emerald-500/15 dark:bg-emerald-500/20" },
    USER_LOGOUT: { icon: LogOut, color: "text-gray-400", bg: "bg-gray-500/10" },
    RESUME_UPLOAD: { icon: FileText, color: "text-violet-500", bg: "bg-violet-500/15 dark:bg-violet-500/20" },
    RESUME_ANALYSIS: { icon: FileText, color: "text-violet-500", bg: "bg-violet-500/15 dark:bg-violet-500/20" },
    INTERVIEW_START: { icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/15 dark:bg-amber-500/20" },
    INTERVIEW_COMPLETE: { icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/15 dark:bg-amber-500/20" },
    TEST_START: { icon: CheckCircle, color: "text-teal-500", bg: "bg-teal-500/15 dark:bg-teal-500/20" },
    TEST_COMPLETE: { icon: CheckCircle, color: "text-teal-500", bg: "bg-teal-500/15 dark:bg-teal-500/20" },
    SUBSCRIPTION_CHANGE: { icon: CreditCard, color: "text-yellow-500", bg: "bg-yellow-500/15 dark:bg-yellow-500/20" },
    CREDIT_PURCHASE: { icon: CreditCard, color: "text-yellow-500", bg: "bg-yellow-500/15 dark:bg-yellow-500/20" },
    SETTINGS_CHANGE: { icon: Settings, color: "text-blue-500", bg: "bg-blue-500/15 dark:bg-blue-500/20" },
    ADMIN_ACTION: { icon: Settings, color: "text-blue-500", bg: "bg-blue-500/15 dark:bg-blue-500/20" },
    SYSTEM_ALERT: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/15 dark:bg-rose-500/20" },
};
const DEFAULT_EVENT = { icon: Activity, color: "text-gray-400", bg: "bg-gray-500/10" };

function StatusBadge({ status }: { status: string }) {
    if (status === 'SUCCESS') return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> Success
        </span>
    );
    if (status === 'WARNING') return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Warning
        </span>
    );
    if (status === 'ERROR') return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/15 dark:bg-rose-500/20 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Error
        </span>
    );
    return null;
}

function formatRelative(dateString: string) {
    const diff = Date.now() - new Date(dateString).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const FILTER_OPTIONS = ["ALL", "USER_REGISTER", "USER_LOGIN", "RESUME_ANALYSIS", "INTERVIEW_START", "TEST_COMPLETE", "CREDIT_PURCHASE", "SYSTEM_ALERT"];

export default function ActivityPage() {
    const { user } = useAuthStore();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState<ActivityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const typeParam = filter !== "ALL" ? `&type=${filter}` : "";
            const res = await authFetch(`/admin/activity?page=${page}&limit=20${typeParam}`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data.data || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const res = await authFetch("/admin/activity/stats");
            if (res.ok) setStats((await res.json()).data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (user) { fetchActivities(); fetchStats(); }
    }, [user, filter, page]);

    const successRate = stats && stats.totalWeek > 0
        ? Math.round(((stats.byStatus.find(s => s.status === "SUCCESS")?.count ?? 0) / stats.totalWeek) * 100)
        : 100;

    const statCards = [
        { label: "Today", value: stats?.totalToday ?? "—", icon: <Clock className="w-4 h-4 text-indigo-400" />, bg: "bg-indigo-500/15" },
        { label: "This Week", value: stats?.totalWeek ?? "—", icon: <Calendar className="w-4 h-4 text-violet-400" />, bg: "bg-violet-500/15" },
        { label: "Success Rate", value: `${successRate}%`, icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, bg: "bg-emerald-500/15", valColor: "text-emerald-500" },
        { label: "Errors This Week", value: stats?.byStatus.find(s => s.status === "ERROR")?.count ?? 0, icon: <XCircle className="w-4 h-4 text-rose-400" />, bg: "bg-rose-500/15", valColor: "text-rose-500" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">System Activity</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Real-time log of events and user actions</p>
                    </div>
                </div>
                <button
                    onClick={() => { fetchActivities(); fetchStats(); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
            </motion.div>

            {/* Stat cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((s, i) => (
                        <motion.div key={s.label}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-5"
                        >
                            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
                            <p className={`text-2xl font-black ${(s as any).valColor ?? "text-gray-900 dark:text-white"}`}>{s.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filter chips */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="flex gap-2 flex-wrap items-center"
            >
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {FILTER_OPTIONS.map((f) => (
                    <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${filter === f
                            ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25 scale-105"
                            : "bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            }`}
                    >
                        {f === "ALL" ? "All" : f.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                ))}
            </motion.div>

            {/* Timeline */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-6"
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">Loading activity…</span>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center mb-4">
                            <Activity className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-gray-600 dark:text-gray-300">No activity recorded yet</p>
                        <p className="text-sm mt-1">System events will appear here as they occur</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <AnimatePresence>
                            {activities.map((act, idx) => {
                                const ev = EVENT_ICONS[act.type] ?? DEFAULT_EVENT;
                                const Icon = ev.icon;
                                return (
                                    <motion.div key={act.id}
                                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.025 }}
                                        className="relative flex gap-4"
                                    >
                                        {/* connector line */}
                                        {idx !== activities.length - 1 && (
                                            <div className="absolute left-[18px] top-10 bottom-[-20px] w-px bg-gradient-to-b from-gray-200 dark:from-white/10 to-transparent" />
                                        )}
                                        {/* icon bubble */}
                                        <div className={`relative z-10 w-9 h-9 rounded-xl ${ev.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                            <Icon className={`w-4 h-4 ${ev.color}`} />
                                        </div>
                                        {/* content */}
                                        <div className="flex-1 pt-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{act.message}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{act.type.replace(/_/g, " ")}</p>
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{formatRelative(act.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {act.userEmail && <span className="text-xs text-gray-500">by {act.userEmail}</span>}
                                                {act.ipAddress && <span className="text-xs text-gray-400">• {act.ipAddress}</span>}
                                                <StatusBadge status={act.status} />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="px-3 py-1.5 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 transition">
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="px-3 py-1.5 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 transition">
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
