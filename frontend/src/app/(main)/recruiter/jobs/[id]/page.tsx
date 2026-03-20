"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    ArrowLeft, User, GripVertical, ExternalLink, RefreshCw,
    Briefcase, Mail, FileText, Award, AlertCircle, Zap,
    Brain, BarChart3, Settings2, X, TrendingUp, Users, Sparkles,
    Video, Send, Loader2, Bot, Check, ChevronLeft, ChevronDown, Calendar, Clock,
    MessageSquare
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AIInterviewConfig from "@/components/recruiter/AIInterviewConfig";
import CandidateEvalModal from "@/components/recruiter/CandidateEvalModal";
import BulkInviteModal from "@/components/recruiter/BulkInviteModal";
import BulkMessageModal from "@/components/recruiter/BulkMessageModal";
import AISummaryModal from "@/components/recruiter/AISummaryModal";
import RediscoveryModal from "@/components/recruiter/RediscoveryModal";
import AssignInterviewerModal from "@/components/recruiter/AssignInterviewerModal";
import SequenceBuilder from "@/components/recruiter/SequenceBuilder";
import OfferLetterModal from "@/components/recruiter/OfferLetterModal";
import PanelSchedulerModal from "@/components/recruiter/PanelSchedulerModal";

type AppStatus = "APPLIED" | "SCREENING" | "INTERVIEWING" | "OFFER" | "REJECTED";
type SidePanel = "interview" | "analytics" | "automation" | null;

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
    // Interview session data (populated from DB)
    sessionId?: string | null;
    inviteType?: 'AI' | 'COPILOT' | null;
    meetLink?: string | null;
    nextSequenceStep?: string | null;
    bgvStatus?: string | null;
    awaitingSchedule?: boolean;
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
    const [invitedMap, setInvitedMap] = useState<Record<string, { sessionId: string; type: 'AI' | 'COPILOT'; meetLink?: string }>>({});
    const [assignTarget, setAssignTarget] = useState<{ applicationId: string; name: string; status: string } | null>(null);
    const [offerTarget, setOfferTarget] = useState<{ applicationId: string; name: string; jobTitle: string } | null>(null);
    const [panelTarget, setPanelTarget] = useState<{ applicationId: string; name: string } | null>(null);
    const [bgvLoading, setBgvLoading] = useState<string | null>(null); // applicationId currently initiating BGV
    const [showBulkInvite, setShowBulkInvite] = useState(false);
    const [showBulkMessage, setShowBulkMessage] = useState(false);
    const [showRediscover, setShowRediscover] = useState(false);
    const [expandedStages, setExpandedStages] = useState<Set<AppStatus>>(new Set<AppStatus>(['APPLIED']));

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
            const apps: Applicant[] = appsData.data || [];
            setApplicants(apps);
            // Seed invitedMap from persisted session data so previously-invited
            // applicants show the correct button (Launch Copilot / AI Interview Sent)
            // even after a page reload.
            const seedMap: Record<string, { sessionId: string; type: 'AI' | 'COPILOT'; meetLink?: string }> = {};
            for (const app of apps) {
                if (app.sessionId && app.inviteType) {
                    seedMap[app.applicationId] = {
                        sessionId: app.sessionId,
                        type: app.inviteType,
                        meetLink: app.meetLink ?? undefined,
                    };
                }
            }
            setInvitedMap(seedMap);
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

            {/* Bulk Message Modal */}
            <AnimatePresence>
                {showBulkMessage && job && (
                    <BulkMessageModal
                        jobTitle={job.title}
                        applicants={applicants}
                        onClose={() => setShowBulkMessage(false)}
                        onSuccess={(sent) => {
                            showToast(`Sent ${sent} message${sent !== 1 ? "s" : ""}`, "success");
                        }}
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
                        onSuccess={(sessionId: string, type: 'AI' | 'COPILOT', meetLink?: string) => {
                            setInvitedMap(prev => ({ ...prev, [inviteTarget.applicationId]: { sessionId, type, meetLink } }));
                            setInviteTarget(null);
                            const label = type === 'AI' ? 'AI interview' : 'co-pilot interview';
                            showToast(`${label} invitation sent to ${inviteTarget.name}`, "success");
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Assign Interviewer Modal */}
            <AnimatePresence>
                {assignTarget && (
                    <AssignInterviewerModal
                        applicationId={assignTarget.applicationId}
                        applicantName={assignTarget.name}
                        stageName="Interviewing"
                        onClose={() => setAssignTarget(null)}
                        onSuccess={() => {
                            setAssignTarget(null);
                            showToast(`Interviewers assigned to ${assignTarget.name}`, "success");
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Offer Letter Modal */}
            <AnimatePresence>
                {offerTarget && (
                    <OfferLetterModal
                        applicationId={offerTarget.applicationId}
                        candidateName={offerTarget.name}
                        jobTitle={offerTarget.jobTitle}
                        onClose={() => setOfferTarget(null)}
                    />
                )}
            </AnimatePresence>

            {/* Panel Scheduler Modal */}
            <AnimatePresence>
                {panelTarget && (
                    <PanelSchedulerModal
                        applicationId={panelTarget.applicationId}
                        candidateName={panelTarget.name}
                        onClose={() => setPanelTarget(null)}
                        onCreated={() => {
                            setPanelTarget(null);
                            showToast(`Panel interview scheduled for ${panelTarget.name}`, "success");
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-30 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-white/70 dark:bg-[#111827]/70 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-[2rem] shadow-xl shadow-indigo-500/5">
                    <div className="flex items-center gap-5">
                        <Link href="/recruiter/jobs" className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-300 group shadow-sm">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-[1000] text-gray-900 dark:text-white tracking-tight leading-none">{job.title}</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${job.isActive ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/20"}`}>
                                    {job.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-gray-500/80">
                                <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-indigo-500" /> {job.location}</span>
                                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-purple-500" /> {applicants.length} Candidates</span>
                                {evaluatedCount > 0 && (
                                    <span className="text-emerald-500 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> {evaluatedCount} AI-Scored
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center flex-wrap gap-2.5">
                        <div className="flex items-center p-1 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                            <button
                                onClick={() => setShowRediscover(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                            >
                                <Sparkles className="w-4 h-4" /> AI Sourcing
                            </button>
                            <button
                                onClick={() => setShowBulkInvite(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/5 transition-all"
                            >
                                <Users className="w-4 h-4" /> Invite
                            </button>
                        </div>

                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10 mx-1 hidden md:block" />

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowBulkMessage(true)}
                                title="Broadcast Message"
                                className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all shadow-sm"
                            >
                                <Send className="w-4.5 h-4.5" />
                            </button>
                            <Link
                                href={`/recruiter/jobs/${id}/analytics`}
                                title="Analytics"
                                className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all shadow-sm"
                            >
                                <BarChart3 className="w-4.5 h-4.5" />
                            </Link>
                            <button
                                onClick={() => togglePanel("automation")}
                                title="Automation"
                                className={`p-2.5 rounded-xl border transition-all shadow-sm ${sidePanel === "automation" ? "bg-amber-500 text-white border-amber-500 shadow-amber-500/20" : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 hover:text-amber-500 hover:border-amber-100 dark:hover:border-amber-500/30"}`}
                            >
                                <Zap className="w-4.5 h-4.5" />
                            </button>
                            <button
                                onClick={() => togglePanel("interview")}
                                title="AI Interview Config"
                                className={`p-2.5 rounded-xl border transition-all shadow-sm ${sidePanel === "interview" ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20" : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 dark:hover:border-indigo-500/30"}`}
                            >
                                <Brain className="w-4.5 h-4.5" />
                            </button>
                            <button
                                onClick={fetchData}
                                title="Refresh Data"
                                className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all shadow-sm"
                            >
                                <RefreshCw className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Kanban Accordion — visible only on < md */}
            <div className="block md:hidden space-y-3">
                {COLUMNS.map(col => {
                    const cards = columnApplicants(col.id);
                    const isOpen = expandedStages.has(col.id);
                    return (
                        <div key={col.id} className={`rounded-2xl border overflow-hidden ${col.borderColor} bg-white dark:bg-[#111827]`}>
                            <button
                                className={`w-full flex items-center justify-between px-4 py-3 ${col.bg} ${col.darkBg}`}
                                onClick={() => setExpandedStages(prev => {
                                    const next = new Set(prev);
                                    next.has(col.id) ? next.delete(col.id) : next.add(col.id);
                                    return next;
                                })}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full border-2 ${col.borderColor}`} />
                                    <span className={`text-xs font-black uppercase tracking-widest ${col.color}`}>{col.label}</span>
                                    <span className="ml-1 px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30 text-[10px] font-black text-gray-700 dark:text-gray-300">{cards.length}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                                <div className="divide-y divide-gray-100 dark:divide-white/5">
                                    {cards.length === 0 ? (
                                        <p className="py-4 text-center text-xs text-gray-400 font-medium">No candidates</p>
                                    ) : cards.map(app => (
                                        <div key={app.applicationId} className="flex items-center gap-3 px-4 py-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                                                {app.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{app.name}</p>
                                                {app.overallScore != null && app.overallScore > 0 && (
                                                    <p className="text-[10px] font-bold text-indigo-500">Score: {app.overallScore}/100</p>
                                                )}
                                            </div>
                                            <select
                                                value={app.status}
                                                className="text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                                onChange={async e => {
                                                    const newStatus = e.target.value as AppStatus;
                                                    setApplicants(prev => prev.map(a => a.applicationId === app.applicationId ? { ...a, status: newStatus } : a));
                                                    await authFetch(`/recruiter/applications/${app.applicationId}/status`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ status: newStatus }),
                                                    }).catch(() => setApplicants(prev => prev.map(a => a.applicationId === app.applicationId ? { ...a, status: app.status } : a)));
                                                }}
                                            >
                                                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Side panel + Kanban layout — desktop only */}
            <div className="hidden md:flex gap-6 items-start">
                {/* Kanban Board */}
                <div className="flex-1 overflow-x-auto pb-8 custom-scrollbar min-w-0">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="flex items-stretch gap-4 min-w-max px-1">
                            {COLUMNS.map((col) => {
                                const cards = columnApplicants(col.id);
                                return (
                                    <div key={col.id} className="w-[310px] flex flex-col group/col">
                                        {/* Column Header */}
                                        <div className={`flex items-center justify-between px-4 py-3 mb-4 rounded-2xl border ${col.bg} ${col.darkBg} ${col.borderColor} shadow-sm transition-all duration-300 group-hover/col:shadow-md`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${col.bg} border-2 ${col.borderColor} shadow-[0_0_10px_rgba(0,0,0,0.05)]`} />
                                                <h3 className={`font-black ${col.color} text-[11px] uppercase tracking-[0.1em]`}>{col.label}</h3>
                                            </div>
                                            <div className="px-2.5 py-0.5 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black text-gray-700 dark:text-gray-200 border border-white dark:border-white/5">
                                                {cards.length}
                                            </div>
                                        </div>

                                        <Droppable droppableId={col.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`flex-1 min-h-[500px] px-2 py-1 rounded-[1.5rem] transition-all duration-300 ${snapshot.isDraggingOver ? "bg-indigo-500/5 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20 ring-inset border-2 border-dashed border-indigo-500/30" : "bg-gray-50/30 dark:bg-white/[0.02]"}`}
                                                >
                                                    {cards.map((app, index) => (
                                                        <Draggable key={app.applicationId} draggableId={app.applicationId} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`mb-4 transition-all duration-200 ${snapshot.isDragging ? "rotate-[2deg] scale-105 z-50 shadow-2xl shadow-indigo-500/20" : ""}`}
                                                                    style={{ ...provided.draggableProps.style }}
                                                                >
                                                                    <ApplicantCard
                                                                        applicant={app}
                                                                        onEvaluate={() => setEvalTarget({ applicationId: app.applicationId, name: app.name })}
                                                                        onSummary={() => setSummaryTarget({ applicationId: app.applicationId, name: app.name, type: 'summary' })}
                                                                        onJustification={() => setSummaryTarget({ applicationId: app.applicationId, name: app.name, type: 'justification' })}
                                                                        onInvite={() => setInviteTarget({ applicationId: app.applicationId, name: app.name })}
                                                                        onAssign={() => setAssignTarget({ applicationId: app.applicationId, name: app.name, status: app.status })}
                                                                        onOffer={() => setOfferTarget({ applicationId: app.applicationId, name: app.name, jobTitle: job?.title || '' })}
                                                                        onPanel={() => setPanelTarget({ applicationId: app.applicationId, name: app.name })}
                                                                        onBgv={async () => {
                                                                            setBgvLoading(app.applicationId);
                                                                            try {
                                                                                const res = await authFetch(`/recruiter/applications/${app.applicationId}/bgv/initiate`, { method: 'POST' });
                                                                                const data = await res.json();
                                                                                if (!data.success) throw new Error(data.message);
                                                                                showToast(`BGV initiated for ${app.name}`, "success");
                                                                                setApplicants(prev => prev.map(a => a.applicationId === app.applicationId ? { ...a, bgvStatus: 'IN_PROGRESS' } : a));
                                                                            } catch (e: any) {
                                                                                showToast(e.message || 'BGV initiation failed', "error");
                                                                            } finally {
                                                                                setBgvLoading(null);
                                                                            }
                                                                        }}
                                                                        bgvLoading={bgvLoading === app.applicationId}
                                                                        invitedInfo={invitedMap[app.applicationId]}
                                                                        showToast={showToast}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}

                                                    {cards.length === 0 && !snapshot.isDraggingOver && (
                                                        <div className="h-32 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200/60 dark:border-white/5 rounded-2xl transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.05]">
                                                            <div className="p-2 rounded-full bg-gray-100 dark:bg-white/5">
                                                                <Users className="w-4 h-4 opacity-40" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Drop Station</span>
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

                {/* Automation Side Panel */}
                <AnimatePresence>
                    {sidePanel === "automation" && (
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
                                        <Zap className="w-4 h-4 text-amber-500" /> Drip Automation
                                    </h3>
                                    <button onClick={() => setSidePanel(null)} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <SequenceBuilder jobId={id} />
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
function ApplicantCard({ applicant, onEvaluate, onSummary, onJustification, onInvite, onAssign, onOffer, onPanel, onBgv, bgvLoading, invitedInfo, showToast }: {
    applicant: Applicant;
    onEvaluate: () => void;
    onSummary: () => void;
    onJustification: () => void;
    onInvite: () => void;
    onAssign: () => void;
    onOffer: () => void;
    onPanel: () => void;
    onBgv: () => void;
    bgvLoading?: boolean;
    invitedInfo?: { sessionId: string; type: 'AI' | 'COPILOT'; meetLink?: string };
    showToast: (message: string, type: "success" | "error") => void;
}) {
    const hasScore = applicant.overallScore != null && applicant.overallScore > 0;
    
    const getRiskStyles = (risk?: string) => {
        if (!risk) return "bg-gray-50 dark:bg-white/5 text-gray-400 border-transparent";
        switch (risk.toUpperCase()) {
            case "HIGH": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
            case "MEDIUM": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "LOW": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            default: return "bg-gray-50 dark:bg-white/5 text-gray-400 border-transparent";
        }
    };

    return (
        <div className="group relative bg-white dark:bg-[#111827] rounded-[1.75rem] border border-gray-100 dark:border-white/5 p-4 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 cursor-grab active:cursor-grabbing overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center justify-between mb-4">
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskStyles(applicant.dropoutRisk)}`}>
                    {applicant.dropoutRisk ? `${applicant.dropoutRisk} Risk` : "N/A Risk"}
                </div>
                <div className="flex items-center gap-1.5 translate-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {applicant.biasFlags && applicant.biasFlags.length > 0 && (
                        <div className="text-rose-500" title={`Bias Warning: ${applicant.biasFlags[0]}`}>
                            <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                    )}
                    <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                </div>
            </div>

            <div className="flex items-center gap-4 mb-5">
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/20">
                        {applicant.avatarUrl
                            ? <img src={applicant.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                            : applicant.name.charAt(0).toUpperCase()}
                    </div>
                    {invitedInfo && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-[#111827] rounded-full border-2 border-white dark:border-[#111827] flex items-center justify-center">
                            <Bot className="w-3 h-3 text-indigo-500" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-[1000] text-gray-900 dark:text-white truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {applicant.name}
                    </h4>
                    <p className="text-[11px] font-bold text-gray-400/80 truncate flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 opacity-60" /> {applicant.email}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-gray-50/50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col justify-between h-[64px]">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-500" /> AI Rank
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-black leading-none ${hasScore ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-gray-700"}`}>
                            {hasScore ? applicant.overallScore : "—"}
                        </span>
                        {hasScore && <span className="text-[10px] font-bold text-gray-400">/100</span>}
                    </div>
                </div>
                <div className="p-3 bg-gray-50/50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col justify-between h-[64px]">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-500" /> Match
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                            {applicant.fitScore || 0}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">%</span>
                    </div>
                </div>
            </div>

            {applicant.nextSequenceStep && (
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl border border-indigo-500/20 mb-5 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Sequence Active
                    </span>
                </div>
            )}

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(applicant.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {applicant.resumeUrl && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        const res = await authFetch(`/resumes/candidate/${applicant.candidateId}/download`);
                                        const data = await res.json();
                                        window.open(data.data.url, "_blank");
                                    } catch { showToast("Error opening CV", "error"); }
                                }}
                                className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30"
                                title="Download CV"
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                        )}
                        <Link
                            href={`/recruiter/candidates/${applicant.candidateId}`}
                            onClick={e => e.stopPropagation()}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30"
                            title="Full Profile"
                        >
                            <User className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Stage Dependent Actions */}
                <div className="space-y-2">
                    {invitedInfo?.type === 'COPILOT' ? (
                        <a
                            href={invitedInfo.meetLink || `/dashboard/interviews/${invitedInfo.sessionId}/live`}
                            target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-600 active:scale-95 transition-all"
                        >
                            <Video className="w-3.5 h-3.5" /> Launch Copilot
                        </a>
                    ) : (applicant.status === 'INTERVIEWING' || invitedInfo?.type === 'AI') ? (
                        <div className="flex flex-col gap-2">
                            <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                                <Bot className="w-3 h-3" /> AI Interview Sent
                            </div>
                            <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); onAssign(); }} className="flex-1 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 text-[10px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-500/20 hover:bg-purple-100 transition-all">Assign</button>
                                <button onClick={(e) => { e.stopPropagation(); onPanel(); }} className="flex-1 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 transition-all">Panel</button>
                            </div>
                        </div>
                    ) : applicant.status === 'OFFER' ? (
                        <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); onOffer(); }} className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">Offer</button>
                            <button onClick={(e) => { e.stopPropagation(); onBgv(); }} disabled={bgvLoading || !!applicant.bgvStatus} className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50">{bgvLoading ? '...' : applicant.bgvStatus ? 'BGV' : 'BGV'}</button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEvaluate(); }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> {hasScore ? "Re-Rank AI" : "AI Assessment"}
                        </button>
                    )}

                    {/* AI Insights (Summary/Justification) */}
                    {hasScore && (
                        <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); onSummary(); }} className="flex-1 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-gray-100 dark:border-white/5 hover:border-indigo-300 transition-all">Summary</button>
                            <button onClick={(e) => { e.stopPropagation(); onJustification(); }} className="flex-1 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-gray-100 dark:border-white/5 hover:border-indigo-300 transition-all">Reason</button>
                        </div>
                    )}

                    {/* Scheduling Status */}
                    {invitedInfo?.type === 'COPILOT' && applicant.awaitingSchedule && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Awaiting Scheduling</span>
                        </div>
                    )}
                </div>
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
    onSuccess: (sessionId: string, type: 'AI' | 'COPILOT', meetLink?: string) => void;
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
            onSuccess(data.data?.sessionId, selectedType, data.data?.meetLink);
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
                                <>A <strong>co-pilot session</strong> and a <strong>PlaceNxt meeting room</strong> will be created. A calendar invite with the join link will be sent to <strong>{candidateName}</strong>. Reminders go out 24h and 2h before. AI will assist you during the live call.</>
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
