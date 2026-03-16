'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Calendar, ArrowLeft, Users, CheckCircle2, Circle, Clock, ChevronDown,
    Save, Loader2, AlertCircle, GraduationCap, Plus, Trash2, ChevronRight,
    Building2, X, Search, UserCheck
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { toast } from 'react-hot-toast';

interface DriveStage {
    name: string;
    order: number;
    description?: string;
    startDate?: string;
    endDate?: string;
}

interface Drive {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    minCGPA?: number;
    eligibleBranches?: string[];
    stages?: DriveStage[];
    _count?: { jobs: number; applications: number };
}

interface DriveInvite {
    id: string;
    invitedAt: string;
    recruiter: {
        id: string;
        companyName: string;
        companyLogo?: string;
        user: { name: string; email: string };
    };
}

interface RecruiterResult {
    id: string;
    companyName: string;
    companyLogo?: string;
    user: { name: string; email: string };
}

interface Partnership {
    id: string;
    companyName: string;
    partnershipTier?: string;
}

interface Registration {
    id: string;
    studentId: string;
    currentStage?: string | null;
    status: string;
    qrCode?: string | null;
    student: {
        id: string;
        name: string;
        email: string;
        cgpa?: number | null;
        branch?: string | null;
    };
}

const STATUS_COLORS: Record<string, string> = {
    UPCOMING: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    ONGOING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
};

