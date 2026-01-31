'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Building, Mail, ExternalLink, Loader2, X, Send, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface InstitutionAdmin {
    id: string;
    email: string;
    name: string | null;
    isVerified: boolean;
}

interface Institution {
    id: string;
    name: string;
    domain: string | null;
    logoUrl: string | null;
    admins?: InstitutionAdmin[];
    _count?: {
        students: number;
    };
}

export default function AdminInstitutionsPage() {
    const { accessToken } = useAuthStore();
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        adminEmail: '',
    });

    useEffect(() => {
        if (accessToken) {
            loadData();
        }
    }, [accessToken]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/institutions`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInstitutions(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/admin/institutions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (res.ok) {
                setShowAddModal(false);
                setFormData({ name: '', domain: '', adminEmail: '' });
                loadData();

                if (formData.adminEmail) {
                    if (result.inviteSent) {
                        showToast('success', `Institution created! Invite sent to ${formData.adminEmail}`);
                    } else {
                        showToast('error', 'Institution created but invite email failed. Check SMTP settings.');
                    }
                } else {
                    showToast('success', 'Institution created successfully');
                }
            } else {
                showToast('error', result.message || 'Failed to create institution');
            }
        } catch (err) {
            console.error('Failed to create', err);
            showToast('error', 'Failed to create institution');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendInvite = async (institutionId: string) => {
        setResending(institutionId);
        try {
            const res = await fetch(`${API_URL}/admin/institutions/${institutionId}/resend-invite`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            const result = await res.json();

            if (res.ok) {
                showToast('success', result.message || 'Invitation resent successfully');
                loadData();
            } else {
                showToast('error', result.message || 'Failed to resend invitation');
            }
        } catch (err) {
            console.error('Failed to resend invite', err);
            showToast('error', 'Failed to resend invitation');
        } finally {
            setResending(null);
        }
    };

    const filtered = institutions.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.domain?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Institutions</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    Add Institution
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search institutions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
                            }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={toast.type === 'success' ? 'text-green-300' : 'text-red-300'}>{toast.message}</span>
                        <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white ml-2">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((inst) => {
                        const admin = inst.admins?.[0];
                        return (
                            <motion.div
                                key={inst.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 rounded-xl glass border border-white/5 hover:border-purple-500/30 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Building className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-1 rounded text-xs font-medium bg-white/5 text-gray-400 flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {inst._count?.students || 0}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">{inst.name}</h3>
                                {inst.domain && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                                        <ExternalLink className="w-3 h-3" />
                                        {inst.domain}
                                    </div>
                                )}

                                {/* Admin Info */}
                                {admin && (
                                    <div className="pt-3 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-3.5 h-3.5 text-gray-500" />
                                                <span className="text-gray-400 truncate max-w-[150px]">{admin.email}</span>
                                            </div>
                                            {admin.isVerified ? (
                                                <span className="flex items-center gap-1 text-xs text-green-400">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleResendInvite(inst.id)}
                                                    disabled={resending === inst.id}
                                                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50"
                                                >
                                                    {resending === inst.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Send className="w-3 h-3" />
                                                    )}
                                                    Resend
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No institutions found.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg p-6 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Add Institution</h2>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Institution Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Domain (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.domain}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                        placeholder="e.g. stanford.edu"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Used for auto-verification of students with email domains</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        placeholder="admin@institution.edu"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Will be invited as Institution Admin</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 disabled:opacity-50"
                                    >
                                        {submitting ? 'Creating...' : 'Create Institution'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
