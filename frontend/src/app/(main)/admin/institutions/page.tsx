'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Building, Mail, ExternalLink, Loader2, X, Send, CheckCircle, AlertCircle, Users, Key, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

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
    const { user } = useAuthStore();
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        adminEmail: '',
    });

    const [inviteEmail, setInviteEmail] = useState('');

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/admin/institutions');
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
            const res = await authFetch('/admin/institutions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                showToast('error', result.error?.message || result.message || 'Failed to create institution');
            }
        } catch (err) {
            console.error('Failed to create', err);
            showToast('error', 'Failed to create institution');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendInvite = async (institutionId: string, email: string) => {
        setResending(institutionId);
        try {
            const res = await authFetch(`/admin/institutions/${institutionId}/send-invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await res.json();

            if (res.ok) {
                showToast('success', result.message || 'Invitation sent successfully');
                setShowInviteModal(false);
                setInviteEmail('');
                loadData();
            } else {
                showToast('error', result.error?.message || result.message || 'Failed to send invitation');
            }
        } catch (err) {
            console.error('Failed to send invite', err);
            showToast('error', 'Failed to send invitation');
        } finally {
            setResending(null);
        }
    };

    const openInviteModal = (inst: Institution) => {
        setSelectedInstitution(inst);
        setInviteEmail(inst.admins?.[0]?.email || '');
        setShowInviteModal(true);
    };

    // Credentials Form State
    const [credentialsForm, setCredentialsForm] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSetCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInstitution) return;

        setSubmitting(true);
        try {
            const res = await authFetch(`/admin/institutions/${selectedInstitution.id}/set-credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentialsForm)
            });

            const result = await res.json();

            if (res.ok) {
                setShowCredentialsModal(false);
                setSelectedInstitution(null);
                setCredentialsForm({ email: '', password: '' });
                loadData();
                showToast('success', result.message || 'Credentials set successfully');
            } else {
                showToast('error', result.error?.message || result.message || 'Failed to set credentials');
            }
        } catch (err) {
            console.error('Failed to set credentials', err);
            showToast('error', 'Failed to set credentials');
        } finally {
            setSubmitting(false);
        }
    };

    const openCredentialsModal = (inst: Institution) => {
        setSelectedInstitution(inst);
        setCredentialsForm({
            email: inst.admins?.[0]?.email || '',
            password: ''
        });
        setShowCredentialsModal(true);
    };

    const filtered = institutions.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.domain?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institutions</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
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
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        <button onClick={() => setToast(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white ml-2">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
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
                                className="p-6 rounded-xl glass border border-gray-200 dark:border-white/5 hover:border-indigo-500/30 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Building className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-1 rounded text-xs font-medium bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {inst._count?.students || 0}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{inst.name}</h3>
                                {inst.domain && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        <ExternalLink className="w-3 h-3" />
                                        {inst.domain}
                                    </div>
                                )}

                                {/* Admin Info */}
                                <div className="pt-3 border-t border-gray-200 dark:border-white/5">
                                    {admin ? (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                                                    <span className="text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{admin.email}</span>
                                                </div>
                                                {admin.isVerified ? (
                                                    <span className="flex items-center gap-1 text-xs text-green-400">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-amber-400">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openInviteModal(inst)}
                                                    disabled={resending === inst.id}
                                                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                                                >
                                                    {resending === inst.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Send className="w-3 h-3" />
                                                    )}
                                                    {admin.isVerified ? 'Send Invite' : 'Resend Invite'}
                                                </button>
                                                <button
                                                    onClick={() => openCredentialsModal(inst)}
                                                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                                                >
                                                    <Key className="w-3 h-3" />
                                                    {admin.isVerified ? 'Reset Password' : 'Set Credentials'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openInviteModal(inst)}
                                                className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                                            >
                                                <Send className="w-4 h-4" />
                                                Send Invitation
                                            </button>
                                            <button
                                                onClick={() => openCredentialsModal(inst)}
                                                className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                                            >
                                                <Key className="w-4 h-4" />
                                                Set Credentials
                                            </button>
                                        </div>
                                    )}
                                </div>
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
                            className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Institution</h2>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Institution Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Domain (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.domain}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                        placeholder="e.g. stanford.edu"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Used for auto-verification of students with email domains</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Admin Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        placeholder="admin@institution.edu"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Will be invited as Institution Admin</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50"
                                    >
                                        {submitting ? 'Creating...' : 'Create Institution'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Send Invite Modal */}
            <AnimatePresence>
                {showInviteModal && selectedInstitution && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send Institution Admin Invite</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedInstitution.name}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setSelectedInstitution(null);
                                        setInviteEmail('');
                                    }}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <p className="text-sm text-indigo-300">
                                    <strong>Email Invitation:</strong> Send an invitation email with a secure link to set up their account.
                                    Make sure SMTP is configured in Settings.
                                </p>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (selectedInstitution) {
                                    handleSendInvite(selectedInstitution.id, inviteEmail);
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Admin Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="admin@institution.edu"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">The admin will receive an email with a link to set up their account</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowInviteModal(false);
                                            setSelectedInstitution(null);
                                            setInviteEmail('');
                                        }}
                                        className="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resending === selectedInstitution.id}
                                        className="px-6 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {resending === selectedInstitution.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send Invitation
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Set Credentials Modal */}
            <AnimatePresence>
                {showCredentialsModal && selectedInstitution && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Set Admin Credentials</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedInstitution.name}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCredentialsModal(false);
                                        setSelectedInstitution(null);
                                    }}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                <p className="text-sm text-violet-300">
                                    <strong>Direct Credentials:</strong> Use this when email invitations fail due to SMTP issues.
                                    The admin can login directly with these credentials.
                                </p>
                            </div>

                            <form onSubmit={handleSetCredentials} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Admin Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={credentialsForm.email}
                                        onChange={(e) => setCredentialsForm({ ...credentialsForm, email: e.target.value })}
                                        placeholder="admin@institution.edu"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            value={credentialsForm.password}
                                            onChange={(e) => setCredentialsForm({ ...credentialsForm, password: e.target.value })}
                                            placeholder="Min 8 characters"
                                            className="w-full px-4 py-2 pr-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Password must be at least 8 characters</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCredentialsModal(false);
                                            setSelectedInstitution(null);
                                        }}
                                        className="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-600 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Setting...
                                            </>
                                        ) : (
                                            <>
                                                <Key className="w-4 h-4" />
                                                Set Credentials
                                            </>
                                        )}
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


