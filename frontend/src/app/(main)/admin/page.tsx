"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Users, CreditCard, TrendingUp, Activity, DollarSign, ArrowUpRight, Zap
} from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#06B6D4'];

interface DashboardStats {
    totalUsers: number;
    newUsersToday: number;
    activeSubscriptions: number;
    totalRevenue: number;
}

interface StatCardProps {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
    delay: number;
}

function StatCard({ label, value, sub, icon, gradient, iconBg, delay }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-6 hover:shadow-lg dark:hover:shadow-indigo-500/5 transition-shadow duration-300 group"
        >
            {/* background glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient} pointer-events-none`} />
            <div className="relative flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
            </div>
            <p className="relative text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
            <p className="relative text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />{sub}
            </p>
        </motion.div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-gray-900 dark:bg-gray-800 border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
                <p className="text-gray-400 mb-1">{label}</p>
                <p className="text-white font-semibold">{payload[0]?.value} users</p>
            </div>
        );
    }
    return null;
};

const PieTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-gray-900 dark:bg-gray-800 border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
                <p className="text-white font-semibold capitalize">{payload[0]?.name}</p>
                <p className="text-gray-400">{payload[0]?.value} subscribers</p>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [growthData, setGrowthData] = useState<any[]>([]);
    const [subscriptionData, setSubscriptionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const [overviewRes, growthRes, subRes] = await Promise.all([
                    authFetch(`/admin/analytics/overview`),
                    authFetch(`/admin/analytics/user-growth`),
                    authFetch(`/admin/analytics/subscriptions`)
                ]);
                if (overviewRes.ok) setStats((await overviewRes.json()).data);
                if (growthRes.ok) setGrowthData((await growthRes.json()).data);
                if (subRes.ok) {
                    const d = await subRes.json();
                    setSubscriptionData(d.data.map((item: any) => ({
                        name: item.plan || item.planName || 'Unknown',
                        value: item.count
                    })));
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading dashboard…</p>
                </div>
            </div>
        );
    }

    const statCards: StatCardProps[] = [
        {
            label: "Total Users",
            value: stats?.totalUsers?.toLocaleString() ?? "0",
            sub: `+${stats?.newUsersToday ?? 0} today`,
            icon: <Users className="w-5 h-5 text-indigo-400" />,
            gradient: "bg-gradient-to-br from-indigo-500/5 to-transparent",
            iconBg: "bg-indigo-500/15 dark:bg-indigo-500/20",
            delay: 0
        },
        {
            label: "Active Subscriptions",
            value: stats?.activeSubscriptions?.toLocaleString() ?? "0",
            sub: "across all premium plans",
            icon: <CreditCard className="w-5 h-5 text-violet-400" />,
            gradient: "bg-gradient-to-br from-violet-500/5 to-transparent",
            iconBg: "bg-violet-500/15 dark:bg-violet-500/20",
            delay: 0.06
        },
        {
            label: "Monthly Revenue",
            value: `₹${stats?.totalRevenue?.toLocaleString() ?? "0"}`,
            sub: "estimated recurring",
            icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
            gradient: "bg-gradient-to-br from-emerald-500/5 to-transparent",
            iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
            delay: 0.12
        },
        {
            label: "System Health",
            value: "99.9%",
            sub: "uptime last 30 days",
            icon: <Activity className="w-5 h-5 text-rose-400" />,
            gradient: "bg-gradient-to-br from-rose-500/5 to-transparent",
            iconBg: "bg-rose-500/15 dark:bg-rose-500/20",
            delay: 0.18
        }
    ];

    return (
        <div className="space-y-8">
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard Overview</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 ml-10">System performance and growth metrics</p>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((card) => (
                    <StatCard key={card.label} {...card} />
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Growth — takes 2/3 */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-6"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Growth</h3>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growthData}>
                                <defs>
                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-10" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#6366F1"
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Pie — takes 1/3 */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32, duration: 0.5 }}
                    className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-6"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <CreditCard className="w-4 h-4 text-violet-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subscription Mix</h3>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={subscriptionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {subscriptionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                        {subscriptionData.map((entry, idx) => (
                            <div key={entry.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-gray-600 dark:text-gray-300 capitalize">{entry.name}</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">{entry.value}</span>
                            </div>
                        ))}
                        {subscriptionData.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-2">No subscription data yet</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
