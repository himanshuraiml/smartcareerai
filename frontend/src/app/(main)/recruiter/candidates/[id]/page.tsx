"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, User, Mail, Award, Clock, Activity, FileText, AlertCircle, MessageSquare, TrendingUp, TrendingDown, ShieldAlert, Percent, ClipboardList, Star, Send, Camera } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ScorecardSummaryCard from "@/components/recruiter/ScorecardSummaryCard";
import ProctoringReport from "@/components/recruiter/ProctoringReport";

interface CandidateProfile {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    userSkills: Array<{ skill: { name: string }, proficiencyLevel: string }>;
    targetJobRole?: { title: string };
    resumeId?: string | null;
    resumeUrl?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
    bio?: string | null;
    experienceYears?: number | null;
    createdAt: string;
    latestScores?: {
        analytical: number | null;
        behavioral: number | null;
        coding: number | null;
        assessmentStatus: string | null;
    };
}

interface Application {
    id: string;
    jobId: string;
    jobTitle: string;
    status: string;
    appliedAt: string;
    overallScore?: number;
    fitScore?: number;
    skillsMatch?: number;
    experienceMatch?: number;
    culturalFit?: number;
    dropoutRisk?: string;
    acceptanceLikelihood?: number;
    analyticalScore?: number | null;
    behavioralScore?: number | null;
    codingScore?: number | null;
    assessmentStatus?: string | null;
    applicationDeadline?: string | null;
    assessmentDeadline?: string | null;
    bgvStatus?: string | null;
    bgvInitiatedAt?: string | null;
    offerLetterUrl?: string | null;
    offerLetterGeneratedAt?: string | null;
}


