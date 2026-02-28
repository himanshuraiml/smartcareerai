"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    MapPin,
    Briefcase,
    Building2,
    DollarSign,
    GraduationCap,
    Send,
    Code,
    AlignLeft,
    CheckCircle2,
    Wand2,
    Brain,
    Settings2,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import AIInterviewConfig, { DraftInterviewConfig } from "@/components/recruiter/AIInterviewConfig";

interface Institution {
    id: string;
    name: string;
    domain: string | null;
}

export default function PostJobPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        location: "",
        locationType: "onsite",
        description: "",
        requirements: "",
        requiredSkills: "",
        salaryMin: "",
        salaryMax: "",
        experienceMin: "",
        experienceMax: "",
        targetInstitutionId: "",
    });

    // AI Interview draft config
    const [aiEnabled, setAiEnabled] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiDraft, setAiDraft] = useState<DraftInterviewConfig | null>(null);

    const [institutions, setInstitutions] = useState<Institution[]>([]);

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const res = await authFetch(`/recruiter/institutions`);
                if (res.ok) {
                    const result = await res.json();
                    setInstitutions(result.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch institutions");
            }
        };
        fetchInstitutions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                requirements: formData.requirements.split('\n').filter(line => line.trim()),
                requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s),
                salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
                salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
                experienceMin: formData.experienceMin ? parseInt(formData.experienceMin) : undefined,
                experienceMax: formData.experienceMax ? parseInt(formData.experienceMax) : undefined,
                targetInstitutionId: formData.targetInstitutionId || undefined,
            };

            const res = await authFetch(`/recruiter/jobs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                console.error("Job post error:", res.status, errBody);
                throw new Error(errBody.message || errBody.error || "Failed to post job");
            }
            const jobData = await res.json();
            const newJobId = jobData.data?.id;

            // If AI Interview enabled and configured, auto-save the draft config
            if (aiEnabled && newJobId && aiDraft) {
                const timeLimitMinutes = Math.max(1, Math.round(aiDraft.totalDurationMinutes / aiDraft.questionCount));
                await authFetch(`/recruiter/jobs/${newJobId}/ai-interview/config`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        enabled: true,
                        interviewType: aiDraft.interviewType,
                        difficulty: aiDraft.difficulty,
                        questionCount: aiDraft.questionCount,
                        timeLimitMinutes,
                        customInstructions: aiDraft.customInstructions,
                        scoringWeights: aiDraft.scoringWeights,
                    }),
                }).catch(() => { });
            }

            setSuccess(true);
            setTimeout(() => { router.push("/recruiter/jobs"); }, 1500);
        } catch (error: any) {
            console.error("Job post failed:", error);
            alert(error.message || "Error posting job. Please ensure all required fields are filled and try again.");
            setLoading(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!formData.title) {
            alert("Please enter a job title first to generate a description.");
            return;
        }

        setGenerating(true);
        try {
            const keywords = formData.requiredSkills
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const res = await authFetch('/recruiter/ai-assistant/generate-jd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    keywords: keywords.length > 0 ? keywords : ['professional'],
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data?.description) {
                    setFormData(prev => ({
                        ...prev,
                        description: data.data.description,
                        // Also backfill required skills if the field was empty
                        requiredSkills: prev.requiredSkills || (data.data.requiredSkills || []).join(', '),
                    }));
                }
            } else {
                throw new Error("Failed to generate description");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate description. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSuggestSalary = async () => {
        if (!formData.title || !formData.experienceMin) {
            alert("Please enter a Job Title and Minimum Experience to get a salary suggestion.");
            return;
        }

        setGenerating(true);
        try {
            const res = await authFetch('/recruiter/ai-assistant/salary-band', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    location: formData.location || "Remote",
                    experienceLevel: `${formData.experienceMin} years`,
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data && data.data.suggestedMin !== undefined) {
                    setFormData(prev => ({
                        ...prev,
                        salaryMin: data.data.suggestedMin.toString(),
                        salaryMax: data.data.suggestedMax.toString()
                    }));
                }
            } else {
                throw new Error("Failed to suggest salary");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to get salary suggestion. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const inputClasses = "w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400";
    const labelClasses = "flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";
    const iconClasses = "w-4 h-4 text-indigo-500";

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">

            {/* Header Section */}
            <div className="relative z-10">
                <Link
                    href="/recruiter/jobs"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-white dark:hover:text-white dark:hover:bg-white/5 transition-colors mb-6 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Jobs
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                            Post a New Job
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                            Reach out to thousands of validated candidates perfectly aligned with your roles.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 w-full">

                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md rounded-3xl"
                        >
                            <div className="flex flex-col items-center gap-4 text-center p-8">
                                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Posted Successfully!</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Redirecting you to the jobs board...</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-8">

                    {/* Basic Info Container */}
                    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Basic Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-1">
                                <label className={labelClasses}>
                                    <Briefcase className={iconClasses} />
                                    Job Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    className={inputClasses}
                                    placeholder="e.g. Senior Frontend Engineer"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className={labelClasses}>
                                    <MapPin className={iconClasses} />
                                    Location <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    className={inputClasses}
                                    placeholder="e.g. San Francisco, CA"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className={labelClasses}>
                                    <Building2 className={iconClasses} />
                                    Work Type <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        className={`${inputClasses} appearance-none pr-10`}
                                        value={formData.locationType}
                                        onChange={e => setFormData({ ...formData, locationType: e.target.value })}
                                    >
                                        <option value="onsite">On-site</option>
                                        <option value="remote">Remote</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={labelClasses}>
                                    <GraduationCap className={iconClasses} />
                                    Target Partner Institution
                                </label>
                                <div className="relative">
                                    <select
                                        className={`${inputClasses} appearance-none pr-10`}
                                        value={formData.targetInstitutionId}
                                        onChange={e => setFormData({ ...formData, targetInstitutionId: e.target.value })}
                                    >
                                        <option value="">Public Job (Open to all)</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id}>
                                                {inst.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                        ▼
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Roles & Requirements */}
                    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                                <AlignLeft className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Role Description</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-1">
                                <label className="flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    <span>Overview & Responsibilities <span className="text-rose-500">*</span></span>
                                    <button
                                        type="button"
                                        onClick={handleGenerateDescription}
                                        disabled={generating}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all text-xs font-bold disabled:opacity-50"
                                    >
                                        <Wand2 className={`w-3.5 h-3.5 ${generating ? 'animate-pulse' : ''}`} />
                                        {generating ? 'Generating...' : 'Auto-Generate with AI'}
                                    </button>
                                </label>
                                <textarea
                                    required
                                    className={`${inputClasses} h-32 resize-none custom-scrollbar`}
                                    placeholder="Provide a comprehensive overview of the role, team, and day-to-day responsibilities..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                        Requirements <span className="text-rose-500">*</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-400">(One requirement per line)</span>
                                </label>
                                <textarea
                                    required
                                    className={`${inputClasses} h-32 resize-none custom-scrollbar font-mono text-sm leading-relaxed`}
                                    placeholder="- 5+ years of software engineering experience&#10;- B.S. in Computer Science or related degree...&#10;- Ability to thrive in a fast-paced environment"
                                    value={formData.requirements}
                                    onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className={labelClasses}>
                                    <Code className="w-4 h-4 text-purple-500" />
                                    Required Skills <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    className={inputClasses}
                                    placeholder="React, TypeScript, Node.js, GraphQL (comma separated)"
                                    value={formData.requiredSkills}
                                    onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
                                />
                                <p className="text-xs font-medium text-gray-400 mt-1">
                                    These skills will be used to auto-match the best validated candidates.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Compensation & Experience */}
                    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compensation & Experience</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleSuggestSalary}
                                disabled={generating}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-all text-sm font-bold disabled:opacity-50"
                            >
                                <Wand2 className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
                                {generating ? 'Suggesting...' : 'Suggest Salary'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className={labelClasses}>
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    Target Salary Range (USD)
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            className={`${inputClasses} pl-8`}
                                            placeholder="Min"
                                            value={formData.salaryMin}
                                            onChange={e => setFormData({ ...formData, salaryMin: e.target.value })}
                                        />
                                    </div>
                                    <span className="text-gray-400 font-bold">-</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            className={`${inputClasses} pl-8`}
                                            placeholder="Max"
                                            value={formData.salaryMax}
                                            onChange={e => setFormData({ ...formData, salaryMax: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className={labelClasses}>
                                    <Briefcase className="w-4 h-4 text-emerald-500" />
                                    Experience Range (Years)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        className={inputClasses}
                                        placeholder="Min Years"
                                        value={formData.experienceMin}
                                        onChange={e => setFormData({ ...formData, experienceMin: e.target.value })}
                                    />
                                    <span className="text-gray-400 font-bold">-</span>
                                    <input
                                        type="number"
                                        className={inputClasses}
                                        placeholder="Max Years"
                                        value={formData.experienceMax}
                                        onChange={e => setFormData({ ...formData, experienceMax: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Interview Card */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border-2 border-dashed border-indigo-200 dark:border-indigo-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${aiEnabled ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25' : 'bg-gray-100 dark:bg-white/5'
                                    }`}>
                                    <Brain className={`w-5 h-5 ${aiEnabled ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        AI Interview
                                        {aiEnabled && (
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                                                {aiDraft ? 'Configured ✓' : 'Enabled'}
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Auto-generate interview questions & scoring from your JD</p>
                                </div>
                            </div>
                            {/* Toggle */}
                            <button
                                type="button"
                                onClick={() => {
                                    const next = !aiEnabled;
                                    setAiEnabled(next);
                                    if (next) setShowAiModal(true);
                                }}
                                className={`w-12 h-6 rounded-full relative transition-colors ${aiEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>

                        {/* When enabled: show summary + reconfigure button */}
                        {aiEnabled && (
                            <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                <div className="flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                                        {aiDraft
                                            ? `${aiDraft.questionCount} questions · ${aiDraft.totalDurationMinutes} min · ${aiDraft.difficulty.charAt(0) + aiDraft.difficulty.slice(1).toLowerCase()}`
                                            : 'Click Configure to set up the interview. You can always reconfigure later from the job pipeline page.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAiModal(true)}
                                    className="flex items-center gap-1.5 ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all"
                                >
                                    <Settings2 className="w-3.5 h-3.5" />
                                    {aiDraft ? 'Reconfigure' : 'Configure'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-indigo-900 dark:bg-indigo-950/40 border border-indigo-800 dark:border-indigo-500/20 shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />

                        <div className="relative z-10 flex-col sm:flex-row flex items-center justify-between w-full gap-4">
                            <p className="text-indigo-200 dark:text-indigo-300 font-medium text-sm text-center sm:text-left">
                                Ready to find you next great hire? The job will be live immediately.
                            </p>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Link
                                    href="/recruiter/jobs"
                                    className="px-6 py-3.5 rounded-xl text-indigo-100 hover:text-white hover:bg-white/10 font-bold transition-colors w-full sm:w-auto text-center"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white rounded-xl transition-all shadow-lg font-bold disabled:opacity-75 disabled:cursor-not-allowed active:scale-95 w-full sm:w-auto"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : success ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Posted!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Publish Job</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </form>

            {/* AI Interview Modal — draftMode collects settings without needing a jobId */}
            {showAiModal && (
                <AIInterviewConfig
                    jobTitle={formData.title || "New Job"}
                    draftMode={true}
                    onDraftSave={(config) => {
                        setAiDraft(config);
                        setAiEnabled(true);
                    }}
                    onClose={() => setShowAiModal(false)}
                />
            )}
        </div>
    );
}

