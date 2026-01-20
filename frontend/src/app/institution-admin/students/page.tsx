"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    User,
    Award,
    ExternalLink
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

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

export default function InstitutionStudentsPage() {
    const { accessToken } = useAuthStore();
    const [students, setStudents] = useState<Student[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [minScore, setMinScore] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "score" | "lastActive">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [showFilters, setShowFilters] = useState(false);

    // Job roles for filter dropdown
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);

    useEffect(() => {
        const fetchJobRoles = async () => {
            try {
                const response = await fetch(`${API_URL}/job-roles`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setJobRoles(data.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch job roles:", err);
            }
        };

        if (accessToken) {
            fetchJobRoles();
        }
    }, [accessToken]);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search) params.append("search", search);
                if (selectedRole) params.append("targetJobRoleId", selectedRole);
                if (minScore) params.append("minScore", minScore);
                params.append("sortBy", sortBy);
                params.append("sortOrder", sortOrder);
                params.append("page", String(pagination.page));
                params.append("limit", String(pagination.limit));

                const response = await fetch(`${API_URL}/admin/institution/students?${params}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch students");
                }

                const result = await response.json();
                setStudents(result.data);
                setPagination(result.pagination);
            } catch (err) {
                console.error("Error fetching students:", err);
                setError("Failed to load students");
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchStudents();
        }
    }, [accessToken, search, selectedRole, minScore, sortBy, sortOrder, pagination.page, pagination.limit]);

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-gray-400";
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-amber-400";
        return "text-red-400";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Students</h1>
                    <p className="text-gray-400 mt-1">Manage and monitor student progress</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search students..."
                            className="pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-64"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="p-4 rounded-xl glass border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Target Job Role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="">All Roles</option>
                            {jobRoles.map((role) => (
                                <option key={role.id} value={role.id}>{role.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Min. Score</label>
                        <input
                            type="number"
                            value={minScore}
                            onChange={(e) => setMinScore(e.target.value)}
                            placeholder="e.g., 70"
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "name" | "score" | "lastActive")}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="name">Name</option>
                            <option value="score">Score</option>
                            <option value="lastActive">Last Active</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Order</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Students Table */}
            <div className="rounded-xl glass border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
                    </div>
                ) : error ? (
                    <div className="p-16 text-center text-red-400">{error}</div>
                ) : students.length === 0 ? (
                    <div className="p-16 text-center text-gray-400">
                        No students found matching your criteria.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Student</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Target Role</th>
                                    <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">Avg. Score</th>
                                    <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">Interviews</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Last Active</th>
                                    <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                                    {student.avatarUrl ? (
                                                        <img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{student.name || "Unnamed"}</p>
                                                    <p className="text-sm text-gray-400">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-300">
                                                {student.targetJobRole?.title || "Not set"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-medium ${getScoreColor(student.averageScore)}`}>
                                                {student.averageScore !== null ? `${student.averageScore}%` : "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Award className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-300">{student.interviewCount}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-400">
                                                {new Date(student.lastActive).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Link
                                                href={`/institution-admin/students/${student.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
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
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                        <p className="text-sm text-gray-400">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-400">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
