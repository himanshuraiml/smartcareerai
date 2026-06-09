"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    Bell, Mail, Phone, Moon, Clock, Globe, ArrowLeft, Loader2, Save, Check, AlertCircle, ShieldCheck, HelpCircle
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { useAuthStore } from "@/store/auth.store";

// Common timezones list
const TIMEZONES = [
    { value: "Asia/Kolkata", label: "India Standard Time (IST) - Asia/Kolkata" },
    { value: "UTC", label: "Coordinated Universal Time (UTC)" },
    { value: "America/New_York", label: "Eastern Time (EST/EDT) - America/New_York" },
    { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT) - America/Los_Angeles" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT/BST) - Europe/London" },
    { value: "Asia/Singapore", label: "Singapore Time (SGT) - Asia/Singapore" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AEST/AEDT) - Australia/Sydney" }
];

export default function NotificationSettingsPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Channel toggles
    const [inAppEnabled, setInAppEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);

    // Category toggles
    const [streakAlerts, setStreakAlerts] = useState(true);
    const [leagueAlerts, setLeagueAlerts] = useState(true);
    const [challengeAlerts, setChallengeAlerts] = useState(true);
    const [masteryAlerts, setMasteryAlerts] = useState(true);
    const [communityAlerts, setCommunityAlerts] = useState(true);
    const [systemAlerts, setSystemAlerts] = useState(true);

    // Quiet hours
    const [quietHoursStart, setQuietHoursStart] = useState<string>("");
    const [quietHoursEnd, setQuietHoursEnd] = useState<string>("");
    const [timezone, setTimezone] = useState("Asia/Kolkata");

    // WhatsApp flow
    const [whatsappPhone, setWhatsappPhone] = useState("");
    const [currentWhatsappPhone, setCurrentWhatsappPhone] = useState<string | null>(null);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [otpSentPhone, setOtpSentPhone] = useState("");
    const [sandboxOtp, setSandboxOtp] = useState<string | null>(null); // For local testing helper

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch("/notifications/preferences");
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    const prefs = result.data;
                    setInAppEnabled(prefs.inAppEnabled);
                    setEmailEnabled(prefs.emailEnabled);
                    setWhatsappEnabled(prefs.whatsappEnabled);
                    setPushEnabled(prefs.pushEnabled);
                    setStreakAlerts(prefs.streakAlerts);
                    setLeagueAlerts(prefs.leagueAlerts);
                    setChallengeAlerts(prefs.challengeAlerts);
                    setMasteryAlerts(prefs.masteryAlerts);
                    setCommunityAlerts(prefs.communityAlerts);
                    setSystemAlerts(prefs.systemAlerts);
                    setQuietHoursStart(prefs.quietHoursStart || "");
                    setQuietHoursEnd(prefs.quietHoursEnd || "");
                    setTimezone(prefs.timezone || "Asia/Kolkata");
                    setCurrentWhatsappPhone(prefs.whatsappPhone || null);
                    if (prefs.whatsappPhone) {
                        setWhatsappPhone(prefs.whatsappPhone);
                    }
                }
            } else {
                setError("Failed to load your notification preferences.");
            }
        } catch (err) {
            console.error("Failed to fetch notification preferences:", err);
            setError("A network error occurred while loading preferences.");
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        setSaving(true);
        setSuccess(false);
        setError(null);

        const payload = {
            inAppEnabled,
            emailEnabled,
            whatsappEnabled,
            pushEnabled,
            streakAlerts,
            leagueAlerts,
            challengeAlerts,
            masteryAlerts,
            communityAlerts,
            systemAlerts,
            quietHoursStart: quietHoursStart || null,
            quietHoursEnd: quietHoursEnd || null,
            timezone
        };

        try {
            const res = await authFetch("/notifications/preferences", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
                } else {
                    setError(result.error || "Failed to update preferences.");
                }
            } else {
                setError("Server returned an error. Please try again.");
            }
        } catch (err) {
            console.error("Failed to save notification preferences:", err);
            setError("A network error occurred while saving preferences.");
        } finally {
            setSaving(false);
        }
    };

    const handleSendOtp = async () => {
        if (!whatsappPhone) {
            setError("Please enter a valid phone number.");
            return;
        }

        setOtpLoading(true);
        setError(null);
        setSandboxOtp(null);

        try {
            const res = await authFetch("/notifications/whatsapp/opt-in", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ phone: whatsappPhone })
            });

            const result = await res.json();
            if (res.ok && result.success) {
                setOtpSent(true);
                setOtpSentPhone(whatsappPhone);
                // In sandbox/local dev, the OTP is returned in the response
                if (result.otp) {
                    setSandboxOtp(result.otp);
                }
            } else {
                setError(result.error || "Failed to send verification code.");
            }
        } catch (err) {
            console.error("WhatsApp OTP error:", err);
            setError("Network error: Could not send verification code.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            setError("Please enter the verification code.");
            return;
        }

        setVerifying(true);
        setError(null);

        try {
            const res = await authFetch("/notifications/whatsapp/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ otp })
            });

            const result = await res.json();
            if (res.ok && result.success) {
                setOtpSent(false);
                setOtp("");
                setSandboxOtp(null);
                setWhatsappEnabled(true);
                setCurrentWhatsappPhone(otpSentPhone);
                loadPreferences(); // Reload to refresh fields
            } else {
                setError(result.error || "Invalid verification code.");
            }
        } catch (err) {
            console.error("WhatsApp verification error:", err);
            setError("Network error: Verification failed.");
        } finally {
            setVerifying(false);
        }
    };

    const handleDisableWhatsapp = async () => {
        setSaving(true);
        try {
            const res = await authFetch("/notifications/preferences", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    whatsappEnabled: false
                })
            });

            if (res.ok) {
                setWhatsappEnabled(false);
                loadPreferences();
            }
        } catch (err) {
            console.error("Failed to disable WhatsApp:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading your preferences...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/settings" className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Notification Preferences</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Control how and when you want to receive alerts, reminders, and daily digests.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Channels Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 shadow-sm space-y-5">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Delivery Channels</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enable or disable delivery methods for notifications.</p>
                </div>

                <div className="space-y-4">
                    {/* In App Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3 items-center">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">In-App Alerts</p>
                                <p className="text-xs text-gray-500">Show count badge on bell and list in Notification Center</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={inAppEnabled}
                                onChange={(e) => setInAppEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Email Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3 items-center">
                            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Email Digests & Reports</p>
                                <p className="text-xs text-gray-500">Receive weekly compilation, inactivity warnings, and reports</p>
                            </div>
                        </div>
                        <label className="relative inline-flex inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={emailEnabled}
                                onChange={(e) => setEmailEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Push Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3 items-center">
                            <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Push Notifications</p>
                                <p className="text-xs text-gray-500">Receive desktop/mobile system notifications</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={pushEnabled}
                                onChange={(e) => setPushEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* WhatsApp Verification Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 shadow-sm space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Phone className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                            WhatsApp Instant Alerts
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Get real-time alerts for streak-at-risk warnings, urgent league updates, and quick challenges.
                        </p>
                    </div>
                    {currentWhatsappPhone ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                            NOT CONNECTED
                        </span>
                    )}
                </div>

                {currentWhatsappPhone ? (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-4">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <div>
                                <p className="text-xs font-semibold text-gray-500">Subscribed WhatsApp Number</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{currentWhatsappPhone}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDisableWhatsapp}
                                    className="px-3 py-1.5 rounded-lg border border-red-200/50 hover:border-red-500/30 dark:border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-all"
                                >
                                    Disable
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentWhatsappPhone(null);
                                        setWhatsappPhone("");
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all"
                                >
                                    Change Number
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                            <div>
                                <p className="text-xs font-bold text-gray-900 dark:text-white">Active Channel Subscription</p>
                                <p className="text-[10px] text-gray-500">Toggle WhatsApp alerts delivery temporarily.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={whatsappEnabled}
                                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">WhatsApp Phone Number</label>
                                <input
                                    type="tel"
                                    value={whatsappPhone}
                                    onChange={(e) => setWhatsappPhone(e.target.value)}
                                    placeholder="+919876543210"
                                    disabled={otpSent}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-950 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSendOtp}
                                disabled={otpLoading || otpSent || !whatsappPhone}
                                className="sm:mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5"
                            >
                                {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Send Verification Code
                            </button>
                        </div>

                        {otpSent && (
                            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.02] space-y-4 animate-in fade-in-50 duration-200">
                                <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Verification Code Sent</p>
                                    <p className="text-[11px] text-gray-500">We've sent a 6-digit OTP code to {otpSentPhone} via WhatsApp.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="Enter 6-digit OTP"
                                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-950 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest text-center"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleVerifyOtp}
                                            disabled={verifying || !otp}
                                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                                        >
                                            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                            Verify & Opt-In
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOtpSent(false);
                                                setSandboxOtp(null);
                                            }}
                                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/5"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>

                                {sandboxOtp && (
                                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-mono flex items-center justify-between">
                                        <span>[SANDBOX MOCK] Code received: <strong>{sandboxOtp}</strong></span>
                                        <button 
                                            onClick={() => setOtp(sandboxOtp)}
                                            className="text-[10px] uppercase font-bold text-blue-500 hover:underline"
                                        >
                                            Autofill
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Categories Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 shadow-sm space-y-5">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Alert Categories</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Choose which events trigger notification deliveries.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Streak Alerts */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Daily Streak Reminders</p>
                            <p className="text-[11px] text-gray-500 leading-normal pr-4">Warn when streak is at risk of resetting</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={streakAlerts}
                                onChange={(e) => setStreakAlerts(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* League Alerts */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">League Updates</p>
                            <p className="text-[11px] text-gray-500 leading-normal pr-4">League demotion warnings and promotion zone alerts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={leagueAlerts}
                                onChange={(e) => setLeagueAlerts(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Challenge Alerts */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Daily Challenges</p>
                            <p className="text-[11px] text-gray-500 leading-normal pr-4">Announcements of new coding challenges & tasks</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={challengeAlerts}
                                onChange={(e) => setChallengeAlerts(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Mastery Alerts */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Skill Mastery Milestones</p>
                            <p className="text-[11px] text-gray-500 leading-normal pr-4">Milestone progress and certificate unlock notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={masteryAlerts}
                                onChange={(e) => setMasteryAlerts(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Community Alerts */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Community & Discussions</p>
                            <p className="text-[11px] text-gray-500 leading-normal pr-4">Updates on group boards, upvotes, and comments</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={communityAlerts}
                                onChange={(e) => setCommunityAlerts(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* System Alerts */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">System Notifications</p>
                            <p className="text-[11px] text-gray-500 leading-normal pr-4">Security alerts, credits purchases, billing issues</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={systemAlerts}
                                onChange={(e) => setSystemAlerts(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Quiet Hours Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 shadow-sm space-y-6">
                <div className="flex gap-3 items-center">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Moon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Do Not Disturb (Quiet Hours)</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Suspend non-urgent alerts during specified hours to protect focus and sleep.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Start Time
                        </label>
                        <input
                            type="time"
                            value={quietHoursStart}
                            onChange={(e) => setQuietHoursStart(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> End Time
                        </label>
                        <input
                            type="time"
                            value={quietHoursEnd}
                            onChange={(e) => setQuietHoursEnd(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" /> Timezone
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer"
                        >
                            {TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value} className="bg-white dark:bg-gray-900 text-gray-950 dark:text-white">
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end items-center gap-4 border-t border-gray-200 dark:border-white/5 pt-6">
                <Link
                    href="/dashboard/settings"
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all"
                >
                    Cancel
                </Link>
                <button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : success ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : success ? "Preferences Saved!" : "Save Preferences"}
                </button>
            </div>
        </div>
    );
}
