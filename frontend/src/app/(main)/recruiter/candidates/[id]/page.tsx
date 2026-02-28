"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Mail, Award, Clock, Activity, FileText, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
}


export default function CandidateProfilePage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();

    // State
    const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "applications">("overview");

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
                                    <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl text-sm border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 transition">
                                        <Mail className="w-4 h-4" /> Message
                                    </a>
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
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* APPLICATIONS TAB */}
                    {activeTab === "applications" && (
                        <div className="space-y-4">
                            {applications.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-gray-900 border border-dashed border-gray-200 rounded-3xl text-gray-500">
                                    No applications found.
                                </div>
                            ) : (
                                applications.map((app) => (
                                    <div key={app.id} className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{app.jobTitle}</h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="font-bold text-indigo-600 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100">
                                                    {app.status}
                                                </span>
                                                <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {app.overallScore && (
                                            <div className="flex flex-col items-center">
                                                <span className="text-2xl font-black text-emerald-600">{app.overallScore}</span>
                                                <span className="text-[10px] uppercase font-bold text-gray-400">AI Score</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
