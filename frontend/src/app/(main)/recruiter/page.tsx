"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
    Search, Filter, Bookmark, Eye, Briefcase, MapPin, Award,
    ChevronRight, Zap, Users, SlidersHorizontal, CheckCircle,
    X, Star, Plus, ToggleLeft, ToggleRight, Bot, Wand2,
    DollarSign, BarChart3, ArrowUpRight, Clock, TrendingUp,
    FileText, Sparkles, Loader2, RefreshCw, Building2, Target,
    ChevronDown
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Job {
    id: string;
    title: string;
    location: string | null;
    jobType: string;
    isActive: boolean;
    createdAt: string;
    _count?: { applications: number };
    salaryMin?: number | null;
    salaryMax?: number | null;
}

interface Candidate {
    id: string;
    studentId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    targetJobRole: { id: string; title: string; category: string } | null;
    bio: string | null;
    location: string | null;
    experienceYears: number | null;
    skills: Array<{ id: string; name: string }>;
    skillBadges: Array<{ id: string; badgeType: string; skill: { name: string } }>;
    _count: { interviews: number };
    overallScore: number | null;
}

interface Stats {
    activeJobs: number;
    totalCandidates: number;
    savedCandidates: number;
    loading: boolean;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    gradient,
    loading,
    suffix = "",
}: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    gradient: string;
    loading: boolean;
    suffix?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${gradient} opacity-10 blur-xl`} />
            <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center mb-4 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            {loading ? (
                <div className="h-8 w-16 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse mb-1" />
            ) : (
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {value}{suffix}
                </p>
            )}
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        </motion.div>
    );
}

function JobCard({
    job,
    onToggle,
    toggling,
}: {
    job: Job;
    onToggle: (id: string) => void;
    toggling: string | null;
}) {
    const applicants = job._count?.applications ?? 0;
    const age = Math.floor(
        (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 hover:border-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all"
        >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{job.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            {job.location && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />{job.location}
                                </span>
                            )}
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{age === 0 ? "Today" : `${age}d ago`}
                            </span>
                        </div>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${job.isActive
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                        }`}>
                        {job.isActive ? "Active" : "Paused"}
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {applicants} applicant{applicants !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-1.5 ml-auto">
                        <Link
                            href={`/recruiter/jobs/${job.id}`}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1"
                        >
                            Pipeline <ArrowUpRight className="w-3 h-3" />
                        </Link>
                        <button
                            onClick={() => onToggle(job.id)}
                            disabled={toggling === job.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-indigo-500/50 transition-colors flex items-center gap-1"
                            title={job.isActive ? "Pause job" : "Activate job"}
                        >
                            {toggling === job.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : job.isActive ? (
                                <ToggleRight className="w-3 h-3 text-emerald-500" />
                            ) : (
                                <ToggleLeft className="w-3 h-3 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function CandidateCard({
    candidate,
    isSaved,
    onToggleSave,
    saving,
}: {
    candidate: Candidate;
    isSaved: boolean;
    onToggleSave: (id: string) => void;
    saving: string | null;
}) {
    const score = candidate.overallScore;
    const hasScore = score !== null && score > 0;

    const scoreColor =
        score && score >= 80
            ? "text-emerald-600 dark:text-emerald-400"
            : score && score >= 60
                ? "text-amber-600 dark:text-amber-400"
                : "text-rose-600 dark:text-rose-400";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex flex-col p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden"
        >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {candidate.avatarUrl ? (
                        <img src={candidate.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <span className="text-white font-bold text-base">
                            {candidate.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {candidate.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {candidate.targetJobRole?.title || "Open to roles"}
                    </p>
                    {candidate.location && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />{candidate.location}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => onToggleSave(candidate.id)}
                    disabled={saving === candidate.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                >
                    {saving === candidate.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-500 text-indigo-500" : ""}`} />
                    )}
                </button>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
                {candidate.skills.slice(0, 4).map((skill, i) => (
                    <span
                        key={skill.id || `${skill.name}-${i}`}
                        className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20"
                    >
                        {skill.name}
                    </span>
                ))}
                {candidate.skills.length > 4 && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-white/5 text-gray-500 border border-gray-100 dark:border-gray-800">
                        +{candidate.skills.length - 4}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    {hasScore ? (
                        <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                            <span className={`font-black text-sm ${scoreColor}`}>{score}%</span>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 italic">No score</span>
                    )}
                    {candidate.experienceYears != null && (
                        <>
                            <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {candidate.experienceYears}y exp
                            </span>
                        </>
                    )}
                </div>
                <Link
                    href={`/recruiter/candidates/${candidate.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all"
                >
                    View <Eye className="w-3 h-3" />
                </Link>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function RecruiterDashboard() {
    const { user } = useAuthStore();

    // Jobs
    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [togglingJob, setTogglingJob] = useState<string | null>(null);

    // Candidates
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [candidatesLoading, setCandidatesLoading] = useState(true);
    const [candidatePage, setCandidatePage] = useState(1);
    const [candidateTotal, setCandidateTotal] = useState(0);

    // Saved candidates (for toggle state)
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [savingId, setSavingId] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState<Stats>({
        activeJobs: 0,
        totalCandidates: 0,
        savedCandidates: 0,
        loading: true,
    });

    // Filters
    const [search, setSearch] = useState("");
    const [skillFilter, setSkillFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [expFilter, setExpFilter] = useState<number | "">("");
    const [showFilters, setShowFilters] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // ── Fetch Jobs ──
    const fetchJobs = useCallback(async () => {
        if (!user) return;
        setJobsLoading(true);
        try {
            const res = await authFetch("/recruiter/jobs");
            const data = await res.json();
            if (data.success) {
                setJobs(data.data || []);
                const active = (data.data || []).filter((j: Job) => j.isActive).length;
                setStats(prev => ({ ...prev, activeJobs: active }));
            }
        } catch {
            // silently fail — jobs section shows empty state
        } finally {
            setJobsLoading(false);
        }
    }, [user]);

    // ── Fetch Candidates ──
    const fetchCandidates = useCallback(async () => {
        if (!user) return;
        setCandidatesLoading(true);
        try {
            const params = new URLSearchParams();
            if (skillFilter) params.set("skills", skillFilter);
            if (locationFilter) params.set("location", locationFilter);
            if (expFilter !== "") params.set("experienceMin", String(expFilter));
            params.set("page", String(candidatePage));
            params.set("limit", "12");

            const res = await authFetch(`/recruiter/candidates/search?${params}`);
            const data = await res.json();
            if (data.success) {
                setCandidates(data.data || []);
                setCandidateTotal(data.pagination?.total ?? data.data?.length ?? 0);
                setStats(prev => ({
                    ...prev,
                    totalCandidates: data.pagination?.total ?? data.data?.length ?? prev.totalCandidates,
                }));
            }
        } catch {
            // silently fail
        } finally {
            setCandidatesLoading(false);
            setStats(prev => ({ ...prev, loading: false }));
        }
    }, [user, skillFilter, locationFilter, expFilter, candidatePage]);

    // ── Fetch Saved IDs ──
    const fetchSaved = useCallback(async () => {
        if (!user) return;
        try {
            const res = await authFetch("/recruiter/candidates/saved");
            const data = await res.json();
            if (data.success) {
                const ids = new Set<string>(
                    (data.data || []).map((s: any) => s.candidateId ?? s.id)
                );
                setSavedIds(ids);
                setStats(prev => ({ ...prev, savedCandidates: ids.size }));
            }
        } catch {
            // silently fail
        }
    }, [user]);

    useEffect(() => {
        fetchJobs();
        fetchSaved();
    }, [fetchJobs, fetchSaved]);

    useEffect(() => {
        fetchCandidates();
    }, [fetchCandidates]);

    // ── Toggle job status ──
    const handleToggleJob = async (jobId: string) => {
        setTogglingJob(jobId);
        try {
            const res = await authFetch(`/recruiter/jobs/${jobId}/toggle`, { method: "PUT" });
            const data = await res.json();
            if (data.success) {
                setJobs(prev => prev.map(j => j.id === jobId ? { ...j, isActive: data.data.isActive } : j));
                const active = jobs.filter(j => (j.id === jobId ? data.data.isActive : j.isActive)).length;
                setStats(prev => ({ ...prev, activeJobs: active }));
                showToast(`Job ${data.data.isActive ? "activated" : "paused"}`);
            }
        } catch {
            showToast("Failed to update job status", "error");
        } finally {
            setTogglingJob(null);
        }
    };

    // ── Toggle save candidate ──
    const handleToggleSave = async (candidateId: string) => {
        setSavingId(candidateId);
        const wasSaved = savedIds.has(candidateId);
        try {
            if (wasSaved) {
                await authFetch(`/recruiter/candidates/${candidateId}`, { method: "DELETE" });
                setSavedIds(prev => { const s = new Set(prev); s.delete(candidateId); return s; });
                setStats(prev => ({ ...prev, savedCandidates: prev.savedCandidates - 1 }));
                showToast("Removed from saved");
            } else {
                await authFetch("/recruiter/candidates/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ candidateId }),
                });
                setSavedIds(prev => new Set([...prev, candidateId]));
                setStats(prev => ({ ...prev, savedCandidates: prev.savedCandidates + 1 }));
                showToast("Candidate saved!");
            }
        } catch {
            showToast("Save action failed", "error");
        } finally {
            setSavingId(null);
        }
    };

    // ── Client-side name search filter ──
    const filteredCandidates = useMemo(() => {
        if (!search) return candidates;
        const q = search.toLowerCase();
        return candidates.filter(
            c =>
                c.name.toLowerCase().includes(q) ||
                c.skills.some(s => s.name.toLowerCase().includes(q)) ||
                c.targetJobRole?.title.toLowerCase().includes(q)
        );
    }, [candidates, search]);

    const totalPages = Math.ceil(candidateTotal / 12);

    // ── AI Tool Shortcuts ──
    const aiTools = [
        {
            icon: Wand2,
            label: "Generate Job Description",
            desc: "AI writes a full JD for any role in seconds.",
            href: "/recruiter/post-job",
            color: "from-violet-500 to-indigo-600",
        },
        {
            icon: Bot,
            label: "AI Interview Config",
            desc: "Configure AI-powered interview workflows per job.",
            href: "/recruiter/jobs",
            color: "from-blue-500 to-cyan-500",
        },
        {
            icon: DollarSign,
            label: "Salary Band Advisor",
            desc: "Get market-aligned compensation bands instantly.",
            href: "/recruiter/post-job",
            color: "from-emerald-500 to-teal-600",
        },
        {
            icon: BarChart3,
            label: "Interview Analytics",
            desc: "Compare candidates with AI-generated scorecards.",
            href: "/recruiter/jobs",
            color: "from-rose-500 to-pink-600",
        },
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-12">

            {/* ── Welcome Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
            >
                <div>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Recruiter HQ
                    </p>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        Welcome back, {user?.name?.split(" ")[0] ?? "Recruiter"} 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Here's what's happening with your hiring pipeline today.
                    </p>
                </div>
                <Link
                    href="/recruiter/post-job"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95 flex-shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Post a Job
                </Link>
            </motion.div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Briefcase}
                    label="Active Jobs"
                    value={stats.activeJobs}
                    gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                    loading={stats.loading}
                />
                <StatCard
                    icon={Users}
                    label="Total Candidates"
                    value={stats.totalCandidates}
                    gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
                    loading={stats.loading}
                />
                <StatCard
                    icon={Bookmark}
                    label="Saved Candidates"
                    value={stats.savedCandidates}
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
                    loading={stats.loading}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Jobs Posted"
                    value={jobs.length}
                    gradient="bg-gradient-to-br from-rose-500 to-pink-600"
                    loading={jobsLoading}
                />
            </div>

            {/* ── Middle: Jobs + AI Tools ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Recent Jobs — 3 cols */}
                <div className="lg:col-span-3 bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Job Postings</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{jobs.length} posting{jobs.length !== 1 ? "s" : ""} total</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchJobs}
                                disabled={jobsLoading}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${jobsLoading ? "animate-spin" : ""}`} />
                            </button>
                            <Link
                                href="/recruiter/jobs"
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                View all <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>

                    <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
                        {jobsLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-20 rounded-2xl bg-gray-50 dark:bg-white/5 animate-pulse"
                                />
                            ))
                        ) : jobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No job postings yet</p>
                                <Link
                                    href="/recruiter/post-job"
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Post your first job →
                                </Link>
                            </div>
                        ) : (
                            jobs.slice(0, 8).map(job => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onToggle={handleToggleJob}
                                    toggling={togglingJob}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* AI Hiring Tools — 2 cols */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            AI Hiring Tools
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Supercharge your hiring with AI</p>
                    </div>
                    <div className="p-4 space-y-2">
                        {aiTools.map((tool) => (
                            <Link
                                key={tool.label}
                                href={tool.href}
                                className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all"
                            >
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                    <tool.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {tool.label}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tool.desc}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                            </Link>
                        ))}

                        {/* Upgrade / Pro banner */}
                        <div className="mt-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                            <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-1">Pro Feature</p>
                            <p className="text-sm font-bold">Bulk AI Interview Invites</p>
                            <p className="text-xs opacity-75 mt-0.5 mb-3">Send AI-powered interview links to hundreds of candidates at once.</p>
                            <Link
                                href="/recruiter/jobs"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-indigo-700 text-xs font-black hover:bg-indigo-50 transition-colors"
                            >
                                Configure <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Candidate Search ── */}
            <div className="bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                {/* Header & Search Bar */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-500" />
                                Talent Directory
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? "s" : ""} found
                            </p>
                        </div>
                        <button
                            onClick={() => setShowFilters(f => !f)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${showFilters
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400"
                                    : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20"
                                }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters
                            {showFilters ? <X className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    {/* Search input */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, skill, or role..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        />
                    </div>

                    {/* Advanced filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Skills (comma-separated)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. React, Python"
                                            value={skillFilter}
                                            onChange={e => { setSkillFilter(e.target.value); setCandidatePage(1); }}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. San Francisco"
                                            value={locationFilter}
                                            onChange={e => { setLocationFilter(e.target.value); setCandidatePage(1); }}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Min. Experience (yrs)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="20"
                                                placeholder="0"
                                                value={expFilter}
                                                onChange={e => { setExpFilter(e.target.value ? Number(e.target.value) : ""); setCandidatePage(1); }}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={() => { setSkillFilter(""); setLocationFilter(""); setExpFilter(""); setSearch(""); setCandidatePage(1); }}
                                            className="px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Candidate Grid */}
                <div className="p-6">
                    {candidatesLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-52 rounded-2xl bg-gray-50 dark:bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredCandidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-52 gap-4 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                <Users className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-700 dark:text-gray-300">No candidates found</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters</p>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        >
                            {filteredCandidates.map(c => (
                                <CandidateCard
                                    key={c.id}
                                    candidate={c}
                                    isSaved={savedIds.has(c.id)}
                                    onToggleSave={handleToggleSave}
                                    saving={savingId}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setCandidatePage(p => Math.max(1, p - 1))}
                                disabled={candidatePage === 1}
                                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:border-indigo-500/40 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                Page {candidatePage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCandidatePage(p => Math.min(totalPages, p + 1))}
                                disabled={candidatePage === totalPages}
                                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:border-indigo-500/40 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm ${toast.type === "error"
                                ? "bg-rose-600 text-white"
                                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                            }`}
                    >
                        {toast.type === "error" ? (
                            <X className="w-4 h-4 flex-shrink-0" />
                        ) : (
                            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400 dark:text-emerald-500" />
                        )}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
