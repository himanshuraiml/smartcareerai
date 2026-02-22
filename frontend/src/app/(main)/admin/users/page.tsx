"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Search, Shield, Trash2, CheckCircle, XCircle,
    RefreshCw, Download, Users, ChevronLeft, ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

interface User {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN" | "RECRUITER" | "INSTITUTION_ADMIN";
    isVerified: boolean;
    createdAt: string;
}

const ROLE_STYLES: Record<string, string> = {
    ADMIN: "bg-rose-500/15 text-rose-500 dark:text-rose-400",
    INSTITUTION_ADMIN: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    RECRUITER: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    USER: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

const AVATAR_GRADIENTS = [
    "from-indigo-500 to-violet-500",
    "from-emerald-500 to-teal-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-cyan-500 to-sky-500",
];

function getAvatarGradient(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
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
                page: page.toString(), limit: "10",
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
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user, page, search, roleFilter, institutionFilter]);

    useEffect(() => {
        if (!user) return;
        authFetch('/admin/institutions').then(async r => {
            if (r.ok) setInstitutions((await r.json()).data);
        });
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const t = setTimeout(() => fetchUsers(), 300);
        return () => clearTimeout(t);
    }, [fetchUsers, search, roleFilter, institutionFilter, user]);

    const handleUpdateRole = async (userId: string, newRole: string) => {
        if (!confirm(`Change role to ${newRole}?`)) return;
        const res = await authFetch(`/admin/users/${userId}/role`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole })
        });
        if (res.ok) fetchUsers();
    };

    const handleResetUser = async (userId: string) => {
        if (!confirm("Reset this user's progress? This will delete all resumes, attempts, and interviews. Cannot be undone.")) return;
        const res = await authFetch(`/admin/users/${userId}/reset`, { method: "POST" });
        if (res.ok) { alert("Reset successful."); fetchUsers(); }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Delete this user? Cannot be undone.")) return;
        const res = await authFetch(`/admin/users/${userId}`, { method: "DELETE" });
        if (res.ok) fetchUsers();
    };

    const handleToggleVerification = async (userId: string, current: boolean) => {
        if (!confirm(`${current ? "Unverify" : "Verify"} this user?`)) return;
        const res = await authFetch(`/admin/users/${userId}/verify`, { method: "PUT" });
        if (res.ok) fetchUsers();
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(search && { search }),
                ...(roleFilter !== "ALL" && { role: roleFilter }),
                ...(institutionFilter !== "ALL" && { institution: institutionFilter })
            });
            const res = await authFetch(`/admin/users/export?${params}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">User Management</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage users, roles, and permissions</p>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-opacity"
                >
                    <Download className="w-4 h-4" /> Export Users
                </button>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 }}
                className="flex flex-col md:flex-row gap-3"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all text-sm"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm [&>option]:bg-white dark:[&>option]:bg-gray-900"
                >
                    <option value="ALL">All Roles</option>
                    <option value="USER">User</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="INSTITUTION_ADMIN">Institution Admin</option>
                    <option value="ADMIN">Admin</option>
                </select>
                <select
                    value={institutionFilter}
                    onChange={(e) => { setInstitutionFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm [&>option]:bg-white dark:[&>option]:bg-gray-900"
                >
                    <option value="ALL">All Institutions</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 overflow-hidden"
            >
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-white/8">
                            {["User", "Role", "Status", "Joined", "Actions"].map((h, i) => (
                                <th key={h} className={`px-5 py-3.5 text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase ${i === 4 ? "text-right" : ""}`}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm">Loading users…</span>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center">
                                    <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">No users found</p>
                                </td>
                            </tr>
                        ) : (
                            users.map((u, idx) => (
                                <motion.tr
                                    key={u.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                                >
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(u.email)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                                {(u.name || u.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{u.name || "—"}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-none focus:ring-2 focus:ring-indigo-500/30 focus:outline-none cursor-pointer ${ROLE_STYLES[u.role]} [&>option]:bg-white dark:[&>option]:bg-gray-900 dark:[&>option]:text-white`}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="RECRUITER">RECRUITER</option>
                                            <option value="INSTITUTION_ADMIN">INST. ADMIN</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <button
                                            onClick={() => handleToggleVerification(u.id, u.isVerified)}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${u.isVerified
                                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                                : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 hover:bg-yellow-500/10 hover:text-yellow-600"
                                                }`}
                                        >
                                            {u.isVerified
                                                ? <><CheckCircle className="w-3.5 h-3.5" /> Verified</>
                                                : <><XCircle className="w-3.5 h-3.5" /> Unverified</>
                                            }
                                        </button>
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleResetUser(u.id)}
                                                title="Reset Progress"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                title="Delete User"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                        Page <span className="font-semibold text-gray-900 dark:text-white">{page}</span> of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
