"use client";

import { useState } from "react";
import { Save, Bell, Lock, Globe, Mail } from "lucide-react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        // Simulate API call
        setTimeout(() => setSaving(false), 1000);
    };

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
                                    <input type="text" defaultValue="SmartCareerAI" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Support Email</label>
                                    <input type="email" defaultValue="support@smartcareer.ai" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" />
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="form-checkbox text-purple-500 rounded bg-white/10 border-white/20" />
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Password Policy</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 [&>option]:text-black">
                                        <option>Strong (Min 12 chars, symbols, numbers)</option>
                                        <option>Medium (Min 8 chars, numbers)</option>
                                        <option>Weak (Min 6 chars)</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="form-checkbox text-purple-500 rounded bg-white/10 border-white/20" />
                                        <span className="text-white">Require Email Verification</span>
                                    </label>
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
