'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trello, List, Clock, CheckCircle2, XCircle, MoreVertical,
    Calendar, Building2, Plus, Trash2, Edit3, Loader2,
    ExternalLink, MapPin, Zap, BarChart2, TrendingUp, Mail
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import AddApplicationDialog from '@/components/tracker/AddApplicationDialog';
import EmailTrackingCard from '@/components/email/EmailTrackingCard';

interface Application {
    id: string;
    job: { id: string; title: string; company: string; location: string; };
    status: 'SAVED' | 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
    appliedAt?: string;
    interviewDate?: string;
    notes?: string;
    updatedAt: string;
}
interface Stats {
    total: number; saved: number; applied: number;
    interviewing: number; offers: number; responseRate: number;
}

const COLUMNS = [
    { id: 'SAVED', label: 'Saved', dot: 'bg-gray-400', chip: 'bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/20', header: 'bg-gray-50 dark:bg-gray-500/5 border-gray-100 dark:border-gray-500/10' },
    { id: 'APPLIED', label: 'Applied', dot: 'bg-blue-400', chip: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20', header: 'bg-blue-50/50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/10' },
    { id: 'SCREENING', label: 'Screening', dot: 'bg-violet-400', chip: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20', header: 'bg-violet-50/50 dark:bg-violet-500/5 border-violet-100 dark:border-violet-500/10' },
    { id: 'INTERVIEWING', label: 'Interview', dot: 'bg-amber-400', chip: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', header: 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10' },
    { id: 'OFFER', label: 'Offer', dot: 'bg-emerald-400', chip: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', header: 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10' },
    { id: 'REJECTED', label: 'Rejected', dot: 'bg-rose-400', chip: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20', header: 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10' },
] as const;

const getCol = (id: string) => COLUMNS.find(c => c.id === id) ?? COLUMNS[0];

export default function ApplicationsPage() {
    const { user } = useAuthStore();
    const [applications, setApplications] = useState<Application[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'list'>('board');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const fetchApplications = useCallback(async () => {
        try {
            const r = await authFetch('/applications/applications');
            if (r.ok) setApplications((await r.json()).data || []);
        } catch { }
    }, [user]);

    const fetchStats = useCallback(async () => {
        try {
            const r = await authFetch('/applications/stats');
            if (r.ok) setStats((await r.json()).data);
        } catch { }
    }, [user]);

    useEffect(() => {
        if (user) Promise.all([fetchApplications(), fetchStats()]).finally(() => setLoading(false));
    }, [user, fetchApplications, fetchStats]);

    const searchParams = useSearchParams();
    const hasSynced = useRef(false);
    useEffect(() => {
        if (searchParams.get('email_connected') === 'true' && user && !hasSynced.current) {
            hasSynced.current = true;
            authFetch('/email/sync', { method: 'POST' }).then(() => { fetchApplications(); fetchStats(); }).catch(() => { });
        }
    }, [searchParams, user, fetchApplications, fetchStats]);

    const handleStatusChange = async (appId: string, newStatus: string) => {
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus as any } : a));
        try {
            await authFetch(`/applications/applications/${appId}/status`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchStats();
        } catch { fetchApplications(); }
    };

    const handleDelete = async (appId: string) => {
        if (!confirm('Delete this application?')) return;
        try {
            await authFetch(`/applications/applications/${appId}`, { method: 'DELETE' });
            setApplications(prev => prev.filter(a => a.id !== appId));
            fetchStats();
        } catch { }
    };

    const byStatus = (s: string) => applications.filter(a => a.status === s);

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden space-y-5">

            {/* ── Page Header ── */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm px-6 py-5 flex items-center justify-between gap-4 flex-shrink-0">
                <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-400/10 blur-3xl" />
                <div className="relative">
                    <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Job Tracker</p>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Applications</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your entire job search in one place</p>
                </div>
                <div className="relative flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                        {[{ icon: Trello, id: 'board' }, { icon: List, id: 'list' }].map(v => (
                            <button key={v.id} onClick={() => setView(v.id as any)}
                                className={`p-2 rounded-lg transition-all ${view === v.id ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}>
                                <v.icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-indigo-500/20">
                        <Plus className="w-4 h-4" />
                        Add Application
                    </button>
                </div>
            </div>

            <AddApplicationDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={() => { fetchApplications(); fetchStats(); }} />

            {/* ── Stats Row ── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
                    {[
                        { label: 'Total Applications', value: stats.total, color: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-50 dark:bg-indigo-500/10', icon: BarChart2, border: 'border-indigo-100 dark:border-indigo-500/20' },
                        { label: 'Interviews', value: stats.interviewing, color: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-500/10', icon: Calendar, border: 'border-amber-100 dark:border-amber-500/20' },
                        { label: 'Offers', value: stats.offers, color: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle2, border: 'border-emerald-100 dark:border-emerald-500/20' },
                        { label: 'Response Rate', value: `${stats.responseRate}%`, color: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-500/10', icon: TrendingUp, border: 'border-blue-100 dark:border-blue-500/20' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className={`w-10 h-10 rounded-xl ${s.iconBg} border ${s.border} flex items-center justify-center flex-shrink-0`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <div>
                                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Main Content ── */}
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-400">Loading applications...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 flex-1 min-h-0 overflow-hidden">
                    {/* Board / List */}
                    <div className="lg:col-span-3 flex flex-col min-h-0">
                        <AnimatePresence mode="wait">
                            {/* ── KANBAN BOARD ── */}
                            {view === 'board' && (
                                <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
                                    {COLUMNS.map(col => {
                                        const apps = byStatus(col.id);
                                        return (
                                            <div key={col.id} className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                                                {/* Column header */}
                                                <div className={`flex items-center justify-between px-4 py-3 border-b ${col.header}`}>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                                                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{col.label}</h3>
                                                        <span className="w-5 h-5 rounded-full bg-white dark:bg-white/10 text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center justify-center shadow-sm">
                                                            {apps.length}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Horizontal cards */}
                                                <div className="p-4 overflow-x-auto">
                                                    <div className="flex gap-3 min-w-min pb-1">
                                                        {apps.map(app => (
                                                            <div key={app.id} draggable
                                                                onDragStart={e => e.dataTransfer.setData('appId', app.id)}
                                                                className="group w-64 flex-shrink-0 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:shadow-[0_4px_16px_rgba(99,102,241,0.1)] cursor-grab active:cursor-grabbing transition-all duration-200 flex flex-col gap-2"
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{app.job.title}</h4>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                                            <Building2 className="w-3 h-3" />{app.job.company}
                                                                        </p>
                                                                    </div>
                                                                    <button onClick={() => setSelectedApp(app)}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-500 transition-all flex-shrink-0">
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-200 dark:border-white/5 mt-auto">
                                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(app.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                                    {app.job.location && <span className="flex items-center gap-1 truncate max-w-[80px]"><MapPin className="w-3 h-3 flex-shrink-0" />{app.job.location}</span>}
                                                                    {app.interviewDate && <span className="flex items-center gap-1 text-amber-500"><Calendar className="w-3 h-3" />{new Date(app.interviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {apps.length === 0 && (
                                                            <div className="flex-1 flex items-center justify-center py-8 text-sm text-gray-400 italic min-w-[200px]">
                                                                No applications here yet
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Drop zone */}
                                                    <div onDragOver={e => e.preventDefault()}
                                                        onDrop={e => { const id = e.dataTransfer.getData('appId'); if (id) handleStatusChange(id, col.id); }}
                                                        className="mt-3 h-9 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center text-xs text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:text-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all cursor-pointer">
                                                        Drop here → {col.label}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {/* ── LIST VIEW ── */}
                            {view === 'list' && (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex-1 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-gray-50 dark:bg-white/[0.04] border-b border-gray-100 dark:border-white/5">
                                            <tr>
                                                {['Role', 'Company', 'Status', 'Applied', 'Actions'].map(h => (
                                                    <th key={h} className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                            {applications.length === 0 ? (
                                                <tr><td colSpan={5} className="text-center py-16 text-sm text-gray-400">No applications yet</td></tr>
                                            ) : applications.map((app, i) => {
                                                const col = getCol(app.status);
                                                return (
                                                    <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                                        className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                                                        <td className="px-5 py-4 text-[15px] font-semibold text-gray-900 dark:text-white max-w-[180px] truncate">{app.job.title}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                            <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-gray-400" />{app.job.company}</div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold border ${col.chip}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                                                                {app.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => setSelectedApp(app)}
                                                                    className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-500 transition-colors">
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button onClick={() => handleDelete(app.id)}
                                                                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 transition-colors">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-1 space-y-4 overflow-y-auto">
                        <EmailTrackingCard />

                        <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-indigo-100 dark:border-indigo-500/20 shadow-sm p-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                How it works
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                We securely scan your Gmail for keywords like "Application Received" or "Interview Invitation". No email content is stored permanently — only relevant job metadata.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Modal ── */}
            <AnimatePresence>
                {selectedApp && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                            className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Modal header */}
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedApp.job.title}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Building2 className="w-3.5 h-3.5" />{selectedApp.job.company}
                                </p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Status</label>
                                    <select value={selectedApp.status}
                                        onChange={e => { handleStatusChange(selectedApp.id, e.target.value); setSelectedApp(prev => prev ? { ...prev, status: e.target.value as any } : null); }}
                                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm">
                                        {COLUMNS.map(col => (
                                            <option key={col.id} value={col.id} className="bg-white dark:bg-gray-900">{col.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Notes</label>
                                    <textarea
                                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-28 resize-none text-sm"
                                        placeholder="Add notes about your application..."
                                        defaultValue={selectedApp.notes}
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button onClick={() => setSelectedApp(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        Close
                                    </button>
                                    <a href={`/dashboard/jobs?id=${selectedApp.job.id}`}
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-1.5">
                                        <ExternalLink className="w-3.5 h-3.5" /> View Job
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
