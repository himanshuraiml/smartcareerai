"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Flame, Trophy, Sparkles, CheckCircle, Star, Info, AlertTriangle, Check } from "lucide-react";
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
        icon?: string;
        color?: string;
    } | null;
    createdAt: string;
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch unread count initially and poll every 30 seconds
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await authFetch("/notifications/unread-count");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setUnreadCount(data.data.unreadCount);
                }
            }
        } catch (err) {
            console.error("Failed to fetch unread count:", err);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/notifications?limit=5");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setNotifications(data.data);
                }
            }
        } catch (err) {
            console.error("Failed to fetch notifications list:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await authFetch(`/notifications/${id}/read`, {
                method: "PUT"
            });
            if (res.ok) {
                setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const res = await authFetch("/notifications/read-all", {
                method: "PUT"
            });
            if (res.ok) {
                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const getNotificationIcon = (type: string, category: string) => {
        const iconClass = "w-4 h-4";
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

    const getRelativeTime = (dateStr: string) => {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 600);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={handleToggle}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border relative ${
                    isOpen
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                        : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                }`}
                title="Notifications"
            >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-white dark:border-gray-900 animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-80 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <div
                                    key={item.id}
                                    className={`p-4 flex gap-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02] ${
                                        !item.isRead ? "bg-blue-50/20 dark:bg-blue-500/[0.02]" : ""
                                    }`}
                                >
                                    <div className="shrink-0 mt-0.5">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200/50 dark:border-white/5">
                                            {getNotificationIcon(item.type, item.category)}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <p className={`text-xs font-bold truncate ${!item.isRead ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                                                {item.title}
                                            </p>
                                            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                                                {getRelativeTime(item.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                                            {item.message}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            {item.metadata?.ctaUrl ? (
                                                <Link
                                                    href={item.metadata.ctaUrl}
                                                    onClick={() => setIsOpen(false)}
                                                    className="inline-flex items-center text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {item.metadata.ctaLabel || "View"} &rarr;
                                                </Link>
                                            ) : (
                                                <div />
                                            )}

                                            {!item.isRead && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(item.id, e)}
                                                    className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <Link
                        href="/dashboard/notifications"
                        onClick={() => setIsOpen(false)}
                        className="block py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] text-center text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
}
