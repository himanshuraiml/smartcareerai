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
    Zap
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface DashboardData {
    totalStudents: number;
    activeStudents: number;
    studentsWithResumes: number;
    studentsWithBadges: number;
    averageScore: number;
    totalInterviews: number;
    recentInterviewCount: number;
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
        if (score === null) return "text-gray-400";
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-amber-400";
        return "text-red-400";
    };

    const getScoreBg = (score: number | null) => {
        if (score === null) return "bg-gray-500/20";
        if (score >= 80) return "bg-emerald-500/20";
        if (score >= 60) return "bg-amber-500/20";
        return "bg-red-500/20";
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-red-400">{error || "No data available"}</p>
                <button
                    onClick={fetchDashboard}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    const activeRate = data.totalStudents > 0 ? Math.round((data.activeStudents / data.totalStudents) * 100) : 0;
    const resumeRate = data.totalStudents > 0 ? Math.round((data.studentsWithResumes / data.totalStudents) * 100) : 0;

    const scoreChartData = [
        { name: "Excellent", value: data.scoreDistribution.excellent, color: "#10b981" },
        { name: "Good", value: data.scoreDistribution.good, color: "#f59e0b" },
        { name: "Average", value: data.scoreDistribution.average, color: "#6366f1" },
        { name: "Needs Work", value: data.scoreDistribution.needsWork, color: "#ef4444" },
    ].filter(d => d.value > 0);

    const totalScored = scoreChartData.reduce((acc, d) => acc + d.value, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Overview of your institution&apos;s student performance
                    </p>
                </div>
                <button
                    onClick={fetchDashboard}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    icon={Users}
                    label="Total Students"
                    value={data.totalStudents}
                    color="emerald"
                />
                <StatCard
                    icon={Activity}
                    label="Active (30d)"
                    value={data.activeStudents}
                    subtitle={`${activeRate}% of total`}
                    color="blue"
                />
                <StatCard
                    icon={FileText}
                    label="With Resumes"
                    value={data.studentsWithResumes}
                    subtitle={`${resumeRate}% uploaded`}
                    color="purple"
                />
                <StatCard
                    icon={Award}
                    label="With Badges"
                    value={data.studentsWithBadges}
                    color="amber"
                />
                <StatCard
                    icon={Target}
                    label="Avg. Score"
                    value={`${data.averageScore}%`}
                    color="teal"
                />
                <StatCard
                    icon={Briefcase}
                    label="Interviews"
                    value={data.totalInterviews}
                    subtitle={`+${data.recentInterviewCount} this week`}
                    color="rose"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Trend - Takes 2 columns */}
                <div className="lg:col-span-2 p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Activity Trend</h2>
                            <p className="text-sm text-gray-500">Interviews & signups over last 14 days</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                Interviews
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                Signups
                            </span>
                        </div>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.activityTrend}>
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
                                    stroke="#6b7280"
                                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={11}
                                    interval="preserveStartEnd"
                                />
                                <YAxis stroke="#6b7280" axisLine={false} tickLine={false} fontSize={11} width={30} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1f2937",
                                        borderColor: "#374151",
                                        borderRadius: "8px",
                                        fontSize: "12px"
                                    }}
                                    labelFormatter={(v) => new Date(v).toLocaleDateString()}
                                />
                                <Area type="monotone" dataKey="interviews" stroke="#10b981" strokeWidth={2} fill="url(#gradInterview)" name="Interviews" />
                                <Area type="monotone" dataKey="signups" stroke="#3b82f6" strokeWidth={2} fill="url(#gradSignup)" name="Signups" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Distribution */}
                <div className="p-6 rounded-xl glass border border-white/5">
                    <h2 className="text-lg font-semibold text-white mb-4">Score Distribution</h2>
                    {totalScored > 0 ? (
                        <>
                            <div className="h-40 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={scoreChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={65}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {scoreChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1f2937",
                                                borderColor: "#374151",
                                                borderRadius: "8px",
                                                fontSize: "12px"
                                            }}
                                            formatter={(value: number) => [`${value} interviews`, ""]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {scoreChartData.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2 text-xs">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-gray-400">{item.name}</span>
                                        <span className="text-white ml-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
                            No interview data yet
                        </div>
                    )}
                </div>
            </div>

            {/* Three Column Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performers */}
                <div className="p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-400" />
                            Top Performers
                        </h2>
                        <Link href="/institution-admin/students?sortBy=score&sortOrder=desc" className="text-xs text-emerald-400 hover:text-emerald-300">
                            View all
                        </Link>
                    </div>
                    {data.topPerformers.length > 0 ? (
                        <div className="space-y-3">
                            {data.topPerformers.map((student, idx) => (
                                <Link
                                    key={student.id}
                                    href={`/institution-admin/students/${student.id}`}
                                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 transition"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold relative">
                                        {student.avatarUrl ? (
                                            <img src={student.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            student.name.charAt(0).toUpperCase()
                                        )}
                                        {idx < 3 && (
                                            <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? "bg-amber-400 text-amber-900" : idx === 1 ? "bg-gray-300 text-gray-700" : "bg-orange-400 text-orange-900"
                                                }`}>
                                                {idx + 1}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{student.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{student.targetRole || "No role set"}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getScoreBg(student.averageScore)} ${getScoreColor(student.averageScore)}`}>
                                        {student.averageScore}%
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 text-sm">
                            No interview data yet
                        </div>
                    )}
                </div>

                {/* Target Roles */}
                <div className="p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-400" />
                            Target Roles
                        </h2>
                    </div>
                    {data.roleDistribution.length > 0 ? (
                        <div className="space-y-3">
                            {data.roleDistribution.map((role, idx) => {
                                const maxCount = data.roleDistribution[0]?.count || 1;
                                const percentage = Math.round((role.count / maxCount) * 100);
                                const colors = ["bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-amber-500", "bg-rose-500", "bg-teal-500"];
                                return (
                                    <div key={idx}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-300 truncate">{role.roleName}</span>
                                            <span className="text-xs text-gray-500">{role.count}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${colors[idx % colors.length]}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 text-sm">
                            No role data available
                        </div>
                    )}
                </div>

                {/* Top Skills */}
                <div className="p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Code className="w-5 h-5 text-indigo-400" />
                            Popular Skills
                        </h2>
                    </div>
                    {data.topSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {data.topSkills.map((skill, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm"
                                >
                                    <span className="text-gray-300">{skill.name}</span>
                                    <span className="text-gray-500 ml-1.5 text-xs">({skill.count})</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 text-sm">
                            No skill data available
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 rounded-xl glass border border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-400" />
                        Recent Activity
                    </h2>
                    <Link href="/institution-admin/students" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                        View all students <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                {data.recentActivity.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {data.recentActivity.map((activity) => (
                            <Link
                                key={activity.id}
                                href={`/institution-admin/students/${activity.student.id}`}
                                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition border border-transparent hover:border-white/10"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                                        {activity.student.avatarUrl ? (
                                            <img src={activity.student.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                                        ) : (
                                            activity.student.name?.charAt(0).toUpperCase() || "?"
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{activity.student.name || "Unknown"}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(activity.completedAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">{activity.type} Interview</p>
                                        <p className="text-sm text-gray-300 truncate">{activity.targetRole}</p>
                                    </div>
                                    {activity.score !== null && (
                                        <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreBg(activity.score)} ${getScoreColor(activity.score)}`}>
                                            {activity.score}%
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-500 text-sm">
                        No recent activity
                    </div>
                )}
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    icon: Icon,
    label,
    value,
    subtitle,
    color }: {
        icon: React.ElementType;
        label: string;
        value: string | number;
        subtitle?: string;
        color: "emerald" | "blue" | "purple" | "amber" | "teal" | "rose";
    }) {
    const colorClasses = {
        emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
        blue: "from-blue-500/20 to-blue-500/5 text-blue-400",
        purple: "from-indigo-500/20 to-indigo-500/5 text-indigo-400",
        amber: "from-amber-500/20 to-amber-500/5 text-amber-400",
        teal: "from-teal-500/20 to-teal-500/5 text-teal-400",
        rose: "from-rose-500/20 to-rose-500/5 text-rose-400"
    };

    const iconColors = {
        emerald: "text-emerald-400",
        blue: "text-blue-400",
        purple: "text-indigo-400",
        amber: "text-amber-400",
        teal: "text-teal-400",
        rose: "text-rose-400"
    };

    return (
        <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border border-white/5`}>
            <Icon className={`w-5 h-5 ${iconColors[color]} mb-2`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
    );
}



