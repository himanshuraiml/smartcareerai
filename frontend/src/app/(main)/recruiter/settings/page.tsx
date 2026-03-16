"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Save,
    Bell,
    ShieldCheck,
    User,
    CreditCard,
    Mail,
    CheckCircle2,
    Building2,
    Users,
    Plus,
    Crown,
    Shield,
    UserCheck,
    AlertCircle,
    Send,
    Globe,
    Loader2,
    Plug,
    CheckCircle,
    XCircle,
    Calendar,
    Link2,
    Lock,
    Trash2,
    Copy,
    Check
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { useAuthStore } from "@/store/auth.store";

// Types
interface OrgMember {
    id: string;
    orgRole: string;
    user: { name: string; email: string; avatarUrl?: string };
}
interface Organization {
    id: string;
    name: string;
    domain?: string;
    website?: string;
    industry?: string;
    companySize?: string;
    isVerified: boolean;
    recruiters: OrgMember[];
    _count: { jobs: number };
    customDomain?: string;
    isWhiteLabel: boolean;
    theme?: any;
    logoUrl?: string;
}
interface AtsConfig {
    id: string;
    provider: string;
    outboundUrl: string | null;
    isActive: boolean;
    lastSyncAt: string | null;
    logs: Array<{ direction: string; status: string; createdAt: string }>;
}
const ATS_PROVIDERS = ["WORKDAY", "SAP", "ZOHO", "KEKA", "GENERIC"];

const ROLE_COLORS: Record<string, string> = {
    OWNER: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200",
    ADMIN: "text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200",
    HR: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200",
    HIRING_MANAGER: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200",
    INTERVIEWER: "text-teal-500 bg-teal-50 dark:bg-teal-500/10 border-teal-200",
    RECRUITER: "text-gray-500 bg-gray-50 dark:bg-gray-500/10 border-gray-200",
};

const ROLE_ICONS: Record<string, typeof Crown> = {
    OWNER: Crown,
    ADMIN: Shield,
    HR: UserCheck,
    HIRING_MANAGER: Briefcase,
    INTERVIEWER: User,
    RECRUITER: User,
};

import { Briefcase } from "lucide-react";

const NOTIF_STORAGE_KEY = "recruiter_notif_prefs";

