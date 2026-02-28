"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    ArrowLeft, User, GripVertical, ExternalLink, RefreshCw,
    Briefcase, Mail, FileText, Award, AlertCircle, Zap,
    Brain, BarChart3, Settings2, X, TrendingUp, Users, Sparkles,
    Video, Send, Loader2, Bot, Check, ChevronLeft, Calendar, Clock
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AIInterviewConfig from "@/components/recruiter/AIInterviewConfig";
import CandidateEvalModal from "@/components/recruiter/CandidateEvalModal";
import BulkInviteModal from "@/components/recruiter/BulkInviteModal";
import AISummaryModal from "@/components/recruiter/AISummaryModal";
import RediscoveryModal from "@/components/recruiter/RediscoveryModal";

type AppStatus = "APPLIED" | "SCREENING" | "INTERVIEWING" | "OFFER" | "REJECTED";
type SidePanel = "interview" | "analytics" | null;

interface Applicant {
    applicationId: string;
    candidateId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    status: AppStatus;
    appliedAt: string;
    resumeUrl?: string | null;
    coverLetter?: string | null;
    overallScore?: number;
    aiEvaluation?: any;
    notes?: string;
    fitScore?: number;
    dropoutRisk?: string;
    acceptanceLikelihood?: number;
    biasFlags?: any[];
}

interface JobDetail {
    id: string;
    title: string;
    location: string;
    locationType: string;
    requiredSkills: string[];
    isActive: boolean;
    createdAt: string;
    applicantCount: number;
}

interface Analytics {
    totalApplicants: number;
    evaluated: number;
    avgScore: number | null;
    stageCounts: Record<string, number>;
    topCandidates: { applicationId: string; overallScore: number; status: string; recommendation: string }[];
}

const COLUMNS: { id: AppStatus; label: string; color: string; bg: string; borderColor: string; darkBg: string }[] = [
    { id: "APPLIED", label: "Applied", color: "text-blue-500", bg: "bg-blue-50", darkBg: "dark:bg-blue-500/10", borderColor: "border-blue-200 dark:border-blue-500/30" },
    { id: "SCREENING", label: "Screening", color: "text-amber-500", bg: "bg-amber-50", darkBg: "dark:bg-amber-500/10", borderColor: "border-amber-200 dark:border-amber-500/30" },
    { id: "INTERVIEWING", label: "Interviewing", color: "text-purple-500", bg: "bg-purple-50", darkBg: "dark:bg-purple-500/10", borderColor: "border-purple-200 dark:border-purple-500/30" },
    { id: "OFFER", label: "Offer Extended", color: "text-emerald-500", bg: "bg-emerald-50", darkBg: "dark:bg-emerald-500/10", borderColor: "border-emerald-200 dark:border-emerald-500/30" },
    { id: "REJECTED", label: "Rejected", color: "text-red-500", bg: "bg-red-50", darkBg: "dark:bg-red-500/10", borderColor: "border-red-200 dark:border-red-500/30" },
];

const RECOMMENDATION_COLORS: Record<string, string> = {
    STRONG_HIRE: "text-emerald-500",
    HIRE: "text-blue-500",
    MAYBE: "text-amber-500",
    NO_HIRE: "text-rose-500",
};

