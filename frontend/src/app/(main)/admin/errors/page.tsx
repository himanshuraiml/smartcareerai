'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw,
    Trash2, Filter, Clock, Server, Activity, XCircle,
    ChevronDown, ChevronUp, Zap, ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

interface ErrorLog {
    id: string; timestamp: string; service: string;
    severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
    message: string; code?: string; path?: string; method?: string;
    stack?: string; userId?: string; resolved: boolean;
}
interface ErrorStats {
    total24h: number; totalLastHour: number; unresolved: number;
    bySeverity: { CRITICAL: number; ERROR: number; WARNING: number; INFO: number };
    byService: Record<string, number>; errorRate: number; services: string[];
    circuitBreakers: { name: string; state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'; failureCount: number; lastFailureTime: string | null }[];
}

const SEV = {
    CRITICAL: { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/15 dark:bg-rose-500/20', border: 'border-rose-500/30', label: 'CRITICAL' },
    ERROR: { icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/15 dark:bg-orange-500/20', border: 'border-orange-500/30', label: 'ERROR' },
    WARNING: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15 dark:bg-amber-500/20', border: 'border-amber-500/30', label: 'WARNING' },
    INFO: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/15 dark:bg-blue-500/20', border: 'border-blue-500/30', label: 'INFO' },
} as const;

const CB_STATE = {
    CLOSED: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15 dark:bg-emerald-500/20', border: 'border-emerald-500/30', label: 'Healthy' },
    OPEN: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/15 dark:bg-rose-500/20', border: 'border-rose-500/30', label: 'Open (Failing)' },
    HALF_OPEN: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15 dark:bg-amber-500/20', border: 'border-amber-500/30', label: 'Testing' },
} as const;

function formatTime(ts: string) {
    return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ErrorMonitoringPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<ErrorStats | null>(null);
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeverity, setSelectedSeverity] = useState('all');
    const [selectedService, setSelectedService] = useState('all');
    const [showResolved, setShowResolved] = useState(false);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());

    const fetchStats = useCallback(async () => {
        try { const r = await authFetch('/admin/errors/stats'); const d = await r.json(); if (d.success) setStats(d.data); }
        catch (e) { console.error(e); }
    }, [user]);

    const fetchLogs = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                limit: '100',
                ...(selectedSeverity !== 'all' && { severity: selectedSeverity }),
                ...(selectedService !== 'all' && { service: selectedService }),
                ...(!showResolved && { resolved: 'false' }),
            });
            const r = await authFetch(`/admin/errors/logs?${params}`);
            const d = await r.json();
            if (d.success) setLogs(d.data.logs);
        } catch (e) { console.error(e); }
    }, [user, selectedSeverity, selectedService, showResolved]);

    useEffect(() => {
        const load = async () => { setLoading(true); await Promise.all([fetchStats(), fetchLogs()]); setLoading(false); };
        load();
    }, [fetchStats, fetchLogs]);

    useEffect(() => {
        const t = setInterval(() => { fetchStats(); fetchLogs(); }, 30000);
        return () => clearInterval(t);
    }, [fetchStats, fetchLogs]);

    const resolveError = async (id: string) => {
        await authFetch(`/admin/errors/${id}/resolve`, { method: 'PUT' });
        fetchLogs(); fetchStats();
    };

    const resolveSelected = async () => {
        if (!selectedLogs.size) return;
        await authFetch('/admin/errors/resolve-multiple', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedLogs) }),
        });
        setSelectedLogs(new Set()); fetchLogs(); fetchStats();
    };

    const clearResolved = async () => {
        if (!confirm('Clear all resolved errors?')) return;
        await authFetch('/admin/errors/clear-resolved', { method: 'DELETE' });
        fetchLogs(); fetchStats();
    };

    const toggleSelect = (id: string) => {
        const s = new Set(selectedLogs);
        s.has(id) ? s.delete(id) : s.add(id);
        setSelectedLogs(s);
    };

    const statCards = [
        { label: 'Unresolved', value: stats?.unresolved ?? 0, icon: <ShieldAlert className="w-4 h-4 text-rose-400" />, bg: 'bg-rose-500/15', valColor: 'text-rose-500' },
        { label: 'Last 24 h', value: stats?.total24h ?? 0, icon: <Clock className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-500/15' },
        { label: 'Error Rate', value: `${stats?.errorRate ?? 0}/min`, icon: <Activity className="w-4 h-4 text-indigo-400" />, bg: 'bg-indigo-500/15' },
        { label: 'Services', value: stats?.services?.length ?? 0, icon: <Server className="w-4 h-4 text-violet-400" />, bg: 'bg-violet-500/15' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading error data…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
                        <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Error Monitoring</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Real-time error tracking and system health</p>
                    </div>
                </div>
                <button onClick={() => { fetchStats(); fetchLogs(); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-5"
                    >
                        <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
                        <p className={`text-2xl font-black ${(s as any).valColor ?? 'text-gray-900 dark:text-white'}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Severity + Circuit Breakers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-6"
                >
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">By Severity (24 h)</h3>
                    <div className="space-y-3">
                        {Object.entries(stats?.bySeverity ?? {}).map(([sev, count]) => {
                            const cfg = SEV[sev as keyof typeof SEV];
                            const Icon = cfg?.icon ?? Info;
                            const total = Object.values(stats?.bySeverity ?? {}).reduce((a, b) => a + b, 0) || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                                <div key={sev}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`w-4 h-4 ${cfg?.color}`} />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{sev}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${cfg?.color}`}>{count}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${cfg?.bg}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                    className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-6"
                >
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Circuit Breakers
                    </h3>
                    {stats?.circuitBreakers?.length ? (
                        <div className="space-y-2.5">
                            {stats.circuitBreakers.map(cb => {
                                const cfg = CB_STATE[cb.state];
                                return (
                                    <div key={cb.name} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{cb.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Failures: {cb.failureCount}</p>
                                        </div>
                                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No circuit breakers registered</p>
                    )}
                </motion.div>
            </div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50 p-4"
            >
                <Filter className="w-4 h-4 text-gray-400" />
                <select value={selectedSeverity} onChange={e => setSelectedSeverity(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 [&>option]:bg-white dark:[&>option]:bg-gray-900"
                >
                    <option value="all">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="ERROR">Error</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                </select>
                <select value={selectedService} onChange={e => setSelectedService(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 [&>option]:bg-white dark:[&>option]:bg-gray-900"
                >
                    <option value="all">All Services</option>
                    {stats?.services?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                    <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} className="rounded accent-indigo-600" />
                    Show resolved
                </label>
                <div className="flex-1" />
                {selectedLogs.size > 0 && (
                    <button onClick={resolveSelected}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                    >
                        Resolve selected ({selectedLogs.size})
                    </button>
                )}
                <button onClick={clearResolved}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-sm font-medium transition-colors"
                >
                    <Trash2 className="w-4 h-4" /> Clear Resolved
                </button>
            </motion.div>

            {/* Log entries */}
            <div className="space-y-3">
                {logs.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16 rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-800/50"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                            <CheckCircle className="w-7 h-7 text-emerald-500" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">No errors found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All systems running smoothly</p>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        {logs.map((log, idx) => {
                            const cfg = SEV[log.severity];
                            const Icon = cfg.icon;
                            const expanded = expandedLog === log.id;
                            return (
                                <motion.div key={log.id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden ${log.resolved ? 'opacity-55' : ''}`}
                                >
                                    <div className="p-4 flex items-start gap-3">
                                        <input type="checkbox"
                                            checked={selectedLogs.has(log.id)}
                                            onChange={() => toggleSelect(log.id)}
                                            disabled={log.resolved}
                                            className="mt-1 rounded accent-indigo-600 flex-shrink-0"
                                        />
                                        <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>{log.severity}</span>
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400">{log.service}</span>
                                                {log.code && <span className="text-xs text-gray-400 font-mono">{log.code}</span>}
                                                {log.resolved && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Resolved</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.message}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>{formatTime(log.timestamp)}</span>
                                                {log.path && <span>{log.method} {log.path}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {!log.resolved && (
                                                <button onClick={() => resolveError(log.id)} title="Mark resolved"
                                                    className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {log.stack && (
                                                <button onClick={() => setExpandedLog(expanded ? null : log.id)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {expanded && log.stack && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 pl-16">
                                                    <pre className="p-3 rounded-xl bg-gray-950 text-gray-200 text-xs overflow-x-auto leading-relaxed">{log.stack}</pre>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