export default function RecruiterSettingsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("account");

    // ─── Account tab ──────────────────────────────────────────────────────────
    const [accountData, setAccountData] = useState({ fullName: "", email: "" });
    const [accountSaving, setAccountSaving] = useState(false);
    const [accountSuccess, setAccountSuccess] = useState(false);
    const [accountError, setAccountError] = useState<string | null>(null);

    // Populate account fields from Zustand store (already fetched at login)
    useEffect(() => {
        if (user) {
            setAccountData({ fullName: user.name || "", email: user.email || "" });
        }
    }, [user]);

    const handleSaveAccount = async () => {
        setAccountSaving(true);
        setAccountError(null);
        try {
            const res = await authFetch("/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: accountData.fullName }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Failed to update profile");
            setAccountSuccess(true);
            setTimeout(() => setAccountSuccess(false), 3000);
        } catch (err: any) {
            setAccountError(err.message);
        } finally {
            setAccountSaving(false);
        }
    };

    // ─── Security tab ─────────────────────────────────────────────────────────
    const [securityData, setSecurityData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [securitySaving, setSecuritySaving] = useState(false);
    const [securitySuccess, setSecuritySuccess] = useState(false);
    const [securityError, setSecurityError] = useState<string | null>(null);

    const handleChangePassword = async () => {
        setSecurityError(null);
        if (!securityData.currentPassword || !securityData.newPassword) {
            setSecurityError("All password fields are required.");
            return;
        }
        if (securityData.newPassword !== securityData.confirmPassword) {
            setSecurityError("New passwords do not match.");
            return;
        }
        if (securityData.newPassword.length < 8) {
            setSecurityError("New password must be at least 8 characters.");
            return;
        }
        setSecuritySaving(true);
        try {
            const res = await authFetch("/auth/change-password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: securityData.currentPassword,
                    newPassword: securityData.newPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Failed to change password");
            setSecuritySuccess(true);
            setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setSecuritySuccess(false), 3000);
        } catch (err: any) {
            setSecurityError(err.message);
        } finally {
            setSecuritySaving(false);
        }
    };

    // ─── Notifications tab ────────────────────────────────────────────────────
    const defaultNotifs = { newApplications: true, messages: true, platformUpdates: false, marketing: false };
    const [notifications, setNotifications] = useState(defaultNotifs);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
            if (stored) setNotifications(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    const handleToggleNotif = (key: keyof typeof notifications) => {
        const updated = { ...notifications, [key]: !notifications[key] };
        setNotifications(updated);
        try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
    };

    // ─── Org tab ──────────────────────────────────────────────────────────────
    const [org, setOrg] = useState<Organization | null>(null);
    const [orgLoading, setOrgLoading] = useState(false);

    const [brandingData, setBrandingData] = useState({
        customDomain: "",
        isWhiteLabel: false,
        theme: { primaryColor: "#4f46e5" },
        logoUrl: ""
    });
    const [brandingSaving, setBrandingSaving] = useState(false);
    const [brandingSuccess, setBrandingSuccess] = useState(false);

    const [newOrgData, setNewOrgData] = useState({
        name: "", domain: "", website: "", industry: "", companySize: ""
    });
    const [creatingOrg, setCreatingOrg] = useState(false);
    const [createOrgError, setCreateOrgError] = useState<string | null>(null);

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("RECRUITER");
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);

    const [verificationToken, setVerificationToken] = useState<string | null>(null);
    const [enteredToken, setEnteredToken] = useState("");
    const [domainActionLoading, setDomainActionLoading] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    // ATS tab state
    const [atsConfigs, setAtsConfigs] = useState<AtsConfig[]>([]);
    const [atsLoading, setAtsLoading] = useState(true);
    const [showAtsForm, setShowAtsForm] = useState(false);
    const [atsForm, setAtsForm] = useState({ provider: "GENERIC", outboundUrl: "", apiKey: "" });
    const [atsSaving, setAtsSaving] = useState(false);
    const [atsTesting, setAtsTesting] = useState<string | null>(null);
    const [atsTestResult, setAtsTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});
    const [urlCopied, setUrlCopied] = useState(false);
    const [activeIntegrationTab, setActiveIntegrationTab] = useState<"calendar" | "ats">("calendar");

    const handleInitiateVerification = async () => {
        setDomainActionLoading(true);
        setVerifyError(null);
        try {
            const res = await authFetch("/organization/domain/initiate", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to initiate verification");
            setVerificationToken(data.data.token);
        } catch (err: any) {
            setVerifyError(err.message);
        } finally {
            setDomainActionLoading(false);
        }
    };

    const handleVerifyDomain = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setDomainActionLoading(true);
        setVerifyError(null);
        try {
            const res = await authFetch("/organization/domain/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: enteredToken })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to verify domain");
            setVerificationToken(null);
            setEnteredToken("");
            await fetchOrg();
        } catch (err: any) {
            setVerifyError(err.message);
        } finally {
            setDomainActionLoading(false);
        }
    };

    const fetchOrg = useCallback(async () => {
        setOrgLoading(true);
        try {
            const res = await authFetch("/organization/my");
            if (res.status === 404) { setOrg(null); return; }
            const data = await res.json();
            setOrg(data.data);
            setBrandingData({
                customDomain: data.data.customDomain || "",
                isWhiteLabel: data.data.isWhiteLabel || false,
                theme: data.data.theme || { primaryColor: "#4f46e5" },
                logoUrl: data.data.logoUrl || ""
            });
        } catch { /* ignore */ }
        finally { setOrgLoading(false); }
    }, []);

    // Fetch organization data when relevant tabs are active
    useEffect(() => {
        if (activeTab === "organization" || activeTab === "integrations" || activeTab === "branding") {
            fetchOrg();
        }
    }, [activeTab, fetchOrg]);

    // Fetch ATS configs separately when integrations tab is active and org is loaded
    useEffect(() => {
        if (activeTab === "integrations" && org?.id) {
            setAtsLoading(true);
            authFetch(`/organization/${org.id}/integrations/ats`)
                .then(r => r.ok ? r.json() : null)
                .then(d => { if (d?.data) setAtsConfigs(d.data); })
                .catch(err => console.error("Failed to load ATS configs:", err))
                .finally(() => setAtsLoading(false));
        }
    }, [activeTab, org?.id]);

    const handleAtsSave = async () => {
        if (!org) return;
        setAtsSaving(true);
        try {
            const res = await authFetch(`/organization/${org.id}/integrations/ats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(atsForm),
            });
            if (res.ok) {
                const d = await res.json();
                setAtsConfigs(prev => {
                    const idx = prev.findIndex(c => c.id === d.data.id);
                    return idx >= 0 ? prev.map((c, i) => i === idx ? d.data : c) : [...prev, d.data];
                });
                setShowAtsForm(false);
            }
        } finally {
            setAtsSaving(false);
        }
    };

    const handleAtsDelete = async (configId: string) => {
        if (!org || !confirm("Remove this ATS integration?")) return;
        await authFetch(`/organization/${org.id}/integrations/ats/${configId}`, { method: "DELETE" });
        setAtsConfigs(prev => prev.filter(c => c.id !== configId));
    };

    const handleAtsTest = async (configId: string) => {
        if (!org) return;
        setAtsTesting(configId);
        try {
            const res = await authFetch(`/organization/${org.id}/integrations/ats/${configId}/test`, { method: "POST" });
            const d = await res.json();
            setAtsTestResult(prev => ({ ...prev, [configId]: { ok: res.ok, msg: d.data?.message || d.message || (res.ok ? "Webhook sent" : "Failed") } }));
        } finally {
            setAtsTesting(null);
        }
    };

    const handleCopyWebhookUrl = (provider: string) => {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const url = `${origin}/api/v1/recruiter/webhooks/ats/${provider.toLowerCase()}`;
        navigator.clipboard.writeText(url);
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000);
    };

    const handleCreateOrg = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setCreatingOrg(true);
        setCreateOrgError(null);
        try {
            const res = await authFetch("/organization", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newOrgData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || data.message || "Failed to create organization");
            await fetchOrg();
        } catch (err: any) {
            setCreateOrgError(err.message);
        } finally {
            setCreatingOrg(false);
        }
    };

    const handleInvite = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setInviting(true);
        setInviteError(null);
        setInviteSuccess(false);
        try {
            const res = await authFetch("/organization/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || data.message || "Failed to invite member");
            setInviteSuccess(true);
            setInviteEmail("");
            await fetchOrg();
            setTimeout(() => setInviteSuccess(false), 3000);
        } catch (err: any) {
            setInviteError(err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleSaveBranding = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setBrandingSaving(true);
        setBrandingSuccess(false);
        try {
            const res = await authFetch("/organization/branding", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(brandingData)
            });
            if (!res.ok) throw new Error("Failed to update branding");
            setBrandingSuccess(true);
            await fetchOrg();
            setTimeout(() => setBrandingSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setBrandingSaving(false);
        }
    };

    // ─── Integrations tab ─────────────────────────────────────────────────────
    const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; platform: string | null } | null>(null);
    const [calendarStatusLoading, setCalendarStatusLoading] = useState(false);
    const [connectingGoogle, setConnectingGoogle] = useState(false);
    const [connectingOutlook, setConnectingOutlook] = useState(false);

    const fetchCalendarStatus = useCallback(async () => {
        if (!org?.id) return;
        setCalendarStatusLoading(true);
        try {
            const res = await authFetch(`/organization/${org.id}/integrations/calendar/status`);
            const data = await res.json();
            if (res.ok) setCalendarStatus(data.data);
        } catch { /* ignore */ }
        finally { setCalendarStatusLoading(false); }
    }, [org?.id]);

    useEffect(() => {
        if (activeTab === "integrations" && org?.id) fetchCalendarStatus();
    }, [activeTab, org?.id, fetchCalendarStatus]);

    const handleConnectGoogle = async () => {
        if (!org?.id) return;
        setConnectingGoogle(true);
        try {
            const res = await authFetch(`/organization/${org.id}/integrations/google-calendar/auth`);
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch { /* ignore */ }
        finally { setConnectingGoogle(false); }
    };

    const handleConnectOutlook = async () => {
        if (!org?.id) return;
        setConnectingOutlook(true);
        try {
            const res = await authFetch(`/organization/${org.id}/integrations/outlook/auth`);
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch { /* ignore */ }
        finally { setConnectingOutlook(false); }
    };

    // ─── Shared UI ────────────────────────────────────────────────────────────
    const tabs = [
        { id: "account", label: "My Account", icon: User, color: "text-blue-500" },
        { id: "organization", label: "Organization", icon: Building2, color: "text-indigo-500" },
        { id: "branding", label: "White-Label Branding", icon: Globe, color: "text-pink-500" },
        { id: "integrations", label: "Integrations", icon: Plug, color: "text-teal-500" },
        { id: "notifications", label: "Notifications", icon: Bell, color: "text-emerald-500" },
        { id: "security", label: "Security", icon: ShieldCheck, color: "text-purple-500" },
        { id: "billing", label: "Billing", icon: CreditCard, color: "text-rose-500" },
    ];

    const inputClasses = "w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400";
    const labelClasses = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";
    const slideVariants = {
        enter: { y: 10, opacity: 0 },
        center: { y: 0, opacity: 1 },
        exit: { y: -10, opacity: 0 }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="relative z-10">
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                    Preferences & Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                    Manage your account, organization, and notification preferences.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                {/* Sidebar */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="p-4 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm space-y-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all group ${isActive ? "text-indigo-700 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                                >
                                    {isActive && (
                                        <motion.div layoutId="settings-tab-bg" className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl" />
                                    )}
                                    <div className="relative z-10 flex items-center gap-3">
                                        <div className={`p-2 rounded-xl transition-colors ${isActive ? "bg-white dark:bg-[#0A0A0A] shadow-sm" : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800"}`}>
                                            <tab.icon className={`w-5 h-5 ${isActive ? tab.color : "text-gray-400"}`} />
                                        </div>
                                        <span className={`font-bold ${isActive ? "text-indigo-700 dark:text-indigo-300" : "group-hover:text-gray-900 dark:group-hover:text-white"}`}>
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
                            <motion.div key={activeTab} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>

                                {/* ── ACCOUNT TAB ── */}
                                {activeTab === "account" && (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                                <User className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Information</h2>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Update your personal details here.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg">
                                            <div className="space-y-2 md:col-span-2">
                                                <label className={labelClasses}>Full Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={accountData.fullName}
                                                        onChange={(e) => setAccountData({ ...accountData, fullName: e.target.value })}
                                                        className={`${inputClasses} pl-10`}
                                                        placeholder="Your full name"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className={labelClasses}>Email Address <span className="text-xs font-normal text-gray-400">(read-only)</span></label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        value={accountData.email}
                                                        readOnly
                                                        className={`${inputClasses} pl-10 opacity-60 cursor-not-allowed`}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400">Email cannot be changed. Contact support if needed.</p>
                                            </div>
                                        </div>

                                        {accountError && (
                                            <p className="text-sm font-medium text-rose-500 flex items-center gap-1.5">
                                                <AlertCircle className="w-4 h-4" /> {accountError}
                                            </p>
                                        )}

                                        <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-3">
                                            {accountSuccess && (
                                                <span className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" /> Saved!
                                                </span>
                                            )}
                                            <button
                                                onClick={handleSaveAccount}
                                                disabled={accountSaving}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${accountSuccess ? "bg-emerald-500 text-white" : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white"} disabled:opacity-60`}
                                            >
                                                {accountSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── ORGANIZATION TAB ── */}
                                {activeTab === "organization" && (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organization</h2>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your multi-tenant workspace.</p>
                                            </div>
                                        </div>

                                        {orgLoading ? (
                                            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span className="font-medium">Loading organization...</span>
                                            </div>
                                        ) : org ? (
                                            <>
                                                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{org.name}</h3>
                                                            {org.domain && <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1"><Globe className="w-3.5 h-3.5" /> {org.domain}</p>}
                                                        </div>
                                                        {org.isVerified ? (
                                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-500/30">
                                                                <AlertCircle className="w-3.5 h-3.5" /> Pending Verification
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        {[
                                                            { label: "Members", value: org.recruiters.length },
                                                            { label: "Active Jobs", value: org._count.jobs },
                                                            { label: "Industry", value: org.industry || "—" }
                                                        ].map(stat => (
                                                            <div key={stat.label} className="text-center p-3 bg-white/60 dark:bg-white/5 rounded-xl">
                                                                <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {!org.isVerified && org.domain && (
                                                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                                                        <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                                                            <ShieldCheck className="w-5 h-5 text-amber-500" /> Verify Domain
                                                        </h4>
                                                        {!verificationToken ? (
                                                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                                                <p className="text-sm text-amber-700 dark:text-amber-400">Your domain <strong>{org.domain}</strong> is not verified.</p>
                                                                <button onClick={handleInitiateVerification} disabled={domainActionLoading} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition shrink-0 flex items-center gap-2">
                                                                    {domainActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                                                    Initiate Verification
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <form onSubmit={handleVerifyDomain} className="space-y-3">
                                                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                                                    Dev Token: <span className="font-mono bg-white/50 px-1 rounded">{verificationToken}</span>
                                                                </p>
                                                                <div className="flex gap-3 max-w-sm">
                                                                    <input type="text" value={enteredToken} onChange={e => setEnteredToken(e.target.value)} placeholder="6-digit token" className={inputClasses} required />
                                                                    <button type="submit" disabled={domainActionLoading || !enteredToken} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition shrink-0 flex items-center gap-2 justify-center">
                                                                        {domainActionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Verify
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        )}
                                                        {verifyError && <p className="text-sm text-rose-500 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {verifyError}</p>}
                                                    </div>
                                                )}

                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-500" /> Invite a Team Member</h4>
                                                    <form onSubmit={handleInvite} className="flex gap-3 items-end">
                                                        <div className="flex-1 space-y-2">
                                                            <label className={labelClasses}>Email Address</label>
                                                            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" className={inputClasses} required />
                                                        </div>
                                                        <div className="w-48 space-y-2">
                                                            <label className={labelClasses}>Role</label>
                                                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className={inputClasses}>
                                                                {["ADMIN", "HR", "HIRING_MANAGER", "INTERVIEWER", "RECRUITER"].map(r => (
                                                                    <option key={r} value={r}>{r.replace("_", " ")}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <button type="submit" disabled={inviting} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60 shrink-0">
                                                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                            Invite
                                                        </button>
                                                    </form>
                                                    {inviteSuccess && <p className="text-sm font-medium text-emerald-500 mt-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Member invited!</p>}
                                                    {inviteError && <p className="text-sm font-medium text-rose-500 mt-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {inviteError}</p>}
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> Team Members ({org.recruiters.length})</h4>
                                                    <div className="space-y-3">
                                                        {org.recruiters.map((member) => {
                                                            const RoleIcon = ROLE_ICONS[member.orgRole] || User;
                                                            return (
                                                                <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-2xl">
                                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                                        {member.user?.name?.charAt(0)?.toUpperCase() || "?"}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-gray-900 dark:text-white truncate">{member.user?.name || "Unknown"}</p>
                                                                        <p className="text-xs text-gray-500 truncate">{member.user?.email}</p>
                                                                    </div>
                                                                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-bold ${ROLE_COLORS[member.orgRole] || ROLE_COLORS.RECRUITER}`}>
                                                                        <RoleIcon className="w-3 h-3" />
                                                                        {member.orgRole.replace("_", " ")}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="py-4">
                                                <div className="p-6 mb-8 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                                    <div className="flex gap-3">
                                                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="font-bold text-amber-800 dark:text-amber-300">You're not in an organization yet</p>
                                                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">Create one to unlock multi-seat hiring workflows, shared job access, and team analytics.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 text-lg">
                                                    <Building2 className="w-5 h-5 text-indigo-500" /> Create Your Organization
                                                </h4>
                                                <form onSubmit={handleCreateOrg} className="space-y-5 max-w-lg">
                                                    <div className="space-y-2">
                                                        <label className={labelClasses}>Organization Name *</label>
                                                        <input type="text" value={newOrgData.name} onChange={e => setNewOrgData({ ...newOrgData, name: e.target.value })} placeholder="Acme Corp" className={inputClasses} required />
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-2">
                                                            <label className={labelClasses}>Primary Domain</label>
                                                            <div className="relative">
                                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                <input type="text" value={newOrgData.domain} onChange={e => setNewOrgData({ ...newOrgData, domain: e.target.value })} placeholder="acme.com" className={`${inputClasses} pl-10`} />
                                                            </div>
                                                            <p className="text-[10px] text-gray-500">Other details (Industry, Size, Website) will be pulled from your Company Profile.</p>
                                                        </div>
                                                    </div>
                                                    {createOrgError && (
                                                        <p className="text-sm font-medium text-rose-500 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {createOrgError}</p>
                                                    )}
                                                    <button type="submit" disabled={creatingOrg || !newOrgData.name.trim()} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60">
                                                        {creatingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                                                        Create Organization
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── BRANDING TAB ── */}
                                {activeTab === "branding" && (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-full bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center">
                                                <Globe className="w-6 h-6 text-pink-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">White-Label Branding</h2>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Customize the platform to match your brand identity.</p>
                                            </div>
                                        </div>

                                        {orgLoading ? (
                                            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span className="font-medium">Loading organization data...</span>
                                            </div>
                                        ) : !org ? (
                                            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                                <div className="flex gap-3">
                                                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-bold text-amber-800 dark:text-amber-300">Organization Required</p>
                                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">Create an organization first to configure white-label branding.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSaveBranding} className="space-y-6">
                                                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/10">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">Enable White-Label Mode</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Remove SmartCareerAI branding for a seamless candidate experience.</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                        <input type="checkbox" className="sr-only peer" checked={brandingData.isWhiteLabel} onChange={(e) => setBrandingData({ ...brandingData, isWhiteLabel: e.target.checked })} />
                                                        <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:shadow-sm after:transition-all peer-checked:bg-pink-500 transition-colors"></div>
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClasses}>Custom Domain <span className="text-xs text-gray-500 font-normal">(Enterprise Only)</span></label>
                                                        <input type="text" value={brandingData.customDomain} onChange={(e) => setBrandingData({ ...brandingData, customDomain: e.target.value })} className={inputClasses} placeholder="careers.yourcompany.com" disabled={!brandingData.isWhiteLabel} />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className={labelClasses}>Company Logo</label>
                                                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-xl">
                                                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden p-1 shadow-sm">
                                                                {org.logoUrl ? (
                                                                    <img src={org.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <Building2 className="w-6 h-6 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Profile Logo</p>
                                                                <Link href="/recruiter/profile" className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold underline transition-colors">
                                                                    Update in Company Profile
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <label className={labelClasses}>Primary Theme Color</label>
                                                        <div className="flex gap-3">
                                                            <input type="color" value={brandingData.theme?.primaryColor || "#4f46e5"} onChange={(e) => setBrandingData({ ...brandingData, theme: { ...brandingData.theme, primaryColor: e.target.value } })} className="h-12 w-20 p-1 rounded-xl cursor-pointer bg-white border border-gray-200 dark:bg-[#111827] dark:border-gray-800 disabled:opacity-50" disabled={!brandingData.isWhiteLabel} />
                                                            <input type="text" value={brandingData.theme?.primaryColor || "#4f46e5"} onChange={(e) => setBrandingData({ ...brandingData, theme: { ...brandingData.theme, primaryColor: e.target.value } })} className={`${inputClasses} flex-1 font-mono uppercase`} placeholder="#4f46e5" disabled={!brandingData.isWhiteLabel} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                                                    {brandingSuccess && <span className="text-sm font-bold text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Branding Updated</span>}
                                                    <button type="submit" disabled={brandingSaving || !org} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-pink-600 hover:bg-pink-700 text-white transition disabled:opacity-60">
                                                        {brandingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        Save Branding
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {/* ── NOTIFICATIONS TAB ── */}
                                {activeTab === "notifications" && (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                                <Bell className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Notifications</h2>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Control what alerts you receive. Preferences are saved automatically.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { id: "newApplications" as const, label: "New Job Applications", desc: "Get notified when a candidate applies to your jobs." },
                                                { id: "messages" as const, label: "Direct Messages", desc: "Receive an email when a candidate messages you." },
                                                { id: "platformUpdates" as const, label: "Platform Updates", desc: "News about product features and improvements." },
                                                { id: "marketing" as const, label: "Marketing & Promotions", desc: "Tips for hiring and promotional content." },
                                            ].map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                                                    <div className="pr-4">
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{item.label}</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={notifications[item.id]}
                                                            onChange={() => handleToggleNotif(item.id)}
                                                        />
                                                        <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:shadow-sm after:transition-all peer-checked:bg-emerald-500 transition-colors"></div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── INTEGRATIONS TAB ── */}
                                {activeTab === "integrations" && (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                                                <Plug className="w-6 h-6 text-teal-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h2>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Connect external tools to streamline your recruitment workflow.</p>
                                            </div>
                                        </div>

                                        {/* Sub-tabs Navigation */}
                                        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit mb-8">
                                            {[
                                                { id: "calendar" as const, label: "Calendar", icon: Calendar },
                                                { id: "ats" as const, label: "ATS Integration", icon: Link2 },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveIntegrationTab(tab.id)}
                                                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                                                        activeIntegrationTab === tab.id
                                                            ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm"
                                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                    }`}
                                                >
                                                    <tab.icon className="w-4 h-4" />
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>

                                        {activeIntegrationTab === "calendar" && (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Calendar Services</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Auto-schedule interviews and generate meeting links.</p>
                                                </div>

                                                {!org && (
                                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                        You need to create an Organization first before connecting calendars.
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02] space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                                                                <Calendar className="w-5 h-5 text-[#4285F4]" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 dark:text-white">Google Calendar</h3>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">Schedule with auto-generated Google Meet links</p>
                                                            </div>
                                                        </div>
                                                        {calendarStatusLoading ? (
                                                            <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Checking status...</div>
                                                        ) : calendarStatus?.connected && calendarStatus.platform === "google" ? (
                                                            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle className="w-4 h-4" /> Connected</div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-sm text-gray-400"><XCircle className="w-4 h-4" /> Not connected</div>
                                                        )}
                                                        <button onClick={handleConnectGoogle} disabled={!org || connectingGoogle || (calendarStatus?.connected && calendarStatus.platform === "google")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4285F4] hover:bg-[#3367d6] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                            {connectingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                                                            {calendarStatus?.connected && calendarStatus.platform === "google" ? "Reconnect Google Calendar" : "Connect Google Calendar"}
                                                        </button>
                                                    </div>

                                                    <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02] space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                                                                <Calendar className="w-5 h-5 text-[#0078D4]" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 dark:text-white">Microsoft 365</h3>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">Schedule with auto-generated Teams links</p>
                                                            </div>
                                                        </div>
                                                        {calendarStatusLoading ? (
                                                            <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Checking status...</div>
                                                        ) : calendarStatus?.connected && calendarStatus.platform === "outlook" ? (
                                                            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle className="w-4 h-4" /> Connected</div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-sm text-gray-400"><XCircle className="w-4 h-4" /> Not connected</div>
                                                        )}
                                                        <button onClick={handleConnectOutlook} disabled={!org || connectingOutlook || (calendarStatus?.connected && calendarStatus.platform === "outlook")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#006ab8] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                            {connectingOutlook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                                                            {calendarStatus?.connected && calendarStatus.platform === "outlook" ? "Reconnect Microsoft 365" : "Connect Microsoft 365"}
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    After connecting, you can schedule interviews directly from the candidate pipeline with auto-generated meeting links.
                                                </p>
                                            </div>
                                        )}

                                        {activeIntegrationTab === "ats" && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">External ATS Platforms</h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Sync candidates bidirectionally with your existing ATS.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowAtsForm(!showAtsForm)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Add Integration
                                                    </button>
                                                </div>

                                                {showAtsForm && (
                                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-2xl gap-4 flex flex-col">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <label className={labelClasses}>Provider</label>
                                                                <select
                                                                    value={atsForm.provider}
                                                                    onChange={e => setAtsForm({ ...atsForm, provider: e.target.value })}
                                                                    className={inputClasses}
                                                                >
                                                                    {ATS_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className={labelClasses}>Outbound Webhook URL</label>
                                                                <input
                                                                    type="url"
                                                                    value={atsForm.outboundUrl}
                                                                    onChange={e => setAtsForm({ ...atsForm, outboundUrl: e.target.value })}
                                                                    placeholder="https://your-ats.com/webhook"
                                                                    className={inputClasses}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className={labelClasses}>API Key (Optional)</label>
                                                                <input
                                                                    type="password"
                                                                    value={atsForm.apiKey}
                                                                    onChange={e => setAtsForm({ ...atsForm, apiKey: e.target.value })}
                                                                    placeholder="Bearer token or API key"
                                                                    className={inputClasses}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleAtsSave}
                                                                disabled={atsSaving}
                                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                                                            >
                                                                {atsSaving ? "Saving..." : "Save Integration"}
                                                            </button>
                                                            <button
                                                                onClick={() => setShowAtsForm(false)}
                                                                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Inbound URL helper */}
                                                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Inbound Webhook URL</span>
                                                        <button
                                                            onClick={() => handleCopyWebhookUrl("generic")}
                                                            className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 transition-colors font-bold"
                                                        >
                                                            {urlCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                            {urlCopied ? "Copied!" : "Copy URL"}
                                                        </button>
                                                    </div>
                                                    <code className="block text-[11px] text-gray-500 dark:text-gray-400 break-all bg-white dark:bg-black/20 p-2 rounded-lg border border-indigo-500/10">
                                                        {typeof window !== "undefined" ? window.location.origin : ""}/api/v1/recruiter/webhooks/ats/{"{provider}"}
                                                    </code>
                                                    <p className="text-[10px] text-gray-400">Replace {"{provider}"} with: workday, sap, zoho, keka, generic</p>
                                                </div>

                                                {/* ATS Configs List */}
                                                {atsLoading ? (
                                                    <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading configurations...</div>
                                                ) : atsConfigs.length === 0 ? (
                                                    <div className="p-10 text-center rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                                        <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                                        <p className="text-gray-500 text-sm font-medium">No ATS integrations configured yet.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {atsConfigs.map(cfg => (
                                                            <div key={cfg.id} className="p-5 bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm space-y-4">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-lg font-bold text-gray-900 dark:text-white capitalize">{cfg.provider.toLowerCase()}</span>
                                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${cfg.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                                                                                {cfg.isActive ? "Active" : "Inactive"}
                                                                            </span>
                                                                        </div>
                                                                        {cfg.outboundUrl && (
                                                                            <p className="text-xs text-gray-400 break-all">{cfg.outboundUrl}</p>
                                                                        )}
                                                                        {atsTestResult[cfg.id] && (
                                                                            <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${atsTestResult[cfg.id].ok ? "text-emerald-500" : "text-rose-500"}`}>
                                                                                {atsTestResult[cfg.id].ok ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                                                {atsTestResult[cfg.id].msg}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleAtsTest(cfg.id)}
                                                                            disabled={atsTesting === cfg.id}
                                                                            className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold transition-colors"
                                                                        >
                                                                            {atsTesting === cfg.id ? "Testing..." : "Test Webhook"}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAtsDelete(cfg.id)}
                                                                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {/* Logs summary */}
                                                                {cfg.logs?.length > 0 && (
                                                                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 gap-2">
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Logs</span>
                                                                        {cfg.logs.slice(0, 3).map((log, i) => (
                                                                            <div key={i} className="flex items-center justify-between text-[10px] font-medium">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={log.status === "SUCCESS" ? "text-emerald-500" : "text-rose-500"}>{log.status}</span>
                                                                                    <span className="text-gray-500">{log.direction}</span>
                                                                                </div>
                                                                                <span className="text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── SECURITY TAB ── */}
                                {activeTab === "security" && (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                                                <ShieldCheck className="w-6 h-6 text-purple-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Password</h2>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">Keep your account secure with a strong password.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-5 max-w-md">
                                            {[
                                                { field: "currentPassword" as const, label: "Current Password" },
                                                { field: "newPassword" as const, label: "New Password" },
                                                { field: "confirmPassword" as const, label: "Confirm New Password" },
                                            ].map(({ field, label }) => (
                                                <div key={field} className="space-y-2">
                                                    <label className={labelClasses}>{label}</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="password"
                                                            value={securityData[field]}
                                                            onChange={(e) => setSecurityData({ ...securityData, [field]: e.target.value })}
                                                            className={`${inputClasses} pl-10`}
                                                            placeholder="••••••••"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {securityError && (
                                            <p className="text-sm font-medium text-rose-500 flex items-center gap-1.5 max-w-md">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {securityError}
                                            </p>
                                        )}

                                        <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 max-w-md">
                                            {securitySuccess && (
                                                <span className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" /> Password changed!
                                                </span>
                                            )}
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={securitySaving}
                                                className={`ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${securitySuccess ? "bg-emerald-500 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"} disabled:opacity-60`}
                                            >
                                                {securitySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                Change Password
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── BILLING TAB ── */}
                                {activeTab === "billing" && (
                                    <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
                                        <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-2">
                                            <CreditCard className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Billing Settings</h2>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">Your account is currently managed by your enterprise plan. Contact support to modify your billing details.</p>
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
