"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    Save,
    Lock,
    Key,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
    Settings as SettingsIcon,
    Camera,
    ShieldCheck,
    Bell,
    CreditCard,
    CheckCircle2
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { motion, AnimatePresence } from "framer-motion";

interface InstitutionSettings {
    id: string;
    name: string;
    domain: string | null;
    logoUrl: string | null;
    address: string | null;
}

export default function InstitutionSettingsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("profile");

    const [settings, setSettings] = useState<InstitutionSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Profile Edit State
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [address, setAddress] = useState("");

    // Password change state
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Notifications state (mock)
    const [notifications, setNotifications] = useState({
        newApplications: true,
        requests: true,
        platformUpdates: false,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await authFetch(`/admin/institution/settings`);

                if (!response.ok) {
                    throw new Error("Failed to fetch settings");
                }

                const result = await response.json();
                setSettings(result.data);
                setName(result.data.name || "");
                setLogoUrl(result.data.logoUrl || "");
                setAddress(result.data.address || "");
            } catch (err) {
                console.error("Error fetching settings:", err);
                setProfileError("Failed to load institution settings");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchSettings();
        }
    }, [user]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileError(null);
        setProfileSuccess(null);

        try {
            const response = await authFetch(`/admin/institution/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, logoUrl, address })
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }

            const result = await response.json();
            setSettings(result.data);
            setProfileSuccess("Settings saved successfully!");
            setTimeout(() => setProfileSuccess(null), 3000);
        } catch (err) {
            console.error("Error saving settings:", err);
            setProfileError("Failed to save settings");
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords don't match");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return;
        }

        setSavingPassword(true);

        try {
            const response = await authFetch(`/auth/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to change password");
            }

            setPasswordSuccess("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordSuccess(null), 3000);
        } catch (err: unknown) {
            console.error("Error changing password:", err);
            setPasswordError(err instanceof Error ? err.message : "Failed to change password");
        } finally {
            setSavingPassword(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Institution Profile', icon: Building2 },
        { id: 'security', label: 'Security & Password', icon: ShieldCheck },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'billing', label: 'Billing Settings', icon: CreditCard },
    ];

    const inputClasses = "w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400";
    const labelClasses = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";

    const slideVariants = {
        enter: { y: 10, opacity: 0 },
        center: { y: 0, opacity: 1 },
        exit: { y: -10, opacity: 0 }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-teal-500 animate-spin flex items-center justify-center">
                        <SettingsIcon className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Configurations...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">

            {/* Header */}
            <div className="relative z-10">
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                    Workspace Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                    Manage your institution's identity, security, and notification preferences.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 relative z-10">

                {/* Navigation Sidebar */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="p-4 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm space-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all overflow-hidden group ${isActive
                                        ? "text-emerald-700 dark:text-emerald-400"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="admin-settings-tab"
                                            className="absolute inset-0 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl"
                                        />
                                    )}

                                    <div className="relative z-10 flex items-center gap-4">
                                        <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white dark:bg-[#0A0A0A] shadow-sm' : 'bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}`}>
                                            <tab.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                                        </div>
                                        <span className={`font-bold ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                            {tab.label}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm min-h-[500px]">

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                            >
                                {/* PROFILE TAB */}
                                {activeTab === 'profile' && (
                                    <form onSubmit={handleSaveProfile} className="space-y-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <Building2 className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Institution Profile</h2>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Update your public identity and branding.</p>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {profileError && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                                                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-3">
                                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                        {profileError}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className={labelClasses}>Institution Name</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className={inputClasses}
                                                    placeholder="Enter full institution name"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className={labelClasses}>Logo URL</label>
                                                <div className="relative">
                                                    <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="url"
                                                        value={logoUrl}
                                                        onChange={(e) => setLogoUrl(e.target.value)}
                                                        className={`${inputClasses} pl-10`}
                                                        placeholder="https://example.com/assets/logo.png"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className={labelClasses}>Physical Address (Optional)</label>
                                                <textarea
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    rows={3}
                                                    className={`${inputClasses} resize-none`}
                                                    placeholder="E.g. 123 University Campus Drive, City, State"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={savingProfile}
                                                className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${profileSuccess
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white"
                                                    } disabled:opacity-75 disabled:cursor-wait`}
                                            >
                                                <AnimatePresence mode="wait">
                                                    {savingProfile ? (
                                                        <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900 rounded-full animate-spin" />
                                                            <span>Saving...</span>
                                                        </motion.div>
                                                    ) : profileSuccess ? (
                                                        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <span>Profile Saved!</span>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                                            <Save className="w-5 h-5" />
                                                            <span>Save Profile</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* SECURITY TAB */}
                                {activeTab === 'security' && (
                                    <form onSubmit={handlePasswordChange} className="space-y-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                                                <ShieldCheck className="w-6 h-6 text-violet-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Security</h2>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Keep your administrative access secure.</p>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {passwordError && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                                                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-3">
                                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                        {passwordError}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="space-y-6 max-w-lg">
                                            <div className="space-y-2">
                                                <label className={labelClasses}>Current Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPassword ? "text" : "password"}
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        required
                                                        className={`${inputClasses} pr-12`}
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors p-1"
                                                    >
                                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className={labelClasses}>New Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        required
                                                        minLength={8}
                                                        className={`${inputClasses} pr-12`}
                                                        placeholder="Min. 8 characters"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors p-1"
                                                    >
                                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className={labelClasses}>Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    className={inputClasses}
                                                    placeholder="Repeat new password"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={savingPassword}
                                                className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${passwordSuccess
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white"
                                                    } disabled:opacity-75 disabled:cursor-wait`}
                                            >
                                                <AnimatePresence mode="wait">
                                                    {savingPassword ? (
                                                        <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900 rounded-full animate-spin" />
                                                            <span>Updating...</span>
                                                        </motion.div>
                                                    ) : passwordSuccess ? (
                                                        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <span>Password Updated!</span>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                                            <Key className="w-5 h-5" />
                                                            <span>Update Password</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* NOTIFICATIONS TAB */}
                                {activeTab === 'notifications' && (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <Bell className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Notifications</h2>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Control what alerts your institution receives.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 px-1">
                                            {[
                                                { id: 'newApplications', label: 'New Student Registrations', desc: 'Get notified when new students join the platform from your domain.' },
                                                { id: 'requests', label: 'Job Approval Requests', desc: 'Receive an email when an employer posts a job requiring your review.' },
                                                { id: 'platformUpdates', label: 'Platform Updates', desc: 'News about product features and improvements.' },
                                            ].map((item) => (
                                                <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                                                    <div className="pr-4">
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{item.label}</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                                                    </div>

                                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={notifications[item.id as keyof typeof notifications]}
                                                            onChange={() => setNotifications({
                                                                ...notifications,
                                                                [item.id]: !notifications[item.id as keyof typeof notifications]
                                                            })}
                                                        />
                                                        <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:shadow-sm after:transition-all peer-checked:bg-emerald-500 transition-colors"></div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* BILLING TAB */}
                                {activeTab === 'billing' && (
                                    <div className="space-y-8 flex flex-col items-center justify-center text-center py-12">
                                        <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                                            <CreditCard className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Billing Settings</h2>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                            Your institution is currently under an enterprise agreement. Contact support to modify your billing details.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                    </div>
                </div>
            </div>
        </div>
    );
}
