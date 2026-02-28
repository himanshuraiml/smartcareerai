"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Save,
    Building,
    MapPin,
    Globe,
    Users,
    Camera,
    UploadCloud,
    CheckCircle2,
    Briefcase,
    AlignLeft,
    Loader2,
    AlertCircle
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface RecruiterProfile {
    companyName: string;
    companyLogo: string;
    companySize: string;
    industry: string;
    website: string;
    location: string;
}

export default function CompanyProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [profile, setProfile] = useState<RecruiterProfile>({
        companyName: "",
        companyLogo: "",
        companySize: "51-200",
        industry: "",
        website: "",
        location: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authFetch("/recruiter/profile");
                const data = await res.json();
                if (data.success && data.data) {
                    const r = data.data;
                    setProfile({
                        companyName: r.companyName || "",
                        companyLogo: r.companyLogo || "",
                        companySize: r.companySize || "51-200",
                        industry: r.industry || "",
                        website: r.website || "",
                        location: r.location || "",
                    });
                }
            } catch {
                setError("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await authFetch("/recruiter/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyName: profile.companyName,
                    companyLogo: profile.companyLogo,
                    companySize: profile.companySize,
                    industry: profile.industry,
                    website: profile.website,
                    location: profile.location,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save profile");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    const inputClasses = "w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400";
    const labelClasses = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto flex items-center justify-center py-32 gap-3 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-medium">Loading profile...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">

            {/* Header */}
            <div className="relative z-10">
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                    Company Profile
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                    Manage your public branding to attract the best talent.
                </p>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-8 relative z-10"
            >
                {/* Logo & Identity Section */}
                <motion.div variants={itemVariants} className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Brand Identity
                    </h2>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                        <div className="relative group shrink-0">
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg">
                                <div className="w-full h-full rounded-[14px] bg-white dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                    {profile.companyLogo ? (
                                        <img src={profile.companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                    )}

                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                                        <UploadCloud className="w-6 h-6 text-white mb-1" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Update</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left pt-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Company Logo URL</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto sm:mx-0">
                                This logo will be displayed on all your job postings and company page. Provide a public URL to your image.
                            </p>
                            <div className="relative max-w-sm mx-auto sm:mx-0">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={profile.companyLogo}
                                    onChange={(e) => setProfile({ ...profile, companyLogo: e.target.value })}
                                    className={`${inputClasses} pl-10 focus:ring-indigo-500/20 focus:border-indigo-500`}
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Core Details Section */}
                <motion.div variants={itemVariants} className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Company Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className={labelClasses}>Company Name</label>
                            <div className="relative">
                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <input
                                    type="text"
                                    value={profile.companyName}
                                    onChange={e => setProfile({ ...profile, companyName: e.target.value })}
                                    className={`${inputClasses} focus:ring-emerald-500/20 focus:border-emerald-500`}
                                    placeholder="Acme Corp"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Website URL</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <input
                                    type="url"
                                    value={profile.website}
                                    onChange={e => setProfile({ ...profile, website: e.target.value })}
                                    className={`${inputClasses} focus:ring-emerald-500/20 focus:border-emerald-500`}
                                    placeholder="https://yourcompany.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Headquarters Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <input
                                    type="text"
                                    value={profile.location}
                                    onChange={e => setProfile({ ...profile, location: e.target.value })}
                                    className={`${inputClasses} focus:ring-emerald-500/20 focus:border-emerald-500`}
                                    placeholder="San Francisco, CA"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Industry</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <input
                                    type="text"
                                    value={profile.industry}
                                    onChange={e => setProfile({ ...profile, industry: e.target.value })}
                                    className={`${inputClasses} focus:ring-emerald-500/20 focus:border-emerald-500`}
                                    placeholder="Technology"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className={labelClasses}>Company Size</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <select
                                    value={profile.companySize}
                                    onChange={e => setProfile({ ...profile, companySize: e.target.value })}
                                    className={`${inputClasses} focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none`}
                                >
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="500+">500+ employees</option>
                                </select>
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 text-xs">▼</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* About Section */}
                <motion.div variants={itemVariants} className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                            <AlignLeft className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        About Us
                    </h2>

                    <div className="space-y-2">
                        <label className={labelClasses}>Description</label>
                        <textarea
                            value={""}
                            readOnly
                            className={`${inputClasses} pl-4 h-40 resize-none custom-scrollbar focus:ring-purple-500/20 focus:border-purple-500 opacity-50 cursor-not-allowed`}
                            placeholder="Company description is managed via your Organization settings."
                        />
                        <p className="text-xs font-medium text-gray-400 mt-1">
                            Manage full company description in <span className="text-indigo-500 font-bold">Settings → Organization</span>.
                        </p>
                    </div>
                </motion.div>

                {/* Error message */}
                {error && (
                    <motion.div variants={itemVariants} className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}

                {/* Save Button */}
                <motion.div variants={itemVariants} className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${success
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white hover:shadow-indigo-500/25"
                            } disabled:opacity-75 disabled:cursor-wait`}
                    >
                        <AnimatePresence mode="wait">
                            {saving ? (
                                <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Saving...</span>
                                </motion.div>
                            ) : success ? (
                                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Saved!</span>
                                </motion.div>
                            ) : (
                                <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                    <Save className="w-5 h-5" />
                                    <span>Save Profile</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </motion.div>

            </motion.div>
        </div>
    );
}
