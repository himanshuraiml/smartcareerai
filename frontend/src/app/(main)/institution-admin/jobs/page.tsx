"use client";

import { useEffect, useState } from "react";
import {
    Briefcase,
    CheckCircle,
    XCircle,
    Clock,
    Building,
    MapPin,
    RefreshCw,
    ExternalLink,
    AlertCircle,
    ChevronRight,
    Users
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { motion, AnimatePresence } from "framer-motion";

interface RecruiterJobApproval {
    id: string;
    title: string;
    location: string;
    locationType: string;
    requiredSkills: string[];
    description: string;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    recruiter: {
        companyName: string;
        companyLogo?: string;
        industry?: string;
        isVerified: boolean;
    };
}

const statusConfig = {
    PENDING: { label: "Pending", icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
    APPROVED: { label: "Approved", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
    REJECTED: { label: "Rejected", icon: XCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20" },
};

export default function InstitutionJobsPage() {
    const { user } = useAuthStore();
    const [jobs, setJobs] = useState<RecruiterJobApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`/admin/institution/jobs?status=${activeTab}`);
            if (!res.ok) throw new Error("Failed to fetch jobs");
            const result = await res.json();
            setJobs(result.data || []);
        } catch (err) {
            console.error("Error:", err);
            setError("Failed to load job postings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchJobs();
    }, [user, activeTab]);

    const handleApproval = async (jobId: string, action: "APPROVED" | "REJECTED") => {
        setActionLoading(jobId);
        try {
            const res = await authFetch(`/admin/institution/jobs/${jobId}/approval`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action }),
            });
            if (!res.ok) throw new Error("Failed to update approval");
            showToast(
                action === "APPROVED" ? "Job approved for your students!" : "Job rejected.",
                action === "APPROVED" ? "success" : "error"
            );
            // Remove from current view after short delay for animation
            setTimeout(() => {
                setJobs((prev) => prev.filter((j) => j.id !== jobId));
            }, 300);
        } catch (err) {
            console.error("Error:", err);
            showToast("Failed to update approval status. Please try again.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const tabs: Array<{ key: "PENDING" | "APPROVED" | "REJECTED"; label: string; icon: React.ElementType }> = [
        { key: "PENDING", label: "Pending Review", icon: Clock },
        { key: "APPROVED", label: "Approved Jobs", icon: CheckCircle },
        { key: "REJECTED", label: "Rejected Jobs", icon: XCircle },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
        exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } }
    };

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className={`fixed top-6 left-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold backdrop-blur-md border ${toast.type === "success"
                            ? "bg-emerald-500/90 text-white border-emerald-400"
                            : "bg-rose-500/90 text-white border-rose-400"
                            }`}
                    >
                        {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                        Job Board Approvals
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-emerald-500" />
                        Curate opportunities for your campus
                    </p>
                </div>
                <button
                    onClick={fetchJobs}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`} />
                    Sync Feed
                </button>
            </div>

            {/* Premium Tabs */}
            <div className="bg-white dark:bg-[#111827] p-1.5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm inline-flex flex-wrap md:flex-nowrap w-full md:w-auto overflow-hidden">
                {tabs.map(({ key, label, icon: Icon }) => {
                    const isActive = activeTab === key;
                    const count = jobs.length; // Only accurate for current active tab but visual indicator works

                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 md:flex-none relative flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${isActive
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabBg"
                                    className="absolute inset-0 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"
                                    transition={{ type: "spring" as const, bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className="relative z-10 flex items-center gap-2.5">
                                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-500" : ""}`} />
                                {label}
                                {isActive && !loading && !error && count > 0 && (
                                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-[10px] text-emerald-700 dark:text-emerald-400 shadow-sm ml-1">
                                        {count}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                            <div className="absolute inset-2 rounded-full border-r-2 border-teal-500 animate-spin flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Opportunities...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-5 text-center px-4 bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="w-20 h-20 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shadow-inner">
                            <AlertCircle className="w-10 h-10 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Interrupted</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">{error}</p>
                            <button onClick={fetchJobs} className="px-6 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-center px-4 bg-white dark:bg-[#111827] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                        <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-white/[0.02] flex items-center justify-center mb-2">
                            <Briefcase className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Queue Empty</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            {activeTab === "PENDING"
                                ? "You're all caught up! No jobs currently waiting for your review."
                                : activeTab === "APPROVED"
                                    ? "You haven't approved any jobs yet. They will appear here once approved."
                                    : "No jobs have been rejected."}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {jobs.map((job) => {
                                const status = statusConfig[job.approvalStatus];
                                const StatusIcon = status.icon;

                                return (
                                    <motion.div
                                        key={job.id}
                                        variants={itemVariants}
                                        layout
                                        className="group flex flex-col p-6 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden"
                                    >
                                        {/* Decorative gradient blob */}
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-colors duration-500 pointer-events-none" />

                                        {/* Header area with company info and status badge */}
                                        <div className="relative flex items-start justify-between mb-6 z-10 w-full">
                                            <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:border-emerald-500/30 transition-colors">
                                                    {job.recruiter.companyLogo ? (
                                                        <img src={job.recruiter.companyLogo} alt="" className="w-10 h-10 object-contain" />
                                                    ) : (
                                                        <Building className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-base font-bold text-gray-900 dark:text-white truncate">{job.recruiter.companyName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                                            {job.recruiter.industry || "Software"}
                                                        </p>
                                                        {job.recruiter.isVerified && (
                                                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500" title="Verified Employer">
                                                                <CheckCircle className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0">
                                                {activeTab !== "PENDING" && (
                                                    <span className={`inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${status.bg} ${status.color} shadow-sm`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">{status.label}</span>
                                                    </span>
                                                )}
                                                {activeTab === "PENDING" && (
                                                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-200 dark:border-amber-500/20">
                                                        <Clock className="w-4 h-4 text-amber-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Job Title & Meta */}
                                        <div className="relative z-10 mb-5">
                                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {job.title}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="truncate max-w-[100px]">{job.location}</span>
                                                </div>
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold text-indigo-700 dark:text-indigo-400 capitalize">
                                                    {job.locationType}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description snippet */}
                                        <div className="relative z-10 flex-1 mb-6">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                                                {job.description}
                                            </p>
                                        </div>

                                        {/* Required Skills */}
                                        <div className="relative z-10 mb-6">
                                            <div className="flex flex-wrap gap-1.5">
                                                {job.requiredSkills.slice(0, 4).map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {job.requiredSkills.length > 4 && (
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                                                        +{job.requiredSkills.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent mb-5 relative z-10" />

                                        {/* Actions Footer */}
                                        <div className="relative z-10 flex items-center justify-between mt-auto">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                Added {new Date(job.createdAt).toLocaleDateString()}
                                            </span>

                                            {job.approvalStatus === "PENDING" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApproval(job.id, "REJECTED")}
                                                        disabled={actionLoading === job.id}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-rose-50 dark:bg-white/[0.02] dark:hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 transition-all shadow-sm"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproval(job.id, "APPROVED")}
                                                        disabled={actionLoading === job.id}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                                                    >
                                                        {actionLoading === job.id ? (
                                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white dark:border-gray-500/40 dark:border-t-gray-900 rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4" />
                                                                Approve
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            {activeTab !== "PENDING" && (
                                                <button className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 group/btn">
                                                    View Details
                                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
