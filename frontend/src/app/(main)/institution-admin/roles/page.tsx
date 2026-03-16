"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Users, UserPlus, Plus, X, Mail, Send,
    AlertTriangle, Building2, Trash2, Edit3, Lock,
    ShieldCheck, Activity, Clock, ChevronRight, CheckCircle2, XCircle,
    Copy, Check
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { toast } from "react-hot-toast";

// ==========================================
// TYPES
// ==========================================

interface Permission {
    id: string;
    name: string;
    description: string;
    category: string;
}

interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    isActive: boolean;
    rolePermissions: { permission: Permission }[];
    _count: { userRoles: number };
}

interface StaffMember {
    id: string;
    isActive: boolean;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
    role: { id: string; name: string };
    department: { id: string; name: string; code: string } | null;
}

interface Department {
    id: string;
    name: string;
    code: string;
    hodName: string | null;
    hodEmail: string | null;
    isActive: boolean;
    _count: { userRoles: number };
}

// ==========================================
// CATEGORY BADGE COLORS
// ==========================================

const CAT_COLORS: Record<string, string> = {
    jobs: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    students: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    drives: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    analytics: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    communication: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    settings: "bg-gray-500/15 text-gray-400 border-gray-500/20",
    operations: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    general: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function RolesAccessPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    // Invite form
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRoleId, setInviteRoleId] = useState("");
    const [inviteDeptId, setInviteDeptId] = useState("");
    const [inviting, setInviting] = useState(false);

    // Modals
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleName, setRoleName] = useState("");
    const [roleDesc, setRoleDesc] = useState("");
    const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

    // Department modal
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [deptName, setDeptName] = useState("");
    const [deptCode, setDeptCode] = useState("");
    const [deptHodName, setDeptHodName] = useState("");
    const [deptHodEmail, setDeptHodEmail] = useState("");

    // Expandable role cards
    const [expandedRole, setExpandedRole] = useState<string | null>(null);

    // ==========================================
    // DATA FETCHING
    // ==========================================

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes, staffRes, deptsRes] = await Promise.all([
                authFetch("/university/rbac/roles"),
                authFetch("/university/rbac/permissions"),
                authFetch("/university/rbac/staff"),
                authFetch("/university/rbac/departments"),
            ]);
            if (rolesRes.ok) { const d = await rolesRes.json(); setRoles(d.data || []); }
            if (permsRes.ok) { const d = await permsRes.json(); setPermissions(d.data || []); }
            if (staffRes.ok) { const d = await staffRes.json(); setStaff(d.data || []); }
            if (deptsRes.ok) { const d = await deptsRes.json(); setDepartments(d.data || []); }
        } catch (e) {
            console.error("Failed to fetch RBAC data", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ==========================================
    // ACTIONS
    // ==========================================

    const seedDefaults = async () => {
        setSeeding(true);
        try {
            const res = await authFetch("/university/rbac/seed-defaults", { method: "POST" });
            if (res.ok) { toast.success("Default roles & permissions seeded!"); fetchAll(); }
            else toast.error("Failed to seed defaults");
        } catch { toast.error("Error seeding defaults"); }
        finally { setSeeding(false); }
    };

    const handleInvite = async () => {
        if (!inviteEmail || !inviteRoleId) return;
        setInviting(true);
        try {
            const res = await authFetch("/university/rbac/staff/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userEmail: inviteEmail,
                    roleId: inviteRoleId,
                    departmentId: inviteDeptId || undefined,
                }),
            });
            if (res.ok) {
                toast.success(`Invitation sent to ${inviteEmail}!`);
                setInviteEmail("");
                setInviteRoleId("");
                setInviteDeptId("");
                fetchAll();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to assign role");
            }
        } catch { toast.error("Error sending invitation"); }
        finally { setInviting(false); }
    };

    const handleRevoke = async (assignmentId: string, email: string) => {
        if (!confirm(`Revoke access for ${email}?`)) return;
        try {
            const res = await authFetch(`/university/rbac/staff/${assignmentId}`, { method: "DELETE" });
            if (res.ok) { toast.success("Access revoked"); fetchAll(); }
            else toast.error("Failed to revoke");
        } catch { toast.error("Error revoking access"); }
    };

    const handleSaveRole = async () => {
        try {
            const url = editingRole ? `/university/rbac/roles/${editingRole.id}` : "/university/rbac/roles";
            const method = editingRole ? "PUT" : "POST";
            const res = await authFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: roleName, description: roleDesc, permissionIds: selectedPermIds }),
            });
            if (res.ok) {
                toast.success(editingRole ? "Role updated!" : "Role created!");
                closeRoleModal();
                fetchAll();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to save role");
            }
        } catch { toast.error("Error saving role"); }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (!confirm("Delete this role? Staff assigned to it will lose access.")) return;
        try {
            const res = await authFetch(`/university/rbac/roles/${roleId}`, { method: "DELETE" });
            if (res.ok) { toast.success("Role deleted"); fetchAll(); }
            else toast.error("Cannot delete system roles");
        } catch { toast.error("Error deleting role"); }
    };

    const openEditRole = (role: Role) => {
        setEditingRole(role);
        setRoleName(role.name);
        setRoleDesc(role.description || "");
        setSelectedPermIds(role.rolePermissions.map(rp => rp.permission.id));
        setShowRoleModal(true);
    };

    const closeRoleModal = () => {
        setShowRoleModal(false);
        setEditingRole(null);
        setRoleName("");
        setRoleDesc("");
        setSelectedPermIds([]);
    };

    const handleCreateDept = async () => {
        try {
            const res = await authFetch("/university/rbac/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: deptName,
                    code: deptCode,
                    hodName: deptHodName || undefined,
                    hodEmail: deptHodEmail || undefined,
                }),
            });
            if (res.ok) {
                toast.success("Department created!");
                setShowDeptModal(false);
                setDeptName(""); setDeptCode(""); setDeptHodName(""); setDeptHodEmail("");
                fetchAll();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to create department");
            }
        } catch { toast.error("Error creating department"); }
    };

    const handleDeleteDept = async (deptId: string, name: string) => {
        if (!confirm(`Delete department "${name}"?`)) return;
        try {
            const res = await authFetch(`/university/rbac/departments/${deptId}`, { method: "DELETE" });
            if (res.ok) { toast.success("Department deleted"); fetchAll(); }
            else toast.error("Failed to delete department");
        } catch { toast.error("Error deleting department"); }
    };

    const permsByCategory = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
        (acc[p.category] ??= []).push(p);
        return acc;
    }, {});

    const togglePerm = (id: string) => {
        setSelectedPermIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectedRole = roles.find(r => r.id === inviteRoleId);

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Page Header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Roles & Access Control</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">Invite staff, assign roles, and manage permissions for your placement cell.</p>
            </div>

            {/* ==========================================
                SECTION 1: INVITE STAFF (PRIMARY ACTION)
            ========================================== */}
            <section className="glass border border-gray-200 dark:border-white/[0.06] rounded-2xl p-6 bg-white dark:bg-[#0E1320]">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Invite Staff Member</h2>
                        <p className="text-xs text-gray-500">Enter email, select a role, and send an invitation to join the placement cell.</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Email */}
                    <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                type="email"
                                placeholder="colleague@university.edu"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div className="lg:w-56">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Role</label>
                        <select
                            value={inviteRoleId}
                            onChange={e => setInviteRoleId(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition appearance-none cursor-pointer"
                        >
                            <option value="">Select role...</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    {/* Department (optional) */}
                    <div className="lg:w-48">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Department <span className="text-gray-600">(optional)</span></label>
                        <select
                            value={inviteDeptId}
                            onChange={e => setInviteDeptId(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition appearance-none cursor-pointer"
                        >
                            <option value="">All Depts</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                        </select>
                    </div>

                    {/* Send button */}
                    <div className="lg:self-end">
                        <button
                            onClick={handleInvite}
                            disabled={!inviteEmail || !inviteRoleId || inviting}
                            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            {inviting ? "Sending..." : "Send Invite"}
                        </button>
                    </div>
                </div>

                {/* Role preview */}
                {selectedRole && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1.5">
                            {selectedRole.name} — {selectedRole.rolePermissions.length} permissions
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {selectedRole.rolePermissions.slice(0, 8).map(rp => (
                                <span key={rp.permission.id} className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                                    {rp.permission.name.replace(/_/g, " ")}
                                </span>
                            ))}
                            {selectedRole.rolePermissions.length > 8 && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500 font-medium">
                                    +{selectedRole.rolePermissions.length - 8} more
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </section>

            {/* ==========================================
                SECTION 2: CURRENT STAFF
            ========================================== */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Current Staff</h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500">{staff.length}</span>
                    </div>
                </div>

                {staff.length === 0 && !loading ? (
                    <div className="glass border border-gray-200 dark:border-white/[0.06] rounded-2xl p-12 text-center">
                        <Users className="w-10 h-10 mx-auto mb-3 text-gray-700 opacity-40" />
                        <p className="text-sm font-bold text-gray-500">No staff assigned yet</p>
                        <p className="text-xs text-gray-600 mt-1">Use the form above to invite your first team member.</p>
                    </div>
                ) : (
                    <div className="glass border border-gray-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Staff Member</th>
                                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Role</th>
                                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Department</th>
                                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</th>
                                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                                    {staff.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                                        {(s.user.name || s.user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{s.user.name || "—"}</p>
                                                        <p className="text-[11px] text-gray-500 truncate">{s.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    {s.role.name}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-400">
                                                {s.department ? (
                                                    <span className="inline-flex items-center gap-1 text-xs">
                                                        <Building2 className="w-3 h-3" />
                                                        {s.department.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-600">All Departments</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.isActive
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "bg-gray-500/10 text-gray-500"
                                                    }`}>
                                                    {s.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => handleRevoke(s.id, s.user.email)}
                                                    className="p-2 rounded-lg hover:bg-rose-500/10 transition group"
                                                    title="Revoke access"
                                                >
                                                    <XCircle className="w-4 h-4 text-gray-600 group-hover:text-rose-500 transition" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* ==========================================
                SECTION 3: ROLES
            ========================================== */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Roles</h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500">{roles.length}</span>
                    </div>
                    <div className="flex gap-2">
                        {roles.length === 0 && !loading && (
                            <button onClick={seedDefaults} disabled={seeding}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition disabled:opacity-40">
                                {seeding ? "Seeding..." : "🚀 Initialize Defaults"}
                            </button>
                        )}
                        <button onClick={() => { closeRoleModal(); setShowRoleModal(true); }}
                            className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white px-4 py-2 rounded-xl font-bold text-xs transition">
                            <Plus className="w-3.5 h-3.5" /> New Role
                        </button>
                    </div>
                </div>

                {roles.length === 0 && !loading ? (
                    <div className="glass border border-gray-200 dark:border-white/[0.06] rounded-2xl p-12 text-center">
                        <Shield className="w-10 h-10 mx-auto mb-3 text-gray-700 opacity-40" />
                        <p className="text-sm font-bold text-gray-500">No roles configured</p>
                        <p className="text-xs text-gray-600 mt-1">Click &quot;Initialize Defaults&quot; to set up the standard placement cell hierarchy.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roles.map(role => (
                            <div key={role.id} className="glass border border-gray-200 dark:border-white/[0.06] rounded-2xl overflow-hidden hover:border-emerald-500/20 transition group">
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer"
                                    onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <Shield className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{role.name}</p>
                                                {role.isSystem && (
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-black uppercase shrink-0">System</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500">
                                                {role.rolePermissions.length} permissions · {role._count.userRoles} member{role._count.userRoles !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={e => { e.stopPropagation(); openEditRole(role); }}
                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] transition">
                                            <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                                        </button>
                                        {!role.isSystem && (
                                            <button onClick={e => { e.stopPropagation(); handleDeleteRole(role.id); }}
                                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 transition">
                                                <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-rose-400" />
                                            </button>
                                        )}
                                        <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ml-1 ${expandedRole === role.id ? "rotate-90" : ""}`} />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedRole === role.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/[0.04] overflow-hidden"
                                        >
                                            <div className="p-4">
                                                {role.description && <p className="text-xs text-gray-500 mb-3">{role.description}</p>}
                                                <div className="flex flex-wrap gap-1">
                                                    {role.rolePermissions.map(rp => (
                                                        <span key={rp.permission.id}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${CAT_COLORS[rp.permission.category] || CAT_COLORS.general}`}>
                                                            <Lock className="w-2 h-2" />
                                                            {rp.permission.name.replace(/_/g, " ")}
                                                        </span>
                                                    ))}
                                                    {role.rolePermissions.length === 0 && (
                                                        <span className="text-xs text-gray-600">No permissions assigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ==========================================
                SECTION 4: DEPARTMENTS
            ========================================== */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Departments</h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500">{departments.length}</span>
                    </div>
                    <button onClick={() => setShowDeptModal(true)}
                        className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white px-4 py-2 rounded-xl font-bold text-xs transition">
                        <Plus className="w-3.5 h-3.5" /> Add Department
                    </button>
                </div>

                {departments.length === 0 && !loading ? (
                    <div className="glass border border-gray-200 dark:border-white/[0.06] rounded-2xl p-12 text-center">
                        <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-700 opacity-40" />
                        <p className="text-sm font-bold text-gray-500">No departments configured</p>
                        <p className="text-xs text-gray-600 mt-1">Add departments to organize staff and students.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {departments.map(dept => (
                            <div key={dept.id} className="glass border border-gray-200 dark:border-white/[0.06] rounded-2xl p-4 hover:border-emerald-500/20 transition group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                                            <Building2 className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{dept.name}</p>
                                            <p className="text-[10px] text-gray-500 font-mono">{dept.code}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDept(dept.id, dept.name)}
                                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-rose-400" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-gray-500">
                                    <span>{dept._count.userRoles} staff assigned</span>
                                    {dept.hodName && (
                                        <span className="truncate max-w-[140px]" title={dept.hodEmail || ""}>
                                            HOD: {dept.hodName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ==========================================
                ROLE CREATE / EDIT MODAL
            ========================================== */}
            <AnimatePresence>
                {showRoleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={closeRoleModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0E1320] rounded-2xl p-6 space-y-5 border border-gray-200 dark:border-white/[0.08] shadow-2xl"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {editingRole ? "Edit Role" : "Create New Role"}
                                </h3>
                                <button onClick={closeRoleModal} className="p-2 hover:bg-white/[0.06] rounded-lg transition">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Role Name</label>
                                    <input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g., Deputy TPO"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Description</label>
                                    <input value={roleDesc} onChange={e => setRoleDesc(e.target.value)} placeholder="Brief role description"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                        Permissions ({selectedPermIds.length} selected)
                                    </label>
                                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                                        {Object.entries(permsByCategory).map(([cat, perms]) => (
                                            <div key={cat}>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1.5">{cat}</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                                    {perms.map(p => (
                                                        <button key={p.id} onClick={() => togglePerm(p.id)}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${selectedPermIds.includes(p.id)
                                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/[0.12]"
                                                                }`}>
                                                            {selectedPermIds.includes(p.id)
                                                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                                : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-600 shrink-0" />
                                                            }
                                                            <span className="truncate">{p.name.replace(/_/g, " ")}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={closeRoleModal}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 dark:border-white/[0.08] hover:bg-white/[0.04] transition text-gray-400">
                                    Cancel
                                </button>
                                <button onClick={handleSaveRole} disabled={!roleName}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition disabled:opacity-40">
                                    {editingRole ? "Update" : "Create"} Role
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ==========================================
                DEPARTMENT CREATE MODAL
            ========================================== */}
            <AnimatePresence>
                {showDeptModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowDeptModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-md bg-white dark:bg-[#0E1320] rounded-2xl p-6 space-y-5 border border-gray-200 dark:border-white/[0.08] shadow-2xl"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Add Department</h3>
                                <button onClick={() => setShowDeptModal(false)} className="p-2 hover:bg-white/[0.06] rounded-lg transition">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Department Name</label>
                                    <input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g., Computer Science & Engineering"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Code</label>
                                    <input value={deptCode} onChange={e => setDeptCode(e.target.value.toUpperCase())} placeholder="e.g., CSE"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition font-mono uppercase" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">HOD Name <span className="text-gray-600">(optional)</span></label>
                                    <input value={deptHodName} onChange={e => setDeptHodName(e.target.value)} placeholder="Dr. Sharma"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">HOD Email <span className="text-gray-600">(optional)</span></label>
                                    <input value={deptHodEmail} onChange={e => setDeptHodEmail(e.target.value)} placeholder="hod@university.edu" type="email"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowDeptModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 dark:border-white/[0.08] hover:bg-white/[0.04] transition text-gray-400">
                                    Cancel
                                </button>
                                <button onClick={handleCreateDept} disabled={!deptName || !deptCode}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition disabled:opacity-40">
                                    Create Department
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
