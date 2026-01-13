'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Trello, List, Clock, CheckCircle, XCircle, MoreVertical,
    Calendar, Building2, Plus, GripVertical, Trash2, Edit3,
    Loader2, DollarSign, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface Application {
    id: string;
    job: {
        id: string;
        title: string;
        company: string;
        location: string;
    };
    status: 'SAVED' | 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
    appliedAt?: string;
    interviewDate?: string;
    notes?: string;
    updatedAt: string;
}

interface Stats {
    total: number;
    saved: number;
    applied: number;
    interviewing: number;
    offers: number;
    responseRate: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const COLUMNS = [
    { id: 'SAVED', label: 'Saved', color: 'bg-gray-500/10 text-gray-400' },
    { id: 'APPLIED', label: 'Applied', color: 'bg-blue-500/10 text-blue-400' },
    { id: 'SCREENING', label: 'Screening', color: 'bg-purple-500/10 text-purple-400' },
    { id: 'INTERVIEWING', label: 'Interview', color: 'bg-yellow-500/10 text-yellow-400' },
    { id: 'OFFER', label: 'Offer', color: 'bg-green-500/10 text-green-400' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-red-500/10 text-red-400' },
];

export default function ApplicationsPage() {
    const { accessToken } = useAuthStore();
    const [applications, setApplications] = useState<Application[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'list'>('board');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    const fetchApplications = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/applications/applications`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setApplications(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch applications:', err);
        }
    }, [accessToken]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/applications/stats`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            setLoading(true);
            Promise.all([fetchApplications(), fetchStats()]).finally(() => setLoading(false));
        }
    }, [accessToken, fetchApplications, fetchStats]);

    const handleStatusChange = async (appId: string, newStatus: string) => {
        // Optimistic update
        setApplications(prev => prev.map(app =>
            app.id === appId ? { ...app, status: newStatus as any } : app
        ));

        try {
            await fetch(`${API_URL}/applications/applications/${appId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchStats(); // Refresh stats
        } catch (err) {
            console.error('Failed to update status:', err);
            fetchApplications(); // Revert on error
        }
    };

    const handleDelete = async (appId: string) => {
        if (!confirm('Are you sure you want to delete this application?')) return;

        try {
            await fetch(`${API_URL}/applications/applications/${appId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            setApplications(prev => prev.filter(app => app.id !== appId));
            fetchStats();
        } catch (err) {
            console.error('Failed to delete application:', err);
        }
    };

    const getAppsByStatus = (status: string) => {
        return applications.filter(app => app.status === status);
    };

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Applications</h1>
                    <p className="text-gray-400 mt-1">Track your job search progress</p>
                </div>
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setView('board')}
                        className={`p-2 rounded-md transition-colors ${view === 'board' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Trello className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="p-4 rounded-xl glass">
                        <p className="text-gray-400 text-sm mb-1">Total Applications</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="p-4 rounded-xl glass">
                        <p className="text-gray-400 text-sm mb-1">Interviews</p>
                        <p className="text-2xl font-bold text-yellow-400">{stats.interviewing}</p>
                    </div>
                    <div className="p-4 rounded-xl glass">
                        <p className="text-gray-400 text-sm mb-1">Offers</p>
                        <p className="text-2xl font-bold text-green-400">{stats.offers}</p>
                    </div>
                    <div className="p-4 rounded-xl glass">
                        <p className="text-gray-400 text-sm mb-1">Response Rate</p>
                        <p className="text-2xl font-bold text-blue-400">{stats.responseRate}%</p>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            {view === 'board' && (
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-3 md:gap-4 h-full pb-4" style={{ minWidth: 'max-content' }}>
                        {COLUMNS.map((column) => (
                            <div key={column.id} className="w-64 md:w-72 lg:w-80 flex-shrink-0 flex flex-col glass rounded-xl overflow-hidden">
                                <div className={`p-3 border-b border-white/5 flex items-center justify-between ${column.color}`}>
                                    <h3 className="font-semibold">{column.label}</h3>
                                    <span className="bg-black/20 px-2 py-0.5 rounded text-sm">
                                        {getAppsByStatus(column.id).length}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/20">
                                    {getAppsByStatus(column.id).map((app) => (
                                        <div
                                            key={app.id}
                                            draggable
                                            onDragStart={(e) => e.dataTransfer.setData('appId', app.id)}
                                            className="p-3 bg-gray-900 rounded-lg border border-white/5 hover:border-purple-500/50 cursor-grab active:cursor-grabbing group shadow-sm transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium text-white truncate pr-2">{app.job.title}</h4>
                                                <button
                                                    onClick={() => setSelectedApp(app)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-400 flex items-center gap-1 mb-2">
                                                <Building2 className="w-3 h-3" />
                                                {app.job.company}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-white/5">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(app.updatedAt).toLocaleDateString()}
                                                </span>
                                                {app.interviewDate && (
                                                    <span className="flex items-center gap-1 text-yellow-500">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(app.interviewDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Drop Zone */}
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        const appId = e.dataTransfer.getData('appId');
                                        if (appId) handleStatusChange(appId, column.id);
                                    }}
                                    className="h-10 border-t border-white/5 flex items-center justify-center text-gray-600 text-sm hover:bg-white/5 transition-colors"
                                >
                                    Drop here
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* List View */}
            {view === 'list' && (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-sm">
                            <tr>
                                <th className="p-4">Role</th>
                                <th className="p-4">Company</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Applied</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {applications.map((app) => (
                                <tr key={app.id} className="text-gray-300 hover:bg-white/5">
                                    <td className="p-4 font-medium text-white">{app.job.title}</td>
                                    <td className="p-4">{app.job.company}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${COLUMNS.find(c => c.id === app.status)?.color}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedApp(app)}
                                                className="p-1 hover:text-white transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(app.id)}
                                                className="p-1 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-[500px] bg-gray-900 border border-white/10 rounded-xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-4">Edit Application</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Status</label>
                                <select
                                    value={selectedApp.status}
                                    onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                                >
                                    {COLUMNS.map(col => (
                                        <option key={col.id} value={col.id} className="bg-gray-900">{col.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Notes</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none h-32 resize-none"
                                    placeholder="Add notes about your application..."
                                    defaultValue={selectedApp.notes}
                                    onBlur={(e) => {
                                        // Update notes API call
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                                >
                                    Close
                                </button>
                                <a
                                    href={`/dashboard/jobs?id=${selectedApp.job.id}`}
                                    className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                >
                                    View Job
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
