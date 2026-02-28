"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    MoreVertical,
    MapPin,
    DollarSign,
    Clock,
    Briefcase,
    Building2,
    CheckCircle2,
    Users,
    Trash2,
    EyeOff,
    Eye
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface Job {
    id: string;
    title: string;
    location: string;
    locationType: string;
    salaryMin?: number;
    salaryMax?: number;
    isActive: boolean;
    createdAt: string;
    _count?: {
        applications: number;
    };
    applicantCount?: number;
    stageBreakdown?: {
        APPLIED: number;
        SCREENING: number;
        INTERVIEWING: number;
        OFFER: number;
        REJECTED: number;
    };
}

export default function JobPostingsPage() {
    const { user } = useAuthStore();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = async () => {
        try {
            const response = await authFetch(`/recruiter/jobs`);

            if (response.ok) {
                const data = await response.json();
                setJobs(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchJobs();
    }, [user]);

    const toggleStatus = async (jobId: string) => {
        try {
            // Optimistic update
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, isActive: !j.isActive } : j));

            const response = await authFetch(`/recruiter/jobs/${jobId}/toggle`, {
                method: 'PUT'
            });
            if (!response.ok) {
                // Revert on error
                fetchJobs();
            }
        } catch (err) {
            console.error(err);
            fetchJobs();
        }
    };

    const deleteJob = async (jobId: string) => {
        if (!confirm("Are you sure you want to permanently delete this job posting? This action cannot be undone.")) return;
        try {
            const response = await authFetch(`/recruiter/jobs/${jobId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setJobs(prev => prev.filter(j => j.id !== jobId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Job Postings...</p>
            </div>
        );
    }

    const activeJobsCount = jobs.filter(j => j.isActive).length;
    const closedJobsCount = jobs.filter(j => !j.isActive).length;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                        Job Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Create, track, and manage all your role postings.</p>
                </div>

                <Link
                    href="/recruiter/post-job"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Post New Job
                </Link>
            </div>

            {/* Quick Stats */}
            {jobs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Postings</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{jobs.length}</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Active Roles</p>
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{activeJobsCount}</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                            <EyeOff className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Closed Roles</p>
                            <p className="text-3xl font-black text-gray-600 dark:text-gray-300 leading-none">{closedJobsCount}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Job Listings */}
            {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] gap-5 text-center px-4 bg-white dark:bg-[#111827] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 shadow-sm relative z-10">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-2 shadow-inner">
                        <Briefcase className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No active postings</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                            You haven't posted any jobs yet. Create your first listing to start receiving candidates.
                        </p>
                        <Link
                            href="/recruiter/post-job"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Post Your First Job
                        </Link>
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 gap-6 relative z-10"
                >
                    <AnimatePresence>
                        {jobs.map(job => (
                            <motion.div
                                key={job.id}
                                variants={itemVariants}
                                layout
                                className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border ${job.isActive ? "border-indigo-100 dark:border-indigo-500/20 shadow-md" : "border-gray-100 dark:border-white/5 opacity-75 shadow-sm"} hover:shadow-xl hover:border-indigo-500/30 transition-all group relative overflow-hidden`}
                            >
                                {/* Active indicator gradient line */}
                                {job.isActive && (
                                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-l-3xl" />
                                )}

                                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                                    {/* Left side: Job details */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {job.title}
                                            </h3>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${job.isActive
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                                }`}>
                                                {job.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                {job.isActive ? 'Active' : 'Closed'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {job.location} <span className="opacity-60 capitalize">({job.locationType})</span>
                                                </span>
                                            </div>

                                            {(job.salaryMin || job.salaryMax) && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                        <DollarSign className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    Posted {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>

                                            {job._count !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                        <Users className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        {job._count.applications} Applicants
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right side: Actions */}
                                    <div className="flex flex-col gap-3 lg:border-l border-gray-100 dark:border-white/10 lg:pl-6 pt-4 lg:pt-0 border-t lg:border-t-0 min-w-[160px]">
                                        {/* Pipeline CTA */}
                                        <Link
                                            href={`/recruiter/jobs/${job.id}`}
                                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
                                        >
                                            <Users className="w-4 h-4" /> View Pipeline
                                        </Link>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleStatus(job.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all flex-1 justify-center ${job.isActive
                                                    ? 'bg-white dark:bg-[#111827] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm'
                                                    : 'bg-white dark:bg-[#111827] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm'
                                                    }`}
                                            >
                                                {job.isActive ? (
                                                    <><EyeOff className="w-3.5 h-3.5" /> Pause</>
                                                ) : (
                                                    <><Eye className="w-3.5 h-3.5" /> Re-open</>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => deleteJob(job.id)}
                                                className="p-2 text-gray-400 hover:text-rose-600 bg-gray-50 dark:bg-white/5 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all shadow-sm"
                                                title="Delete Job"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