export default function RecruiterJobATSPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();

    const [job, setJob] = useState<JobDetail | null>(null);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [isBrowser, setIsBrowser] = useState(false);
    const [sidePanel, setSidePanel] = useState<SidePanel>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [evalTarget, setEvalTarget] = useState<{ applicationId: string; name: string } | null>(null);
    const [summaryTarget, setSummaryTarget] = useState<{ applicationId: string; name: string, type: 'summary' | 'justification' } | null>(null);
    const [inviteTarget, setInviteTarget] = useState<{ applicationId: string; name: string } | null>(null);
    const [invitedMap, setInvitedMap] = useState<Record<string, { sessionId: string; type: 'AI' | 'COPILOT' }>>({});
    const [showBulkInvite, setShowBulkInvite] = useState(false);
    const [showRediscover, setShowRediscover] = useState(false);

    useEffect(() => { setIsBrowser(true); }, []);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [jobRes, appsRes] = await Promise.all([
                authFetch(`/recruiter/jobs/${id}`),
                authFetch(`/recruiter/jobs/${id}/applicants`),
            ]);
            if (!jobRes.ok || !appsRes.ok) throw new Error("Failed to fetch data");
            const jobData = await jobRes.json();
            const appsData = await appsRes.json();
            setJob(jobData.data);
            setApplicants(appsData.data || []);
        } catch {
            setError("Failed to load job data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchAnalytics = useCallback(async () => {
        if (!id) return;
        setAnalyticsLoading(true);
        try {
            const res = await authFetch(`/recruiter/jobs/${id}/ai-interview/analytics`);
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data.data);
            }
        } catch { /* silent */ }
        finally { setAnalyticsLoading(false); }
    }, [id]);

    useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
        const newStatus = destination.droppableId as AppStatus;
        const targetApp = applicants.find(a => a.applicationId === draggableId);
        if (!targetApp || targetApp.status === newStatus) return;
        const oldStatus = targetApp.status;
        setApplicants(prev => prev.map(a => a.applicationId === draggableId ? { ...a, status: newStatus } : a));
        try {
            const res = await authFetch(`/recruiter/applications/${draggableId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Update Failed");
            showToast(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`, "success");
        } catch {
            setApplicants(prev => prev.map(a => a.applicationId === draggableId ? { ...a, status: oldStatus } : a));
            showToast("Failed to update status. Reverting.", "error");
        }
    };

    const handleEvalComplete = (result: any) => {
        // Update the applicant's score live in the list
        if (evalTarget) {
            setApplicants(prev => prev.map(a =>
                a.applicationId === evalTarget.applicationId
                    ? { ...a, overallScore: result.overallScore, aiEvaluation: result }
                    : a
            ));
        }
        showToast(`Evaluation complete — Score: ${result.overallScore}/100`, "success");
    };

    const togglePanel = (panel: SidePanel) => {
        if (sidePanel === panel) {
            setSidePanel(null);
        } else {
            setSidePanel(panel);
            if (panel === "analytics") fetchAnalytics();
        }
    };

    const columnApplicants = (colId: AppStatus) => applicants
        .filter((a) => a.status === colId)
        .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));

    if (loading || !isBrowser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                    </div>
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Pipeline...</p>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 shadow-sm p-8">
                <AlertCircle className="w-16 h-16 text-rose-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pipeline Error</h2>
                <p className="text-gray-500 dark:text-gray-400">{error || "Job not found"}</p>
                <button onClick={fetchData} className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition mt-2">Retry</button>
            </div>
        );
    }

    const evaluatedCount = applicants.filter(a => a.overallScore != null && a.overallScore > 0).length;

    return (
        <div className="space-y-0 max-w-full mx-auto pb-10">
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

            {/* Eval Modal */}
            <AnimatePresence>
                {evalTarget && (
                    <CandidateEvalModal
                        jobId={id}
                        applicationId={evalTarget.applicationId}
                        candidateName={evalTarget.name}
                        onClose={() => setEvalTarget(null)}
                        onComplete={handleEvalComplete}
                    />
                )}
            </AnimatePresence>

            {/* Bulk Invite Modal */}
            <AnimatePresence>
                {showBulkInvite && (
                    <BulkInviteModal
                        jobId={id}
                        onClose={() => setShowBulkInvite(false)}
                        onSuccess={(results) => {
                            setShowBulkInvite(false);
                            showToast(`Successfully invited ${results.added} candidates`, "success");
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* AI Rediscovery / Sourcing Modal */}
            <AnimatePresence>
                {showRediscover && (
                    <RediscoveryModal
                        jobId={id}
                        onClose={() => setShowRediscover(false)}
                        onInvite={async (candidate) => {
                            try {
                                const res = await authFetch(`/recruiter/jobs/${id}/bulk-invite`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ candidates: [{ name: candidate.name, email: candidate.email }] })
                                });
                                if (!res.ok) throw new Error("Failed to invite");
                                showToast(`${candidate.name} added to pipeline!`, "success");
                                setShowRediscover(false);
                                fetchData();
                            } catch (e) {
                                showToast("Failed to move candidate to pipeline.", "error");
                            }
                        }}
                    />
                )}
            </AnimatePresence>

            {/* AI Summary/Justification Modal */}
            <AnimatePresence>
                {summaryTarget && (
                    <AISummaryModal
                        applicationId={summaryTarget.applicationId}
                        candidateName={summaryTarget.name}
                        type={summaryTarget.type}
                        onClose={() => setSummaryTarget(null)}
                        onComplete={() => {
                            showToast(`Successfully generated ${summaryTarget.type === 'summary' ? 'summary' : 'justification'}`, "success");
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Interview Invite Modal */}
            <AnimatePresence>
                {inviteTarget && (
                    <InviteInterviewModal
                        jobId={id}
                        applicationId={inviteTarget.applicationId}
                        candidateName={inviteTarget.name}
                        onClose={() => setInviteTarget(null)}
                        onSuccess={(sessionId: string, type: 'AI' | 'COPILOT') => {
                            setInvitedMap(prev => ({ ...prev, [inviteTarget.applicationId]: { sessionId, type } }));
                            setInviteTarget(null);
                            const label = type === 'AI' ? 'AI interview' : 'co-pilot interview';
                            showToast(`${label} invitation sent to ${inviteTarget.name}`, "success");
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-3xl shadow-sm mb-6">
                <div className="flex items-start gap-4">
                    <Link href="/recruiter/jobs" className="p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-indigo-600 transition group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{job.title}</h1>
                        <div className="flex items-center flex-wrap gap-2 mt-1 text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.location}</span>
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <span className="capitalize">{job.locationType}</span>
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{applicants.length} Candidates</span>
                            {evaluatedCount > 0 && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-700">·</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> {evaluatedCount} AI-Scored
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowRediscover(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm transition-all"
                    >
                        <Sparkles className="w-4 h-4" /> AI Sourcing
                    </button>
                    <button
                        onClick={() => setShowBulkInvite(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 transition-all"
                    >
                        <Users className="w-4 h-4" /> Bulk Invite
                    </button>
                    <Link
                        href={`/recruiter/jobs/${id}/analytics`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300"
                    >
                        <BarChart3 className="w-4 h-4" /> Analytics
                    </Link>
                    <button
                        onClick={() => togglePanel("interview")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${sidePanel === "interview" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300"}`}
                    >
                        <Brain className="w-4 h-4" /> AI Interview
                    </button>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:border-gray-300 shadow-sm transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Side panel + Kanban layout */}
            <div className="flex gap-6 items-start">
                {/* Kanban Board */}
                <div className="flex-1 overflow-x-auto pb-8 custom-scrollbar min-w-0">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="flex items-stretch gap-4 min-w-max px-1">
                            {COLUMNS.map((col) => {
                                const cards = columnApplicants(col.id);
                                return (
                                    <div key={col.id} className="w-[290px] flex flex-col">
                                        {/* Column Header */}
                                        <div className={`flex items-center justify-between p-3.5 mb-3 rounded-2xl border ${col.bg} ${col.darkBg} ${col.borderColor}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${col.bg} border ${col.borderColor}`} />
                                                <h3 className={`font-bold ${col.color} text-xs uppercase tracking-wider`}>{col.label}</h3>
                                            </div>
                                            <div className="px-2 py-0.5 bg-white/60 dark:bg-black/20 rounded-lg text-xs font-black text-gray-700 dark:text-gray-200">{cards.length}</div>
                                        </div>

                                        <Droppable droppableId={col.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`flex-1 min-h-[420px] p-1.5 rounded-2xl transition-all duration-200 ${snapshot.isDraggingOver ? "bg-indigo-50/60 dark:bg-indigo-500/10 border-2 border-dashed border-indigo-300 dark:border-indigo-500/40" : "bg-transparent"}`}
                                                >
                                                    {cards.map((app, index) => (
                                                        <Draggable key={app.applicationId} draggableId={app.applicationId} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`mb-3 transition-transform ${snapshot.isDragging ? "rotate-1 scale-105 z-50" : ""}`}
                                                                    style={{ ...provided.draggableProps.style }}
                                                                >
                                                                    <ApplicantCard
                                                                        applicant={app}
                                                                        onEvaluate={() => setEvalTarget({ applicationId: app.applicationId, name: app.name })}
                                                                        onSummary={() => setSummaryTarget({ applicationId: app.applicationId, name: app.name, type: 'summary' })}
                                                                        onJustification={() => setSummaryTarget({ applicationId: app.applicationId, name: app.name, type: 'justification' })}
                                                                        onInvite={() => setInviteTarget({ applicationId: app.applicationId, name: app.name })}
                                                                        invitedInfo={invitedMap[app.applicationId]}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}

                                                    {cards.length === 0 && !snapshot.isDraggingOver && (
                                                        <div className="h-24 flex items-center justify-center text-gray-300 dark:text-gray-700 text-xs font-semibold border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                                            Drop here
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                );
                            })}
                        </div>
                    </DragDropContext>
                </div>

                {/* Analytics Side Panel (stays as narrow panel) */}
                <AnimatePresence>
                    {sidePanel === "analytics" && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 400, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="flex-shrink-0 overflow-hidden"
                        >
                            <div className="w-[400px] bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-indigo-500" /> Job Analytics
                                    </h3>
                                    <button onClick={() => setSidePanel(null)} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <AnalyticsPanel analytics={analytics} loading={analyticsLoading} applicants={applicants} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AI Interview Config — full-screen modal */}
                <AnimatePresence>
                    {sidePanel === "interview" && (
                        <AIInterviewConfig
                            jobId={id}
                            jobTitle={job.title}
                            onClose={() => setSidePanel(null)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {applicants.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-dashed border-gray-200 rounded-3xl mt-4">
                    <User className="w-14 h-14 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pipeline Empty</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-sm">No candidates yet. Pipeline tracking will appear here once candidates apply.</p>
                </div>
            )}
        </div>
    );
}

// ── Applicant Card ──────────────────────────────────────────────────
function ApplicantCard({ applicant, onEvaluate, onSummary, onJustification, onInvite, invitedInfo }: {
    applicant: Applicant;
    onEvaluate: () => void;
    onSummary: () => void;
    onJustification: () => void;
    onInvite: () => void;
    invitedInfo?: { sessionId: string; type: 'AI' | 'COPILOT' };
}) {
    const hasScore = applicant.overallScore != null && applicant.overallScore > 0;
    const recommendation = applicant.aiEvaluation?.recommendation;

    // Determine dropout risk color
    const getRiskColor = (risk?: string) => {
        if (!risk) return "bg-gray-100 dark:bg-gray-800 text-gray-500";
        switch (risk.toUpperCase()) {
            case "HIGH": return "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
            case "MEDIUM": return "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
            case "LOW": return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
            default: return "bg-gray-100 dark:bg-gray-800 text-gray-500";
        }
    };

    return (
        <div className="group bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {applicant.biasFlags && applicant.biasFlags.length > 0 && (
                    <div className="text-rose-500" title={`Bias Warning: ${applicant.biasFlags[0]}`}>
                        <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                )}
                <GripVertical className="w-3.5 h-3.5 text-gray-300" />
            </div>

            {/* Avatar + Info */}
            <div className="flex items-start gap-3 mb-3 pr-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {applicant.avatarUrl
                        ? <img src={applicant.avatarUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                        : applicant.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{applicant.name}</p>
                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{applicant.email}</p>
                </div>
            </div>

            {/* Score / Fit / Risk Grid */}
            <div className="mb-3 grid grid-cols-2 gap-2">
                {/* AI Score (Interviews) */}
                {hasScore ? (
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> AI Score</span>
                            <div className="flex items-baseline gap-0.5">
                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm leading-none">{applicant.overallScore}</span>
                                <span className="text-[10px] text-emerald-400 font-bold">/100</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><FileText className="w-2.5 h-2.5" /> AI Score</span>
                        <span className="text-xs text-gray-400 font-medium">Pending Data</span>
                    </div>
                )}

                {/* Fit Score */}
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Brain className="w-2.5 h-2.5" /> Fit Score</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm leading-none">{applicant.fitScore || 0}</span>
                            <span className="text-[10px] text-indigo-400 font-bold">%</span>
                        </div>
                    </div>
                </div>

                {/* Risk and Acc Lk */}
                <div className={`col-span-2 p-1.5 flex items-center justify-between rounded-lg border ${getRiskColor(applicant.dropoutRisk)}`}>
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Risk: {applicant.dropoutRisk || 'N/A'}</span>
                    </div>
                    {applicant.acceptanceLikelihood != null && (
                        <span className="text-[10px] font-bold bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">
                            {applicant.acceptanceLikelihood}% Accept Lk.
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 pt-2.5 mt-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 flex-1">
                        {new Date(applicant.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEvaluate(); }}
                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 transition-colors"
                    >
                        <Brain className="w-2.5 h-2.5" /> {hasScore ? "Re-eval" : "Evaluate"}
                    </button>
                    {applicant.resumeUrl ? (
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    const res = await authFetch(`/resumes/candidate/${applicant.candidateId}/download`);
                                    if (!res.ok) throw new Error();
                                    const data = await res.json();
                                    window.open(data.data.url, "_blank");
                                } catch {
                                    alert("Could not open resume. Please try again.");
                                }
                            }}
                            title="View Resume"
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/20 transition-colors cursor-pointer"
                        >
                            <FileText className="w-2.5 h-2.5" /> Resume
                        </button>
                    ) : (
                        <span
                            title="No resume submitted"
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 border border-gray-100 dark:border-gray-800 cursor-not-allowed"
                        >
                            <FileText className="w-2.5 h-2.5" /> No CV
                        </span>
                    )}
                    <Link
                        href={`/recruiter/candidates/${applicant.candidateId}`}
                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-gray-800 transition-colors"
                        onClick={e => e.stopPropagation()}
                    >
                        <ExternalLink className="w-2.5 h-2.5" /> View
                    </Link>
                </div>

                {/* Interview Invite Button — context-aware */}
                {invitedInfo?.type === 'COPILOT' ? (
                    <a
                        href={`/dashboard/interviews/${invitedInfo.sessionId}/live`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg border bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-500/20 border-teal-100 dark:border-teal-500/20 transition-colors"
                    >
                        <Video className="w-2.5 h-2.5" /> Launch Copilot
                    </a>
                ) : invitedInfo?.type === 'AI' || applicant.status === 'INTERVIEWING' ? (
                    <button
                        disabled
                        className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg border bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20 opacity-70 cursor-default"
                    >
                        <Bot className="w-2.5 h-2.5" /> AI Interview Sent
                    </button>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); onInvite(); }}
                        className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-emerald-100 dark:border-emerald-500/20 transition-colors"
                    >
                        <Video className="w-2.5 h-2.5" /> Invite to Interview
                    </button>
                )}

                {hasScore && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onSummary(); }}
                            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-100 dark:border-violet-500/20 transition-colors"
                        >
                            <FileText className="w-2.5 h-2.5" /> 5-Line Summary
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onJustification(); }}
                            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-100 dark:border-blue-500/20 transition-colors"
                        >
                            <Award className="w-2.5 h-2.5" /> Justification
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Invite to Interview Modal (two-step: choose type → configure) ────
function InviteInterviewModal({ jobId, applicationId, candidateName, onClose, onSuccess }: {
    jobId: string;
    applicationId: string;
    candidateName: string;
    onClose: () => void;
    onSuccess: (sessionId: string, type: 'AI' | 'COPILOT') => void;
}) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedType, setSelectedType] = useState<'AI' | 'COPILOT'>('AI');
    const [message, setMessage] = useState('');
    const [scheduledAt, setScheduledAt] = useState(''); // datetime-local value
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Minimum datetime: 30 minutes from now
    const minDateTime = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16);

    const handleSend = async () => {
        if (selectedType === 'COPILOT' && !scheduledAt) {
            setError('Please select a date and time for the interview.');
            return;
        }
        setSending(true);
        setError(null);
        try {
            const body: any = {
                customMessage: message || undefined,
                inviteType: selectedType,
            };
            if (selectedType === 'COPILOT' && scheduledAt) {
                body.scheduledAt = new Date(scheduledAt).toISOString();
                body.durationMinutes = durationMinutes;
            }
            const res = await authFetch(`/recruiter/jobs/${jobId}/invite/${applicationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send invitation');
            }
            const data = await res.json();
            onSuccess(data.data?.sessionId, selectedType);
        } catch (err: any) {
            setError(err.message || 'Failed to send invitation');
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <Video className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                {step === 1 ? 'Invite to Interview' : selectedType === 'AI' ? 'Full AI Interview' : 'Co-pilot Interview'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{candidateName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Step 1: Choose type */}
                {step === 1 && (
                    <div className="p-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how you want to interview <strong className="text-gray-800 dark:text-gray-200">{candidateName}</strong>:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Full AI Interview */}
                            <button
                                onClick={() => { setSelectedType('AI'); setStep(2); }}
                                className="p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-500/5 text-left hover:border-indigo-400 dark:hover:border-indigo-400 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-3">
                                    <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Full AI Interview</h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">AI asks questions and evaluates automatically. Candidate takes it at their own time — no scheduling needed.</p>
                                <div className="space-y-1.5">
                                    {['Async, no scheduling', 'Full AI evaluation report', 'No recruiter time'].map(f => (
                                        <div key={f} className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400">
                                            <Check className="w-3 h-3 flex-shrink-0" /><span>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </button>

                            {/* Co-pilot Interview */}
                            <button
                                onClick={() => { setSelectedType('COPILOT'); setStep(2); }}
                                className="p-4 rounded-xl border-2 border-teal-200 dark:border-teal-500/30 bg-teal-50/60 dark:bg-teal-500/5 text-left hover:border-teal-400 dark:hover:border-teal-400 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center mb-3">
                                    <Video className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Co-pilot Interview</h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">You conduct the interview live via video call. AI suggests questions and helps evaluate responses in real-time.</p>
                                <div className="space-y-1.5">
                                    {['Human-led, personal touch', 'Real-time AI question hints', 'AI-powered hiring decision'].map(f => (
                                        <div key={f} className="flex items-center gap-1.5 text-[11px] text-teal-600 dark:text-teal-400">
                                            <Check className="w-3 h-3 flex-shrink-0" /><span>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </button>
                        </div>
                        <button onClick={onClose} className="w-full mt-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            Cancel
                        </button>
                    </div>
                )}

                {/* Step 2: Configure + send */}
                {step === 2 && (
                    <div className="p-6 space-y-4">
                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-1"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Back
                        </button>

                        <div className={`p-3 rounded-xl border text-xs leading-relaxed ${selectedType === 'AI'
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                            : 'bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20 text-teal-700 dark:text-teal-300'
                        }`}>
                            {selectedType === 'AI' ? (
                                <>An <strong>AI interview session</strong> will be created for <strong>{candidateName}</strong>. They'll receive a notification to start at their convenience. No credits deducted from candidate.</>
                            ) : (
                                <>A <strong>co-pilot session</strong> will be created. A Google Calendar invite with a Meet link will be sent to <strong>{candidateName}</strong>. Reminders go out 24h and 2h before. AI will assist you during the live call.</>
                            )}
                        </div>

                        {/* ── Date / Time / Duration (COPILOT only) ── */}
                        {selectedType === 'COPILOT' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <Calendar className="w-3.5 h-3.5" /> Interview Date & Time <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        min={minDateTime}
                                        onChange={e => setScheduledAt(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <Clock className="w-3.5 h-3.5" /> Duration
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[30, 45, 60, 90].map(d => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => setDurationMinutes(d)}
                                                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${durationMinutes === d
                                                    ? 'bg-teal-500 text-white border-teal-500'
                                                    : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-teal-400'
                                                }`}
                                            >
                                                {d}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                                Custom Message <span className="font-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={2}
                                placeholder={selectedType === 'AI'
                                    ? 'e.g. Please complete this interview at your earliest convenience…'
                                    : 'e.g. Looking forward to speaking with you about this role…'}
                                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none text-sm"
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-3 py-2 rounded-lg">{error}</p>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={sending || (selectedType === 'COPILOT' && !scheduledAt)}
                                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${selectedType === 'AI'
                                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                    : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                                }`}
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {sending ? 'Sending…' : selectedType === 'COPILOT' ? 'Schedule & Send Invite' : 'Send Invitation'}
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// ── Analytics Panel ─────────────────────────────────────────────────
function AnalyticsPanel({ analytics, loading, applicants }: { analytics: Analytics | null; loading: boolean; applicants: Applicant[] }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading analytics…</span>
            </div>
        );
    }

    const stageData = COLUMNS.map(col => ({
        label: col.label,
        count: applicants.filter(a => a.status === col.id).length,
        color: col.color,
        bg: col.bg,
        darkBg: col.darkBg,
        borderColor: col.borderColor,
    }));

    const maxCount = Math.max(...stageData.map(s => s.count), 1);
    const evaluatedList = applicants.filter(a => a.overallScore != null && a.overallScore > 0);
    const avgScore = evaluatedList.length > 0
        ? Math.round(evaluatedList.reduce((s, a) => s + (a.overallScore || 0), 0) / evaluatedList.length)
        : null;

    return (
        <div className="space-y-5">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total", value: applicants.length, color: "text-indigo-500" },
                    { label: "AI Scored", value: evaluatedList.length, color: "text-emerald-500" },
                    { label: "Avg Score", value: avgScore != null ? `${avgScore}` : "—", color: "text-amber-500" },
                ].map(stat => (
                    <div key={stat.label} className="text-center p-3 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Pipeline funnel */}
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Pipeline Funnel</p>
                <div className="space-y-2">
                    {stageData.map(stage => (
                        <div key={stage.label} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                                <span className={stage.color}>{stage.label}</span>
                                <span className="text-gray-500">{stage.count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stage.count / maxCount) * 100}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className={`h-full rounded-full ${stage.bg} ${stage.darkBg}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top scored candidates */}
            {evaluatedList.length > 0 && (
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Top Candidates</p>
                    <div className="space-y-2">
                        {evaluatedList
                            .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
                            .slice(0, 5)
                            .map((app, i) => (
                                <div key={app.applicationId} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-gray-800">
                                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                                        {i + 1}
                                    </span>
                                    <span className="flex-1 text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{app.name}</span>
                                    <span className={`text-xs font-black ${(app.overallScore || 0) >= 70 ? "text-emerald-500" : "text-amber-500"}`}>
                                        {app.overallScore}/100
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {evaluatedList.length === 0 && analytics === null && (
                <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                    <TrendingUp className="w-8 h-8" />
                    <p className="text-sm font-medium text-center">No evaluations yet.<br />Use AI Interview to score candidates.</p>
                </div>
            )}
        </div>
    );
}