export default function DriveDetailPage() {
    const params = useParams();
    const router = useRouter();
    const driveId = params.id as string;

    const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'stages' | 'recruiters'>('overview');
    const [drive, setDrive] = useState<Drive | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [regsLoading, setRegsLoading] = useState(false);

    // Stages editor state
    const [stages, setStages] = useState<DriveStage[]>([]);
    const [savingStages, setSavingStages] = useState(false);

    // Recruiters / invites state
    const [invites, setInvites] = useState<DriveInvite[]>([]);
    const [invitesLoading, setInvitesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<RecruiterResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [inviting, setInviting] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    // Bulk advance state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [targetStage, setTargetStage] = useState('');
    const [advancing, setAdvancing] = useState(false);

    const loadDrive = useCallback(async () => {
        try {
            const res = await authFetch(`/institution-admin/drives/${driveId}`);
            if (res.ok) {
                const { data } = await res.json();
                setDrive(data);
                setStages(Array.isArray(data.stages) ? data.stages : []);
            }
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, [driveId]);

    const loadRegistrations = useCallback(async () => {
        setRegsLoading(true);
        try {
            const res = await authFetch(`/institution-admin/drives/${driveId}/registrations`);
            if (res.ok) {
                const { data } = await res.json();
                setRegistrations(data || []);
            }
        } catch { /* silent */ } finally {
            setRegsLoading(false);
        }
    }, [driveId]);

    const loadInvites = useCallback(async () => {
        setInvitesLoading(true);
        try {
            const res = await authFetch(`/institution-admin/drives/${driveId}/invites`);
            if (res.ok) {
                const { data } = await res.json();
                setInvites(data || []);
            }
        } catch { /* silent */ } finally {
            setInvitesLoading(false);
        }
    }, [driveId]);

    const loadPartnerships = useCallback(async () => {
        try {
            const res = await authFetch('/institution-admin/partnerships');
            if (res.ok) {
                const { data } = await res.json();
                setPartnerships(data || []);
            }
        } catch { /* silent */ }
    }, []);

    const handleRecruiterSearch = useCallback(async (q: string) => {
        setSearchQuery(q);
        if (!q.trim()) { setSearchResults([]); return; }
        setSearchLoading(true);
        try {
            const res = await authFetch(`/institution-admin/recruiters/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const { data } = await res.json();
                setSearchResults(data || []);
            }
        } catch { /* silent */ } finally {
            setSearchLoading(false);
        }
    }, []);

    const handleInvite = async (recruiterId: string) => {
        setInviting(recruiterId);
        try {
            const res = await authFetch(`/institution-admin/drives/${driveId}/invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recruiterId }),
            });
            if (res.ok) {
                toast.success('Recruiter invited');
                setSearchQuery('');
                setSearchResults([]);
                loadInvites();
            } else {
                toast.error('Failed to invite recruiter');
            }
        } catch {
            toast.error('Error inviting recruiter');
        } finally {
            setInviting(null);
        }
    };

    const handleRemoveInvite = async (inviteId: string) => {
        setRemovingId(inviteId);
        try {
            const res = await authFetch(`/institution-admin/drives/${driveId}/invites/${inviteId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Invite removed');
                setInvites(prev => prev.filter(i => i.id !== inviteId));
            } else {
                toast.error('Failed to remove invite');
            }
        } catch {
            toast.error('Error removing invite');
        } finally {
            setRemovingId(null);
        }
    };

    useEffect(() => { loadDrive(); }, [loadDrive]);
    useEffect(() => {
        if (activeTab === 'registrations') loadRegistrations();
        if (activeTab === 'recruiters') { loadInvites(); loadPartnerships(); }
    }, [activeTab, loadRegistrations, loadInvites, loadPartnerships]);

    const saveStages = async () => {
        setSavingStages(true);
        try {
            const res = await authFetch(`/institution-admin/drives/${driveId}/stages`, {
                method: 'PUT',
                body: JSON.stringify({ stages }),
            });
            if (res.ok) {
                toast.success('Stages saved');
                loadDrive();
            } else {
                toast.error('Failed to save stages');
            }
        } catch {
            toast.error('Error saving stages');
        } finally {
            setSavingStages(false);
        }
    };

    const advanceStudents = async () => {
        if (!targetStage || selectedIds.size === 0) return;
        setAdvancing(true);
        try {
            const res = await authFetch(`/institution-admin/drives/${driveId}/advance`, {
                method: 'POST',
                body: JSON.stringify({ studentIds: Array.from(selectedIds), targetStage }),
            });
            if (res.ok) {
                toast.success(`${selectedIds.size} student(s) advanced to "${targetStage}"`);
                setSelectedIds(new Set());
                loadRegistrations();
            } else {
                toast.error('Failed to advance students');
            }
        } catch {
            toast.error('Error advancing students');
        } finally {
            setAdvancing(false);
        }
    };

    const addStage = () => {
        setStages(prev => [...prev, { name: '', order: prev.length + 1 }]);
    };

    const removeStage = (idx: number) => {
        setStages(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
    };

    const updateStage = (idx: number, field: keyof DriveStage, value: string | number) => {
        setStages(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    };

    const isEligible = (reg: Registration) => {
        if (!drive) return true;
        const cgpaOk = !drive.minCGPA || (reg.student.cgpa ?? 0) >= drive.minCGPA;
        const branchOk = !drive.eligibleBranches?.length ||
            drive.eligibleBranches.includes(reg.student.branch ?? '');
        return cgpaOk && branchOk;
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === registrations.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(registrations.map(r => r.studentId)));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!drive) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <p className="text-gray-500">Drive not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/institution-admin/drives')}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white truncate">{drive.name}</h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[drive.status] ?? ''}`}>
                            {drive.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {new Date(drive.startDate).toLocaleDateString()} – {new Date(drive.endDate).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
                {(['overview', 'registrations', 'stages', 'recruiters'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition ${activeTab === tab
                            ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ─── OVERVIEW TAB ─── */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Jobs', value: drive._count?.jobs ?? 0, icon: Calendar },
                            { label: 'Applications', value: drive._count?.applications ?? 0, icon: Users },
                            { label: 'Min CGPA', value: drive.minCGPA ?? '—', icon: GraduationCap },
                            { label: 'Stages', value: stages.length, icon: ChevronRight },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="glass rounded-2xl p-5 border border-gray-200 dark:border-white/5">
                                <div className="flex items-center gap-2 text-gray-500 mb-2">
                                    <Icon className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                                </div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    {drive.description && (
                        <div className="glass rounded-2xl p-6 border border-gray-200 dark:border-white/5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Description</h3>
                            <p className="text-sm text-gray-500">{drive.description}</p>
                        </div>
                    )}

                    {/* Stage timeline */}
                    {stages.length > 0 && (
                        <div className="glass rounded-2xl p-6 border border-gray-200 dark:border-white/5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-6">Stage Timeline</h3>
                            <div className="flex items-center gap-0 overflow-x-auto pb-2">
                                {stages.map((stage, idx) => (
                                    <div key={idx} className="flex items-center flex-shrink-0">
                                        <div className="flex flex-col items-center gap-2 px-4">
                                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                                                <span className="text-xs font-black text-emerald-600">{stage.order}</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center max-w-[80px]">{stage.name}</span>
                                            {stage.startDate && (
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(stage.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                        {idx < stages.length - 1 && (
                                            <div className="h-0.5 w-8 bg-emerald-200 dark:bg-emerald-500/30 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Eligibility */}
                    {(drive.eligibleBranches?.length || drive.minCGPA) && (
                        <div className="glass rounded-2xl p-6 border border-gray-200 dark:border-white/5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Eligibility Criteria</h3>
                            <div className="flex flex-wrap gap-3">
                                {drive.minCGPA && (
                                    <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                        Min CGPA: {drive.minCGPA}
                                    </span>
                                )}
                                {drive.eligibleBranches?.map(b => (
                                    <span key={b} className="px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold">
                                        {b}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── REGISTRATIONS TAB ─── */}
            {activeTab === 'registrations' && (
                <div className="space-y-4">
                    {/* Bulk advance controls */}
                    {selectedIds.size > 0 && stages.length > 0 && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                {selectedIds.size} selected
                            </span>
                            <div className="relative flex-1 max-w-xs">
                                <select
                                    value={targetStage}
                                    onChange={e => setTargetStage(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 rounded-xl text-sm border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-gray-900 appearance-none"
                                >
                                    <option value="">— Select stage —</option>
                                    {stages.map(s => (
                                        <option key={s.order} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <button
                                onClick={advanceStudents}
                                disabled={!targetStage || advancing}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 transition"
                            >
                                {advancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                Advance
                            </button>
                        </div>
                    )}

                    {regsLoading ? (
                        <div className="flex justify-center p-16">
                            <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="text-center py-16 glass rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No registrations yet</p>
                        </div>
                    ) : (
                        <div className="glass rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/2">
                                        <th className="p-4 text-left w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === registrations.length && registrations.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded"
                                            />
                                        </th>
                                        <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                        <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase tracking-wider">Email</th>
                                        <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase tracking-wider">Branch</th>
                                        <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase tracking-wider">CGPA</th>
                                        <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase tracking-wider">Stage</th>
                                        <th className="p-4 text-left font-bold text-gray-500 text-xs uppercase tracking-wider">Eligibility</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {registrations.map(reg => {
                                        const eligible = isEligible(reg);
                                        return (
                                            <tr
                                                key={reg.id}
                                                className={`hover:bg-gray-50 dark:hover:bg-white/2 transition ${selectedIds.has(reg.studentId) ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''}`}
                                            >
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(reg.studentId)}
                                                        onChange={() => toggleSelect(reg.studentId)}
                                                        className="rounded"
                                                    />
                                                </td>
                                                <td className="p-4 font-bold text-gray-900 dark:text-white">{reg.student.name}</td>
                                                <td className="p-4 text-gray-500">{reg.student.email}</td>
                                                <td className="p-4 text-gray-500">{reg.student.branch ?? '—'}</td>
                                                <td className="p-4">
                                                    <span className={`font-bold ${(reg.student.cgpa ?? 0) >= (drive.minCGPA ?? 0) ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        {reg.student.cgpa ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {reg.currentStage ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold">
                                                            {reg.currentStage}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Not started</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {eligible ? (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-rose-500">
                                                            <Circle className="w-3.5 h-3.5" /> Ineligible
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ─── RECRUITERS TAB ─── */}
            {activeTab === 'recruiters' && (
                <div className="space-y-6">
                    {/* Search & invite */}
                    <div className="glass rounded-3xl border border-gray-200 dark:border-white/5 p-6 space-y-4">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Invite Recruiter</h3>
                            <p className="text-xs text-gray-500">Search by company name, recruiter name, or email.</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => handleRecruiterSearch(e.target.value)}
                                placeholder="Search recruiters…"
                                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium"
                            />
                            {searchLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                        </div>
                        {searchResults.length > 0 && (
                            <div className="divide-y divide-gray-100 dark:divide-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                {searchResults.map(r => {
                                    const alreadyInvited = invites.some(i => i.recruiter.id === r.id);
                                    return (
                                        <div key={r.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/3 transition">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{r.companyName}</p>
                                                <p className="text-xs text-gray-500 truncate">{r.user.name} · {r.user.email}</p>
                                            </div>
                                            <button
                                                onClick={() => handleInvite(r.id)}
                                                disabled={alreadyInvited || inviting === r.id}
                                                className="ml-4 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50
                                                    bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-500"
                                            >
                                                {inviting === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : alreadyInvited ? <UserCheck className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                {alreadyInvited ? 'Invited' : 'Invite'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* From Partnerships */}
                        {partnerships.length > 0 && !searchQuery && (
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">From Your Partnerships</p>
                                <div className="flex flex-wrap gap-2">
                                    {partnerships.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleRecruiterSearch(p.companyName)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 transition"
                                        >
                                            <Building2 className="w-3 h-3" />
                                            {p.companyName}
                                            {p.partnershipTier && <span className="opacity-50">· {p.partnershipTier}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Invited recruiters list */}
                    <div className="glass rounded-3xl border border-gray-200 dark:border-white/5 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                            Invited Recruiters <span className="text-gray-400 font-normal">({invites.length})</span>
                        </h3>
                        {invitesLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                            </div>
                        ) : invites.length === 0 ? (
                            <div className="text-center py-10">
                                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">No recruiters invited yet. Use the search above to invite recruiters to this drive.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {invites.map(invite => (
                                    <div key={invite.id} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                                <Building2 className="w-4 h-4 text-violet-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{invite.recruiter.companyName}</p>
                                                <p className="text-xs text-gray-500 truncate">{invite.recruiter.user.name} · {invite.recruiter.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                            <span className="text-xs text-gray-400 hidden sm:block">
                                                {new Date(invite.invitedAt).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveInvite(invite.id)}
                                                disabled={removingId === invite.id}
                                                className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 transition disabled:opacity-50"
                                            >
                                                {removingId === invite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── STAGES TAB ─── */}
            {activeTab === 'stages' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Define the stages for this placement drive.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={addStage}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition"
                            >
                                <Plus className="w-4 h-4" /> Add Stage
                            </button>
                            <button
                                onClick={saveStages}
                                disabled={savingStages}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 transition"
                            >
                                {savingStages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Stages
                            </button>
                        </div>
                    </div>

                    {stages.length === 0 ? (
                        <div className="text-center py-16 glass rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No stages defined yet</p>
                            <button onClick={addStage} className="mt-4 text-sm text-emerald-600 font-bold hover:underline">
                                Add your first stage
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stages.map((stage, idx) => (
                                <div key={idx} className="glass rounded-2xl border border-gray-200 dark:border-white/5 p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-xs font-black text-emerald-600">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Stage Name *</label>
                                                <input
                                                    type="text"
                                                    value={stage.name}
                                                    onChange={e => updateStage(idx, 'name', e.target.value)}
                                                    placeholder="e.g. Resume Screening"
                                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                                                <input
                                                    type="text"
                                                    value={stage.description ?? ''}
                                                    onChange={e => updateStage(idx, 'description', e.target.value)}
                                                    placeholder="Optional description"
                                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</label>
                                                <input
                                                    type="date"
                                                    value={stage.startDate ?? ''}
                                                    onChange={e => updateStage(idx, 'startDate', e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
                                                <input
                                                    type="date"
                                                    value={stage.endDate ?? ''}
                                                    onChange={e => updateStage(idx, 'endDate', e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeStage(idx)}
                                            className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 transition flex-shrink-0 mt-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
