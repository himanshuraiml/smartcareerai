'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, MapPin, Briefcase, Building2, DollarSign, Clock,
    Bookmark, BookmarkCheck, ExternalLink, Filter, X, Loader2, RefreshCw,
    ChevronLeft, ArrowRight
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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function JobsPage() {
    const { user } = useAuthStore();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [remoteOnly, setRemoteOnly] = useState(false);
    // Default to matching jobs as per user request
    const [showMatching, setShowMatching] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch personalized jobs based on user's target job role
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

            if (params.toString()) {
                url = `${API_URL}/jobs/search?${params.toString()}`;
            }

            // Construct relative URL for authFetch
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

    const fetchMatchingJobs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/jobs/match?limit=20');

            if (response.ok) {
                const data = await response.json();
                setJobs(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch matching jobs:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchFromAggregator = useCallback(async (query?: string) => {
        setLoading(true);
        try {
            const defaultQuery = query || user?.targetJobRole?.title || 'Software Engineer';
            const response = await authFetch(`/jobs/aggregate?q=${encodeURIComponent(defaultQuery)}&limit=10`, {
                method: 'POST'
            });

            if (response.ok) {
                // After aggregating, fetch personalized to get the latest
                await fetchPersonalizedJobs();
            }
        } catch (err) {
            console.error('Failed to fetch from aggregator:', err);
        } finally {
            setLoading(false);
        }
    }, [user, user?.targetJobRole?.title, fetchPersonalizedJobs]);

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

    useEffect(() => {
        if (user) {
            // Always fetch personalized jobs first based on user's target role
            fetchPersonalizedJobs();
            fetchSavedJobs();
        }
    }, [user, fetchPersonalizedJobs, fetchSavedJobs]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Try local DB first, then aggregator
        fetchJobs().then(() => {
            if (jobs.length === 0 && searchQuery) {
                fetchFromAggregator(searchQuery);
            }
        });
    };

    const toggleSaveJob = async (jobId: string) => {
        const isSaved = savedJobIds.has(jobId);

        try {
            if (isSaved) {
                await authFetch(`/jobs/jobs/${jobId}/save`, {
                    method: 'DELETE'
                });
                setSavedJobIds(prev => {
                    const next = new Set(prev);
                    next.delete(jobId);
                    return next;
                });
            } else {
                await authFetch(`/jobs/jobs/${jobId}/save`, {
                    method: 'POST'
                });
                setSavedJobIds(prev => new Set([...Array.from(prev), jobId]));
            }
        } catch (err) {
            console.error('Failed to toggle save:', err);
        }
    };

    const formatSalary = (job: Job) => {
        if (!job.salaryMin && !job.salaryMax) return null;
        const currency = job.salaryCurrency || 'USD';
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
        if (job.salaryMin && job.salaryMax) {
            return `${formatter.format(job.salaryMin)} - ${formatter.format(job.salaryMax)}`;
        }
        return formatter.format(job.salaryMin || job.salaryMax || 0);
    };

    const getLocationBadge = (type: string) => {
        const colors: Record<string, string> = {
            remote: 'bg-green-500/10 text-green-400',
            hybrid: 'bg-blue-500/10 text-blue-400',
            onsite: 'bg-gray-500/10 text-gray-400'
        };
        return colors[type] || colors.onsite;
    };

    const handleApply = async () => {
        if (!selectedJob) return;

        // Auto-track application (User Request #3)
        // We create an application entry even though the user goes external
        try {
            await authFetch('/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobId: selectedJob.id,
                    status: 'APPLIED',
                    company: selectedJob.company,
                    position: selectedJob.title,
                    location: selectedJob.location,
                    salary: formatSalary(selectedJob),
                    dateApplied: new Date().toISOString()
                })
            });
        } catch (err) {
            console.error('Failed to track application:', err);
        }

        // Redirect to source
        if (selectedJob.sourceUrl) {
            window.open(selectedJob.sourceUrl, '_blank', 'noopener,noreferrer');
        } else {
            // Fallback for internal jobs
            window.location.href = `/dashboard/applications?jobId=${selectedJob.id}`;
        }
    };

    // Mobile: Show job detail as full screen overlay
    const JobDetailPanel = ({ job, onClose }: { job: Job; onClose: () => void }) => (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-[var(--background)] lg:relative lg:inset-auto lg:z-auto lg:w-[450px] lg:rounded-2xl lg:glass overflow-y-auto"
        >
            <div className="p-4 lg:p-6">
                {/* Mobile Back Button */}
                <button
                    onClick={onClose}
                    className="lg:hidden flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Back to Jobs</span>
                </button>

                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white break-words">{job.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 truncate">{job.company}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="hidden lg:block p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${getLocationBadge(job.locationType)}`}>
                        {job.locationType}
                    </span>
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
                            <span key={i} className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm">
                                {skill}
                            </span>
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

                {/* Sticky Action Buttons for Mobile */}
                <div className="flex gap-3 sticky bottom-4 lg:static bg-[var(--background)] lg:bg-transparent pt-4 lg:pt-0">
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
                        onClick={handleApply}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                        Apply Now
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)]">
            {/* Job List - Full width on mobile, flex-1 on desktop */}
            <div className={`flex-1 flex flex-col min-w-0 ${selectedJob ? 'hidden lg:flex' : 'flex'}`}>
                {/* Header & Search */}
                <div className="mb-4 lg:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="min-w-0">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Jobs</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm lg:text-base truncate">
                                {user?.targetJobRole
                                    ? `Jobs for ${user.targetJobRole.title}`
                                    : 'Find your next opportunity'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => fetchFromAggregator()}
                                className="px-3 lg:px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Import Jobs</span>
                                <span className="sm:hidden">Import</span>
                            </button>
                            <button
                                onClick={() => fetchPersonalizedJobs()}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                aria-label="Refresh jobs"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search jobs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none text-sm lg:text-base"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-3 rounded-xl border transition-colors ${showFilters ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                aria-label="Toggle filters"
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <button
                                type="submit"
                                className="px-4 lg:px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm lg:text-base"
                            >
                                <span className="hidden sm:inline">Search</span>
                                <ArrowRight className="w-5 h-5 sm:hidden" />
                            </button>
                        </div>
                    </form>

                    {/* Filters */}
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
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none text-sm"
                                    />
                                    <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-pointer text-sm">
                                        <input
                                            type="checkbox"
                                            checked={remoteOnly}
                                            onChange={(e) => setRemoteOnly(e.target.checked)}
                                            className="w-4 h-4 rounded bg-white/10 border-white/20 text-indigo-500"
                                        />
                                        Remote Only
                                    </label>
                                    <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-pointer text-sm">
                                        <input
                                            type="checkbox"
                                            checked={showMatching}
                                            onChange={(e) => setShowMatching(e.target.checked)}
                                            className="w-4 h-4 rounded bg-white/10 border-white/20 text-indigo-500"
                                        />
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
                        jobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => setSelectedJob(job)}
                                className={`p-4 rounded-xl glass cursor-pointer transition-all hover:border-indigo-500/50 active:scale-[0.98] ${selectedJob?.id === job.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-transparent'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-gray-900 dark:text-white font-semibold line-clamp-2 break-words text-sm lg:text-base">{job.title}</h3>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-gray-500 dark:text-gray-400 text-xs lg:text-sm">
                                            <span className="flex items-center gap-1 min-w-0">
                                                <Building2 className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{job.company}</span>
                                            </span>
                                            <span className="flex items-center gap-1 min-w-0">
                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{job.location}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                                        {job.matchPercent !== undefined && (
                                            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs whitespace-nowrap">
                                                {job.matchPercent}%
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSaveJob(job.id); }}
                                            className="p-1.5 lg:p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                        >
                                            {savedJobIds.has(job.id) ? (
                                                <BookmarkCheck className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-400" />
                                            ) : (
                                                <Bookmark className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <span className={`px-2 py-0.5 rounded text-xs ${getLocationBadge(job.locationType)}`}>
                                        {job.locationType}
                                    </span>
                                    {formatSalary(job) && (
                                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                                            <DollarSign className="w-3 h-3" />
                                            <span className="truncate max-w-[100px] lg:max-w-none">{formatSalary(job)}</span>
                                        </span>
                                    )}
                                    {job.experienceMin !== undefined && (
                                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                                            <Clock className="w-3 h-3" />
                                            {job.experienceMin}+ yrs
                                        </span>
                                    )}
                                </div>

                                {job.requiredSkills?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {job.requiredSkills.slice(0, 3).map((skill, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs truncate max-w-[100px]">
                                                {skill}
                                            </span>
                                        ))}
                                        {job.requiredSkills.length > 3 && (
                                            <span className="px-2 py-0.5 text-gray-500 text-xs">
                                                +{job.requiredSkills.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Job Detail Panel - Shown on desktop as sidebar, on mobile as full screen */}
            <AnimatePresence>
                {selectedJob && (
                    <JobDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}



