'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    User, Mail, Briefcase, Camera, Save, Check, Loader2,
    ChevronDown, Shield, Bell, Key, Trash2, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface JobRole {
    id: string;
    title: string;
    category: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, accessToken, updateTargetJobRole, logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        targetJobRoleId: '',
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Notification preferences state (local only, not connected to backend)
    const [notifications, setNotifications] = useState({
        'job-alerts': true,
        'skill-tips': true,
        'interview-reminders': true,
        'marketing': false,
    });

    // Fetch job roles
    useEffect(() => {
        const fetchJobRoles = async () => {
            try {
                const res = await fetch(`${API_URL}/job-roles`);
                if (res.ok) {
                    const data = await res.json();
                    setJobRoles(data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch job roles:', err);
            }
        };
        fetchJobRoles();
    }, []);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                targetJobRoleId: user.targetJobRoleId || '',
            });
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!accessToken) return;

        setSaving(true);
        setSuccess(false);

        try {
            // Update profile info
            const profileRes = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ name: formData.name }),
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
        if (!accessToken) return;

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
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
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
        if (!accessToken || !deletePassword) return;

        setDeleteError(null);
        setDeleteLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ password: deletePassword }),
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

    // Group job roles by category
    const groupedRoles = Array.from(new Set(jobRoles.map(r => r.category))).map(cat => ({
        category: cat,
        roles: jobRoles.filter(r => r.category === cat),
    }));

    const selectedRole = jobRoles.find(r => r.id === formData.targetJobRoleId);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-2">Manage your account and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                        <h2 className="text-lg font-bold text-white mb-4">Profile Photo</h2>
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
                                <p className="text-white font-medium">{user?.name || 'User'}</p>
                                <p className="text-gray-400 text-sm">{user?.email}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="p-6 rounded-2xl glass-card">
                        <h2 className="text-lg font-bold text-white mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Your name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>
                        </div>
                    </div>

                    {/* Target Job Role */}
                    <div className="p-6 rounded-2xl glass-card">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white">Target Job Role</h2>
                                <p className="text-sm text-gray-400">This personalizes your skill recommendations, job matches, and interview prep</p>
                            </div>
                            <Briefcase className="w-5 h-5 text-indigo-400" />
                        </div>

                        {/* Current Selection */}
                        {selectedRole && (
                            <div className="mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <p className="text-xs text-gray-400 mb-1">Currently targeting</p>
                                <p className="text-lg font-bold text-white">{selectedRole.title}</p>
                                <p className="text-sm text-gray-400">{selectedRole.category}</p>
                            </div>
                        )}

                        {/* Role Selector */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-300">Change Target Role</label>
                            <select
                                value={formData.targetJobRoleId}
                                onChange={(e) => setFormData({ ...formData, targetJobRoleId: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                                style={{ backgroundImage: 'none' }}
                            >
                                <option value="" className="bg-gray-900">Select a role...</option>
                                {groupedRoles.map((group) => (
                                    <optgroup key={group.category} label={group.category} className="bg-gray-900">
                                        {group.roles.map((role) => (
                                            <option key={role.id} value={role.id} className="bg-gray-900">
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
                        <h2 className="text-lg font-bold text-white mb-4">Change Password</h2>

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
                                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                onClick={handleChangePassword}
                                disabled={passwordLoading}
                                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                            >
                                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl glass-card border border-red-500/20">
                        <h2 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h2>
                        <p className="text-gray-400 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
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

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl glass-card"
                >
                    <h2 className="text-lg font-bold text-white mb-4">Notification Preferences</h2>
                    <div className="space-y-4">
                        {[
                            { id: 'job-alerts' as keyof typeof notifications, label: 'Job Alerts', description: 'New job matches based on your profile' },
                            { id: 'skill-tips' as keyof typeof notifications, label: 'Skill Tips', description: 'Weekly recommendations to improve your skills' },
                            { id: 'interview-reminders' as keyof typeof notifications, label: 'Interview Reminders', description: 'Reminders for scheduled mock interviews' },
                            { id: 'marketing' as keyof typeof notifications, label: 'Marketing Emails', description: 'Occasional updates about new features' },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <div>
                                    <p className="text-white font-medium">{item.label}</p>
                                    <p className="text-sm text-gray-400">{item.description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications[item.id]}
                                        onChange={(e) => setNotifications({ ...notifications, [item.id]: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
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
                        className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-red-500/30"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Delete Account</h2>
                                <p className="text-gray-400 text-sm">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-gray-300 mb-4">
                            All your data, including resumes, interview history, and preferences will be permanently deleted.
                        </p>

                        {deleteError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {deleteError}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Enter your password to confirm</label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletePassword('');
                                    setDeleteError(null);
                                }}
                                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading || !deletePassword}
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
