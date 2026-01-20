"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users,
    TrendingUp,
    TrendingDown,
    Award,
    Activity,
    Target,
    AlertTriangle,
    Search,
    Filter,
    Grid3X3,
    List,
    Download,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Check,
    Clock,
    XCircle,
    MessageSquare
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface DashboardData {
    totalStudents: number;
    activeStudents: number;
    averageScore: number;
    totalInterviews: number;
    roleDistribution: { roleName: string; count: number }[];
    activityTrend: { date: string; count: number }[];
}

interface Student {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    targetJobRole?: { id: string; title: string };
    averageScore: number | null;
    interviewCount: number;
    lastActive: string;
    createdAt: string;
}

// Mock alerts data (would come from backend in production)
const mockAlerts = [
    { id: 1, name: "Marcus Johnson", issue: "Score drop >10%", type: "warning" },
    { id: 2, name: "Emily Zhao", issue: "Inactive 7d", type: "info" },
];

const jobRoleOptions = [
    "Software Engineer",
    "Product Manager",
    "Data Scientist",
    "UX Designer",
];

const skillBadgeOptions = ["Python", "React", "SQL", "Figma"];

export default function InstitutionDashboard() {
    const { accessToken } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [atsScoreRange, setAtsScoreRange] = useState([0, 100]);
    const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

    // Chart period
    const [chartPeriod, setChartPeriod] = useState<"7d" | "30d" | "90d">("30d");

    // Table view
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 5;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardRes, studentsRes] = await Promise.all([
                    fetch(`${API_URL}/admin/institution/dashboard`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }),
                    fetch(`${API_URL}/admin/institution/students?limit=50`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }),
                ]);

                if (!dashboardRes.ok || !studentsRes.ok) {
                    throw new Error("Failed to fetch data");
                }

                const dashboardData = await dashboardRes.json();
                const studentsData = await studentsRes.json();

                setData(dashboardData.data);
                setStudents(studentsData.data?.students || []);
            } catch (err) {
                console.error("Error fetching dashboard:", err);
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchData();
        }
    }, [accessToken]);

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const toggleBadge = (badge: string) => {
        setSelectedBadges(prev =>
            prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
        );
    };

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedRoles([]);
        setAtsScoreRange([0, 100]);
        setSelectedBadges([]);
    };

    // Filter students
    const filteredStudents = students.filter(student => {
        if (searchTerm && !student.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        if (selectedRoles.length > 0 && student.targetJobRole && !selectedRoles.includes(student.targetJobRole.title)) {
            return false;
        }
        if (student.averageScore !== null && (student.averageScore < atsScoreRange[0] || student.averageScore > atsScoreRange[1])) {
            return false;
        }
        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * studentsPerPage,
        currentPage * studentsPerPage
    );

    const getRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-gray-400";
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-amber-400";
        return "text-red-400";
    };

    const getScoreBgColor = (score: number | null) => {
        if (score === null) return "bg-gray-500/20";
        if (score >= 80) return "bg-emerald-500/20";
        if (score >= 60) return "bg-amber-500/20";
        return "bg-red-500/20";
    };

    if (loading) {
        return (
            <div className="text-white text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    const activePercentage = data?.totalStudents ? Math.round((data.activeStudents / data.totalStudents) * 100) : 0;

    return (
        <div className="flex gap-6">
            {/* Left Sidebar - Alerts & Filters */}
            <aside className="w-72 flex-shrink-0 space-y-6">
                {/* Alerts Section */}
                <div className="p-4 rounded-xl glass border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-white">ALERTS ({mockAlerts.length})</span>
                    </div>
                    <div className="space-y-3">
                        {mockAlerts.map(alert => (
                            <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                                    {alert.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{alert.name}</p>
                                    <p className={`text-xs ${alert.type === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>
                                        {alert.issue}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-3 text-xs text-emerald-400 hover:text-emerald-300">
                        View all 12 alerts
                    </button>
                </div>

                {/* Filters Section */}
                <div className="p-4 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-white">Filters</span>
                        <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-white">
                            Reset all
                        </button>
                    </div>

                    {/* Student Name Search */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-400 mb-1 block">Student Name</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="e.g. Alex Rivera"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Job Role Filter */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-400 mb-2 block">Job Role</label>
                        <div className="space-y-2">
                            {jobRoleOptions.map(role => (
                                <label key={role} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedRoles.includes(role)}
                                        onChange={() => toggleRole(role)}
                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-300">{role}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ATS Score Range */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-400 mb-2 block">ATS Readiness Score</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">0%</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={atsScoreRange[0]}
                                onChange={(e) => setAtsScoreRange([parseInt(e.target.value), atsScoreRange[1]])}
                                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <span className="text-xs text-gray-400">100%</span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-emerald-400">{atsScoreRange[0]}%+</span>
                        </div>
                    </div>

                    {/* Skill Badges */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-400 mb-2 block">Skill Badges</label>
                        <div className="flex flex-wrap gap-2">
                            {skillBadgeOptions.map(badge => (
                                <button
                                    key={badge}
                                    onClick={() => toggleBadge(badge)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${selectedBadges.includes(badge)
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {badge}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="w-full py-2.5 rounded-lg bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition">
                        Apply Filters
                    </button>

                    <button className="w-full mt-3 py-2.5 rounded-lg border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/5 transition flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Bulk Message ({filteredStudents.length})
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Students */}
                    <div className="p-5 rounded-xl glass border border-white/5">
                        <p className="text-xs text-gray-400 mb-1">Total Students</p>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-white">{data?.totalStudents?.toLocaleString() || 0}</p>
                            <div className="flex items-center gap-1 text-emerald-400 text-xs">
                                <TrendingUp className="w-3 h-3" />
                                <span>+4% vs last month</span>
                            </div>
                        </div>
                    </div>

                    {/* Active Users */}
                    <div className="p-5 rounded-xl glass border border-white/5">
                        <p className="text-xs text-gray-400 mb-1">Active Users (30d)</p>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-white">{data?.activeStudents?.toLocaleString() || 0}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-emerald-400">{activePercentage}% active</span>
                            </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activePercentage}%` }} />
                        </div>
                    </div>

                    {/* Avg Job Readiness */}
                    <div className="p-5 rounded-xl glass border border-white/5">
                        <p className="text-xs text-gray-400 mb-1">Avg. Job Readiness</p>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-white">
                                {data?.averageScore || 0}<span className="text-lg text-gray-400">/100</span>
                            </p>
                            <div className="flex items-center gap-1 text-emerald-400 text-xs">
                                <TrendingUp className="w-3 h-3" />
                                <span>+6 pts vs last 30d</span>
                            </div>
                        </div>
                    </div>

                    {/* App Success Rate */}
                    <div className="p-5 rounded-xl glass border border-white/5">
                        <p className="text-xs text-gray-400 mb-1">App. Success Rate</p>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-white">42%</p>
                            <div className="flex items-center gap-1 text-red-400 text-xs">
                                <TrendingDown className="w-3 h-3" />
                                <span>-1% since last week</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student Engagement Chart */}
                <div className="p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Student Engagement</h3>
                            <p className="text-xs text-gray-400">Login activity over the last {chartPeriod === '7d' ? '7' : chartPeriod === '30d' ? '30' : '90'} days</p>
                        </div>
                        <div className="flex gap-1 p-1 rounded-lg bg-white/5">
                            {(['7d', '30d', '90d'] as const).map(period => (
                                <button
                                    key={period}
                                    onClick={() => setChartPeriod(period)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${chartPeriod === period
                                            ? 'bg-emerald-500 text-white'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.activityTrend || []}>
                                <defs>
                                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={12}
                                />
                                <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    fill="url(#colorActivity)"
                                    name="Logins"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Student Directory */}
                <div className="p-6 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Student Directory</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1 p-1 rounded-lg bg-white/5">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded transition ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                            </div>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white text-sm transition">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 border-b border-white/5">
                                    <th className="pb-3 font-medium">STUDENT NAME</th>
                                    <th className="pb-3 font-medium">BADGES</th>
                                    <th className="pb-3 font-medium">ATS READINESS</th>
                                    <th className="pb-3 font-medium">ROLE</th>
                                    <th className="pb-3 font-medium">INTERVIEW STATUS</th>
                                    <th className="pb-3 font-medium">LAST LOGIN</th>
                                    <th className="pb-3 font-medium">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-white/5 transition">
                                        <td className="py-4">
                                            <Link href={`/institution-admin/students/${student.id}`} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium">
                                                    {student.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{student.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-400">{student.targetJobRole?.title || 'No role set'}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-1">
                                                <Award className="w-4 h-4 text-amber-400" />
                                                <span className="text-sm text-white">{student.interviewCount || 0}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-16 h-1.5 rounded-full overflow-hidden ${getScoreBgColor(student.averageScore)}`}>
                                                    <div
                                                        className={`h-full rounded-full ${student.averageScore !== null && student.averageScore >= 80 ? 'bg-emerald-500' : student.averageScore !== null && student.averageScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${student.averageScore || 0}%` }}
                                                    />
                                                </div>
                                                <span className={`text-sm font-medium ${getScoreColor(student.averageScore)}`}>
                                                    {student.averageScore !== null ? `${student.averageScore}%` : 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            {student.targetJobRole ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                                    {student.targetJobRole.title}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-500">Not set</span>
                                            )}
                                        </td>
                                        <td className="py-4">
                                            {student.interviewCount > 0 ? (
                                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                                                    <Check className="w-3 h-3" />
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4">
                                            <span className="text-sm text-gray-400">{getRelativeTime(student.lastActive)}</span>
                                        </td>
                                        <td className="py-4">
                                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                        <p className="text-sm text-gray-400">
                            Showing {((currentPage - 1) * studentsPerPage) + 1}-{Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
