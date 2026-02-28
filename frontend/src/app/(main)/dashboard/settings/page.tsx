'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    User, Mail, Briefcase, Camera, Save, Check, Loader2,
    ChevronDown, Shield, Bell, Key, Trash2, AlertTriangle, Building2, Download
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface JobRole {
    id: string;
    title: string;
    category: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, updateTargetJobRole, logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'privacy'>('profile');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        targetJobRoleId: '',
        institutionId: ''
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Notification preferences state (local only, not connected to backend)
    const [notifications, setNotifications] = useState({
        'job-alerts': true,
        'skill-tips': true,
        'interview-reminders': true,
        'marketing': false
    });

    // GDPR Export state
    const [exportLoading, setExportLoading] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    // Fetch job roles
    useEffect(() => {
        const fetchJobRoles = async () => {
            try {
                const res = await authFetch('/job-roles');
                if (res.ok) {
                    const data = await res.json();
                    setJobRoles(data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch job roles:', err);
            }
        };
        fetchJobRoles();

        const fetchInstitutions = async () => {
            try {
                const res = await authFetch('/institutions');
                if (res.ok) {
                    const data = await res.json();
                    setInstitutions(data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch institutions:', err);
            }
        };
        fetchInstitutions();
    }, []);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                targetJobRoleId: user.targetJobRoleId || '',
                institutionId: user.institutionId || ''
            });
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        setSuccess(false);

        try {
            // Update profile info
            const profileRes = await authFetch('/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    institutionId: formData.institutionId || null // Send null if empty string
                })
            });

            if (!profileRes.ok) {
                throw new Error('Failed to update profile');
            }

            // Update target job role if changed
            if (formData.targetJobRoleId !== user?.targetJobRoleId) {
                await updateTargetJobRole(formData.targetJobRoleId);
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user) return;

        setPasswordError(null);
        setPasswordSuccess(false);

        // Validation
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError('All fields are required');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        setPasswordLoading(true);

        try {
            const res = await authFetch('/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            setPasswordSuccess(true);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error: any) {
            setPasswordError(error.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        if (user.hasGoogleAuth && deleteConfirmPhrase !== 'DELETE') return;
        if (!user.hasGoogleAuth && !deletePassword) return;

        setDeleteError(null);
        setDeleteLoading(true);

        try {
            const res = await authFetch('/auth/me', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    user.hasGoogleAuth
                        ? { confirmPhrase: deleteConfirmPhrase }
                        : { password: deletePassword }
                )
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete account');
            }

            // Logout and redirect
            logout();
            router.push('/');
        } catch (error: any) {
            setDeleteError(error.message || 'Failed to delete account');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleExportData = async () => {
        if (!user) return;
        setExportLoading(true);
        setExportSuccess(false);

        try {
            const res = await authFetch('/auth/me/export', {
                method: 'GET'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to export data');
            }

            // Handle file download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smartcareerai-data-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 5000);
        } catch (error: any) {
            console.error('Export error:', error);
            alert(error.message || 'Failed to export data');
        } finally {
            setExportLoading(false);
        }
    };

    // Group job roles by category
    const groupedRoles = Array.from(new Set(jobRoles.map(r => r.category))).map(cat => ({
        category: cat,
        roles: jobRoles.filter(r => r.category === cat)
    }));

    const selectedRole = jobRoles.find(r => r.id === formData.targetJobRoleId);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Avatar Section */}
                    <div className="p-6 rounded-2xl glass-card">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Profile Photo</h2>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                                    {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <div>
                                <p className="text-gray-900 dark:text-white font-medium">{user?.name || 'User'}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="p-6 rounded-2xl glass-card">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Your name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>
                        </div>
                    </div>

                    {/* Institution */}
                    <div className="p-6 rounded-2xl glass-card">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Institution</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Select your university or college if you are a student</p>
                            </div>
                            <Building2 className="w-5 h-5 text-indigo-400" />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Your Institution</label>
                            <select
                                value={formData.institutionId}
                                onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                                style={{ backgroundImage: 'none' }}
                            >
                                <option value="" className="bg-white dark:bg-gray-900">Not a student / Skip</option>
                                {institutions.map((inst) => (
                                    <option key={inst.id} value={inst.id} className="bg-white dark:bg-gray-900">
                                        {inst.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Target Job Role */}
                    <div className="p-6 rounded-2xl glass-card">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Target Job Role</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">This personalizes your skill recommendations, job matches, and interview prep</p>
                            </div>
                            <Briefcase className="w-5 h-5 text-indigo-400" />
                        </div>

                        {/* Current Selection */}
                        {selectedRole && (
                            <div className="mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Currently targeting</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedRole.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRole.category}</p>
                            </div>
                        )}

                        {/* Role Selector */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Change Target Role</label>
                            <select
                                value={formData.targetJobRoleId}
                                onChange={(e) => setFormData({ ...formData, targetJobRoleId: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                                style={{ backgroundImage: 'none' }}
                            >
                                <option value="" className="bg-white dark:bg-gray-900">Select a role...</option>
                                {groupedRoles.map((group) => (
                                    <optgroup key={group.category} label={group.category} className="bg-white dark:bg-gray-900">
                                        {group.roles.map((role) => (
                                            <option key={role.id} value={role.id} className="bg-white dark:bg-gray-900">
                                                {role.title}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : success ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {saving ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="p-6 rounded-2xl glass-card">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Password</h2>

                        {user?.hasGoogleAuth ? (
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-900 dark:text-white font-medium">Signed in with Google</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                        Your account uses Google for authentication. To change your password, visit your
                                        {' '}<a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Google Account settings</a>.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {passwordError && (
                                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                        {passwordError}
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                                        Password changed successfully!
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={passwordLoading}
                                        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                                    >
                                        {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                        {passwordLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-6 rounded-2xl glass-card border border-red-500/20">
                        <h2 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition-colors border border-red-500/30"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Privacy & Data Tab */}
            {activeTab === 'privacy' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* GDPR Data Export */}
                    <div className="p-6 rounded-2xl glass-card">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Download Your Data</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Get a copy of your personal data, interview history, and resume information.
                                </p>
                            </div>
                            <Download className="w-5 h-5 text-indigo-400" />
                        </div>

                        {exportSuccess && (
                            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                                Data exported successfully! Your download should begin shortly.
                            </div>
                        )}

                        <button
                            onClick={handleExportData}
                            disabled={exportLoading}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {exportLoading ? 'Processing Export...' : 'Export Data (JSON)'}
                        </button>
                    </div>

                    {/* Account Deletion */}
                    <div className="p-6 rounded-2xl glass-card border border-red-500/20">
                        <h2 className="text-lg font-bold text-red-400 mb-2">Delete Account & Data</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                            Permanently delete your account and all associated data in accordance with GDPR. This action cannot be undone.
                        </p>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition-colors border border-red-500/30"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Account & Data
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl glass-card"
                >
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Preferences</h2>
                    <div className="space-y-4">
                        {[
                            { id: 'job-alerts' as keyof typeof notifications, label: 'Job Alerts', description: 'New job matches based on your profile' },
                            { id: 'skill-tips' as keyof typeof notifications, label: 'Skill Tips', description: 'Weekly recommendations to improve your skills' },
                            { id: 'interview-reminders' as keyof typeof notifications, label: 'Interview Reminders', description: 'Reminders for scheduled mock interviews' },
                            { id: 'marketing' as keyof typeof notifications, label: 'Marketing Emails', description: 'Occasional updates about new features' },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                <div>
                                    <p className="text-gray-900 dark:text-white font-medium">{item.label}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications[item.id]}
                                        onChange={(e) => setNotifications({ ...notifications, [item.id]: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-red-500/30"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Account</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            All your data, including resumes, interview history, and preferences will be permanently deleted.
                        </p>

                        {deleteError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {deleteError}
                            </div>
                        )}

                        <div className="mb-4">
                            {user?.hasGoogleAuth ? (
                                <>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                        Type <span className="text-red-400 font-bold">DELETE</span> to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirmPhrase}
                                        onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="DELETE"
                                        autoComplete="off"
                                    />
                                </>
                            ) : (
                                <>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Enter your password to confirm</label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="••••••••"
                                    />
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletePassword('');
                                    setDeleteConfirmPhrase('');
                                    setDeleteError(null);
                                }}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading || (user?.hasGoogleAuth ? deleteConfirmPhrase !== 'DELETE' : !deletePassword)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition disabled:opacity-50"
                            >
                                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {deleteLoading ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}



