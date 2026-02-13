"use client";

import { useState } from "react";
import { Save, Bell, Lock, User, CreditCard } from "lucide-react";

export default function RecruiterSettingsPage() {
    const [activeTab, setActiveTab] = useState("account");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Manage your account and preferences</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
                    {[
                        { id: 'account', label: 'My Account', icon: User },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'security', label: 'Security', icon: Lock },
                        { id: 'billing', label: 'Billing', icon: CreditCard },
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
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6">Account Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                                    <input type="text" defaultValue="John Recruiter" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                                    <input type="email" defaultValue="recruiter@techhunters.io" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {(activeTab !== 'account') && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <p>Settings for {activeTab} coming soon...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


