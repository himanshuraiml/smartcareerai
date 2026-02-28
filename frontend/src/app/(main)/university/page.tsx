// src/app/(main)/university/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Users, Briefcase, TrendingUp, Activity, ArrowUpRight, Award, Zap, Building2, CheckCircle2, AlertCircle
} from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, BarChart, Bar, Cell, Legend
} from "recharts";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

interface UniversityStats {
    totalStudents: number;
    placedStudents: number;
    upcomingInterviews: number;
    averageScore: number;
    recentActivity: any[];
}

interface StatCardProps {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
    delay: number;
    trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ label, value, sub, icon, gradient, iconBg, delay, trend = 'neutral' }: StatCardProps) {
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
                    {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
                    {trend === 'down' && <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 rotate-90" />}
                    {trend === 'neutral' && <Activity className="w-3.5 h-3.5 text-blue-500" />}
                    {sub}
                </p>
            </div>
        </motion.div>
    );
}

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

export default function UniversityDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<UniversityStats | null>(null);
    const [placementTrend, setPlacementTrend] = useState<any[]>([]);
    const [skillDistribution, setSkillDistribution] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                // In a real application, these endpoints would be implemented on the backend.
                // For now, we simulate data fetching or fetch from existing generic ones if applicable.

                const statsRes = await authFetch(`/university/analytics/overview`);
                if (statsRes.ok) {
                    setStats((await statsRes.json()).data);
                } else {
                    setStats({
                        totalStudents: 1250,
                        placedStudents: 485,
                        upcomingInterviews: 124,
                        averageScore: 78.5,
                        recentActivity: [
                            { id: 1, type: 'PLACEMENT', message: 'Sarah Connor placed at TechCorp', time: '10m ago', success: true },
                            { id: 2, type: 'TEST', message: 'CS Dept average coding score increased', time: '1h ago', success: true },
                            { id: 3, type: 'INTERVIEW', message: '15 interviews scheduled for next week', time: '3h ago', success: null },
                            { id: 4, type: 'ALERT', message: 'Mechanical Dept low attendance in mock tests', time: '5h ago', success: false },
                        ]
                    });
                }

                // Mock data for charts
                setPlacementTrend([
                    { month: 'Jan', placed: 40, active: 200 },
                    { month: 'Feb', placed: 65, active: 250 },
                    { month: 'Mar', placed: 85, active: 300 },
                    { month: 'Apr', placed: 120, active: 320 },
                    { month: 'May', placed: 180, active: 310 },
                    { month: 'Jun', placed: 240, active: 280 },
                ]);

                setSkillDistribution([
                    { name: 'React/Frontend', score: 85, students: 450 },
                    { name: 'Node.js/Backend', score: 72, students: 380 },
                    { name: 'Data structure', score: 65, students: 850 },
                    { name: 'System Design', score: 55, students: 210 },
                    { name: 'Communication', score: 88, students: 1200 },
                ]);

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
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm animate-pulse">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const placementRate = stats ? Math.round((stats.placedStudents / stats.totalStudents) * 100) : 0;

    const statCards: StatCardProps[] = [
        {
            label: "Total Registered Students",
            value: stats?.totalStudents?.toLocaleString() ?? "0",
            sub: "+120 this semester",
            icon: <Users className="w-5 h-5 text-violet-500 dark:text-violet-400" />,
            gradient: "bg-gradient-to-br from-violet-500/5 to-transparent",
            iconBg: "bg-violet-50 dark:bg-violet-500/20",
            delay: 0,
            trend: 'up'
        },
        {
            label: "Total Placed",
            value: stats?.placedStudents?.toLocaleString() ?? "0",
            sub: `${placementRate}% placement rate`,
            icon: <Award className="w-5 h-5 text-fuchsia-500 dark:text-fuchsia-400" />,
            gradient: "bg-gradient-to-br from-fuchsia-500/5 to-transparent",
            iconBg: "bg-fuchsia-50 dark:bg-fuchsia-500/20",
            delay: 0.1,
            trend: 'up'
        },
        {
            label: "Upcoming Interviews",
            value: stats?.upcomingInterviews?.toLocaleString() ?? "0",
            sub: "Scheduled across 12 companies",
            icon: <Briefcase className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
            gradient: "bg-gradient-to-br from-indigo-500/5 to-transparent",
            iconBg: "bg-indigo-50 dark:bg-indigo-500/20",
            delay: 0.2,
            trend: 'up'
        },
        {
            label: "Avg. AI Readiness Score",
            value: `${stats?.averageScore ?? "0"}/100`,
            sub: "+2.5pts since last month",
            icon: <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
            gradient: "bg-gradient-to-br from-emerald-500/5 to-transparent",
            iconBg: "bg-emerald-50 dark:bg-emerald-500/20",
            delay: 0.3,
            trend: 'up'
        }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        Institutional Performance
                        <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-wider">
                            Real-time
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of student engagement and placement metrics.</p>
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/university/students"
                        className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        View Students
                    </Link>
                    <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition">
                        Export Report
                    </button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <StatCard key={card.label} {...card} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Placement Trend */}
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
                                Placement Trajectory
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active candidates vs. confirmed placements over time</p>
                        </div>
                        <select className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500">
                            <option>Last 6 Months</option>
                            <option>This Year</option>
                            <option>All Time</option>
                        </select>
                    </div>

                    <div className="h-[300px] w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={placementTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    dx={-10}
                                />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', stroke: '#8B5CF6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Line
                                    type="monotone"
                                    name="Active Candidates"
                                    dataKey="active"
                                    stroke="#CBD5E1"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#CBD5E1', stroke: '#fff', strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    name="Placed Students"
                                    dataKey="placed"
                                    stroke="#8B5CF6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
                                    activeDot={{ r: 7, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
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

                    <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                        {stats?.recentActivity.map((act, index) => (
                            <div key={act.id} className="relative flex gap-4 group">
                                {index !== (stats.recentActivity.length - 1) && (
                                    <div className="absolute left-[15px] top-8 bottom-[-20px] w-px bg-gray-200 dark:bg-gray-700" />
                                )}
                                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-white dark:border-gray-900
                                    ${act.success === true ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                        act.success === false ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                                            'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}
                                `}>
                                    {act.success === true ? <CheckCircle2 className="w-4 h-4" /> :
                                        act.success === false ? <AlertCircle className="w-4 h-4" /> :
                                            <Zap className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                        {act.message}
                                    </p>
                                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                                        {act.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        View All Activity
                    </button>
                </motion.div>

                {/* Skill Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-3 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-800/30 p-6 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-500" />
                                Departmental Skill Readiness
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average verification scores across key skill domains</p>
                        </div>
                    </div>

                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={skillDistribution} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl">
                                                    <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Score: <span className="font-bold text-indigo-500">{payload[0].value}%</span></p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">Students Evaluated: <span className="font-bold">{payload[0].payload.students}</span></p>
                                                </div>
                                            )
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="score"
                                    radius={[6, 6, 0, 0]}
                                >
                                    {skillDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
