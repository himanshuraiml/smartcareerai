"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Flame, Trophy, Sparkles, CheckCircle, Star, Info, AlertTriangle, Check, Trash2, ArrowLeft } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    category: string;
    isRead: boolean;
    metadata: {
        ctaUrl?: string;
        ctaLabel?: string;
    } | null;
    createdAt: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchNotifications();
    }, [filter, page]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/notifications?page=${page}&limit=15&unread=${filter === "unread"}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setNotifications(data.data);
                    setTotalPages(data.pagination.pages || 1);
                }
            }
        } catch (err) {
            console.error("Failed to load notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            const res = await authFetch(`/notifications/${id}/read`, { method: "PUT" });
            if (res.ok) {
                setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
            }
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await authFetch("/notifications/read-all", { method: "PUT" });
            if (res.ok) {
                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            }
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const getNotificationIcon = (type: string, category: string) => {
        const iconClass = "w-5 h-5";
        switch (type) {
            case "streak":
                return <Flame className={`${iconClass} text-orange-500 fill-orange-500/10`} />;
            case "league":
                return <Trophy className={`${iconClass} text-yellow-500`} />;
            case "challenge":
                return <Sparkles className={`${iconClass} text-teal-500`} />;
            case "mastery":
                return <Star className={`${iconClass} text-purple-500 fill-purple-500/10`} />;
            case "community":
                return <CheckCircle className={`${iconClass} text-emerald-500`} />;
            default:
                return category === "warning" || category === "urgent"
                    ? <AlertTriangle className={`${iconClass} text-rose-500`} />
                    : <Info className={`${iconClass} text-blue-500`} />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Notification Center</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Stay updated with your preparation milestones</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleMarkAllRead}
                        className="px-4 py-2 text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all flex items-center gap-1.5"
                    >
                        <Check className="w-4 h-4" /> Mark All Read
                    </button>
                    <Link
                        href="/dashboard/settings/notifications"
                        className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                        Preferences
                    </Link>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 dark:border-white/5">
                <button
                    onClick={() => { setFilter("all"); setPage(1); }}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                        filter === "all"
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                >
                    All Notifications
                </button>
                <button
                    onClick={() => { setFilter("unread"); setPage(1); }}
                    className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                        filter === "unread"
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                >
                    Unread Only
                </button>
            </div>

            {/* Notifications Feed */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-20 text-center text-sm text-gray-500">Loading your notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="py-24 text-center glass rounded-2xl border border-gray-200/50 dark:border-white/5 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto">
                            <Bell className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications found.</p>
                    </div>
                ) : (
                    notifications.map((item) => (
                        <div
                            key={item.id}
                            className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-200 ${
                                !item.isRead
                                    ? "bg-gradient-to-r from-blue-500/[0.03] to-teal-500/[0.01] border-blue-500/20 shadow-sm"
                                    : "bg-white dark:bg-gray-950/40 border-gray-200/50 dark:border-white/5"
                            }`}
                        >
                            <div className="flex items-start gap-4 min-w-0">
                                <div className="shrink-0 w-11 h-11 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200/50 dark:border-white/5 shadow-sm">
                                    {getNotificationIcon(item.type, item.category)}
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className={`text-sm font-bold ${!item.isRead ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                                            {item.title}
                                        </p>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {new Date(item.createdAt).toLocaleString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {item.message}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                {item.metadata?.ctaUrl && (
                                    <Link
                                        href={item.metadata.ctaUrl}
                                        className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                    >
                                        Go &rarr;
                                    </Link>
                                )}

                                {!item.isRead && (
                                    <button
                                        onClick={() => handleMarkRead(item.id)}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-blue-500/30 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                        title="Mark as read"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4">
                    <button
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-xs font-semibold text-gray-500">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
