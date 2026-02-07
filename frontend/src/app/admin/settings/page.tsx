"use client";

import { useState, useEffect } from "react";
import { Save, Bell, Lock, Globe, Mail } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function SettingsPage() {
    const { accessToken } = useAuthStore();
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
            const res = await fetch(`${API_URL}/admin/settings`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
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
            const res = await fetch(`${API_URL}/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
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
                        { id: 'email', label: 'Email Templates', icon: Mail },
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
                <div className="flex-1 glass rounded-xl p-6 lg:p-8">
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
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.maintenance_mode || false}
                                            onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                        />
                                        <span className="text-gray-900 dark:text-white">Enable Maintenance Mode</span>
                                    </label>
                                    <p className="text-sm text-gray-500 mt-1 ml-7">Prevents non-admin users from accessing the platform</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security Settings</h2>

                            <div className="space-y-6">
                                {/* Password Policy */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
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
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.require_uppercase || true}
                                                onChange={(e) => handleChange('require_uppercase', e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                            />
                                            <span className="text-gray-900 dark:text-white">Require uppercase letter</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.require_number || true}
                                                onChange={(e) => handleChange('require_number', e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                            />
                                            <span className="text-gray-900 dark:text-white">Require number</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.require_special_char || false}
                                                onChange={(e) => handleChange('require_special_char', e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                            />
                                            <span className="text-gray-900 dark:text-white">Require special character</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Session Settings */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
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
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">Two-Factor Authentication</h3>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.enable_2fa || false}
                                            onChange={(e) => handleChange('enable_2fa', e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                        />
                                        <div>
                                            <span className="text-gray-900 dark:text-white">Enable 2FA for all users</span>
                                            <p className="text-sm text-gray-500">Require two-factor authentication for all user accounts</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer mt-4">
                                        <input
                                            type="checkbox"
                                            checked={settings.require_2fa_admin || true}
                                            onChange={(e) => handleChange('require_2fa_admin', e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                        />
                                        <div>
                                            <span className="text-gray-900 dark:text-white">Require 2FA for administrators</span>
                                            <p className="text-sm text-gray-500">Always require 2FA for admin accounts (recommended)</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Notification Settings</h2>

                            <div className="space-y-6">
                                {/* Email Notifications */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">Email Notifications</h3>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notify_new_user || true}
                                                onChange={(e) => handleChange('notify_new_user', e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                            />
                                            <div>
                                                <span className="text-gray-900 dark:text-white">New user registrations</span>
                                                <p className="text-sm text-gray-500">Get notified when a new user registers</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notify_payment || true}
                                                onChange={(e) => handleChange('notify_payment', e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                            />
                                            <div>
                                                <span className="text-gray-900 dark:text-white">Payment events</span>
                                                <p className="text-sm text-gray-500">Get notified on successful payments and subscription changes</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notify_error || true}
                                                onChange={(e) => handleChange('notify_error', e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                            />
                                            <div>
                                                <span className="text-gray-900 dark:text-white">System errors</span>
                                                <p className="text-sm text-gray-500">Get notified when critical errors occur</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Admin Notification Email */}
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
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
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
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

                            <div className="pt-6 border-t border-gray-200 dark:border-white/5">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Email Templates</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Welcome Email Subject</label>
                                        <input
                                            type="text"
                                            value={settings.email_welcome_subject || 'Welcome to PlaceNxt!'}
                                            onChange={(e) => handleChange('email_welcome_subject', e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    {/* Add more template fields as needed */}
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
