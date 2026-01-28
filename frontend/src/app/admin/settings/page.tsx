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
                <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
                <p className="text-gray-400 mt-1">Configure global application settings</p>
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
                                ? "bg-white/10 text-white font-medium"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
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
                            <h2 className="text-xl font-bold text-white mb-6">General Configuration</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Platform Name</label>
                                    <input
                                        type="text"
                                        value={settings.platform_name || "SmartCareerAI"}
                                        onChange={(e) => handleChange('platform_name', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Support Email</label>
                                    <input
                                        type="email"
                                        value={settings.support_email || "support@smartcareer.ai"}
                                        onChange={(e) => handleChange('support_email', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.maintenance_mode || false}
                                            onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                            className="form-checkbox text-purple-500 rounded bg-white/10 border-white/20"
                                        />
                                        <span className="text-white">Enable Maintenance Mode</span>
                                    </label>
                                    <p className="text-sm text-gray-500 mt-1 ml-7">Prevents non-admin users from accessing the platform</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6">Security Settings</h2>
                            <p className="text-gray-500">Security configurations logic here...</p>
                        </div>
                    )}

                    {activeTab === 'email' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">SMTP Configuration</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">SMTP Host</label>
                                        <input
                                            type="text"
                                            value={settings.smtp_host || ''}
                                            onChange={(e) => handleChange('smtp_host', e.target.value)}
                                            placeholder="smtp.example.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">SMTP Port</label>
                                        <input
                                            type="number"
                                            value={settings.smtp_port || ''}
                                            onChange={(e) => handleChange('smtp_port', e.target.value)}
                                            placeholder="587"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={settings.smtp_user || ''}
                                            onChange={(e) => handleChange('smtp_user', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                        <input
                                            type="password"
                                            value={settings.smtp_pass || ''}
                                            onChange={(e) => handleChange('smtp_pass', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <h2 className="text-xl font-bold text-white mb-4">Email Templates</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Welcome Email Subject</label>
                                        <input
                                            type="text"
                                            value={settings.email_welcome_subject || 'Welcome to SmartCareerAI!'}
                                            onChange={(e) => handleChange('email_welcome_subject', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    {/* Add more template fields as needed */}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
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
