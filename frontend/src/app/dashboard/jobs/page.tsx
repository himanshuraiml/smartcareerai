'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, MapPin, Briefcase, Building2, DollarSign, Clock,
    Bookmark, BookmarkCheck, ExternalLink, Filter, X, Loader2, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

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
    const { accessToken, user } = useAuthStore();
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
            const response = await fetch(`${API_URL}/jobs/for-me?limit=20`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (response.ok) {
                const data = await response.json();
                setJobs(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch personalized jobs:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

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

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (response.ok) {
                const data = await response.json();
                setJobs(data.data?.jobs || data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken, searchQuery, locationFilter, remoteOnly]);

    const fetchMatchingJobs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/jobs/match?limit=20`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (response.ok) {
                const data = await response.json();
                setJobs(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch matching jobs:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    const fetchSavedJobs = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/jobs/saved`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (response.ok) {
                const data = await response.json();
                setSavedJobIds(new Set(data.data?.map((j: Job) => j.id) || []));
            }
        } catch (err) {
            console.error('Failed to fetch saved jobs:', err);
        }
    }, [accessToken]);

    // Fetch from external job aggregator based on user's target role
    const fetchFromAggregator = useCallback(async () => {
        setLoading(true);
        try {
            // Use personalized aggregate endpoint - fetches jobs based on user's target role
            const response = await fetch(`${API_URL}/jobs/aggregate-for-me?limit=20`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (response.ok) {
                const data = await response.json();
                setJobs(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch from aggregator:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            // Always fetch personalized jobs first based on user's target role
            fetchPersonalizedJobs();
            fetchSavedJobs();
        }
    }, [accessToken, fetchPersonalizedJobs, fetchSavedJobs]);

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
                await fetch(`${API_URL}/jobs/jobs/${jobId}/save`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });
                setSavedJobIds(prev => {
                    const next = new Set(prev);
                    next.delete(jobId);
                    return next;
                });
            } else {
                await fetch(`${API_URL}/jobs/jobs/${jobId}/save`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
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
            onsite: 'bg-gray-500/10 text-gray-400',
        };
        return colors[type] || colors.onsite;
    };

    const handleApply = async () => {
        if (!selectedJob) return;

        // Auto-track application (User Request #3)
        // We create an application entry even though the user goes external
        try {
            await fetch(`${API_URL}/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
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

    return (
        <div className="flex gap-6 h-[calc(100vh-120px)]">
            {/* Job List */}
            <div className="flex-1 flex flex-col">
                {/* Header & Search */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Jobs</h1>
                            <p className="text-gray-400 mt-1">
                                {user?.targetJobRole
                                    ? `Jobs for ${user.targetJobRole.title}`
                                    : 'Find your next opportunity'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchFromAggregator()}
                                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors"
                            >
                                Import Jobs
                            </button>
                            <button
                                onClick={() => fetchPersonalizedJobs()}
                                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search jobs, companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-3 rounded-xl border transition-colors ${showFilters ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-white/10 text-gray-400 hover:text-white'
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                        >
                            Search
                        </button>
                    </form>

                    {/* Filters */}
                    {showFilters && (
                        <div className="mt-4 p-4 rounded-xl glass flex flex-wrap gap-4">
                            <input
                                type="text"
                                placeholder="Location"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                            />
                            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={remoteOnly}
                                    onChange={(e) => setRemoteOnly(e.target.checked)}
                                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-500"
                                />
                                Remote Only
                            </label>
                            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showMatching}
                                    onChange={(e) => setShowMatching(e.target.checked)}
                                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-500"
                                />
                                Matching My Skills
                            </label>
                        </div>
                    )}
                </div>

                {/* Job Cards */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading jobs...</p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="p-12 rounded-2xl glass text-center">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No jobs found</h3>
                            <p className="text-gray-400">Try adjusting your search filters</p>
                        </div>
                    ) : (
                        jobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => setSelectedJob(job)}
                                className={`p-4 rounded-xl glass cursor-pointer transition-all hover:border-purple-500/50 ${selectedJob?.id === job.id ? 'border-purple-500 bg-purple-500/10' : 'border-transparent'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-white font-semibold">{job.title}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-gray-400 text-sm">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-4 h-4" />
                                                {job.company}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {job.location}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {job.matchPercent !== undefined && (
                                            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                                                {job.matchPercent}% match
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSaveJob(job.id); }}
                                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            {savedJobIds.has(job.id) ? (
                                                <BookmarkCheck className="w-5 h-5 text-purple-400" />
                                            ) : (
                                                <Bookmark className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <span className={`px-2 py-0.5 rounded text-xs ${getLocationBadge(job.locationType)}`}>
                                        {job.locationType}
                                    </span>
                                    {formatSalary(job) && (
                                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                                            <DollarSign className="w-3 h-3" />
                                            {formatSalary(job)}
                                        </span>
                                    )}
                                    {job.experienceMin !== undefined && (
                                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                                            <Clock className="w-3 h-3" />
                                            {job.experienceMin}+ years
                                        </span>
                                    )}
                                </div>

                                {job.requiredSkills?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {job.requiredSkills.slice(0, 4).map((skill, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-gray-300 text-xs">
                                                {skill}
                                            </span>
                                        ))}
                                        {job.requiredSkills.length > 4 && (
                                            <span className="px-2 py-0.5 text-gray-500 text-xs">
                                                +{job.requiredSkills.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Job Detail Panel */}
            {selectedJob && (
                <div className="w-[450px] rounded-2xl glass p-6 overflow-y-auto">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">{selectedJob.title}</h2>
                            <p className="text-gray-400">{selectedJob.company}</p>
                        </div>
                        <button
                            onClick={() => setSelectedJob(null)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${getLocationBadge(selectedJob.locationType)}`}>
                            {selectedJob.locationType}
                        </span>
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm">
                            <MapPin className="w-4 h-4" />
                            {selectedJob.location}
                        </span>
                    </div>

                    {formatSalary(selectedJob) && (
                        <div className="p-4 rounded-xl bg-green-500/10 mb-4">
                            <p className="text-green-400 font-semibold">{formatSalary(selectedJob)}</p>
                            <p className="text-gray-400 text-sm">Estimated salary</p>
                        </div>
                    )}

                    <div className="mb-6">
                        <h3 className="text-white font-medium mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedJob.requiredSkills?.map((skill, i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-white font-medium mb-2">Description</h3>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                            {selectedJob.description}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => toggleSaveJob(selectedJob.id)}
                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${savedJobIds.has(selectedJob.id)
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                        >
                            {savedJobIds.has(selectedJob.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                            {savedJobIds.has(selectedJob.id) ? 'Saved' : 'Save'}
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 py-3 rounded-xl bg-purple-600 text-white flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
                        >
                            Apply Now
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