export default function CandidateProfilePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();

    // State
    const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "applications" | "scorecards" | "proctoring">("overview");
    const [scorecards, setScorecards] = useState<any[]>([]);
    const [scorecardsLoading, setScorecardsLoading] = useState(false);
    const [proctoringReports, setProctoringReports] = useState<any[]>([]);
    const [proctoringLoading, setProctoringLoading] = useState(false);
    const [surveyingSent, setSurveyingSent] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSendSurvey = async (applicationId: string) => {
        try {
            const res = await authFetch(`/recruiter/applications/${applicationId}/survey`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || "Failed to send survey");
            }
            setSurveyingSent(prev => ({ ...prev, [applicationId]: true }));
            showToast("NPS survey sent to candidate", "success");
        } catch (err: any) {
            showToast(err.message || "Failed to send survey", "error");
        }
    };

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);

        try {
            const [profRes, appsRes] = await Promise.all([
                authFetch(`/recruiter/candidates/${id}`),
                authFetch(`/recruiter/candidates/${id}/applications`),
            ]);

            if (!profRes.ok) {
                const err = await profRes.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to load candidate');
            }

            const profData = await profRes.json();
            setCandidate(profData.data);

            if (appsRes.ok) {
                const appsData = await appsRes.json();
                setApplications(appsData.data || []);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load candidate details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    useEffect(() => {
        if (activeTab !== "proctoring" || applications.length === 0) return;
        async function fetchProctoring() {
            setProctoringLoading(true);
            try {
                const results = await Promise.all(
                    applications.map(app =>
                        authFetch(`/recruiter/applications/${app.id}/proctoring-report`)
                            .then(r => r.ok ? r.json() : null)
                            .then(d => d?.success ? { applicationId: app.id, jobTitle: app.jobTitle, ...d.data } : null)
                    )
                );
                setProctoringReports(results.filter(Boolean) as any[]);
            } finally {
                setProctoringLoading(false);
            }
        }
        fetchProctoring();
    }, [activeTab, applications]);

    useEffect(() => {
        if (activeTab !== "scorecards" || applications.length === 0) return;
        async function fetchScorecards() {
            setScorecardsLoading(true);
            try {
                const results = await Promise.all(
                    applications.map(app =>
                        authFetch(`/recruiter/applications/${app.id}/scorecards`)
                            .then(r => r.ok ? r.json() : null)
                            .then(d => d?.success ? {
                                applicationId: app.id,
                                jobTitle: app.jobTitle,
                                assignments: d.data.assignments || [],
                                summary: d.data.summary || { totalAssigned: 0, totalSubmitted: 0, overallAvg: null, dimensionAverages: [] },
                            } : null)
                    )
                );
                setScorecards(results.filter(Boolean));
            } catch { /* silent */ }
            finally { setScorecardsLoading(false); }
        }
        fetchScorecards();
    }, [activeTab, applications]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-500" />
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Profile...</p>
            </div>
        );
    }

    if (error && !candidate) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8">
                <AlertCircle className="w-16 h-16 text-rose-500 block mb-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Loading Error</h2>
                <p className="text-gray-500 dark:text-gray-400">{error}</p>
                <button onClick={fetchData} className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition mt-2">Retry</button>
            </div>
        );
    }

    // Safely extract candidate initial
    const initial = candidate?.name ? candidate.name.charAt(0).toUpperCase() : '?';

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
                    >
                        {toast.type === "success" ? <Award className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Nav */}
            <div className="flex items-center justify-between bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-3xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-indigo-600 transition group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Candidate Profile</h1>
                        <p className="text-xs text-gray-500 font-medium">{candidate?.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                </div>
            </div>

            {/* Profile Overview Card */}
            {candidate && (
                <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                        {/* Avatar */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-500/20 shrink-0 border-4 border-white dark:border-gray-900 -mt-6 bg-white shrink">
                            {candidate.avatarUrl ? (
                                <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                                initial
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 pb-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{candidate.name}</h2>
                                    {candidate.targetJobRole && (
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                            <Award className="w-4 h-4" /> {candidate.targetJobRole.title}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {candidate.resumeId && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await authFetch(`/resumes/${candidate.resumeId}/download`);
                                                    if (!res.ok) throw new Error("Failed to get resume URL");
                                                    const data = await res.json();
                                                    window.open(data.data.url, "_blank");
                                                } catch {
                                                    alert("Could not open resume. Please try again.");
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl text-sm border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 transition cursor-pointer"
                                        >
                                            <FileText className="w-4 h-4" /> View Resume
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            const targetPath = `/recruiter/messages?candidateId=${candidate.id}`;
                                            if (pathname === '/recruiter/messages' || pathname === `/recruiter/candidates/${candidate.id}`) {
                                                // If we are on the candidate profile and click message, we go to messages. 
                                                // The "toggle" logic here is a bit tricky since we are on a different page.
                                                // However, if we are ALREADY on the messages page for this candidate, clicking message icon in header would toggle.
                                                // For this button on the profile page, let's just make it navigate.
                                                router.push(targetPath);
                                            } else {
                                                router.push(targetPath);
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl text-sm border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 transition cursor-pointer"
                                    >
                                        <MessageSquare className="w-4 h-4" /> Message
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {candidate.email}</span>
                                <span className="text-gray-300 dark:text-gray-700">•</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Joined {new Date(candidate.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Skills */}
                            {candidate.userSkills && candidate.userSkills.length > 0 && (
                                <div className="mt-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Top Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {candidate.userSkills.map((sk, i) => (
                                            <span key={i} className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-white dark:bg-white/5 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                                                {sk.skill.name} <span className="opacity-50 ml-1">· {sk.proficiencyLevel.substring(0, 3)}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {[
                    { id: "overview", label: "Overview", icon: Activity },
                    { id: "applications", label: "Applications", icon: FileText, count: applications.length },
                    { id: "scorecards", label: "Scorecards", icon: ClipboardList },
                    { id: "proctoring", label: "Proctoring", icon: Camera },
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm"}`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] ${isActive ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800"}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {candidate && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* OVERVIEW TAB */}
                        {activeTab === "overview" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Score Summary Card */}
                                <div className="md:col-span-2 bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-indigo-500" />
                                        Latest Assessment Performance
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Analytical</p>
                                            <p className="text-3xl font-black text-gray-900 dark:text-white">
                                                {candidate.latestScores?.analytical != null ? `${candidate.latestScores.analytical}%` : <span className="text-gray-300 dark:text-gray-700">--</span>}
                                            </p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100/50 dark:border-purple-500/10 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">Behavioral</p>
                                            <p className="text-3xl font-black text-gray-900 dark:text-white">
                                                {candidate.latestScores?.behavioral != null ? `${(candidate.latestScores.behavioral / 10).toFixed(1)}/10` : <span className="text-gray-300 dark:text-gray-700">--</span>}
                                            </p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Coding</p>
                                            <p className="text-3xl font-black text-gray-900 dark:text-white">
                                                {candidate.latestScores?.coding != null ? `${candidate.latestScores.coding}%` : <span className="text-gray-300 dark:text-gray-700">--</span>}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 font-medium lowercase italic">Last attempt status</span>
                                            <span className={`px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest text-[10px] ${candidate.latestScores?.assessmentStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                candidate.latestScores?.assessmentStatus === 'FLAGGED' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {candidate.latestScores?.assessmentStatus || 'No Attempts'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Info */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-widest opacity-50">Quick Details</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Exp. Years</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{candidate.experienceYears ?? 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-50 dark:border-white/5">
                                                <span className="text-gray-500">Location</span>
                                                <span className="font-bold text-gray-900 dark:text-white">San Francisco, CA</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* APPLICATIONS TAB */}
                        {activeTab === "applications" && (
                            <div className="space-y-4">
                                {applications.length === 0 ? (
                                    <div className="text-center py-12 bg-white dark:bg-gray-900 border border-dashed border-gray-200 rounded-3xl text-gray-500">
                                        No applications found.
                                    </div>
                                ) : (
                                    applications.map((app) => (
                                        <div key={app.id} className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{app.jobTitle}</h3>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                                        <span className="font-bold text-indigo-600 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100">
                                                            {app.status}
                                                        </span>
                                                        <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {(app.applicationDeadline || app.assessmentDeadline) && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {app.applicationDeadline && (() => {
                                                                const isPast = new Date() > new Date(app.applicationDeadline!);
                                                                return (
                                                                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isPast ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                                                                        <Clock className="w-3 h-3" />
                                                                        App closes: {new Date(app.applicationDeadline!).toLocaleDateString()}{isPast && ' (Closed)'}
                                                                    </span>
                                                                );
                                                            })()}
                                                            {app.assessmentDeadline && (() => {
                                                                const isPast = new Date() > new Date(app.assessmentDeadline!);
                                                                return (
                                                                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isPast ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'}`}>
                                                                        <Clock className="w-3 h-3" />
                                                                        Test due: {new Date(app.assessmentDeadline!).toLocaleDateString()}{isPast && ' (Expired)'}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                                {app.overallScore && (
                                                    <div className="flex flex-col items-center bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 min-w-[80px]">
                                                        <span className="text-2xl font-black text-emerald-600">{app.overallScore}</span>
                                                        <span className="text-[10px] uppercase font-bold text-gray-400">Overall AI</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Test Scores Grid */}
                                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Analytical</span>
                                                    <span className="text-lg font-black text-gray-900 dark:text-white">
                                                        {app.analyticalScore !== null ? `${app.analyticalScore}%` : <span className="text-gray-300 dark:text-gray-700 font-medium text-sm italic">N/A</span>}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col border-x border-gray-50 dark:border-white/5 px-4 text-center">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Behavioral</span>
                                                    <span className="text-lg font-black text-gray-900 dark:text-white">
                                                        {app.behavioralScore != null ? `${(app.behavioralScore / 10).toFixed(1)}/10` : <span className="text-gray-300 dark:text-gray-700 font-medium text-sm italic">N/A</span>}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Coding</span>
                                                    <span className="text-lg font-black text-gray-900 dark:text-white">
                                                        {app.codingScore !== null ? `${app.codingScore}%` : <span className="text-gray-300 dark:text-gray-700 font-medium text-sm italic">N/A</span>}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Offer Letter + BGV Status */}
                                            {(app.offerLetterUrl || app.bgvStatus) && (
                                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 flex flex-wrap gap-3 items-center">
                                                    {app.offerLetterUrl && (
                                                        <a
                                                            href={app.offerLetterUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            View Offer Letter
                                                            {app.offerLetterGeneratedAt && (
                                                                <span className="font-normal text-emerald-600/70 ml-1">
                                                                    · {new Date(app.offerLetterGeneratedAt).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </a>
                                                    )}
                                                    {app.bgvStatus && (
                                                        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                                                            app.bgvStatus === 'CLEAR' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                                                            : app.bgvStatus === 'FLAGGED' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20'
                                                            : app.bgvStatus === 'IN_PROGRESS' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700'
                                                        }`}>
                                                            <ShieldAlert className="w-3 h-3" />
                                                            BGV: {app.bgvStatus.replace('_', ' ')}
                                                            {app.bgvInitiatedAt && (
                                                                <span className="font-normal opacity-70 ml-1">
                                                                    · {new Date(app.bgvInitiatedAt).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Send NPS Survey */}
                                            {["INTERVIEWING", "OFFER", "PLACED", "REJECTED"].includes(app.status) && (
                                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 flex justify-end">
                                                    <button
                                                        onClick={() => handleSendSurvey(app.id)}
                                                        disabled={surveyingSent[app.id]}
                                                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                                                            surveyingSent[app.id]
                                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 cursor-default"
                                                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                                                        }`}
                                                    >
                                                        <Star className="w-3 h-3" />
                                                        {surveyingSent[app.id] ? "Survey Sent" : "Send NPS Survey"}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Predictive Analytics */}
                                            {(app.fitScore != null || app.dropoutRisk || app.acceptanceLikelihood != null) && (
                                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-3">Predictive Analytics</p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {app.fitScore != null && (
                                                            <div className="flex flex-col items-center p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10">
                                                                <TrendingUp className="w-3.5 h-3.5 text-indigo-500 mb-1" />
                                                                <span className="text-sm font-black text-indigo-700 dark:text-indigo-400">{Math.round(app.fitScore)}%</span>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Role Fit</span>
                                                            </div>
                                                        )}
                                                        {app.dropoutRisk && (
                                                            <div className={`flex flex-col items-center p-2.5 rounded-xl border ${app.dropoutRisk === "LOW" ? "bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10" : app.dropoutRisk === "MEDIUM" ? "bg-amber-50/60 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10" : "bg-rose-50/60 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10"}`}>
                                                                {app.dropoutRisk === "LOW"
                                                                    ? <TrendingDown className="w-3.5 h-3.5 text-emerald-500 mb-1" />
                                                                    : <ShieldAlert className="w-3.5 h-3.5 text-amber-500 mb-1" />
                                                                }
                                                                <span className={`text-sm font-black ${app.dropoutRisk === "LOW" ? "text-emerald-700 dark:text-emerald-400" : app.dropoutRisk === "MEDIUM" ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400"}`}>
                                                                    {app.dropoutRisk}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Drop Risk</span>
                                                            </div>
                                                        )}
                                                        {app.acceptanceLikelihood != null && (
                                                            <div className="flex flex-col items-center p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                                                                <Percent className="w-3.5 h-3.5 text-emerald-500 mb-1" />
                                                                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{Math.round(app.acceptanceLikelihood)}%</span>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Offer Accept</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* SCORECARDS TAB */}
                        {activeTab === "scorecards" && (
                            <div className="space-y-6">
                                {scorecardsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin" />
                                    </div>
                                ) : scorecards.length === 0 ? (
                                    <div className="text-center py-12 bg-white dark:bg-gray-900 border border-dashed border-gray-200 rounded-3xl">
                                        <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No scorecards submitted yet.</p>
                                        <p className="text-xs text-gray-400 mt-1">Assign interviewers from the job pipeline to collect scorecard feedback.</p>
                                    </div>
                                ) : (
                                    scorecards.map((sc) => (
                                        <div key={sc.applicationId} className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4 text-purple-500" />
                                                {sc.jobTitle}
                                            </h3>
                                            <ScorecardSummaryCard
                                                applicationId={sc.applicationId}
                                                candidateName={candidate?.name || ""}
                                                jobTitle={sc.jobTitle}
                                                assignments={sc.assignments}
                                                summary={sc.summary}
                                                currentUserId={user?.id}
                                                onScorecardSubmitted={() => {
                                                    // re-trigger scorecards fetch by toggling activeTab
                                                    setActiveTab("overview");
                                                    setTimeout(() => setActiveTab("scorecards"), 50);
                                                }}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* PROCTORING TAB */}
                        {activeTab === "proctoring" && (
                            <div className="space-y-6">
                                {proctoringLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin" />
                                    </div>
                                ) : proctoringReports.length === 0 ? (
                                    <div className="text-center py-12 bg-white dark:bg-gray-900 border border-dashed border-gray-200 rounded-3xl">
                                        <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No assessment attempts found.</p>
                                    </div>
                                ) : (
                                    proctoringReports.map((r) => (
                                        <div key={r.applicationId} className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-blue-500" />
                                                {r.jobTitle}
                                            </h3>
                                            <ProctoringReport report={r} />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
