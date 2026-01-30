"use client";

import { useEffect, useState } from "react";
import {
    Users,
    CreditCard,
    TrendingUp,
    Activity,
    DollarSign,
    UserPlus
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

interface DashboardStats {
    totalUsers: number;
    newUsersToday: number;
    activeSubscriptions: number;
    totalRevenue: number;
}

export default function AdminDashboard() {
    const { accessToken } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [growthData, setGrowthData] = useState<any[]>([]);
    const [subscriptionData, setSubscriptionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${accessToken}` };

                const [overviewRes, growthRes, subRes] = await Promise.all([
                    fetch(`${API_URL}/admin/analytics/overview`, { headers }),
                    fetch(`${API_URL}/admin/analytics/user-growth`, { headers }),
                    fetch(`${API_URL}/admin/analytics/subscriptions`, { headers })
                ]);

                if (overviewRes.ok) {
                    const data = await overviewRes.json();
                    setStats(data.data);
                }

                if (growthRes.ok) {
                    const data = await growthRes.json();
                    setGrowthData(data.data);
                }

                if (subRes.ok) {
                    const data = await subRes.json();
                    setSubscriptionData(data.data.map((item: any) => ({
                        name: item.planName,
                        value: item.count
                    })));
                }

            } catch (error) {
                console.error("Failed to fetch admin analytics", error);
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchData();
        }
    }, [accessToken]);

    if (loading) {
        return <div className="text-white text-center py-20">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-gray-400 mt-1">System performance and growth metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                    <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{stats?.newUsersToday || 0} today
                    </p>
                </div>

                <div className="p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Active Subscriptions</h3>
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <CreditCard className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.activeSubscriptions || 0}</p>
                    <p className="text-purple-400 text-xs mt-2">
                        across all premium plans
                    </p>
                </div>

                <div className="p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Monthly Revenue</h3>
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
                    <p className="text-gray-400 text-xs mt-2">
                        estimated recurring
                    </p>
                </div>

                <div className="p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">System Health</h3>
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <Activity className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-green-400">99.9%</p>
                    <p className="text-gray-400 text-xs mt-2">
                        uptime last 30 days
                    </p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Chart */}
                <div className="p-6 rounded-xl glass border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6">User Growth</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8B5CF6"
                                    strokeWidth={2}
                                    dot={{ fill: '#8B5CF6' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subscription Distribution */}
                <div className="p-6 rounded-xl glass border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6">Subscription Distribution</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={subscriptionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {subscriptionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
