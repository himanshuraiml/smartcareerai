// src/app/(main)/university/drives/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2, MapPin, Building, Users, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { authFetch } from '@/lib/auth-fetch';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Drive {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    _count: {
        jobs: number;
        applications: number;
    };
}

export default function PlacementDrivesPage() {
    const [drives, setDrives] = useState<Drive[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create form state
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newStart, setNewStart] = useState('');
    const [newEnd, setNewEnd] = useState('');

    useEffect(() => {
        loadDrives();
    }, []);

    const loadDrives = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/university/drives');
            if (res.ok) {
                const data = await res.json();
                setDrives(data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDrive = async () => {
        try {
            const res = await authFetch('/university/drives', {
                method: 'POST',
                body: JSON.stringify({
                    name: newName,
                    description: newDesc,
                    startDate: newStart,
                    endDate: newEnd,
                })
            });

            if (res.ok) {
                toast.success('Drive created successfully');
                setShowCreateModal(false);
                loadDrives();
            } else {
                toast.error('Failed to create drive');
            }
        } catch (err) {
            toast.error('Error creating drive');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'UPCOMING': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
            case 'ONGOING': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'COMPLETED': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Placement Drives</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage institutional hiring events and company visits.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition"
                >
                    <Plus className="w-5 h-5" />
                    New Drive
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                </div>
            ) : drives.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">No drives found</h3>
                    <p className="text-gray-500 mt-2">Create your first placement drive to start managing campus hiring.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drives.map((drive, idx) => (
                        <motion.div
                            key={drive.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden group hover:border-violet-500/30 transition-all shadow-sm hover:shadow-xl"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(drive.status)}`}>
                                        {drive.status}
                                    </span>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                                        <Clock className="w-3 h-3" />
                                        {new Date(drive.startDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 group-hover:text-violet-500 transition-colors">
                                    {drive.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 h-10">
                                    {drive.description || 'No description provided.'}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Building className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase">Jobs</span>
                                        </div>
                                        <p className="text-xl font-black text-gray-900 dark:text-white">{drive._count.jobs}</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase">Apps</span>
                                        </div>
                                        <p className="text-xl font-black text-gray-900 dark:text-white">{drive._count.applications}</p>
                                    </div>
                                </div>

                                <Link
                                    href={`/university/drives/${drive.id}`}
                                    className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm flex items-center justify-center gap-2 group/btn transition"
                                >
                                    Manage Drive
                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 border border-gray-100 dark:border-white/10 shadow-2xl"
                    >
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Create Placement Drive</h3>
                        <p className="text-sm text-gray-500 mb-8 font-medium">Set up a new hiring event for companies to participate.</p>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Drive Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Winter Placement Drive 2024"
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                                <textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    rows={3}
                                    placeholder="Details about the drive, eligibility, etc."
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={newStart}
                                        onChange={(e) => setNewStart(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">End Date</label>
                                    <input
                                        type="date"
                                        value={newEnd}
                                        onChange={(e) => setNewEnd(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 rounded-2xl border border-gray-200 dark:border-white/10 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateDrive}
                                    className="flex-1 py-4 rounded-2xl bg-violet-600 text-white font-bold shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition"
                                >
                                    Create Drive
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
