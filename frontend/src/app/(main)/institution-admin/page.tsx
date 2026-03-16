// src/app/(main)/institution-admin/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Briefcase, TrendingUp, Activity, ArrowUpRight, Award, Zap, Building2,
    CheckCircle2, AlertCircle, X, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, BarChart, Bar, Cell, Legend,
} from "recharts";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";

const COLORS = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16"];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DashboardData {
    totalStudents: number;
    placedStudents: number;
    recentInterviewCount: number;
    averageScore: number;
    recentActivity: ActivityItem[];
    activityTrend: { date: string; interviews: number; signups: number }[];
    topSkills: { name: string; category: string; count: number }[];
    placementIntelligence: {
        totalRiskyStudents: number;
        averageReadiness: number;
        activeAlerts: number;
    };
}

interface ActivityItem {
    id: string;
    message?: string;
    time?: string;
    success?: boolean | null;
    student?: { id: string; name: string | null; avatarUrl: string | null };
    targetRole?: string | null;
    score?: number | null;
    status?: string;
    // legacy fields from /dashboard endpoint
    type?: string;
    completedAt?: string;
    createdAt?: string;
}

interface DeptReadiness {
    name: string;
    students: number;
    avgAtsScore: number;
    avgInterviewScore?: number;
    skillScore?: number;
    readiness: number;
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
    delay: number;
    trend?: "up" | "down" | "neutral";
}

