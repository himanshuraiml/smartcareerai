"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    MoreVertical,
    Shield,
    Trash2,
    CheckCircle,
    XCircle,
    Mail,
    RefreshCw,
    Download,
    User as UserIcon
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface User {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN" | "RECRUITER" | "INSTITUTION_ADMIN";
    isVerified: boolean;
    createdAt: string;
}

export default function UserManagementPage() {
    const { user } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [institutionFilter, setInstitutionFilter] = useState("ALL");
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                ...(search && { search }),
                ...(roleFilter !== "ALL" && { role: roleFilter }),
                ...(institutionFilter !== "ALL" && { institution: institutionFilter })
            });

            const response = await authFetch(`/admin/users?${params}`);

            if (response.ok) {
                const data = await response.json();
                setUsers(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    }, [user, page, search, roleFilter, institutionFilter]);

    useEffect(() => {
        if (user) {
            // Fetch institutions
            const fetchInstitutions = async () => {
                try {
                    const response = await authFetch('/admin/institutions');
                    if (response.ok) {
                        const data = await response.json();
                        setInstitutions(data.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch institutions", error);
                }
            };
            fetchInstitutions();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                fetchUsers();
            }, 300); // Debounce search
            return () => clearTimeout(timer);
        }
    }, [fetchUsers, search, roleFilter, institutionFilter, user]); // Trigger on filter change

    const handleUpdateRole = async (userId: string, newRole: string) => {
        if (!confirm(`Are you sure you want to change user role to ${newRole}?`)) return;

        try {
            const response = await authFetch(`/admin/users/${userId}/role`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Failed to update role", error);
        }
    };

    const handleResetUser = async (userId: string) => {
        if (!confirm("Are you sure you want to RESET this user's progress? This will delete all resumes, test attempts, and interviews. This cannot be undone.")) return;

        try {
            const response = await authFetch(`/admin/users/${userId}/reset`, {
                method: "POST"
            });

            if (response.ok) {
                alert("User progress has been reset successfully.");
                fetchUsers();
            }
        } catch (error) {
            console.error("Failed to reset user", error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const response = await authFetch(`/admin/users/${userId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    };

    const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
        const action = currentStatus ? "unverify" : "verify";
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const response = await authFetch(`/admin/users/${userId}/verify`, {
                method: "PUT"
            });

            if (response.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Failed to toggle verification", error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-gray-400">Manage users, roles, and permissions</p>
                    <button
                        onClick={async () => {
                            try {
                                const params = new URLSearchParams({
                                    ...(search && { search }),
                                    ...(roleFilter !== "ALL" && { role: roleFilter }),
                                    ...(institutionFilter !== "ALL" && { institution: institutionFilter })
                                });

                                const response = await authFetch(`/admin/users/export?${params}`);
                                if (response.ok) {
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                } else {
                                    console.error('Export failed');
                                }
                            } catch (error) {
                                console.error('Export error', error);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" /> Export Users
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 [&>option]:bg-gray-900"
                >
                    <option value="ALL">All Roles</option>
                    <option value="USER">User</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="INSTITUTION_ADMIN">Institution Admin</option>
                    <option value="ADMIN">Admin</option>
                </select>

                <select
                    value={institutionFilter}
                    onChange={(e) => setInstitutionFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 [&>option]:bg-gray-900"
                >
                    <option value="ALL">All Institutions</option>
                    {institutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                            {inst.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Users Table */}
            <div className="glass rounded-xl overflow-hidden border border-white/5">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-sm">
                        <tr>
                            <th className="p-4 font-medium">User</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Joined</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">Loading users...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">No users found</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-medium">
                                                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.name || 'No Name'}</p>
                                                <p className="text-gray-400 text-sm">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                            className={`px-3 py-1 rounded text-xs font-bold border border-transparent focus:border-white/20 focus:outline-none cursor-pointer ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                                                user.role === 'INSTITUTION_ADMIN' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    user.role === 'RECRUITER' ? 'bg-indigo-500/20 text-indigo-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                } [&>option]:bg-gray-900 [&>option]:text-white`}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="RECRUITER">RECRUITER</option>
                                            <option value="INSTITUTION_ADMIN">INSTITUTION ADMIN</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggleVerification(user.id, user.isVerified)}
                                            className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg transition hover:bg-white/10 ${user.isVerified
                                                ? 'text-green-400 hover:text-green-300'
                                                : 'text-gray-400 hover:text-yellow-400'
                                                }`}
                                            title={user.isVerified ? "Click to unverify" : "Click to verify"}
                                        >
                                            {user.isVerified ? (
                                                <><CheckCircle className="w-4 h-4" /> Verified</>
                                            ) : (
                                                <><XCircle className="w-4 h-4" /> Unverified</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleResetUser(user.id)}
                                            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition"
                                            title="Reset User Progress"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-400">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}



