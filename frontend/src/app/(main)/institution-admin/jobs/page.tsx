// src/app/(main)/institution-admin/jobs/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Briefcase, Search, Loader2, Filter, Building, MapPin, CheckCircle, XCircle, Info, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/auth-fetch';
import { toast } from 'react-hot-toast';

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    locationType: string;
    requiredSkills: string[];
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    recruiter?: {
        name: string;
        organization?: {
            name: string;
            logoUrl?: string;
        } | null;
    } | null;
    applicantCount: number;
}

interface PreScreenResult {
    id: string;
    name: string;
    email: string;
    isEligible: boolean;
    failedCriteria: string[];
}

export default function JobMarketplacePage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [preScreenResults, setPreScreenResults] = useState<PreScreenResult[]>([]);
    const [loadingPreScreen, setLoadingPreScreen] = useState(false);

    useEffect(() => {
        loadJobs();
    }, [statusFilter]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/university/jobs?status=${statusFilter}`);
            if (res.ok) {
                const data = await res.json();
                setJobs(data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (jobId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await authFetch(`/university/jobs/${jobId}/approval`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                toast.success(`Job ${status === 'APPROVED' ? 'approved' : 'rejected'}`);
                loadJobs();
            }
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const runPreScreen = async (jobId: string) => {
        setLoadingPreScreen(true);
        try {
            const res = await authFetch(`/university/jobs/${jobId}/pre-screen`);
            if (res.ok) {
                const data = await res.json();
                setPreScreenResults(data.data || []);
            }
        } catch (err) {
            toast.error('Failed to run pre-screening');
        } finally {
            setLoadingPreScreen(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                            <Briefcase className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Job Marketplace</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">Review and approve job listings from recruiters for your students.</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/5">
                    {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${statusFilter === status
                                ? 'bg-white dark:bg-gray-800 text-violet-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Job List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-20">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-20 glass rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No {statusFilter.toLowerCase()} jobs found.</p>
                        </div>
                    ) : (
                        jobs.map((job) => (
                            <motion.div
                                key={job.id}
                                layoutId={job.id}
                                onClick={() => setSelectedJob(job)}
                                className={`p-6 rounded-3xl glass border transition-all cursor-pointer ${selectedJob?.id === job.id
                                    ? 'border-violet-500 shadow-lg shadow-violet-500/10'
                                    : 'border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                            {job.recruiter?.organization?.logoUrl ? (
                                                <img src={job.recruiter?.organization?.logoUrl} alt="" className="w-8 h-8 rounded-lg" />
                                            ) : (
                                                <Building className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 dark:text-white leading-tight">{job.title}</h3>
                                            <p className="text-sm text-gray-500 font-bold">{job.recruiter?.organization?.name || 'Unknown Organization'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {job.location} ({job.locationType})
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            Posted {new Date(job.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {job.requiredSkills.slice(0, 4).map(skill => (
                                        <span key={skill} className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-[10px] font-bold text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                                            {skill}
                                        </span>
                                    ))}
                                    {job.requiredSkills.length > 4 && (
                                        <span className="text-[10px] font-bold text-gray-400 px-1 py-1">+{job.requiredSkills.length - 4} more</span>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Details / Pre-Screen Panel */}
                <div className="lg:col-span-1">
                    <AnimatePresence mode="wait">
                        {selectedJob ? (
                            <motion.div
                                key={selectedJob.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="sticky top-6 p-8 rounded-[2.5rem] glass border border-gray-200 dark:border-white/5 shadow-xl"
                            >
                                <div className="mb-8">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{selectedJob.title}</h3>
                                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm mb-6">
                                        <Building className="w-4 h-4" />
                                        {selectedJob.recruiter?.organization?.name || 'Unknown Organization'}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                            <div className="flex items-center gap-2 text-gray-500 text-xs font-black uppercase tracking-widest mb-2">
                                                <Info className="w-3.5 h-3.5" />
                                                Action Required
                                            </div>
                                            {selectedJob.approvalStatus === 'PENDING' ? (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleApproval(selectedJob.id, 'APPROVED')}
                                                        className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproval(selectedJob.id, 'REJECTED')}
                                                        className="flex-1 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 font-bold text-xs"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold ${selectedJob.approvalStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                    }`}>
                                                    {selectedJob.approvalStatus === 'APPROVED' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    Currently {selectedJob.approvalStatus}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => runPreScreen(selectedJob.id)}
                                            className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-sm flex items-center justify-center gap-2 transition hover:opacity-90 shadow-xl shadow-black/10"
                                        >
                                            <Users className="w-4 h-4" />
                                            {loadingPreScreen ? 'Calculating Eligibility...' : 'Run Pre-Screening'}
                                        </button>
                                    </div>
                                </div>

                                {/* Pre-Screen Results */}
                                {preScreenResults.length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5">
                                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                                            Eligible Students
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px]">
                                                {preScreenResults.filter(r => r.isEligible).length} Found
                                            </span>
                                        </h4>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {preScreenResults.map(res => (
                                                <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{res.name}</p>
                                                        <p className="text-[10px] text-gray-500 mt-1">{res.email}</p>
                                                    </div>
                                                    {res.isEligible ? (
                                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    ) : (
                                                        <div className="text-[8px] font-black text-rose-500 border border-rose-200 px-1 py-0.5 rounded bg-rose-50">
                                                            {res.failedCriteria[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="sticky top-6 p-8 rounded-[2.5rem] glass border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center opacity-60">
                                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                                    <ArrowRight className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="font-black text-gray-500">Select a job to view details and pre-screen students</h3>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
