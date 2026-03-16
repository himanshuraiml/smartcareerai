"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users, Shield, UserPlus, Search,
    MoreVertical, UserCheck, ShieldOff, AlertTriangle
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { toast } from "react-hot-toast";

interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function StaffRoles() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchEmail, setSearchEmail] = useState("");

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            // Reusing students list but looking for admins or high scores initially
            // In real app, would have a dedicated admins endpoint
            const res = await authFetch("/university/students?role=UNIVERSITY_ADMIN");
            if (res.ok) {
                const data = await res.json();
                setStaff(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch staff", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRole = async (email: string, newRole: string) => {
        try {
            const res = await authFetch("/university/roles/assign", {
                method: "POST",
                body: JSON.stringify({ email, role: newRole })
            });
            if (res.ok) {
                toast.success(`Role updated successfully for ${email}`);
                fetchStaff();
            } else {
                toast.error("Failed to update role");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Institutional Roles</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage portal access for other TPO staff and faculty members.</p>
                </div>
            </div>

            {/* Quick Assign */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border border-gray-200 dark:border-white/10 rounded-3xl p-6"
            >
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <UserPlus className="w-5 h-5 text-violet-500" />
                    Assign New Admin
                </h3>
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Enter colleague's institutional email address..."
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <button
                        onClick={() => handleAssignRole(searchEmail, "UNIVERSITY_ADMIN")}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-violet-500/25 transition disabled:opacity-50"
                        disabled={!searchEmail}
                    >
                        Grant Access
                    </button>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex gap-3 items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-500 leading-tight">
                        Admins can view all student data, manage placement drives, and broadcast messages.
                        Only grant access to verified staff members.
                    </p>
                </div>
            </motion.div>

            {/* Admins List */}
            <div className="rounded-3xl glass border border-gray-200 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-white/10">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-500" />
                        Active Staff & Admins
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-black/20 border-b border-gray-200 dark:border-white/10">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Staff Member</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Permissions</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {staff.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</p>
                                                <p className="text-xs text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                            <UserCheck className="w-3 h-3" />
                                            FULL PORTAL ACCESS
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleAssignRole(member.email, "USER")}
                                            className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                                            title="Revoke Admin Access"
                                        >
                                            <ShieldOff className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {staff.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 text-sm">
                                        {loading ? "Searching staff..." : "No additional admins found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
