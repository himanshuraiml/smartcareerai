"use client";

import { useState, useEffect } from "react";
import { Activity, User, Briefcase, FileText, CheckCircle, AlertCircle, XCircle, RefreshCw, Filter, LogIn, LogOut, CreditCard, Settings, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface ActivityLog {
    id: string;
    type: string;
    message: string;
    userId?: string;
    userEmail?: string;
    metadata?: any;
    ipAddress?: string;
    status: 'SUCCESS' | 'WARNING' | 'ERROR';
    createdAt: string;
}

interface ActivityStats {
    totalToday: number;
    totalWeek: number;
    byType: Array<{ type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    recentActivity: ActivityLog[];
}

export default function ActivityPage() {
    const { user } = useAuthStore();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState<ActivityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (user) {
            fetchActivities();
            fetchStats();
        }
    }, [user, filter, page]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const typeParam = filter !== 'ALL' ? `&type=${filter}` : '';
            const res = await authFetch(`/admin/activity?page=${page}&limit=20${typeParam}`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data.data || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to fetch activities:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await authFetch('/admin/activity/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "USER_REGISTER": return <User className="w-5 h-5 text-blue-400" />;
            case "USER_LOGIN": return <LogIn className="w-5 h-5 text-green-400" />;
            case "USER_LOGOUT": return <LogOut className="w-5 h-5 text-gray-400" />;
            case "RESUME_UPLOAD":
            case "RESUME_ANALYSIS": return <FileText className="w-5 h-5 text-indigo-400" />;
            case "INTERVIEW_START":
            case "INTERVIEW_COMPLETE": return <Briefcase className="w-5 h-5 text-orange-400" />;
            case "TEST_START":
            case "TEST_COMPLETE": return <CheckCircle className="w-5 h-5 text-teal-400" />;
            case "SUBSCRIPTION_CHANGE":
            case "CREDIT_PURCHASE": return <CreditCard className="w-5 h-5 text-yellow-400" />;
            case "SETTINGS_CHANGE":
            case "ADMIN_ACTION": return <Settings className="w-5 h-5 text-indigo-400" />;
            case "SYSTEM_ALERT": return <AlertTriangle className="w-5 h-5 text-red-400" />;
            default: return <Activity className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Success
                    </span>
                );
            case 'WARNING':
                return (
                    <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Warning
                    </span>
                );
            case 'ERROR':
                return (
                    <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Error
                    </span>
                );
            default:
                return null;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const filterOptions = [
        'ALL',
        'USER_REGISTER',
        'USER_LOGIN',
        'RESUME_ANALYSIS',
        'INTERVIEW_START',
        'TEST_COMPLETE',
        'CREDIT_PURCHASE',
        'SYSTEM_ALERT'
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Activity</h1>
                    <p className="text-gray-400 mt-1">Real-time log of system events and user actions</p>
                </div>
                <button
                    onClick={() => { fetchActivities(); fetchStats(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Today</p>
                        <p className="text-2xl font-bold text-white">{stats.totalToday}</p>
                        <p className="text-xs text-gray-500">events</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-gray-400 text-sm">This Week</p>
                        <p className="text-2xl font-bold text-white">{stats.totalWeek}</p>
                        <p className="text-xs text-gray-500">events</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Success Rate</p>
                        <p className="text-2xl font-bold text-green-400">
                            {stats.totalWeek > 0
                                ? Math.round((stats.byStatus.find(s => s.status === 'SUCCESS')?.count || 0) / stats.totalWeek * 100)
                                : 100}%
                        </p>
                        <p className="text-xs text-gray-500">this week</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Errors</p>
                        <p className="text-2xl font-bold text-red-400">
                            {stats.byStatus.find(s => s.status === 'ERROR')?.count || 0}
                        </p>
                        <p className="text-xs text-gray-500">this week</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 flex-wrap items-center">
                <Filter className="w-4 h-4 text-gray-400" />
                {filterOptions.map((f) => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        {f === 'ALL' ? 'All' : f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Activity Timeline */}
            <div className="glass rounded-xl p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                ) : activities.length > 0 ? (
                    <div className="space-y-6">
                        {activities.map((activity, index) => (
                            <div key={activity.id} className="relative flex gap-4">
                                {/* Connecting Line */}
                                {index !== activities.length - 1 && (
                                    <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-white/5" />
                                )}

                                <div className="relative z-10 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                    {getIcon(activity.type)}
                                </div>

                                <div className="flex-1 pt-1">
                                    <div className="flex items-start justify-between mb-1">
                                        <div>
                                            <h3 className="text-white font-medium">{activity.message}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {activity.type.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500">{formatTime(activity.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm flex-wrap">
                                        {activity.userEmail && (
                                            <span className="text-gray-400">by {activity.userEmail}</span>
                                        )}
                                        {activity.ipAddress && (
                                            <span className="text-gray-500 text-xs">• {activity.ipAddress}</span>
                                        )}
                                        {getStatusBadge(activity.status)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-gray-400 text-sm">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Activity className="w-12 h-12 mb-4 opacity-20" />
                        <p>No activity recorded yet</p>
                        <p className="text-sm text-gray-500 mt-1">System events will appear here as they occur</p>
                    </div>
                )}
            </div>
        </div>
    );
}


