'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle,
    AlertCircle,
    Info,
    CheckCircle,
    RefreshCw,
    Trash2,
    Filter,
    Clock,
    Server,
    Activity,
    XCircle,
    ChevronDown,
    ChevronUp,
    Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/providers/ThemeProvider';
import { authFetch } from '@/lib/auth-fetch';

interface ErrorLog {
    id: string;
    timestamp: string;
    service: string;
    severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    code?: string;
    path?: string;
    method?: string;
    stack?: string;
    userId?: string;
    resolved: boolean;
}

interface ErrorStats {
    total24h: number;
    totalLastHour: number;
    unresolved: number;
    bySeverity: {
        CRITICAL: number;
        ERROR: number;
        WARNING: number;
        INFO: number;
    };
    byService: Record<string, number>;
    errorRate: number;
    services: string[];
    circuitBreakers: {
        name: string;
        state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
        failureCount: number;
        lastFailureTime: string | null;
    }[];
}

const SEVERITY_CONFIG = {
    CRITICAL: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    ERROR: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    WARNING: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
};

const CIRCUIT_STATE_CONFIG = {
    CLOSED: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Healthy' },
    OPEN: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Open (Failing)' },
    HALF_OPEN: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Testing' }
};

export default function ErrorMonitoringPage() {
    const { user } = useAuthStore();
    const { theme } = useTheme();
    const isLightMode = theme === 'light';

    // Card style for light mode - solid white background
    const cardStyle = isLightMode ? { backgroundColor: '#ffffff' } : { backgroundColor: '#1f2937' };

    const [stats, setStats] = useState<ErrorStats | null>(null);
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
    const [selectedService, setSelectedService] = useState<string>('all');
    const [showResolved, setShowResolved] = useState(false);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    const fetchStats = useCallback(async () => {
        try {
            const res = await authFetch('/admin/errors/stats');
            const data = await res.json();
            if (data.success) setStats(data.data);
        } catch (err) {
            console.error('Failed to fetch error stats:', err);
        }
    }, [API_BASE, user]);

    const fetchLogs = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                limit: '100',
                ...(selectedSeverity !== 'all' && { severity: selectedSeverity }),
                ...(selectedService !== 'all' && { service: selectedService }),
                ...(!showResolved && { resolved: 'false' })
            });

            const res = await authFetch(`/admin/errors/logs?${params}`);
            const data = await res.json();
            if (data.success) setLogs(data.data.logs);
        } catch (err) {
            console.error('Failed to fetch error logs:', err);
        }
    }, [API_BASE, user, selectedSeverity, selectedService, showResolved]);

    const resolveError = async (id: string) => {
        try {
            await authFetch(`/admin/errors/${id}/resolve`, {
                method: 'PUT'
            });
            fetchLogs();
            fetchStats();
        } catch (err) {
            console.error('Failed to resolve error:', err);
        }
    };

    const resolveSelected = async () => {
        if (selectedLogs.size === 0) return;
        try {
            await authFetch('/admin/errors/resolve-multiple', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: Array.from(selectedLogs) })
            });
            setSelectedLogs(new Set());
            fetchLogs();
            fetchStats();
        } catch (err) {
            console.error('Failed to resolve errors:', err);
        }
    };

    const clearResolved = async () => {
        if (!confirm('Are you sure you want to clear all resolved errors?')) return;
        try {
            await authFetch('/admin/errors/clear-resolved', {
                method: 'DELETE'
            });
            fetchLogs();
            fetchStats();
        } catch (err) {
            console.error('Failed to clear resolved:', err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchStats(), fetchLogs()]);
            setLoading(false);
        };
        loadData();
    }, [fetchStats, fetchLogs]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats();
            fetchLogs();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchStats, fetchLogs]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const toggleLogSelection = (id: string) => {
        const newSelection = new Set(selectedLogs);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedLogs(newSelection);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Error Monitoring</h1>
                    <p className="text-gray-600 dark:text-gray-400">Real-time error tracking and system health</p>
                </div>
                <button
                    onClick={() => { fetchStats(); fetchLogs(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" style={cardStyle}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Unresolved</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.unresolved || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" style={cardStyle}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <Clock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Last 24h</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total24h || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" style={cardStyle}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                            <Activity className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.errorRate || 0}/min</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" style={cardStyle}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10">
                            <Server className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Services</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.services?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Severity Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" style={cardStyle}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By Severity (24h)</h3>
                    <div className="space-y-3">
                        {Object.entries(stats?.bySeverity || {}).map(([severity, count]) => {
                            const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
                            const Icon = config?.icon || Info;
                            return (
                                <div key={severity} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${config?.color}`} />
                                        <span className="text-gray-700 dark:text-gray-300">{severity}</span>
                                    </div>
                                    <span className={`font-semibold ${config?.color}`}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Circuit Breakers */}
                <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" style={cardStyle}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Circuit Breakers
                    </h3>
                    {stats?.circuitBreakers && stats.circuitBreakers.length > 0 ? (
                        <div className="space-y-3">
                            {stats.circuitBreakers.map((cb) => {
                                const config = CIRCUIT_STATE_CONFIG[cb.state];
                                return (
                                    <div key={cb.name} className={`p-3 rounded-lg ${config.bg} border ${config.color.replace('text-', 'border-')}/30`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900 dark:text-white">{cb.name}</span>
                                            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            Failures: {cb.failureCount}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No circuit breakers registered</p>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" style={cardStyle}>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Filters:</span>
                </div>

                <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-gray-600"
                >
                    <option value="all">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="ERROR">Error</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                </select>

                <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-gray-600"
                >
                    <option value="all">All Services</option>
                    {stats?.services?.map((service) => (
                        <option key={service} value={service}>{service}</option>
                    ))}
                </select>

                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showResolved}
                        onChange={(e) => setShowResolved(e.target.checked)}
                        className="rounded"
                    />
                    Show resolved
                </label>

                <div className="flex-1" />

                {selectedLogs.size > 0 && (
                    <button
                        onClick={resolveSelected}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                    >
                        Resolve Selected ({selectedLogs.size})
                    </button>
                )}

                <button
                    onClick={clearResolved}
                    className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm transition"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear Resolved
                </button>
            </div>

            {/* Error Logs */}
            <div className="space-y-3">
                {logs.length === 0 ? (
                    <div className="p-12 text-center rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" style={cardStyle}>
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No errors found</h3>
                        <p className="text-gray-600 dark:text-gray-400">All systems are running smoothly</p>
                    </div>
                ) : (
                    logs.map((log) => {
                        const config = SEVERITY_CONFIG[log.severity];
                        const Icon = config.icon;
                        const isExpanded = expandedLog === log.id;

                        return (
                            <div
                                key={log.id}
                                className={`rounded-xl border ${log.resolved ? 'opacity-60' : ''} ${config.border} ${config.bg} overflow-hidden`}
                            >
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedLogs.has(log.id)}
                                            onChange={() => toggleLogSelection(log.id)}
                                            className="mt-1 rounded"
                                            disabled={log.resolved}
                                        />
                                        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                                                    {log.severity}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                    {log.service}
                                                </span>
                                                {log.code && (
                                                    <span className="text-xs text-gray-500">{log.code}</span>
                                                )}
                                                {log.resolved && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-600">
                                                        Resolved
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-gray-900 dark:text-white font-medium">{log.message}</p>
                                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                                                <span>{formatTime(log.timestamp)}</span>
                                                {log.path && <span>{log.method} {log.path}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!log.resolved && (
                                                <button
                                                    onClick={() => resolveError(log.id)}
                                                    className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20 rounded transition"
                                                    title="Mark as resolved"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {log.stack && (
                                                <button
                                                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                                    className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isExpanded && log.stack && (
                                    <div className="px-4 pb-4">
                                        <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-x-auto">
                                            {log.stack}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}



