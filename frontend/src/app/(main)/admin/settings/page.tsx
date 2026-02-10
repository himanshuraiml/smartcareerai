"use client";

import { useState, useEffect } from "react";
import { Save, Bell, Lock, Globe, Mail, Check } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/providers/ThemeProvider";
import { authFetch } from "@/lib/auth-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function SettingsPage() {
    const { accessToken } = useAuthStore();
    const { theme } = useTheme();
    const isLightMode = theme === 'light';

    // Card style for light mode - solid white background
    const cardStyle = isLightMode ? { backgroundColor: '#ffffff' } : { backgroundColor: '#1f2937' };

    const [activeTab, setActiveTab] = useState("general");
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (accessToken) {
            fetchSettings();
        }
    }, [accessToken]);

    const fetchSettings = async () => {
        try {
            const res = await authFetch('/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data.data || {});
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await authFetch('/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                // Show success toast?
            }
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return <div className="p-12 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Configure global application settings</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
                    {[
                        { id: 'general', label: 'General', icon: Globe },
                        { id: 'security', label: 'Security', icon: Lock },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'email', label: 'Email Settings', icon: Mail },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                ? "bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-white font-medium"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 rounded-xl p-6 lg:p-8 border border-gray-200 dark:border-white/10 shadow-sm" style={cardStyle}>
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">General Configuration</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Platform Name</label>
                                    <input
                                        type="text"
                                        value={settings.platform_name || "PlaceNxt"}
                                        onChange={(e) => handleChange('platform_name', e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Support Email</label>
                                    <input
                                        type="email"
                                        value={settings.support_email || "support@smartcareer.ai"}
                                        onChange={(e) => handleChange('support_email', e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('maintenance_mode', !settings.maintenance_mode)}
                                            className="w-5 h-5 flex-shrink-0 rounded border-2 cursor-pointer flex items-center justify-center transition-colors"
                                            style={{
                                                backgroundColor: settings.maintenance_mode ? '#6366f1' : (isLightMode ? '#ffffff' : '#374151'),
                                                borderColor: settings.maintenance_mode ? '#6366f1' : (isLightMode ? '#d1d5db' : '#4b5563')
                                            }}
                                        >
                                            {settings.maintenance_mode && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </button>
                                        <span
                                            onClick={() => handleChange('maintenance_mode', !settings.maintenance_mode)}
                                            className="cursor-pointer text-gray-900 dark:text-white select-none"
                                            style={{ backgroundColor: 'transparent' }}
                                        >
                                            Enable Maintenance Mode
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 ml-8">Prevents non-admin users from accessing the platform</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security Settings</h2>

                            <div className="space-y-6">
                                {/* Password Policy */}
                                <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10" style={isLightMode ? { backgroundColor: '#f9fafb' } : { backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">Password Policy</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Minimum Password Length</label>
                                            <input
                                                type="number"
                                                min="6"
                                                max="32"
                                                value={settings.min_password_length || 8}
                                                onChange={(e) => handleChange('min_password_length', parseInt(e.target.value))}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('require_uppercase', settings.require_uppercase === false ? true : false)}
                                                className="w-5 h-5 flex-shrink-0 rounded border-2 cursor-pointer flex items-center justify-center transition-colors"
                                                style={{
                                                    backgroundColor: settings.require_uppercase !== false ? '#6366f1' : (isLightMode ? '#ffffff' : '#374151'),
                                                    borderColor: settings.require_uppercase !== false ? '#6366f1' : (isLightMode ? '#d1d5db' : '#4b5563')
                                                }}
                                            >
                                                {settings.require_uppercase !== false && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </button>
                                            <span
                                                onClick={() => handleChange('require_uppercase', settings.require_uppercase === false ? true : false)}
                                                className="cursor-pointer text-gray-900 dark:text-white select-none"
                                                style={{ backgroundColor: 'transparent' }}
                                            >
                                                Require uppercase letter
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('require_number', settings.require_number === false ? true : false)}
                                                className="w-5 h-5 flex-shrink-0 rounded border-2 cursor-pointer flex items-center justify-center transition-colors"
                                                style={{
                                                    backgroundColor: settings.require_number !== false ? '#6366f1' : (isLightMode ? '#ffffff' : '#374151'),
                                                    borderColor: settings.require_number !== false ? '#6366f1' : (isLightMode ? '#d1d5db' : '#4b5563')
                                                }}
                                            >
                                                {settings.require_number !== false && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </button>
                                            <span
                                                onClick={() => handleChange('require_number', settings.require_number === false ? true : false)}
                                                className="cursor-pointer text-gray-900 dark:text-white select-none"
                                                style={{ backgroundColor: 'transparent' }}
                                            >
                                                Require number
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('require_special_char', !settings.require_special_char)}
                                                className="w-5 h-5 flex-shrink-0 rounded border-2 cursor-pointer flex items-center justify-center transition-colors"
                                                style={{
                                                    backgroundColor: settings.require_special_char ? '#6366f1' : (isLightMode ? '#ffffff' : '#374151'),
                                                    borderColor: settings.require_special_char ? '#6366f1' : (isLightMode ? '#d1d5db' : '#4b5563')
                                                }}
                                            >
                                                {settings.require_special_char && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </button>
                                            <span
                                                onClick={() => handleChange('require_special_char', !settings.require_special_char)}
                                                className="cursor-pointer text-gray-900 dark:text-white select-none"
                                                style={{ backgroundColor: 'transparent' }}
                                            >
                                                Require special character
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Session Settings */}
                                <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10" style={isLightMode ? { backgroundColor: '#f9fafb' } : { backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">Session Settings</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Session Timeout (minutes)</label>
                                            <input
                                                type="number"
                                                min="5"
                                                max="1440"
                                                value={settings.session_timeout || 60}
                                                onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                            />
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Users will be logged out after this period of inactivity</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Max Login Attempts</label>
                                            <input
                                                type="number"
                                                min="3"
                                                max="10"
                                                value={settings.max_login_attempts || 5}
                                                onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value))}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                            />
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Account will be locked after this many failed attempts</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Two-Factor Authentication */}
                                <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10" style={isLightMode ? { backgroundColor: '#f9fafb' } : { backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">Two-Factor Authentication</h3>
                                    <div className="flex items-start gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('enable_2fa', !settings.enable_2fa)}
                                            className="w-5 h-5 mt-0.5 flex-shrink-0 rounded border-2 cursor-pointer flex items-center justify-center transition-colors"
                                            style={{
                                                backgroundColor: settings.enable_2fa ? '#6366f1' : (isLightMode ? '#ffffff' : '#374151'),
                                                borderColor: settings.enable_2fa ? '#6366f1' : (isLightMode ? '#d1d5db' : '#4b5563')
                                            }}
                                        >
                                            {settings.enable_2fa && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </button>
                                        <div
                                            onClick={() => handleChange('enable_2fa', !settings.enable_2fa)}
                                            className="cursor-pointer select-none"
                                            style={{ backgroundColor: 'transparent' }}
                                        >
                                            <span className="text-gray-900 dark:text-white block" style={{ backgroundColor: 'transparent' }}>Enable 2FA for all users</span>
                                            <p className="text-sm text-gray-500" style={{ backgroundColor: 'transparent' }}>Require two-factor authentication for all user accounts</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('require_2fa_admin', settings.require_2fa_admin === false ? true : false)}
                                            className="w-5 h-5 mt-0.5 flex-shrink-0 rounded border-2 cursor-pointer flex items-center justify-center transition-colors"
                                            style={{
                                                backgroundColor: settings.require_2fa_admin !== false ? '#6366f1' : (isLightMode ? '#ffffff' : '#374151'),
                                                borderColor: settings.require_2fa_admin !== false ? '#6366f1' : (isLightMode ? '#d1d5db' : '#4b5563')
                                            }}
                                        >
                                            {settings.require_2fa_admin !== false && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </button>
                                        <div
                                            onClick={() => handleChange('require_2fa_admin', settings.require_2fa_admin === false ? true : false)}
                                            className="cursor-pointer select-none"
                                            style={{ backgroundColor: 'transparent' }}
                                        >
                                            <span className="text-gray-900 dark:text-white block" style={{ backgroundColor: 'transparent' }}>Require 2FA for administrators</span>
                                            <p className="text-sm text-gray-500" style={{ backgroundColor: 'transparent' }}>Always require 2FA for admin accounts (recommended)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Notification Settings</h2>

                            <div className="space-y-6">
                                {/* Email Notifications */}
                                <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10" style={isLightMode ? { backgroundColor: '#f9fafb' } : { backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">Email Notifications</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('notify_new_user', settings.notify_new_user === false ? true : false)}
                                                className="w-5 h-5 mt-0.5 flex-shrink-0 rounded border-2 cursor-pointer flex items-center justify-center transition-colors"
                                                style={{
                                                    backgroundColor: settings.notify_new_user !== false ? '#6366f1' : (isLightMode ? '#ffffff' : '#374151'),
                                                    borderColor: settings.notify_new_user !== false ? '#6366f1' : (isLightMode ? '#d1d5db' : '#4b5563')
                                                }}
                                            >
                                                {settings.notify_new_user !== false && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </button>
                                            <div
                                                onClick={() => handleChange('notify_new_user', settings.notify_new_user === false ? true : false)}
                                                className="cursor-pointer select-none"
                                                style={{ backgroundColor: 'transparent' }}
                                            >
                                                <span className="text-gray-900 dark:text-white block" style={{ backgroundColor: 'transparent' }}>New user registrations</span>
                                                <p className="text-sm text-gray-500" style={{ backgroundColor: 'transparent' }}>Get notified when a new user registers</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('notify_payment', settings.notify_payment === false ? true : false)}
                                                className="w-5 h-5 mt-0.5 flex-shrink-0 rounded border-2 cursor-pointer flex items-center justify-center transition-colors"
                                                style={{
                                                    backgroundColor: settings.notify_payment !== false ? '#6366f1' : (isLightMode ? '#ffffff' : '#374151'),
                                                    borderColor: settings.notify_payment !== false ? '#6366f1' : (isLightMode ? '#d1d5db' : '#4b5563')
                                                }}
                                            >
                                                {settings.notify_payment !== false && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </button>
                                            <div
                                                onClick={() => handleChange('notify_payment', settings.notify_payment === false ? true : false)}
                                                className="cursor-pointer select-none"
                                                style={{ backgroundColor: 'transparent' }}
                                            >
                                                <span className="text-gray-900 dark:text-white block" style={{ backgroundColor: 'transparent' }}>Payment events</span>
                                                <p className="text-sm text-gray-500" style={{ backgroundColor: 'transparent' }}>Get notified on successful payments and subscription changes</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('notify_error', settings.notify_error === false ? true : false)}
                                                className="w-5 h-5 mt-0.5 flex-shrink-0 rounded border-2 cursor-pointer flex items-center justify-center transition-colors"
                                                style={{
                                                    backgroundColor: settings.notify_error !== false ? '#6366f1' : (isLightMode ? '#ffffff' : '#374151'),
                                                    borderColor: settings.notify_error !== false ? '#6366f1' : (isLightMode ? '#d1d5db' : '#4b5563')
                                                }}
                                            >
                                                {settings.notify_error !== false && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </button>
                                            <div
                                                onClick={() => handleChange('notify_error', settings.notify_error === false ? true : false)}
                                                className="cursor-pointer select-none"
                                                style={{ backgroundColor: 'transparent' }}
                                            >
                                                <span className="text-gray-900 dark:text-white block" style={{ backgroundColor: 'transparent' }}>System errors</span>
                                                <p className="text-sm text-gray-500" style={{ backgroundColor: 'transparent' }}>Get notified when critical errors occur</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Notification Email */}
                                <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10" style={isLightMode ? { backgroundColor: '#f9fafb' } : { backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">Notification Recipients</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Admin Email</label>
                                        <input
                                            type="email"
                                            value={settings.admin_notification_email || ''}
                                            onChange={(e) => handleChange('admin_notification_email', e.target.value)}
                                            placeholder="admin@example.com"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                        />
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Notifications will be sent to this email address</p>
                                    </div>
                                </div>

                                {/* Digest Settings */}
                                <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10" style={isLightMode ? { backgroundColor: '#f9fafb' } : { backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">Digest Settings</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email Digest Frequency</label>
                                            <select
                                                value={settings.digest_frequency || 'daily'}
                                                onChange={(e) => handleChange('digest_frequency', e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="realtime" className="bg-white dark:bg-gray-900">Real-time</option>
                                                <option value="hourly" className="bg-white dark:bg-gray-900">Hourly</option>
                                                <option value="daily" className="bg-white dark:bg-gray-900">Daily</option>
                                                <option value="weekly" className="bg-white dark:bg-gray-900">Weekly</option>
                                                <option value="off" className="bg-white dark:bg-gray-900">Off</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'email' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">SMTP Configuration</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">SMTP Host</label>
                                        <input
                                            type="text"
                                            value={settings.smtp_host || ''}
                                            onChange={(e) => handleChange('smtp_host', e.target.value)}
                                            placeholder="smtp.example.com"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">SMTP Port</label>
                                        <input
                                            type="number"
                                            value={settings.smtp_port || ''}
                                            onChange={(e) => handleChange('smtp_port', e.target.value)}
                                            placeholder="587"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={settings.smtp_user || ''}
                                            onChange={(e) => handleChange('smtp_user', e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
                                        <input
                                            type="password"
                                            value={settings.smtp_pass || ''}
                                            onChange={(e) => handleChange('smtp_pass', e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
