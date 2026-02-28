'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, MapPin, Briefcase, Building2, DollarSign, Clock,
    Bookmark, BookmarkCheck, ExternalLink, Filter, X, Loader2, RefreshCw,
    ChevronLeft, ArrowRight, Bell, BellDot, BadgeCheck, Sparkles,
    CheckCircle2, Send, FileText, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import { motion, AnimatePresence } from 'framer-motion';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    locationType: string;
    sourceUrl?: string;
    description: string;
    requiredSkills: string[];
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    experienceMin?: number;
    experienceMax?: number;
    matchPercent?: number;
    postedAt: string;
    createdAt: string;
    isPlatformJob?: boolean;
    companyLogo?: string | null;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    metadata?: { recruiterJobId?: string; companyName?: string; jobTitle?: string };
}

interface PlatformApplyResult {
    applicationId: string;
    jobTitle: string;
    company: string;
    status: string;
}

interface CandidateResume {
    id: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function JobsPage() {
    const { user } = useAuthStore();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    // Platform job apply state
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyingJob, setApplyingJob] = useState<Job | null>(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [applyLoading, setApplyLoading] = useState(false);
    const [applyResult, setApplyResult] = useState<PlatformApplyResult | null>(null);
    const [candidateResume, setCandidateResume] = useState<CandidateResume | null>(null);
    const [resumeLoading, setResumeLoading] = useState(false);
    // Track which platform job IDs the user has already applied to
    const [appliedPlatformJobIds, setAppliedPlatformJobIds] = useState<Set<string>>(new Set());

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [remoteOnly, setRemoteOnly] = useState(false);
    const [showMatching, setShowMatching] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const fetchPersonalizedJobs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/jobs/for-me?limit=20');
            if (response.ok) {
                const data = await response.json();
                setJobs(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch personalized jobs:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            let url = `${API_URL}/jobs/jobs`;
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (locationFilter) params.append('location', locationFilter);
            if (remoteOnly) params.append('locationType', 'remote');
            if (params.toString()) url = `${API_URL}/jobs/search?${params.toString()}`;

            const relativeUrl = url.replace(API_URL, '');
            const response = await authFetch(relativeUrl);
            if (response.ok) {
                const data = await response.json();
                setJobs(data.data?.jobs || data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setLoading(false);
        }
    }, [user, searchQuery, locationFilter, remoteOnly]);

    const fetchFromAggregator = useCallback(async (query?: string) => {
        setLoading(true);
        try {
            const defaultQuery = query || user?.targetJobRole?.title || 'Software Engineer';
            const response = await authFetch(`/jobs/aggregate?q=${encodeURIComponent(defaultQuery)}&limit=10`, { method: 'POST' });
            if (response.ok) await fetchPersonalizedJobs();
        } catch (err) {
            console.error('Failed to fetch from aggregator:', err);
        } finally {
            setLoading(false);
        }
    }, [user, fetchPersonalizedJobs]);

    const fetchSavedJobs = useCallback(async () => {
        try {
            const response = await authFetch('/jobs/saved');
            if (response.ok) {
                const data = await response.json();
                const savedIds = new Set<string>((data.data || []).map((j: { jobId: string }) => j.jobId));
                setSavedJobIds(savedIds);
            }
        } catch (err) {
            console.error('Failed to fetch saved jobs:', err);
        }
    }, [user]);

    const fetchNotifications = useCallback(async () => {
        try {
            const [notifsRes, countRes] = await Promise.all([
                authFetch('/jobs/notifications'),
                authFetch('/jobs/notifications/unread-count'),
            ]);
            if (notifsRes.ok) {
                const data = await notifsRes.json();
                setNotifications(data.data || []);
            }
            if (countRes.ok) {
                const data = await countRes.json();
                setUnreadCount(data.data?.count || 0);
            }
        } catch (_) {}
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchPersonalizedJobs();
            fetchSavedJobs();
            fetchNotifications();
        }
    }, [user, fetchPersonalizedJobs, fetchSavedJobs, fetchNotifications]);

    // Once jobs are loaded, check application status for platform jobs
    useEffect(() => {
        const platformJobs = jobs.filter(j => j.isPlatformJob);
        if (platformJobs.length === 0) return;

        Promise.all(
            platformJobs.map(j =>
                authFetch(`/recruiter/public/jobs/${j.id}/my-application`)
                    .then(r => r.ok ? r.json() : null)
                    .then(data => data?.data ? j.id : null)
                    .catch(() => null)
            )
        ).then(results => {
            const applied = new Set<string>(results.filter(Boolean) as string[]);
            setAppliedPlatformJobIds(applied);
        });
    }, [jobs]);

    const handleOpenNotifications = async () => {
        setShowNotifications(prev => !prev);
        if (!showNotifications && unreadCount > 0) {
            try {
                await authFetch('/jobs/notifications/read', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (_) {}
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchJobs().then(() => {
            if (jobs.length === 0 && searchQuery) fetchFromAggregator(searchQuery);
        });
    };

    const toggleSaveJob = async (jobId: string) => {
        const isSaved = savedJobIds.has(jobId);
        try {
            if (isSaved) {
                await authFetch(`/jobs/jobs/${jobId}/save`, { method: 'DELETE' });
                setSavedJobIds(prev => { const n = new Set(prev); n.delete(jobId); return n; });
            } else {
                await authFetch(`/jobs/jobs/${jobId}/save`, { method: 'POST' });
                setSavedJobIds(prev => new Set([...Array.from(prev), jobId]));
            }
        } catch (err) {
            console.error('Failed to toggle save:', err);
        }
    };

    // Open platform apply modal — also fetch candidate's latest resume
    const openPlatformApply = async (job: Job) => {
        setApplyingJob(job);
        setCoverLetter('');
        setApplyResult(null);
        setCandidateResume(null);
        setShowApplyModal(true);
        setResumeLoading(true);
        try {
            const res = await authFetch('/resumes/');
            if (res.ok) {
                const data = await res.json();
                const resumes: CandidateResume[] = data.data || [];
                if (resumes.length > 0) {
                    // Sort by createdAt descending and pick the latest
                    const latest = resumes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                    setCandidateResume(latest);
                }
            }
        } catch (_) {
            // non-critical — proceed without resume info
        } finally {
            setResumeLoading(false);
        }
    };

    // Submit platform job application
    const submitPlatformApplication = async () => {
        if (!applyingJob) return;
        setApplyLoading(true);
        try {
            const res = await authFetch(`/recruiter/public/jobs/${applyingJob.id}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverLetter: coverLetter.trim() || undefined }),
            });
            const data = await res.json();
            if (res.ok) {
                setApplyResult(data.data);
                setAppliedPlatformJobIds(prev => new Set([...Array.from(prev), applyingJob.id]));
            } else {
                alert(data.message || data.error || 'Failed to submit application');
            }
        } catch (err) {
            alert('Something went wrong. Please try again.');
        } finally {
            setApplyLoading(false);
        }
    };

    // External job apply
    const handleExternalApply = async (job: Job) => {
        try {
            await authFetch('/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: job.id,
                    status: 'APPLIED',
                    company: job.company,
                    position: job.title,
                    location: job.location,
                    salary: formatSalary(job),
                    dateApplied: new Date().toISOString(),
                }),
            });
        } catch (_) {}
        if (job.sourceUrl) {
            window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const formatSalary = (job: Job) => {
        if (!job.salaryMin && !job.salaryMax) return null;
        const currency = job.salaryCurrency || 'USD';
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
        if (job.salaryMin && job.salaryMax) return `${formatter.format(job.salaryMin)} - ${formatter.format(job.salaryMax)}`;
        return formatter.format(job.salaryMin || job.salaryMax || 0);
    };

    const getLocationBadge = (type: string) => ({
        remote: 'bg-green-500/10 text-green-400',
        hybrid: 'bg-blue-500/10 text-blue-400',
        onsite: 'bg-gray-500/10 text-gray-400',
    }[type] || 'bg-gray-500/10 text-gray-400');

    const platformJobCount = jobs.filter(j => j.isPlatformJob).length;

    // ── Platform Apply Modal ─────────────────────────────────────────────
    const PlatformApplyModal = () => {
        if (!applyingJob) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !applyLoading && setShowApplyModal(false)} />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg rounded-2xl glass border border-white/10 shadow-2xl overflow-hidden"
                >
                    {applyResult ? (
                        // Success state
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted!</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                                You applied for <span className="text-white font-medium">{applyResult.jobTitle}</span>
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                at <span className="text-indigo-400 font-medium">{applyResult.company}</span>
                            </p>
                            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 mb-6">
                                The recruiter can now see your profile and will reach out if you're a fit. You can track this in your applications.
                            </div>
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="w-full py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        // Apply form
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{applyingJob.title}</h2>
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-400 text-[10px] font-bold">
                                            <BadgeCheck className="w-3 h-3" />
                                            Platform
                                        </span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{applyingJob.company} · {applyingJob.location}</p>
                                </div>
                                <button
                                    onClick={() => setShowApplyModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Applicant info summary */}
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-3">
                                <p className="text-xs text-gray-400 mb-1">Applying as</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>

                            {/* Resume status */}
                            <div className="mb-4">
                                {resumeLoading ? (
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                        <span className="text-xs text-gray-400">Looking for your resume...</span>
                                    </div>
                                ) : candidateResume ? (
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-emerald-400">Resume auto-attached</p>
                                            <p className="text-xs text-gray-400 truncate">{candidateResume.fileName}</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await authFetch(`/resumes/${candidateResume.id}/download`);
                                                    if (!res.ok) throw new Error();
                                                    const data = await res.json();
                                                    window.open(data.data.url, "_blank");
                                                } catch {
                                                    alert("Could not open resume. Please try again.");
                                                }
                                            }}
                                            className="text-[10px] text-emerald-400 hover:text-emerald-300 underline whitespace-nowrap cursor-pointer"
                                        >
                                            Preview
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-amber-400">No resume found</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Upload a resume first so recruiters can review your profile.{' '}
                                                <a href="/dashboard/resumes" className="underline text-amber-300 hover:text-amber-200">
                                                    Upload now
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cover Letter */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={coverLetter}
                                    onChange={e => setCoverLetter(e.target.value)}
                                    placeholder={`Tell ${applyingJob.company} why you're a great fit for this role...`}
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none text-sm resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowApplyModal(false)}
                                    disabled={applyLoading}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitPlatformApplication}
                                    disabled={applyLoading}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-60"
                                >
                                    {applyLoading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                    ) : (
                                        <><Send className="w-4 h-4" /> Submit Application</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        );
    };

    // ── Job Detail Panel ────────────────────────────────────────────────
    const JobDetailPanel = ({ job, onClose }: { job: Job; onClose: () => void }) => {
        const alreadyApplied = job.isPlatformJob && appliedPlatformJobIds.has(job.id);

        return (
            <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-50 bg-[var(--background)] lg:relative lg:inset-auto lg:z-auto lg:w-[450px] lg:rounded-2xl lg:glass overflow-y-auto"
            >
                <div className="p-4 lg:p-6">
                    <button onClick={onClose} className="lg:hidden flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
                        <ChevronLeft className="w-5 h-5" /><span>Back to Jobs</span>
                    </button>

                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white break-words">{job.title}</h2>
                                {job.isPlatformJob && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-400 text-xs font-semibold whitespace-nowrap">
                                        <BadgeCheck className="w-3 h-3" />Platform Job
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 truncate">{job.company}</p>
                        </div>
                        <button onClick={onClose} className="hidden lg:block p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {job.isPlatformJob && (
                        <div className="mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <p className="text-indigo-300 text-xs">
                                This job was posted directly on PlaceNxt. Apply here — the recruiter reviews all applications on-platform and will contact you directly.
                            </p>
                        </div>
                    )}

                    {alreadyApplied && (
                        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <p className="text-green-300 text-xs font-medium">You have already applied to this job.</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${getLocationBadge(job.locationType)}`}>{job.locationType}</span>
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{job.location}</span>
                        </span>
                    </div>

                    {formatSalary(job) && (
                        <div className="p-4 rounded-xl bg-green-500/10 mb-4">
                            <p className="text-green-400 font-semibold">{formatSalary(job)}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Estimated salary</p>
                        </div>
                    )}

                    <div className="mb-6">
                        <h3 className="text-gray-900 dark:text-white font-medium mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {job.requiredSkills?.map((skill, i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm">{skill}</span>
                            ))}
                            {(!job.requiredSkills || job.requiredSkills.length === 0) && (
                                <span className="text-gray-500 text-sm">No skills listed</span>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-gray-900 dark:text-white font-medium mb-2">Description</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line break-words">
                            {job.description || 'No description available.'}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 sticky bottom-4 lg:static bg-[var(--background)] lg:bg-transparent pt-4 lg:pt-0">
                        {job.isPlatformJob ? (
                            alreadyApplied ? (
                                <button
                                    disabled
                                    className="flex-1 py-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/40 flex items-center justify-center gap-2 cursor-default text-sm"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Applied
                                </button>
                            ) : (
                                <button
                                    onClick={() => openPlatformApply(job)}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors text-sm font-medium"
                                >
                                    <Send className="w-4 h-4" />
                                    Apply on Platform
                                </button>
                            )
                        ) : (
                            <>
                                <button
                                    onClick={() => toggleSaveJob(job.id)}
                                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${savedJobIds.has(job.id)
                                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500'
                                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {savedJobIds.has(job.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                    {savedJobIds.has(job.id) ? 'Saved' : 'Save'}
                                </button>
                                <button
                                    onClick={() => handleExternalApply(job)}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                                >
                                    Apply Now<ExternalLink className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)]">
            {/* Platform Apply Modal */}
            <AnimatePresence>
                {showApplyModal && <PlatformApplyModal />}
            </AnimatePresence>

            {/* Job List */}
            <div className={`flex-1 flex flex-col min-w-0 ${selectedJob ? 'hidden lg:flex' : 'flex'}`}>
                {/* Header */}
                <div className="mb-4 lg:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="min-w-0">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Jobs</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm lg:text-base truncate">
                                {user?.targetJobRole ? `Jobs for ${user.targetJobRole.title}` : 'Find your next opportunity'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={handleOpenNotifications}
                                    className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    {unreadCount > 0 ? <BellDot className="w-5 h-5 text-indigo-400" /> : <Bell className="w-5 h-5" />}
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl glass border border-white/10 shadow-2xl overflow-hidden"
                                        >
                                            <div className="p-3 border-b border-white/10 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Job Alerts</h3>
                                                <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-gray-400" /></button>
                                            </div>
                                            <div className="max-h-72 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-4 text-center text-gray-500 text-sm">No job alerts yet</div>
                                                ) : notifications.map(n => (
                                                    <div
                                                        key={n.id}
                                                        className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer ${!n.isRead ? 'bg-indigo-500/5' : ''}`}
                                                        onClick={() => {
                                                            setShowNotifications(false);
                                                            if (n.metadata?.recruiterJobId) {
                                                                const job = jobs.find(j => j.id === n.metadata?.recruiterJobId);
                                                                if (job) setSelectedJob(job);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />}
                                                            <div className={!n.isRead ? '' : 'ml-4'}>
                                                                <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                onClick={() => fetchFromAggregator()}
                                className="px-3 lg:px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Import Jobs</span>
                                <span className="sm:hidden">Import</span>
                            </button>
                            <button
                                onClick={fetchPersonalizedJobs}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Platform jobs banner */}
                    {platformJobCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-2"
                        >
                            <BadgeCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <p className="text-indigo-300 text-xs">
                                <span className="font-semibold text-indigo-400">{platformJobCount} platform {platformJobCount === 1 ? 'job' : 'jobs'}</span> posted directly by recruiters on PlaceNxt — apply here and the recruiter will review your profile
                            </p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSearch} className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search jobs..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none text-sm lg:text-base"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-3 rounded-xl border transition-colors ${showFilters ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <button type="submit" className="px-4 lg:px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm lg:text-base">
                                <span className="hidden sm:inline">Search</span>
                                <ArrowRight className="w-5 h-5 sm:hidden" />
                            </button>
                        </div>
                    </form>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 p-4 rounded-xl glass overflow-hidden"
                            >
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Location"
                                        value={locationFilter}
                                        onChange={e => setLocationFilter(e.target.value)}
                                        className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none text-sm"
                                    />
                                    <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-pointer text-sm">
                                        <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} className="w-4 h-4 rounded" />
                                        Remote Only
                                    </label>
                                    <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-pointer text-sm">
                                        <input type="checkbox" checked={showMatching} onChange={e => setShowMatching(e.target.checked)} className="w-4 h-4 rounded" />
                                        Matching My Skills
                                    </label>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Job Cards */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-0 lg:pr-2">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Loading jobs...</p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="p-8 lg:p-12 rounded-2xl glass text-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs found</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Try adjusting your search filters</p>
                        </div>
                    ) : (
                        jobs.map(job => {
                            const alreadyApplied = job.isPlatformJob && appliedPlatformJobIds.has(job.id);
                            return (
                                <div
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                                        job.isPlatformJob
                                            ? `border ${selectedJob?.id === job.id ? 'border-indigo-500 bg-indigo-500/15' : 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60'}`
                                            : `glass ${selectedJob?.id === job.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-transparent hover:border-indigo-500/50'}`
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="text-gray-900 dark:text-white font-semibold line-clamp-2 text-sm lg:text-base">{job.title}</h3>
                                                {job.isPlatformJob && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-400 text-[10px] font-bold whitespace-nowrap">
                                                        <BadgeCheck className="w-3 h-3" />Platform
                                                    </span>
                                                )}
                                                {alreadyApplied && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/40 text-green-400 text-[10px] font-bold whitespace-nowrap">
                                                        <CheckCircle2 className="w-3 h-3" />Applied
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-gray-500 dark:text-gray-400 text-xs lg:text-sm">
                                                <span className="flex items-center gap-1"><Building2 className="w-4 h-4 flex-shrink-0" /><span className="truncate">{job.company}</span></span>
                                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 flex-shrink-0" /><span className="truncate">{job.location}</span></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                                            {job.matchPercent !== undefined && (
                                                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs whitespace-nowrap">{job.matchPercent}%</span>
                                            )}
                                            {!job.isPlatformJob && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); toggleSaveJob(job.id); }}
                                                    className="p-1.5 lg:p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    {savedJobIds.has(job.id)
                                                        ? <BookmarkCheck className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-400" />
                                                        : <Bookmark className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className={`px-2 py-0.5 rounded text-xs ${getLocationBadge(job.locationType)}`}>{job.locationType}</span>
                                        {formatSalary(job) && (
                                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                                                <DollarSign className="w-3 h-3" /><span className="truncate max-w-[100px] lg:max-w-none">{formatSalary(job)}</span>
                                            </span>
                                        )}
                                        {job.experienceMin !== undefined && (
                                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                                                <Clock className="w-3 h-3" />{job.experienceMin}+ yrs
                                            </span>
                                        )}
                                    </div>

                                    {job.requiredSkills?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {job.requiredSkills.slice(0, 3).map((skill, i) => (
                                                <span key={i} className={`px-2 py-0.5 rounded text-xs truncate max-w-[100px] ${job.isPlatformJob ? 'bg-indigo-500/10 text-indigo-300' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300'}`}>
                                                    {skill}
                                                </span>
                                            ))}
                                            {job.requiredSkills.length > 3 && (
                                                <span className="px-2 py-0.5 text-gray-500 text-xs">+{job.requiredSkills.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Job Detail Panel */}
            <AnimatePresence>
                {selectedJob && (
                    <JobDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
