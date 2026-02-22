"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    User,
    Award,
    ExternalLink,
    FileText,
    Target,
    BookOpen,
    X,
    SlidersHorizontal
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface Student {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    targetJobRole?: { id: string; title: string };
    interviewScore: number | null;
    atsScore: number | null;
    skillScore: number | null;
    combinedScore: number | null;
    interviewCount: number;
    testCount: number;
    badgeCount: number;
    lastActive: string;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface JobRole {
    id: string;
    title: string;
}

type ScoreType = "all" | "ats" | "skill" | "interview";
type SortBy = "name" | "score" | "atsScore" | "skillScore" | "interviewScore" | "lastActive";

export default function InstitutionStudentsPage() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();

    const [students, setStudents] = useState<Student[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [scoreType, setScoreType] = useState<ScoreType>("all");
    const [minAtsScore, setMinAtsScore] = useState("");
    const [minSkillScore, setMinSkillScore] = useState("");
    const [minInterviewScore, setMinInterviewScore] = useState("");
    const [minCombinedScore, setMinCombinedScore] = useState("");
    const [sortBy, setSortBy] = useState<SortBy>("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [showFilters, setShowFilters] = useState(false);

    // Job roles for filter dropdown
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);

    // Initialize from URL params
    useEffect(() => {
        const urlSortBy = searchParams.get("sortBy");
        const urlSortOrder = searchParams.get("sortOrder");
        if (urlSortBy) setSortBy(urlSortBy as SortBy);
        if (urlSortOrder) setSortOrder(urlSortOrder as "asc" | "desc");
    }, [searchParams]);

    useEffect(() => {
        const fetchJobRoles = async () => {
            try {
                const response = await authFetch(`/job-roles`);
                if (response.ok) {
                    const data = await response.json();
                    setJobRoles(data.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch job roles:", err);
            }
        };

        if (user) {
            fetchJobRoles();
        }
    }, [user]);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search) params.append("search", search);
                if (selectedRole) params.append("targetJobRoleId", selectedRole);
                if (scoreType !== "all") params.append("scoreType", scoreType);
                if (minAtsScore) params.append("minAtsScore", minAtsScore);
                if (minSkillScore) params.append("minSkillScore", minSkillScore);
                if (minInterviewScore) params.append("minInterviewScore", minInterviewScore);
                if (minCombinedScore) params.append("minScore", minCombinedScore);
                params.append("sortBy", sortBy);
                params.append("sortOrder", sortOrder);
                params.append("page", String(pagination.page));
                params.append("limit", String(pagination.limit));

                const response = await authFetch(`/admin/institution/students?${params}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch students");
                }

                const result = await response.json();
                setStudents(result.data || []);
                setPagination(result.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
            } catch (err) {
                console.error("Error fetching students:", err);
                setError("Failed to load students");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStudents();
        }
    }, [user, search, selectedRole, scoreType, minAtsScore, minSkillScore, minInterviewScore, minCombinedScore, sortBy, sortOrder, pagination.page, pagination.limit]);

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedRole("");
        setScoreType("all");
        setMinAtsScore("");
        setMinSkillScore("");
        setMinInterviewScore("");
        setMinCombinedScore("");
        setSortBy("name");
        setSortOrder("asc");
    };

    const hasActiveFilters = search || selectedRole || scoreType !== "all" || minAtsScore || minSkillScore || minInterviewScore || minCombinedScore;

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-gray-500";
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-amber-400";
        return "text-red-400";
    };

    const getScoreBg = (score: number | null) => {
        if (score === null) return "bg-gray-500/10";
        if (score >= 80) return "bg-emerald-500/10";
        if (score >= 60) return "bg-amber-500/10";
        return "bg-red-500/10";
    };

    const ScoreBadge = ({ score, label, icon: Icon }: { score: number | null; label: string; icon: React.ElementType }) => (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${getScoreBg(score)}`} title={label}>
            <Icon className={`w-3.5 h-3.5 ${getScoreColor(score)}`} />
            <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                {score !== null ? `${score}%` : "-"}
            </span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and monitor student progress</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search students..."
                            className="pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-64"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters || hasActiveFilters
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="p-5 rounded-xl glass border border-gray-200 dark:border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <Filter className="w-4 h-4 text-emerald-400" />
                            Filter Students
                        </h3>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                            >
                                <X className="w-3 h-3" />
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Score Type Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: "all", label: "All Scores" },
                            { value: "interview", label: "Interview Score" },
                            { value: "ats", label: "ATS Score" },
                            { value: "skill", label: "Skill Score" },
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setScoreType(tab.value as ScoreType)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${scoreType === tab.value
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Filter Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {/* Target Role */}
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Target Role</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="">All Roles</option>
                                {jobRoles.map((role) => (
                                    <option key={role.id} value={role.id}>{role.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Min Interview Score */}
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                Min Interview Score
                            </label>
                            <input
                                type="number"
                                value={minInterviewScore}
                                onChange={(e) => setMinInterviewScore(e.target.value)}
                                placeholder="0-100"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>

                        {/* Min ATS Score */}
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Min ATS Score
                            </label>
                            <input
                                type="number"
                                value={minAtsScore}
                                onChange={(e) => setMinAtsScore(e.target.value)}
                                placeholder="0-100"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>

                        {/* Min Skill Score */}
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                Min Skill Score
                            </label>
                            <input
                                type="number"
                                value={minSkillScore}
                                onChange={(e) => setMinSkillScore(e.target.value)}
                                placeholder="0-100"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortBy)}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="name">Name</option>
                                <option value="interviewScore">Interview Score</option>
                                <option value="atsScore">ATS Score</option>
                                <option value="skillScore">Skill Score</option>
                                <option value="lastActive">Last Active</option>
                            </select>
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Order</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Summary */}
            {!loading && !error && (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-500 dark:text-gray-400">
                        Found <span className="text-gray-900 dark:text-white font-medium">{pagination.total}</span> students
                        {hasActiveFilters && " matching your filters"}
                    </p>
                </div>
            )}

            {/* Students Table */}
            <div className="rounded-xl glass border border-gray-200 dark:border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
                    </div>
                ) : error ? (
                    <div className="p-16 text-center text-red-400">{error}</div>
                ) : students.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="text-gray-500 dark:text-gray-400 mb-2">No students found matching your criteria.</div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-emerald-400 hover:text-emerald-300 text-sm"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                    <th className="text-left px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Role</th>
                                    <th className="text-center px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            <Target className="w-3.5 h-3.5" />
                                            Interview
                                        </div>
                                    </th>
                                    <th className="text-center px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            <FileText className="w-3.5 h-3.5" />
                                            ATS
                                        </div>
                                    </th>
                                    <th className="text-center px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            Skill
                                        </div>
                                    </th>
                                    <th className="text-center px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            <Award className="w-3.5 h-3.5" />
                                            Badges
                                        </div>
                                    </th>
                                    <th className="text-left px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Active</th>
                                    <th className="text-center px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                                                    {student.avatarUrl ? (
                                                        <img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-white" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">{student.name || "Unnamed"}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-600 dark:text-gray-300 truncate block max-w-[150px]">
                                                {student.targetJobRole?.title || "Not set"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                                <ScoreBadge score={student.interviewScore} label="Interview Score" icon={Target} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                                <ScoreBadge score={student.atsScore} label="ATS Score" icon={FileText} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                                <ScoreBadge score={student.skillScore} label="Skill Score" icon={BookOpen} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <Award className={`w-4 h-4 ${student.badgeCount > 0 ? "text-amber-400" : "text-gray-500"}`} />
                                                <span className={`text-sm ${student.badgeCount > 0 ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                                                    {student.badgeCount}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(student.lastActive).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Link
                                                href={`/institution-admin/students/${student.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm"
                                            >
                                                View <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 rounded-lg bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



