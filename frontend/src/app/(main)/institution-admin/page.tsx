"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users,
    Award,
    Activity,
    FileText,
    Target,
    RefreshCw,
    ChevronRight,
    Clock,
    Briefcase,
    Code,
    Trophy,
    Zap,
    TrendingUp
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface DashboardData {
    totalStudents: number;
    activeStudents: number;
    studentsWithResumes: number;
    studentsWithBadges: number;
    averageScore: number;
    totalInterviews: number;
    recentInterviewCount: number;
    placedStudents: number;
    profileCompletion: {
        hasResume: number;
        hasSkills: number;
        hasTargetRole: number;
        averageCompletion: number;
    };
    scoreDistribution: {
        excellent: number;
        good: number;
        average: number;
        needsWork: number;
    };
    roleDistribution: { roleName: string; count: number }[];
    topSkills: { name: string; category: string; count: number }[];
    topPerformers: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        targetRole: string | null;
        averageScore: number;
        interviewCount: number;
        badgeCount: number;
    }[];
    recentActivity: {
        id: string;
        targetRole: string;
        type: string;
        score: number | null;
        completedAt: string;
        student: { id: string; name: string; avatarUrl?: string };
    }[];
    activityTrend: { date: string; interviews: number; signups: number }[];
}

export default function InstitutionDashboard() {
    const { user } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`/admin/institution/dashboard`);
            if (!res.ok) throw new Error("Failed to fetch dashboard");
            const result = await res.json();
            setData(result.data);
        } catch (err) {
            console.error("Dashboard error:", err);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchDashboard();
    }, [user]);

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-gray-500 dark:text-gray-400";
        if (score >= 80) return "text-emerald-500 dark:text-emerald-400";
        if (score >= 60) return "text-amber-500 dark:text-amber-400";
        return "text-rose-500 dark:text-rose-400";
    };

    const getScoreBg = (score: number | null) => {
        if (score === null) return "bg-gray-100 dark:bg-gray-800";
        if (score >= 80) return "bg-emerald-50 dark:bg-emerald-500/10";
        if (score >= 60) return "bg-amber-50 dark:bg-amber-500/10";
        return "bg-rose-50 dark:bg-rose-500/10";
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffHours < 1) return "Just now";
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-teal-500 animate-spin flex items-center justify-center">
                        <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading dashboard elements...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-2">
                    <Zap className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Oops! Something went wrong</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">{error || "We couldn't load your dashboard data right now."}</p>
                <button
                    onClick={fetchDashboard}
                    className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-lg shadow-gray-900/20 dark:shadow-white/10 font-medium"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        );
    }

    const activeRate = data.totalStudents > 0 ? Math.round((data.activeStudents / data.totalStudents) * 100) : 0;

    const scoreChartData = [
        { name: "Excellent", value: data.scoreDistribution.excellent, color: "#10b981" },
        { name: "Good", value: data.scoreDistribution.good, color: "#f59e0b" },
        { name: "Average", value: data.scoreDistribution.average, color: "#6366f1" },
        { name: "Needs Work", value: data.scoreDistribution.needsWork, color: "#f43f5e" },
    ].filter(d => d.value > 0);

    const totalScored = scoreChartData.reduce((acc, d) => acc + d.value, 0);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                        Institution Overview
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Live metrics and performance insights
                    </p>
                </div>
                <button
                    onClick={fetchDashboard}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-sm font-medium">Sync Data</span>
                </button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard
                    icon={Users}
                    label="Total Students"
                    value={data.totalStudents}
                    color="emerald"
                />
                <StatCard
                    icon={Target}
                    label="Placed Students"
                    value={data.placedStudents}
                    subtitle="Successfully hired"
                    color="blue"
                />
                <StatCard
                    icon={Activity}
                    label="Active (30d)"
                    value={data.activeStudents}
                    subtitle={`${activeRate}% engagement`}
                    color="indigo"
                />
                <StatCard
                    icon={Trophy}
                    label="Avg. Score"
                    value={`${data.averageScore}%`}
                    subtitle="Platform wide"
                    color="amber"
                />
            </motion.div>

            {/* Intermediate Stats row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <MiniStatCard
                    icon={FileText}
                    label="Profile Completion"
                    value={`${data.profileCompletion.averageCompletion}%`}
                    color="purple"
                />
                <MiniStatCard
                    icon={Award}
                    label="Students With Badges"
                    value={data.studentsWithBadges}
                    color="teal"
                />
                <MiniStatCard
                    icon={Briefcase}
                    label="Total Interviews"
                    value={data.totalInterviews}
                    subtitle={`+${data.recentInterviewCount} this week`}
                    color="rose"
                />
            </motion.div>

            {/* Charts Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Trend - Takes 2 columns */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Activity Pulse</h2>
                            <p className="text-sm text-gray-500">14-day engagement metrics</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-md">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Interviews
                            </span>
                            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-1 rounded-md">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Signups
                            </span>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradInterview" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradSignup" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={12}
                                    dy={10}
                                />
                                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                                    contentStyle={{
                                        backgroundColor: "rgba(17, 24, 39, 0.9)",
                                        backdropFilter: "blur(8px)",
                                        borderColor: "rgba(255, 255, 255, 0.1)",
                                        borderRadius: "12px",
                                        color: "#fff",
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                                    }}
                                    itemStyle={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}
                                    labelStyle={{ color: "#9ca3af", marginBottom: "4px", fontSize: "12px" }}
                                    labelFormatter={(v) => new Date(v).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                />
                                <Area type="monotone" dataKey="interviews" stroke="#10b981" strokeWidth={3} fill="url(#gradInterview)" name="Interviews" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                                <Area type="monotone" dataKey="signups" stroke="#3b82f6" strokeWidth={3} fill="url(#gradSignup)" name="Signups" activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Distribution */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Score Distribution</h2>
                    <p className="text-sm text-gray-500 mb-6">Overall breakdown of interview attempts</p>

                    {totalScored > 0 ? (
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="h-44 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={scoreChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {scoreChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(17, 24, 39, 0.9)",
                                                border: "none",
                                                borderRadius: "12px",
                                                color: "#fff",
                                            }}
                                            itemStyle={{ color: "#fff", fontWeight: 600 }}
                                            formatter={(value: number) => [`${value} Interviews`, ""]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="pt-4 grid grid-cols-2 gap-y-3 gap-x-2">
                                {scoreChartData.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center p-6 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-xl">
                                <PieChart className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-500">Not enough data to calculate distribution</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Three Column Info */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Target Roles */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Target Roles</h2>
                        </div>
                    </div>
                    {data.roleDistribution.length > 0 ? (
                        <div className="space-y-4">
                            {data.roleDistribution.slice(0, 5).map((role, idx) => {
                                const maxCount = data.roleDistribution[0]?.count || 1;
                                const percentage = Math.round((role.count / maxCount) * 100);
                                const colors = ["bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500"];
                                return (
                                    <div key={idx} className="group">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate pr-4">{role.roleName}</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 px-2 rounded-md">{role.count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, delay: idx * 0.1 }}
                                                className={`h-full rounded-full ${colors[idx % colors.length]}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState icon={Briefcase} message="No role targets set by students yet" />
                    )}
                </div>

                {/* Top Performers */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-amber-500" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Performers</h2>
                        </div>
                        <Link href="/institution-admin/students?sortBy=score&sortOrder=desc" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 group">
                            View all <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    {data.topPerformers.length > 0 ? (
                        <div className="space-y-4">
                            {data.topPerformers.slice(0, 5).map((student, idx) => (
                                <Link
                                    key={student.id}
                                    href={`/institution-admin/students/${student.id}`}
                                    className="flex items-center gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold relative border border-gray-200 dark:border-white/10 overflow-hidden group-hover:border-emerald-500 transition-colors">
                                        {student.avatarUrl ? (
                                            <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            student.name.charAt(0).toUpperCase()
                                        )}
                                        {idx < 3 && (
                                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-[#111827] ${idx === 0 ? "bg-amber-400 text-amber-900"
                                                    : idx === 1 ? "bg-slate-300 text-slate-800"
                                                        : "bg-[#cd7f32] text-white"
                                                }`}>
                                                {idx + 1}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{student.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{student.targetRole || "No specific role"}</p>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-md text-sm font-bold shadow-sm ${getScoreBg(student.averageScore)} ${getScoreColor(student.averageScore)}`}>
                                        {student.averageScore}%
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Trophy} message="No performance data available" />
                    )}
                </div>

                {/* Top Skills */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                                <Code className="w-5 h-5 text-purple-500" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Popular Skills</h2>
                        </div>
                    </div>
                    {data.topSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                            {data.topSkills.map((skill, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 text-sm hover:border-purple-500/30 dark:hover:border-purple-500/30 transition-colors cursor-default"
                                >
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{skill.name}</span>
                                    <span className="ml-2 font-semibold text-gray-400 dark:text-gray-500 bg-gray-200/50 dark:bg-white/10 px-1.5 rounded text-xs">{skill.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Code} message="No skills logged by students yet" />
                    )}
                </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Interview Activity</h2>
                    </div>
                    <Link href="/institution-admin/students" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 group">
                        Student database <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                {data.recentActivity.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {data.recentActivity.map((activity) => (
                            <Link
                                key={activity.id}
                                href={`/institution-admin/students/${activity.student.id}`}
                                className="group relative p-5 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-inner">
                                        {activity.student.avatarUrl ? (
                                            <img src={activity.student.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            activity.student.name?.charAt(0).toUpperCase() || "?"
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{activity.student.name || "Unknown"}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            {formatDate(activity.completedAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-gray-200/60 dark:border-white/10 flex items-center justify-between">
                                    <div className="pr-3">
                                        <div className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                            {activity.type}
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{activity.targetRole}</p>
                                    </div>
                                    {activity.score !== null && (
                                        <div className={`shrink-0 flex items-center justify-center px-3 py-1.5 rounded-lg text-lg font-black shadow-sm ${getScoreBg(activity.score)} ${getScoreColor(activity.score)}`}>
                                            {activity.score}%
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={Zap} message="No recent interview activity found" />
                )}
            </motion.div>
        </motion.div>
    );
}

// Reusable Components

function StatCard({
    icon: Icon,
    label,
    value,
    subtitle,
    color
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subtitle?: string;
    color: "emerald" | "blue" | "indigo" | "amber" | "teal" | "rose" | "purple";
}) {
    const colorConfigs = {
        emerald: { bg: "bg-emerald-500", text: "text-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-500/10" },
        blue: { bg: "bg-blue-500", text: "text-blue-500", lightBg: "bg-blue-50 dark:bg-blue-500/10" },
        indigo: { bg: "bg-indigo-500", text: "text-indigo-500", lightBg: "bg-indigo-50 dark:bg-indigo-500/10" },
        amber: { bg: "bg-amber-500", text: "text-amber-500", lightBg: "bg-amber-50 dark:bg-amber-500/10" },
        teal: { bg: "bg-teal-500", text: "text-teal-500", lightBg: "bg-teal-50 dark:bg-teal-500/10" },
        rose: { bg: "bg-rose-500", text: "text-rose-500", lightBg: "bg-rose-50 dark:bg-rose-500/10" },
        purple: { bg: "bg-purple-500", text: "text-purple-500", lightBg: "bg-purple-50 dark:bg-purple-500/10" }
    };

    const conf = colorConfigs[color];

    return (
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-shadow">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.03] dark:opacity-[0.02] ${conf.bg} group-hover:scale-150 transition-transform duration-500`} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
                    {subtitle && <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-xl ${conf.lightBg}`}>
                    <Icon className={`w-6 h-6 ${conf.text}`} />
                </div>
            </div>
        </div>
    );
}

function MiniStatCard({
    icon: Icon,
    label,
    value,
    subtitle,
    color
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subtitle?: string;
    color: "emerald" | "blue" | "indigo" | "amber" | "teal" | "rose" | "purple";
}) {
    const colorConfigs = {
        emerald: { text: "text-emerald-500", border: "border-emerald-500/20" },
        blue: { text: "text-blue-500", border: "border-blue-500/20" },
        indigo: { text: "text-indigo-500", border: "border-indigo-500/20" },
        amber: { text: "text-amber-500", border: "border-amber-500/20" },
        teal: { text: "text-teal-500", border: "border-teal-500/20" },
        rose: { text: "text-rose-500", border: "border-rose-500/20" },
        purple: { text: "text-purple-500", border: "border-purple-500/20" }
    };

    const conf = colorConfigs[color];

    return (
        <div className={`flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm border-l-4 ${conf.border}`}>
            <div className={`p-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03]`}>
                <Icon className={`w-5 h-5 ${conf.text}`} />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {subtitle && <span className="text-xs font-medium text-gray-400">{subtitle}</span>}
                </div>
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType, message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );
}