function StatCard({ label, value, sub, icon, gradient, iconBg, delay, trend = "neutral" }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-6 hover:shadow-lg dark:hover:shadow-violet-500/5 transition-shadow duration-300 group flex flex-col h-full"
        >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient} pointer-events-none`} />
            <div className="relative flex items-start justify-between mb-4">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
                <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
            </div>
            <div className="mt-auto">
                <p className="relative text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
                <p className="relative text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                    {trend === "up" && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
                    {trend === "down" && <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 rotate-90" />}
                    {trend === "neutral" && <Activity className="w-3.5 h-3.5 text-blue-500" />}
                    {sub}
                </p>
            </div>
        </motion.div>
    );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl text-sm">
                <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 mt-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <p className="text-gray-900 dark:text-white font-bold">{p.name}: <span className="font-normal">{p.value}</span></p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// ─── Activity Feed Item ────────────────────────────────────────────────────────
function ActivityFeedItem({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
    const success = item.success;
    const time = item.time || item.completedAt || item.createdAt;
    const message = item.message || (() => {
        const name = item.student?.name || "Student";
        const role = item.targetRole || item.type || "interview";
        const score = item.score;
        const isCompleted = item.status === "COMPLETED";
        return isCompleted
            ? `${name} completed a ${role} interview${score != null ? ` (score: ${score}/100)` : ""}`
            : `${name} started a ${role} interview`;
    })();

    return (
        <div className="relative flex gap-4 group">
            {!isLast && (
                <div className="absolute left-[15px] top-8 bottom-[-20px] w-px bg-gray-200 dark:bg-gray-700" />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-white dark:border-gray-900 overflow-hidden
                ${!item.student?.avatarUrl ? (
                    success === true ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                        success === false ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" :
                            "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                ) : ""}`}
            >
                {item.student?.avatarUrl ? (
                    <img
                        src={item.student.avatarUrl}
                        alt={item.student.name || ""}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                                parent.classList.add(
                                    success === true ? "bg-emerald-100" :
                                        success === false ? "bg-rose-100" : "bg-indigo-100"
                                );
                                // Re-insert the icon logic if necessary, but keep it simple
                            }
                        }}
                    />
                ) : (
                    success === true ? <CheckCircle2 className="w-4 h-4" /> :
                        success === false ? <AlertCircle className="w-4 h-4" /> :
                            <Zap className="w-4 h-4" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                    {message}
                </p>
                {time && (
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 block">
                        {new Date(time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── View All Activity Modal ───────────────────────────────────────────────────
function ActivityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [items, setItems] = useState<ActivityItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchPage = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await authFetch(`/university/analytics/activity?page=${p}&limit=20`);
            if (res.ok) {
                const json = await res.json();
                setItems(json.data.items || []);
                setTotalPages(json.data.pagination?.pages || 1);
                setPage(p);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) fetchPage(1);
    }, [open, fetchPage]);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative bg-white dark:bg-[#0E1320] border border-gray-200 dark:border-white/10 rounded-[28px] shadow-2xl flex flex-col w-full max-w-xl max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-500/10">
                                    <Activity className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                                </div>
                                <h2 className="text-base font-black text-gray-900 dark:text-white">All Activity</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                                </div>
                            ) : items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                    <Activity className="w-10 h-10 opacity-30" />
                                    <p className="text-sm">No activity yet</p>
                                </div>
                            ) : (
                                <div className="space-y-5 py-2">
                                    {items.map((item, i) => (
                                        <ActivityFeedItem key={item.id} item={item} isLast={i === items.length - 1} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] shrink-0">
                                <button
                                    onClick={() => fetchPage(page - 1)}
                                    disabled={page <= 1 || loading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] text-sm font-bold text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Prev
                                </button>
                                <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
                                <button
                                    onClick={() => fetchPage(page + 1)}
                                    disabled={page >= totalPages || loading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] text-sm font-bold text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InstitutionAdminDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<DashboardData | null>(null);
    const [placementTrend, setPlacementTrend] = useState<any[]>([]);
    const [deptReadiness, setDeptReadiness] = useState<DeptReadiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllActivity, setShowAllActivity] = useState(false);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const [dashRes, deptRes] = await Promise.all([
                    authFetch("/university/analytics/overview"),
                    authFetch("/university/analytics/department-readiness"),
                ]);

                if (dashRes.ok) {
                    const data = (await dashRes.json()).data;
                    setStats(data);

                    if (data.activityTrend) {
                        setPlacementTrend(
                            data.activityTrend.map((t: any) => ({
                                month: new Date(t.date).toLocaleDateString("default", { month: "short", day: "numeric" }),
                                interviews: t.interviews,
                                signups: t.signups,
                            }))
                        );
                    }
                }

                if (deptRes.ok) {
                    const deptData = (await deptRes.json()).data;
                    setDeptReadiness(deptData || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-r-2 border-fuchsia-500 animate-spin" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm animate-pulse">Loading analytics…</p>
                </div>
            </div>
        );
    }

    const placementRate = stats
        ? Math.round(((stats.placedStudents || 0) / Math.max(stats.totalStudents || 1, 1)) * 100)
        : 0;

    const statCards: StatCardProps[] = [
        {
            label: "Total Registered Students",
            value: stats?.totalStudents?.toLocaleString() ?? "0",
            sub: `${stats?.recentInterviewCount ?? 0} active this week`,
            icon: <Users className="w-5 h-5 text-violet-500 dark:text-violet-400" />,
            gradient: "bg-gradient-to-br from-violet-500/5 to-transparent",
            iconBg: "bg-violet-50 dark:bg-violet-500/20",
            delay: 0,
            trend: "up",
        },
        {
            label: "Total Placed",
            value: stats?.placedStudents?.toLocaleString() ?? "0",
            sub: `${placementRate}% placement rate`,
            icon: <Award className="w-5 h-5 text-fuchsia-500 dark:text-fuchsia-400" />,
            gradient: "bg-gradient-to-br from-fuchsia-500/5 to-transparent",
            iconBg: "bg-fuchsia-50 dark:bg-fuchsia-500/20",
            delay: 0.1,
            trend: "up",
        },
        {
            label: "Interviews This Week",
            value: stats?.recentInterviewCount?.toLocaleString() ?? "0",
            sub: "Practice sessions in last 7 days",
            icon: <Briefcase className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
            gradient: "bg-gradient-to-br from-indigo-500/5 to-transparent",
            iconBg: "bg-indigo-50 dark:bg-indigo-500/20",
            delay: 0.2,
            trend: "neutral",
        },
        {
            label: "Avg. AI Readiness Score",
            value: `${stats?.placementIntelligence?.averageReadiness ?? 0}/100`,
            sub: "Overall campus employability index",
            icon: <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
            gradient: "bg-gradient-to-br from-amber-500/5 to-transparent",
            iconBg: "bg-amber-50 dark:bg-amber-500/20",
            delay: 0.3,
            trend: "up",
        },
        {
            label: "At-Risk Students",
            value: stats?.placementIntelligence?.totalRiskyStudents?.toLocaleString() ?? "0",
            sub: `${stats?.placementIntelligence?.activeAlerts ?? 0} active AI alerts`,
            icon: <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />,
            gradient: "bg-gradient-to-br from-rose-500/5 to-transparent",
            iconBg: "bg-rose-50 dark:bg-rose-500/20",
            delay: 0.4,
            trend: "down",
        },
    ];

    const recentActivity = stats?.recentActivity || [];

    return (
        <>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-xl bg-emerald-500/10">
                                <Activity className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                Institutional Performance
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                    Live
                                </span>
                            </h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">Overview of student engagement and placement metrics.</p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/institution-admin/students"
                            className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            View Students
                        </Link>
                        <Link
                            href="/institution-admin/reports"
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition inline-flex items-center justify-center"
                        >
                            Export Report
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {statCards.map((card) => (
                        <StatCard key={card.label} {...card} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Trend Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-800/30 p-6 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-violet-500" />
                                    Activity Trend
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">New signups vs. interview sessions — last 14 days</p>
                            </div>
                        </div>

                        {placementTrend.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-16">
                                No activity data yet
                            </div>
                        ) : (
                            <div className="h-[300px] w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={placementTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#9CA3AF", fontSize: 11 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                            dx={-10}
                                            allowDecimals={false}
                                        />
                                        <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: "#8B5CF6", strokeWidth: 1, strokeDasharray: "4 4" }} />
                                        <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                                        <Line
                                            type="monotone"
                                            name="New Signups"
                                            dataKey="signups"
                                            stroke="#CBD5E1"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, fill: "#CBD5E1", stroke: "#fff", strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            name="Interviews"
                                            dataKey="interviews"
                                            stroke="#8B5CF6"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 0 }}
                                            activeDot={{ r: 7, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-800/30 p-6 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-fuchsia-500" />
                                Recent Activity
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 space-y-5 min-h-0">
                            {recentActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                                    <Activity className="w-8 h-8 opacity-30" />
                                    <p className="text-sm">No recent activity</p>
                                </div>
                            ) : (
                                recentActivity.slice(0, 6).map((act, index) => (
                                    <ActivityFeedItem
                                        key={act.id}
                                        item={{
                                            ...act,
                                            message: (() => {
                                                const name = act.student?.name || "Student";
                                                const role = act.targetRole || act.type || "interview";
                                                const score = act.score;
                                                const isCompleted = act.status === "COMPLETED";
                                                return isCompleted
                                                    ? `${name} completed a ${role} interview${score != null ? ` (score: ${score}/100)` : ""}`
                                                    : `${name} started a ${role} interview`;
                                            })(),
                                            time: (act as any).completedAt || (act as any).createdAt,
                                            success: act.status === "COMPLETED"
                                                ? (act.score != null ? act.score >= 60 : null)
                                                : null,
                                        }}
                                        isLast={index === Math.min(recentActivity.length - 1, 5)}
                                    />
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setShowAllActivity(true)}
                            className="w-full mt-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            View All Activity
                        </button>
                    </motion.div>

                    {/* Departmental Skill Readiness */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-3 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-800/30 p-6 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-indigo-500" />
                                    Departmental Skill Readiness
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Composite readiness score per department — ATS (40%) + Interview (40%) + Skill coverage (20%)
                                </p>
                            </div>
                            <Link
                                href="/institution-admin/skill-gaps"
                                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                            >
                                Full skill matrix <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>

                        {deptReadiness.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                <Building2 className="w-10 h-10 opacity-30" />
                                <p className="text-sm">No department data yet — students need to complete their profiles</p>
                            </div>
                        ) : (
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={deptReadiness}
                                        margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                                        barSize={32}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                            domain={[0, 100]}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload as DeptReadiness;
                                                    return (
                                                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl text-sm space-y-1">
                                                            <p className="font-bold text-gray-900 dark:text-white">{label}</p>
                                                            <p className="text-gray-600 dark:text-gray-300">Readiness: <span className="font-bold text-indigo-500">{d.readiness}/100</span></p>
                                                            <p className="text-gray-600 dark:text-gray-300">Avg ATS Score: <span className="font-bold">{d.avgAtsScore}/100</span></p>
                                                            {d.avgInterviewScore != null && (
                                                                <p className="text-gray-600 dark:text-gray-300">Avg Interview: <span className="font-bold">{d.avgInterviewScore}/100</span></p>
                                                            )}
                                                            <p className="text-gray-600 dark:text-gray-300">Students: <span className="font-bold">{d.students}</span></p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="readiness" radius={[6, 6, 0, 0]} name="Readiness Score">
                                            {deptReadiness.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* View All Activity Modal */}
            <ActivityModal open={showAllActivity} onClose={() => setShowAllActivity(false)} />
        </>
    );
}
