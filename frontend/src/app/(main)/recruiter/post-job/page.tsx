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
    Sparkles,
    Zap,
    Info,
    Bold,
    List
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import AIInterviewConfig, { DraftInterviewConfig } from "@/components/recruiter/AIInterviewConfig";
import WorkflowBuilder, { PipelineStep, StageType } from "@/components/recruiter/WorkflowBuilder";
import CodingChallengeConfig from "@/components/recruiter/CodingChallengeConfig";
import SalaryBenchmarkPanel from "@/components/recruiter/SalaryBenchmarkPanel";
import JDAnalysisPanel from "@/components/recruiter/JDAnalysisPanel";

interface Institution {
    id: string;
    name: string;
    domain: string | null;
}

const STEPS = [
    { id: 1, label: 'Basic Data' },
    { id: 2, label: 'Role Description' },
    { id: 3, label: 'Compensation & Exposure' },
    { id: 4, label: 'Workflow' },
    { id: 5, label: 'AI Interview' }
];

export default function PostJobPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [success, setSuccess] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);

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
        salaryCurrency: "INR",
        experienceMin: "",
        experienceMax: "",
        targetInstitutionId: "",
        applicationDeadline: "",
        vertical: "",  // F12: industry vertical
    });

    // AI Interview draft config
    const [aiEnabled, setAiEnabled] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiDraft, setAiDraft] = useState<DraftInterviewConfig | null>(null);
    const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);

    // Coding Test config
    const [showCodingModal, setShowCodingModal] = useState(false);
    const [configuringStageId, setConfiguringStageId] = useState<string | null>(null);

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

    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep(c => c + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(c => c - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            router.push('/recruiter/jobs');
        }
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const payload = {
                ...formData,
                requirements: formData.requirements.split('\n').filter(line => line.trim()),
                requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s),
                salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
                salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
                salaryCurrency: formData.salaryCurrency,
                experienceMin: formData.experienceMin ? parseInt(formData.experienceMin) : undefined,
                experienceMax: formData.experienceMax ? parseInt(formData.experienceMax) : undefined,
                targetInstitutionId: formData.targetInstitutionId || undefined,
                applicationDeadline: formData.applicationDeadline || undefined,
                pipelineSteps: pipelineSteps.length > 0 ? pipelineSteps.map((s, i) => ({
                    type: s.type,
                    order: i + 1,
                    configId: s.configId,
                    config: s.config,
                })) : undefined,
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
                ? formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s.length > 0)
                : ['professional'];

            const res = await authFetch('/recruiter/ai-assistant/generate-jd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    keywords: keywords.length > 0 ? keywords : ['professional'],
                    ...(formData.vertical ? { vertical: formData.vertical } : {}),
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data?.description) {
                    setFormData(prev => ({
                        ...prev,
                        description: data.data.description,
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

    const inputClasses = "w-full bg-[#1A1D24] border border-[#2A2E39] rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6] transition-all placeholder-gray-500 shadow-inner";
    const labelClasses = "block text-sm font-bold text-[#94A3B8] mb-2";

    return (
        <div className="min-h-screen bg-[#0E1117] text-[#E2E8F0]">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0E1117] sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Post New Job</h1>
                </div>
                <div className="flex items-center gap-6">
                    <button className="text-gray-400 hover:text-white font-medium text-sm transition-colors hidden sm:block">
                        Save Draft
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={loading || success}
                        className="bg-[#3B82F6] hover:bg-blue-500 text-white px-6 py-2 rounded-full font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (currentStep === 5 ? 'Publish Job' : 'Next Step')}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Stepper */}
                <div className="flex items-center justify-between mb-16 relative w-[85%] mx-auto">
                    <div className="absolute left-0 top-6 w-full h-[1px] bg-[#1E293B] -z-10" />
                    {STEPS.map((step, idx) => {
                        const isActive = currentStep === step.id;
                        const isPast = currentStep > step.id;
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-3 bg-[#0E1117] px-4">
                                <button
                                    onClick={() => setCurrentStep(step.id)}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors border-4 shadow-sm
                                        ${isActive
                                            ? 'bg-[#3B82F6] text-white border-[#3B82F6]/20'
                                            : isPast
                                                ? 'bg-[#1E293B] text-gray-400 border-[#1E293B] cursor-pointer hover:bg-gray-800'
                                                : 'bg-[#1A1D24] text-gray-600 border-[#1A1D24]'}`}
                                >
                                    {isActive ? step.id : (isPast ? step.id : step.id)}
                                </button>
                                <span className={`text-sm font-medium ${isActive ? 'text-[#3B82F6]' : 'text-gray-500'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Success Overlay */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1117]/90 backdrop-blur-sm"
                        >
                            <div className="flex flex-col items-center gap-4 text-center p-8">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Job Posted Successfully!</h3>
                                    <p className="text-gray-400">Redirecting you to the jobs board...</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step Content */}
                <div className="w-full">
                    {currentStep === 1 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Basic Data</h2>
                                <p className="text-[#94A3B8] text-[15px]">Fill in the essential information for your new job posting to get started.</p>
                            </div>

                            <div className="bg-[#151821] border border-[#1E293B] p-8 rounded-3xl space-y-8 shadow-sm">
                                <div>
                                    <label className={labelClasses}>Job Title</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="e.g. Senior Software Engineer"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Job Location (City)</label>
                                        <div className="relative group/loc">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/loc:text-[#3B82F6] transition-colors">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                list="indian-cities"
                                                className={`${inputClasses} pl-11`}
                                                placeholder="Search or enter location (e.g. Bangalore, Mumbai, Remote)"
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            />
                                            <datalist id="indian-cities">
                                                <option value="Bangalore" />
                                                <option value="Mumbai" />
                                                <option value="Delhi NCR" />
                                                <option value="Hyderabad" />
                                                <option value="Pune" />
                                                <option value="Chennai" />
                                                <option value="Ahmedabad" />
                                                <option value="Kolkata" />
                                                <option value="Gurgaon" />
                                                <option value="Noida" />
                                                <option value="Jaipur" />
                                                <option value="Lucknow" />
                                                <option value="Chandigarh" />
                                                <option value="Indore" />
                                                <option value="Coimbatore" />
                                                <option value="Kochi" />
                                                <option value="Trivandrum" />
                                                <option value="Nagpur" />
                                                <option value="Bhubaneswar" />
                                                <option value="Visakhapatnam" />
                                                <option value="Mysore" />
                                                <option value="Vadodara" />
                                                <option value="Surat" />
                                                <option value="Guwahati" />
                                                <option value="Mangalore" />
                                                <option value="Remote" />
                                            </datalist>
                                        </div>
                                        <p className="text-[11px] text-[#475569] mt-2 font-medium">
                                            Select from the list or type a custom location if it's not present.
                                        </p>
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Location Type</label>
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
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Target Candidate</label>
                                        <div className="relative">
                                            <select
                                                className={`${inputClasses} appearance-none pr-10`}
                                                value={formData.targetInstitutionId}
                                                onChange={e => setFormData({ ...formData, targetInstitutionId: e.target.value })}
                                            >
                                                <option value="">Public Job (Open to all)</option>
                                                {institutions.map(inst => (
                                                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                                        </div>
                                    </div>
                                </div>

                                {/* F12: Industry Vertical Selector */}
                                <div>
                                    <label className="text-sm font-bold text-white mb-2 block">Industry Vertical <span className="text-[#94A3B8] font-normal">(optional — improves AI JD quality)</span></label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Tech', 'Finance', 'Ops', 'Sales', 'Healthcare', 'Manufacturing'].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, vertical: prev.vertical === v ? '' : v }))}
                                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${formData.vertical === v ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#151821] border-[#2A2E39] text-[#94A3B8] hover:border-blue-500/50 hover:text-white'}`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.vertical && (
                                        <p className="text-xs text-blue-400 mt-2">✓ AI will generate a {formData.vertical}-specific JD with domain certifications and SEO keywords</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-3 border-b border-[#2A2E39] pb-3">
                                        <label className="text-sm font-bold text-white">Role Description Workspace</label>
                                        <button
                                            onClick={handleGenerateDescription}
                                            disabled={generating}
                                            className="text-[#3B82F6] hover:text-blue-400 text-sm font-bold flex items-center gap-1.5 transition-colors"
                                        >
                                            <Sparkles className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
                                            Generate with AI
                                        </button>
                                    </div>
                                    <div className="relative bg-[#1A1D24] border border-[#2A2E39] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all shadow-inner">
                                        <textarea
                                            className="w-full h-[240px] bg-transparent p-5 text-gray-200 placeholder-[#475569] focus:outline-none resize-none leading-relaxed"
                                            placeholder="Enter job description, requirements, and responsibilities..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <button className="w-9 h-9 rounded-lg bg-[#2A2E39]/80 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/5">
                                                <Bold className="w-4 h-4" />
                                            </button>
                                            <button className="w-9 h-9 rounded-lg bg-[#2A2E39]/80 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/5">
                                                <List className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* F4: JD Bias & SEO Analysis */}
                            <JDAnalysisPanel jobDescription={formData.description} />

                            <div className="bg-[#111A2C]/40 border border-[#1E3A8A]/50 rounded-3xl p-6 flex flex-col sm:flex-row gap-4 items-start relative overflow-hidden">
                                <div className="absolute -left-4 -top-4 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full" />
                                <div className="mt-1 relative z-10 text-[#3B82F6]">
                                    <Info className="w-6 h-6 border-2 border-[#3B82F6] rounded-full p-0.5" />
                                </div>
                                <div className="space-y-1.5 relative z-10">
                                    <h4 className="text-[#3B82F6] font-bold text-[15px]">Recruiter Pro Tip</h4>
                                    <p className="text-[#94A3B8] text-sm leading-relaxed max-w-2xl">
                                        Clearly defined roles receive up to 40% more qualified applications. Use our AI assistant to help refine your description based on industry benchmarks.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Role Requirements & Skills</h2>
                                <p className="text-[#94A3B8] text-[15px]">Specify exactly what you're looking for in a candidate.</p>
                            </div>

                            <div className="bg-[#151821] border border-[#1E293B] p-8 rounded-3xl space-y-6 shadow-sm">
                                <div>
                                    <label className={labelClasses}>
                                        Requirements
                                        <span className="text-xs font-medium text-gray-500 ml-2">(One requirement per line)</span>
                                    </label>
                                    <textarea
                                        className={`${inputClasses} h-40 resize-none font-mono text-sm leading-relaxed`}
                                        placeholder="- 5+ years of software engineering experience&#10;- B.S. in Computer Science or related degree...&#10;- Ability to thrive in a fast-paced environment"
                                        value={formData.requirements}
                                        onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className={labelClasses}>Required Skills</label>
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="React, TypeScript, Node.js, GraphQL (comma separated)"
                                        value={formData.requiredSkills}
                                        onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
                                    />
                                    <p className="text-xs font-medium text-[#475569] mt-2">
                                        These skills will be used to auto-match the best validated candidates.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Compensation & Experience</h2>
                                <p className="text-[#94A3B8] text-[15px]">Set the salary bounds and the target experience levels.</p>
                            </div>

                            <div className="bg-[#151821] border border-[#1E293B] p-8 rounded-3xl space-y-6 shadow-sm">
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSuggestSalary}
                                        disabled={generating}
                                        className="text-emerald-400 hover:text-emerald-300 text-sm font-bold flex items-center gap-1.5 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20"
                                    >
                                        <Wand2 className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
                                        Suggest Salary Range
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className={labelClasses}>Annual Compensation</label>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1/3">
                                                    <select
                                                        className={inputClasses}
                                                        value={formData.salaryCurrency}
                                                        onChange={e => setFormData({ ...formData, salaryCurrency: e.target.value })}
                                                    >
                                                        <option value="INR">INR (₹)</option>
                                                        <option value="USD">USD ($)</option>
                                                        <option value="EUR">EUR (€)</option>
                                                        <option value="JPY">JPY (¥)</option>
                                                        <option value="CNY">CNY (元)</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1 flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            className={inputClasses}
                                                            placeholder="Min"
                                                            value={formData.salaryMin}
                                                            onChange={e => setFormData({ ...formData, salaryMin: e.target.value })}
                                                        />
                                                    </div>
                                                    <span className="text-[#475569] font-bold">-</span>
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            className={inputClasses}
                                                            placeholder="Max"
                                                            value={formData.salaryMax}
                                                            onChange={e => setFormData({ ...formData, salaryMax: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-[#475569] font-medium italic">
                                                {formData.salaryCurrency === 'INR'
                                                    ? "For INR, use LPA (e.g., 3.5, 12, etc.)"
                                                    : "Enter full annual amount (e.g., 120000)"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className={labelClasses}>Experience Range (Years)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                className={inputClasses}
                                                placeholder="Min"
                                                value={formData.experienceMin}
                                                onChange={e => setFormData({ ...formData, experienceMin: e.target.value })}
                                            />
                                            <span className="text-[#475569] font-bold">-</span>
                                            <input
                                                type="number"
                                                className={inputClasses}
                                                placeholder="Max"
                                                value={formData.experienceMax}
                                                onChange={e => setFormData({ ...formData, experienceMax: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* F9: Salary Benchmark Panel */}
                            {formData.title && (
                                <SalaryBenchmarkPanel
                                    role={formData.title}
                                    location={formData.location}
                                    salaryMin={formData.salaryMin ? parseFloat(formData.salaryMin) : 0}
                                    salaryMax={formData.salaryMax ? parseFloat(formData.salaryMax) : 0}
                                />
                            )}

                            {/* Application Deadline */}
                            <div className="bg-[#151821] border border-[#1E293B] p-8 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                        <Info className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Application Deadline</h3>
                                        <p className="text-[#94A3B8] text-sm">Set the last date candidates can apply to this job.</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 max-w-xs">
                                    <label className="text-sm font-semibold text-[#94A3B8]">Closing Date <span className="text-gray-500 font-normal">(optional)</span></label>
                                    <input
                                        type="date"
                                        className="bg-[#0F1117] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2563EB] transition-colors [color-scheme:dark]"
                                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                        value={formData.applicationDeadline}
                                        onChange={e => setFormData({ ...formData, applicationDeadline: e.target.value })}
                                    />
                                    <p className="text-xs text-[#475569]">Leave blank to keep the job open indefinitely. Applications submitted after this date will be rejected.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Recruitment Workflow</h2>
                                <p className="text-[#94A3B8] text-[15px]">Drag and drop stages to build your custom hiring funnel.</p>
                            </div>

                            <div className="bg-[#151821] border border-[#1E293B] p-8 rounded-3xl shadow-sm">
                                <WorkflowBuilder
                                    initialSteps={pipelineSteps}
                                    onChange={(steps) => setPipelineSteps(steps)}
                                    onConfigure={(id, type) => {
                                        setConfiguringStageId(id);
                                        if (type === 'CODING') {
                                            setShowCodingModal(true);
                                        } else if (type === 'AI_INTERVIEW') {
                                            setShowAiModal(true);
                                        }
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 5 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Interview Configuration (Optional)</h2>
                                <p className="text-[#94A3B8] text-[15px]">Set up an automated AI screen for your candidates.</p>
                            </div>

                            <div className="bg-[#151821] border border-[#1E293B] p-8 rounded-3xl shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${aiEnabled ? 'bg-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-[#1A1D24]'}`}>
                                            <Brain className={`w-6 h-6 ${aiEnabled ? 'text-white' : 'text-gray-500'}`} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                                AI Interview
                                                {aiEnabled && (
                                                    <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                                                        {aiDraft ? 'Configured' : 'Enabled'}
                                                    </span>
                                                )}
                                            </h2>
                                            <p className="text-sm text-[#475569]">Auto-generate interview questions & scoring from your JD</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = !aiEnabled;
                                            setAiEnabled(next);
                                            if (next) setShowAiModal(true);
                                        }}
                                        className={`w-14 h-7 rounded-full relative transition-colors ${aiEnabled ? 'bg-[#3B82F6]' : 'bg-[#2A2E39]'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${aiEnabled ? 'translate-x-[26px]' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {aiEnabled && (
                                    <div className="mt-8 flex items-center justify-between p-5 rounded-2xl bg-[#0F172A] border border-[#1E3A8A]">
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="w-5 h-5 text-[#3B82F6] flex-shrink-0" />
                                            <p className="text-sm text-[#94A3B8] font-medium mt-0.5">
                                                {aiDraft
                                                    ? `${aiDraft.questionCount} questions · ${aiDraft.totalDurationMinutes} min · ${aiDraft.difficulty}`
                                                    : 'Click Configure to set up the interview properties.'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAiModal(true)}
                                            className="flex items-center gap-2 ml-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors"
                                        >
                                            <Settings2 className="w-4 h-4" />
                                            {aiDraft ? 'Reconfigure' : 'Configure'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Modals outside of the main bounds so they overlay correctly */}
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

            {showCodingModal && (
                <CodingChallengeConfig
                    onClose={() => setShowCodingModal(false)}
                    initialSelected={pipelineSteps.find(s => s.id === configuringStageId)?.config?.challengeIds || []}
                    onSave={(challengeIds) => {
                        setPipelineSteps(prev => prev.map(s =>
                            s.id === configuringStageId
                                ? { ...s, config: { ...s.config, challengeIds } }
                                : s
                        ));
                        setShowCodingModal(false);
                    }}
                />
            )}

        </div>
    );
}
