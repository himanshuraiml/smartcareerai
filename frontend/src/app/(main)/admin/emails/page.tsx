'use client';

import { useState, useEffect } from 'react';
import {
    Mail,
    Send,
    Search,
    Filter,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    Plus,
    FileText,
    Users,
    Building,
    Briefcase,
    Clock,
    RefreshCw,
    Eye,
    Trash2,
    Edit3,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

type Tab = 'logs' | 'invites' | 'templates' | 'compose';

interface EmailLog {
    id: string;
    recipientEmail: string;
    subject: string;
    emailType: string;
    status: string;
    errorMessage?: string;
    metadata?: any;
    sentAt?: string;
    createdAt: string;
    template?: {
        name: string;
        category: string;
    };
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    category: string;
    variables: string[];
    isActive: boolean;
    createdAt: string;
}

interface InviteLog {
    id: string;
    recipientEmail: string;
    subject: string;
    status: string;
    createdAt: string;
    isAccepted: boolean;
    user?: {
        name: string;
        isVerified: boolean;
        adminForInstitution?: {
            name: string;
        };
    };
}

interface EmailStats {
    totalSent: number;
    totalFailed: number;
    byType: Array<{ type: string; count: number }>;
    recentActivity: EmailLog[];
}

export default function AdminEmailsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<Tab>('logs');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Email Logs State
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [logsPage, setLogsPage] = useState(1);
    const [logsTotalPages, setLogsTotalPages] = useState(1);
    const [logsSearch, setLogsSearch] = useState('');
    const [logsFilter, setLogsFilter] = useState({ emailType: '', status: '' });

    // Invites State
    const [invites, setInvites] = useState<InviteLog[]>([]);

    // Templates State
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        subject: '',
        htmlContent: '',
        textContent: '',
        category: 'GENERAL',
        variables: ''
    });

    // Compose State
    const [composeForm, setComposeForm] = useState({
        recipientType: 'all_students',
        subject: '',
        content: '',
        templateId: ''
    });
    const [sending, setSending] = useState(false);

    // Stats State
    const [stats, setStats] = useState<EmailStats | null>(null);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, activeTab, logsPage, logsFilter]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'logs') {
                await loadLogs();
                await loadStats();
            } else if (activeTab === 'invites') {
                await loadInvites();
            } else if (activeTab === 'templates') {
                await loadTemplates();
            } else if (activeTab === 'compose') {
                await loadTemplates();
            }
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        const params = new URLSearchParams({
            page: logsPage.toString(),
            limit: '20',
            ...(logsFilter.emailType && { emailType: logsFilter.emailType }),
            ...(logsFilter.status && { status: logsFilter.status }),
            ...(logsSearch && { search: logsSearch })
        });

        const res = await authFetch(`/admin/emails/logs?${params}`);
        if (res.ok) {
            const data = await res.json();
            setLogs(data.data || []);
            setLogsTotalPages(data.pagination?.totalPages || 1);
        }
    };

    const loadStats = async () => {
        const res = await authFetch('/admin/emails/stats');
        if (res.ok) {
            const data = await res.json();
            setStats(data.data);
        }
    };

    const loadInvites = async () => {
        const res = await authFetch('/admin/emails/invites');
        if (res.ok) {
            const data = await res.json();
            setInvites(data.data || []);
        }
    };

    const loadTemplates = async () => {
        const res = await authFetch('/admin/emails/templates');
        if (res.ok) {
            const data = await res.json();
            setTemplates(data.data || []);
        }
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const variables = templateForm.variables
                .split(',')
                .map(v => v.trim())
                .filter(v => v);

            const body = {
                ...templateForm,
                variables
            };

            const url = editingTemplate
                ? `/admin/emails/templates/${editingTemplate.id}`
                : '/admin/emails/templates';

            const res = await authFetch(url, {
                method: editingTemplate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast('success', editingTemplate ? 'Template updated' : 'Template created');
                setShowTemplateModal(false);
                setEditingTemplate(null);
                setTemplateForm({
                    name: '',
                    subject: '',
                    htmlContent: '',
                    textContent: '',
                    category: 'GENERAL',
                    variables: ''
                });
                loadTemplates();
            } else {
                const data = await res.json();
                showToast('error', data.message || 'Failed to save template');
            }
        } catch (err) {
            showToast('error', 'Failed to save template');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const res = await authFetch(`/admin/emails/templates/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                showToast('success', 'Template deleted');
                loadTemplates();
            } else {
                showToast('error', 'Failed to delete template');
            }
        } catch (err) {
            showToast('error', 'Failed to delete template');
        }
    };

    const handleSendBulkEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            const res = await authFetch('/admin/emails/send-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(composeForm)
            });

            const data = await res.json();

            if (res.ok) {
                showToast('success', data.message || 'Emails sent successfully');
                setComposeForm({
                    recipientType: 'all_students',
                    subject: '',
                    content: '',
                    templateId: ''
                });
            } else {
                showToast('error', data.message || 'Failed to send emails');
            }
        } catch (err) {
            showToast('error', 'Failed to send emails');
        } finally {
            setSending(false);
        }
    };

    const handleSendTestEmail = async () => {
        const email = prompt('Enter test email address:');
        if (!email) return;

        try {
            const res = await authFetch('/admin/emails/send-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    emailType: 'newsletter',
                    subject: composeForm.subject || 'Test Email',
                    content: composeForm.content || 'This is a test email.'
                })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('success', `Test email sent to ${email}`);
            } else {
                showToast('error', data.message || 'Failed to send test email');
            }
        } catch (err) {
            showToast('error', 'Failed to send test email');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SENT':
                return 'text-green-400 bg-green-500/20';
            case 'FAILED':
                return 'text-red-400 bg-red-500/20';
            case 'PENDING':
                return 'text-yellow-400 bg-yellow-500/20';
            default:
                return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getEmailTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'INSTITUTION_ADMIN_INVITE': 'Institution Admin Invite',
            'STUDENT_WELCOME': 'Student Welcome',
            'RECRUITER_WELCOME': 'Recruiter Welcome',
            'NEWSLETTER': 'Newsletter',
            'PROMOTIONAL': 'Promotional',
            'PASSWORD_RESET': 'Password Reset',
            'VERIFICATION': 'Verification',
            'NOTIFICATION': 'Notification',
            'BULK': 'Bulk Email',
            'OTHER': 'Other'
        };
        return labels[type] || type;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Email Management</h1>
                <button
                    onClick={() => loadData()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl glass border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.totalSent}</p>
                                <p className="text-sm text-gray-400">Emails Sent</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl glass border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.totalFailed}</p>
                                <p className="text-sm text-gray-400">Failed</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl glass border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{templates.length}</p>
                                <p className="text-sm text-gray-400">Templates</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl glass border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Building className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {invites.filter(i => !i.isAccepted).length}
                                </p>
                                <p className="text-sm text-gray-400">Pending Invites</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
                {[
                    { id: 'logs', label: 'Email Logs', icon: Mail },
                    { id: 'invites', label: 'Invitations', icon: Building },
                    { id: 'templates', label: 'Templates', icon: FileText },
                    { id: 'compose', label: 'Compose', icon: Send }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success'
                            ? 'bg-green-500/20 border border-green-500/30'
                            : 'bg-red-500/20 border border-red-500/30'
                            }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={toast.type === 'success' ? 'text-green-300' : 'text-red-300'}>
                            {toast.message}
                        </span>
                        <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white ml-2">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Email Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-4">
                                <div className="relative flex-1 min-w-[200px] max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by email or subject..."
                                        value={logsSearch}
                                        onChange={(e) => setLogsSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <select
                                    value={logsFilter.emailType}
                                    onChange={(e) => setLogsFilter({ ...logsFilter, emailType: e.target.value })}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="INSTITUTION_ADMIN_INVITE">Institution Admin Invite</option>
                                    <option value="NEWSLETTER">Newsletter</option>
                                    <option value="PROMOTIONAL">Promotional</option>
                                    <option value="STUDENT_WELCOME">Student Welcome</option>
                                    <option value="RECRUITER_WELCOME">Recruiter Welcome</option>
                                    <option value="BULK">Bulk Email</option>
                                </select>
                                <select
                                    value={logsFilter.status}
                                    onChange={(e) => setLogsFilter({ ...logsFilter, status: e.target.value })}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="SENT">Sent</option>
                                    <option value="FAILED">Failed</option>
                                    <option value="PENDING">Pending</option>
                                </select>
                            </div>

                            {/* Logs Table */}
                            <div className="rounded-xl glass border border-white/5 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Recipient</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Subject</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Type</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-white/5">
                                                <td className="px-4 py-3 text-sm text-white">{log.recipientEmail}</td>
                                                <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{log.subject}</td>
                                                <td className="px-4 py-3 text-sm text-gray-400">{getEmailTypeLabel(log.emailType)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-400">{formatDate(log.createdAt)}</td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                    No email logs found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {logsTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                                        disabled={logsPage === 1}
                                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-gray-400">
                                        Page {logsPage} of {logsTotalPages}
                                    </span>
                                    <button
                                        onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
                                        disabled={logsPage === logsTotalPages}
                                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Invitations Tab */}
                    {activeTab === 'invites' && (
                        <div className="space-y-4">
                            <div className="rounded-xl glass border border-white/5 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Email</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Institution</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Sent At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {invites.map((invite) => (
                                            <tr key={invite.id} className="hover:bg-white/5">
                                                <td className="px-4 py-3 text-sm text-white">{invite.recipientEmail}</td>
                                                <td className="px-4 py-3 text-sm text-gray-300">
                                                    {invite.user?.adminForInstitution?.name || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {invite.isAccepted ? (
                                                        <span className="flex items-center gap-1 text-xs text-green-400">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Accepted
                                                        </span>
                                                    ) : invite.status === 'SENT' ? (
                                                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                                                            <Clock className="w-3 h-3" />
                                                            Pending
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs text-red-400">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {invite.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-400">{formatDate(invite.createdAt)}</td>
                                            </tr>
                                        ))}
                                        {invites.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                    No invitation emails found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Templates Tab */}
                    {activeTab === 'templates' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setEditingTemplate(null);
                                        setTemplateForm({
                                            name: '',
                                            subject: '',
                                            htmlContent: '',
                                            textContent: '',
                                            category: 'GENERAL',
                                            variables: ''
                                        });
                                        setShowTemplateModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Template
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className="p-4 rounded-xl glass border border-white/5 hover:border-indigo-500/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-white font-medium">{template.name}</h3>
                                                <p className="text-sm text-gray-400">{template.subject}</p>
                                            </div>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">
                                                {template.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                Variables: {template.variables.join(', ') || 'None'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingTemplate(template);
                                                        setTemplateForm({
                                                            name: template.name,
                                                            subject: template.subject,
                                                            htmlContent: template.htmlContent,
                                                            textContent: template.textContent || '',
                                                            category: template.category,
                                                            variables: template.variables.join(', ')
                                                        });
                                                        setShowTemplateModal(true);
                                                    }}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {templates.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-gray-500">
                                        No templates found. Create your first template.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Compose Tab */}
                    {activeTab === 'compose' && (
                        <div className="max-w-2xl">
                            <form onSubmit={handleSendBulkEmail} className="space-y-6">
                                <div className="p-6 rounded-xl glass border border-white/5 space-y-4">
                                    <h3 className="text-lg font-medium text-white mb-4">Send Bulk Email</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Recipients</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'all_students', label: 'All Students', icon: Users },
                                                { id: 'all_recruiters', label: 'All Recruiters', icon: Briefcase },
                                                { id: 'all_institution_admins', label: 'Institution Admins', icon: Building }
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => setComposeForm({ ...composeForm, recipientType: option.id })}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${composeForm.recipientType === option.id
                                                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                                        }`}
                                                >
                                                    <option.icon className="w-5 h-5" />
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Use Template (Optional)
                                        </label>
                                        <select
                                            value={composeForm.templateId}
                                            onChange={(e) => setComposeForm({ ...composeForm, templateId: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="" className="bg-gray-800 text-white">No template (compose manually)</option>
                                            {templates.map((t) => (
                                                <option key={t.id} value={t.id} className="bg-gray-800 text-white">
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {!composeForm.templateId && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                                                <input
                                                    type="text"
                                                    value={composeForm.subject}
                                                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                                                    required={!composeForm.templateId}
                                                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Email subject..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                                                <textarea
                                                    value={composeForm.content}
                                                    onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                                                    required={!composeForm.templateId}
                                                    rows={8}
                                                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Email content (HTML supported)..."
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 disabled:opacity-50"
                                    >
                                        {sending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        {sending ? 'Sending...' : 'Send Emails'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSendTestEmail}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Send Test
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </>
            )}

            {/* Template Modal */}
            <AnimatePresence>
                {showTemplateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {editingTemplate ? 'Edit Template' : 'New Template'}
                                </h2>
                                <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveTemplate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Template Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={templateForm.name}
                                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                                        <select
                                            value={templateForm.category}
                                            onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="GENERAL">General</option>
                                            <option value="NEWSLETTER">Newsletter</option>
                                            <option value="PROMOTIONAL">Promotional</option>
                                            <option value="INVITATION">Invitation</option>
                                            <option value="NOTIFICATION">Notification</option>
                                            <option value="TRANSACTIONAL">Transactional</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={templateForm.subject}
                                        onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Use {{variable}} for dynamic content"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Variables (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={templateForm.variables}
                                        onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., userName, companyName"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">HTML Content</label>
                                    <textarea
                                        required
                                        rows={10}
                                        value={templateForm.htmlContent}
                                        onChange={(e) => setTemplateForm({ ...templateForm, htmlContent: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="<p>Hello {{userName}},</p>..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Plain Text (Optional)</label>
                                    <textarea
                                        rows={4}
                                        value={templateForm.textContent}
                                        onChange={(e) => setTemplateForm({ ...templateForm, textContent: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Plain text version..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplateModal(false)}
                                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600"
                                    >
                                        {editingTemplate ? 'Update Template' : 'Create Template'}
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


