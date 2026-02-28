"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain, Zap, CheckCircle2, AlertCircle, RefreshCw, Loader2,
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info, Clock, Code2, Users, MessageSquare,
    X, Sliders, Sparkles, BarChart3, Shield
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface GeneratedQuestion {
    id: string;
    questionText: string;
    type: string;
    expectedKeyPoints: string[];
    idealAnswer?: string;
    isCodingChallenge?: boolean;
    starterCode?: string;
}

interface AIInterviewConfigData {
    enabled: boolean;
    questionCount: number;
    interviewType: "TECHNICAL" | "BEHAVIORAL" | "MIXED" | "HR";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    timeLimitMinutes: number;
    customInstructions?: string;
    hasCodingQuestions?: boolean;
    questions?: GeneratedQuestion[];
    generatedAt?: string;
    scoringWeights?: ScoringWeights;
}

interface ScoringWeights {
    technical: number;
    communication: number;
    problemSolving: number;
    culturalFit: number;
    leadership: number;
}

export interface DraftInterviewConfig {
    interviewType: "TECHNICAL" | "BEHAVIORAL" | "MIXED" | "HR";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    questionCount: number;
    totalDurationMinutes: number;
    customInstructions: string;
    hasCodingQuestions: boolean;
    scoringWeights: ScoringWeights;
}

interface Props {
    jobId?: string;
    jobTitle: string;
    /** Renders as a full-screen modal overlay when false/omitted. */
    embedded?: boolean;
    /** Called when the user closes the modal. */
    onClose?: () => void;
    /** Draft mode: no jobId, no API calls. Collect settings and return via callback. */
    draftMode?: boolean;
    onDraftSave?: (config: DraftInterviewConfig) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const INTERVIEW_TYPE_OPTIONS = [
    { value: "TECHNICAL", label: "Technical", icon: Code2, desc: "Algorithms, system design, coding" },
    { value: "BEHAVIORAL", label: "Behavioral", icon: Users, desc: "Soft skills, culture, past experience" },
    { value: "MIXED", label: "Mixed", icon: Brain, desc: "Blend of technical & behavioral" },
    { value: "HR", label: "HR Screening", icon: MessageSquare, desc: "Initial HR / cultural round" },
] as const;

const DIFFICULTY_OPTIONS = [
    { value: "EASY", label: "Junior", color: "emerald" },
    { value: "MEDIUM", label: "Mid-level", color: "amber" },
    { value: "HARD", label: "Senior", color: "rose" },
] as const;

const CRITERIA_META: {
    key: keyof ScoringWeights;
    label: string;
    desc: string;
    color: string;
    gradient: string;
}[] = [
        { key: "technical", label: "Technical Skills", desc: "Code quality, domain knowledge, system design", color: "text-indigo-600 dark:text-indigo-400", gradient: "from-indigo-500 to-indigo-600" },
        { key: "communication", label: "Communication", desc: "Clarity, articulation, structure of answers", color: "text-blue-600 dark:text-blue-400", gradient: "from-blue-500 to-cyan-500" },
        { key: "problemSolving", label: "Problem Solving", desc: "Logical reasoning, creativity, approach", color: "text-violet-600 dark:text-violet-400", gradient: "from-violet-500 to-purple-600" },
        { key: "culturalFit", label: "Cultural Fit", desc: "Values alignment, team compatibility", color: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-500 to-teal-500" },
        { key: "leadership", label: "Leadership", desc: "Initiative, mentorship, ownership mindset", color: "text-amber-600 dark:text-amber-400", gradient: "from-amber-500 to-orange-500" },
    ];

const DEFAULT_WEIGHTS: ScoringWeights = {
    technical: 40,
    communication: 20,
    problemSolving: 20,
    culturalFit: 10,
    leadership: 10,
};

// presets
const WEIGHT_PRESETS: Record<string, { label: string; weights: ScoringWeights }> = {
    engineering: { label: "Engineering", weights: { technical: 45, communication: 15, problemSolving: 25, culturalFit: 10, leadership: 5 } },
    management: { label: "Management", weights: { technical: 15, communication: 25, problemSolving: 20, culturalFit: 20, leadership: 20 } },
    sales: { label: "Sales", weights: { technical: 10, communication: 40, problemSolving: 15, culturalFit: 25, leadership: 10 } },
    hr: { label: "HR Roles", weights: { technical: 10, communication: 35, problemSolving: 15, culturalFit: 30, leadership: 10 } },
    balanced: { label: "Balanced", weights: { technical: 20, communication: 20, problemSolving: 20, culturalFit: 20, leadership: 20 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// Scoring Weights Editor
// ─────────────────────────────────────────────────────────────────────────────
function ScoringWeightsEditor({
    weights,
    onChange,
}: {
    weights: ScoringWeights;
    onChange: (w: ScoringWeights) => void;
}) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const isValid = total === 100;

    const handleSlider = (key: keyof ScoringWeights, newVal: number) => {
        const oldVal = weights[key];
        const delta = newVal - oldVal;
        if (delta === 0) return;

        // Distribute the delta proportionally among other keys
        const otherKeys = (Object.keys(weights) as (keyof ScoringWeights)[]).filter(k => k !== key);
        const otherTotal = otherKeys.reduce((s, k) => s + weights[k], 0);
        const updated = { ...weights, [key]: newVal };

        if (otherTotal > 0) {
            let remainder = delta;
            otherKeys.forEach((k, i) => {
                if (i === otherKeys.length - 1) {
                    updated[k] = Math.max(0, weights[k] - remainder);
                } else {
                    const share = Math.round((weights[k] / otherTotal) * delta);
                    updated[k] = Math.max(0, weights[k] - share);
                    remainder -= share;
                }
            });
        }

        // Clamp all to [0, 100] and fix total
        const newTotal = (Object.values(updated) as number[]).reduce((a, b) => a + b, 0);
        if (newTotal !== 100) {
            const diff = 100 - newTotal;
            // Add remainder to biggest non-key
            const biggest = otherKeys.reduce((a, b) => updated[a] > updated[b] ? a : b);
            updated[biggest] = Math.max(0, updated[biggest] + diff);
        }
        onChange(updated);
    };

    return (
        <div className="space-y-5">
            {/* Presets */}
            <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Quick Presets
                </p>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(WEIGHT_PRESETS).map(([k, preset]) => (
                        <button
                            key={k}
                            onClick={() => onChange(preset.weights)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total indicator */}
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${isValid ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"}`}>
                <span className={`text-sm font-bold ${isValid ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                    {isValid ? "✓ Weights sum to 100%" : `⚠ Total: ${total}% (must equal 100)`}
                </span>
                <button
                    onClick={() => onChange(DEFAULT_WEIGHTS)}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors underline"
                >
                    Reset
                </button>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
                {CRITERIA_META.map(({ key, label, desc, color, gradient }) => (
                    <div key={key} className="group">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <span className={`text-sm font-bold ${color}`}>{label}</span>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={weights[key]}
                                    onChange={e => handleSlider(key, Math.min(100, Math.max(0, Number(e.target.value))))}
                                    className={`w-14 text-center px-2 py-1 rounded-lg text-sm font-black border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 ${color} focus:outline-none focus:ring-2 focus:ring-indigo-500/30`}
                                />
                                <span className="text-sm font-bold text-gray-400">%</span>
                            </div>
                        </div>
                        <div className="relative h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: `${weights[key]}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${gradient}`}
                            />
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={weights[key]}
                                onChange={e => handleSlider(key, Number(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-300 dark:text-gray-600">0%</span>
                            <span className="text-[10px] text-gray-300 dark:text-gray-600">100%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visual pie-like breakdown */}
            <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" /> Score Breakdown Preview
                </p>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                    {CRITERIA_META.map(({ key, gradient }) =>
                        weights[key] > 0 ? (
                            <motion.div
                                key={key}
                                animate={{ flex: weights[key] }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`bg-gradient-to-r ${gradient} rounded-sm`}
                                title={`${CRITERIA_META.find(c => c.key === key)?.label}: ${weights[key]}%`}
                            />
                        ) : null
                    )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                    {CRITERIA_META.map(({ key, label, color }) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-sm bg-gradient-to-r ${CRITERIA_META.find(c => c.key === key)?.gradient}`} />
                            <span className={`text-[11px] font-semibold ${color}`}>{label.split(" ")[0]} {weights[key]}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Question Accordion
// ─────────────────────────────────────────────────────────────────────────────
const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
    MEDIUM: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
    HARD: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
};

function QuestionList({ config }: { config: AIInterviewConfigData }) {
    const [openQ, setOpenQ] = useState<string | null>(null);

    if (!config.questions || config.questions.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    {config.questions.length} Generated Questions
                    <span className={`text-xs px-2 py-0.5 rounded-lg border font-bold ${DIFFICULTY_COLORS[config.difficulty]}`}>
                        {config.difficulty}
                    </span>
                </h4>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{config.timeLimitMinutes}min/question
                </span>
            </div>
            {(config.questions || []).map((q, i) => {
                const isOpen = openQ === q.id;
                return (
                    <div key={q.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.02] overflow-hidden">
                        <button
                            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                            onClick={() => setOpenQ(isOpen ? null : q.id)}
                        >
                            <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center flex-shrink-0">
                                {i + 1}
                            </span>
                            <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 pr-4 text-left">{q.questionText}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                                    {q.type}
                                </span>
                                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </div>
                        </button>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                                        {q.expectedKeyPoints.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Expected Key Points</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {q.expectedKeyPoints.map((pt, pi) => (
                                                        <span key={pi} className="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium border border-indigo-100 dark:border-indigo-500/20">
                                                            {pt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {q.expectedKeyPoints && q.expectedKeyPoints.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ideal Answer Outline</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{q.expectedKeyPoints?.join(', ') || ''}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component — works in two modes:
//   1. embedded=true  → renders inline (parent controls layout/modal)
//   2. embedded=false → renders as a modal trigger button + full-screen overlay
// ─────────────────────────────────────────────────────────────────────────────

// ── HELPER COMPONENTS & CONSTANTS ──────────────────────────────────────────

const FormSection = ({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {children}
    </div>
);

const aiTypeOptions = [
    { value: "TECHNICAL", label: "Technical", desc: "Algorithms, system design, coding", icon: Code2 },
    { value: "BEHAVIORAL", label: "Behavioral", desc: "Soft skills, culture, past experience", icon: Users },
    { value: "MIXED", label: "Mixed", desc: "Blend of technical & behavioral", icon: Brain },
    { value: "HR", label: "HR Screening", desc: "Initial HR / cultural round", icon: MessageSquare },
] as const;



export default function AIInterviewConfig({ jobId, jobTitle, embedded = false, onClose, draftMode = false, onDraftSave }: Props) {
    const [config, setConfig] = useState<AIInterviewConfigData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<"setup" | "weights" | "questions">("setup");

    const [form, setForm] = useState({
        enabled: true,
        questionCount: 5,
        interviewType: "TECHNICAL" as AIInterviewConfigData["interviewType"],
        difficulty: "MEDIUM" as AIInterviewConfigData["difficulty"],
        totalDurationMinutes: 30,
        customInstructions: "",
        hasCodingQuestions: false,
    });


    const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);

    const handleWeightSlider = (key: keyof ScoringWeights, value: number) => {
        setWeights(prev => {
            const sum = Object.values(prev).reduce((a, b) => a + b, 0) - prev[key];
            if (sum + value > 100) return { ...prev, [key]: 100 - sum };
            return { ...prev, [key]: value };
        });
    };





    // Draft mode: load nothing from API 
    const fetchConfig = useCallback(async () => {
        if (draftMode) { setLoading(false); return; }
        if (!jobId) { setLoading(false); return; }
        setLoading(true);
        try {
            const res = await authFetch(`/recruiter/jobs/${jobId}/ai-interview/config`);
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    const c = data.data as AIInterviewConfigData;
                    setConfig(c);
                    setForm({
                        enabled: c.enabled,
                        questionCount: c.questionCount,
                        interviewType: c.interviewType,
                        difficulty: c.difficulty,
                        totalDurationMinutes: c.timeLimitMinutes * c.questionCount || 30,
                        customInstructions: c.customInstructions || "",
                        hasCodingQuestions: !!c.hasCodingQuestions,
                    });
                    if (c.scoringWeights) setWeights(c.scoringWeights);
                    if (c.questions?.length) setActiveTab("questions");
                }
            }
        } catch { /* no config yet */ }
        finally { setLoading(false); }
    }, [jobId, draftMode]);

    useEffect(() => { fetchConfig(); }, [fetchConfig]);

    const handleGenerate = async () => {
        // Draft mode — just collect the settings and return to parent
        if (draftMode) {
            onDraftSave?.({
                interviewType: form.interviewType,
                difficulty: form.difficulty,
                questionCount: form.questionCount,
                totalDurationMinutes: form.totalDurationMinutes,
                customInstructions: form.customInstructions,
                hasCodingQuestions: form.hasCodingQuestions,
                scoringWeights: weights,
            });
            onClose?.();
            return;
        }
        setGenerating(true);
        setError(null);
        setSuccess(false);
        try {
            const timeLimitMinutes = Math.max(1, Math.round(form.totalDurationMinutes / form.questionCount));
            const res = await authFetch(`/recruiter/jobs/${jobId}/ai-interview/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, timeLimitMinutes, scoringWeights: weights }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to generate");
            setConfig(data.data);
            setSuccess(true);
            setActiveTab("questions");
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    const inputCls = "w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all";

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const weightsValid = totalWeight === 100;

    const content = (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            AI Interview Config
                            {config?.generatedAt && (
                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" /> Active
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {jobTitle} — Tune interview parameters and scoring criteria
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
                {[
                    { id: "setup", label: "Interview Setup", icon: Zap },
                    { id: "weights", label: "Scoring Criteria", icon: Sliders, badge: !weightsValid ? "!" : undefined },
                    { id: "questions", label: "Questions", icon: MessageSquare, badge: config?.questions?.length },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-inner"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {tab.badge !== undefined && (
                            <span className={`ml-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black ${tab.badge === "!" ? "bg-rose-500 text-white" : "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                }`}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Main scrollable area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 min-h-0">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === "setup" && (
                                <div className="space-y-10">
                                    <FormSection title="Interview Type">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {aiTypeOptions.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setForm(f => ({ ...f, interviewType: opt.value }))}
                                                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${form.interviewType === opt.value
                                                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm shadow-indigo-500/10"
                                                        : "border-gray-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/30 bg-white dark:bg-white/[0.02]"
                                                        }`}
                                                >
                                                    <div className={`p-2.5 rounded-xl ${form.interviewType === opt.value ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                                        <opt.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-bold mb-1 ${form.interviewType === opt.value ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'}`}>{opt.label}</h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{opt.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </FormSection>

                                    <FormSection title="Difficulty Level">
                                        <div className="grid grid-cols-3 gap-4">
                                            {(["Junior", "Mid-level", "Senior"] as const).map(level => {
                                                const valMap: Record<string, "EASY" | "MEDIUM" | "HARD"> = { Junior: "EASY", "Mid-level": "MEDIUM", Senior: "HARD" };
                                                const isActive = form.difficulty === valMap[level];
                                                return (
                                                    <button
                                                        key={level}
                                                        onClick={() => setForm(f => ({ ...f, difficulty: valMap[level] }))}
                                                        className={`py-4 px-6 rounded-2xl border-2 font-bold transition-all ${isActive
                                                            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-sm shadow-amber-500/10"
                                                            : "border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-white/10 bg-white dark:bg-white/[0.02]"
                                                            }`}
                                                    >
                                                        {level}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </FormSection>

                                    <FormSection title="Include Coding Challenges?">
                                        <button
                                            onClick={() => setForm(f => ({ ...f, hasCodingQuestions: !f.hasCodingQuestions }))}
                                            className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${form.hasCodingQuestions
                                                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm shadow-indigo-500/10"
                                                : "border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 bg-white dark:bg-white/[0.02]"
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${form.hasCodingQuestions ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                                    <Code2 className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className={`font-bold mb-1 ${form.hasCodingQuestions ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'}`}>
                                                        Coding Questions
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Add algorithmic or debugging challenges where candidates must write actual code.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${form.hasCodingQuestions ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${form.hasCodingQuestions ? "translate-x-6" : "translate-x-0"}`} />
                                            </div>
                                        </button>
                                    </FormSection>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <FormSection title="Questions">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex-1 relative">
                                                        <div className="absolute inset-y-0 left-0 right-0 py-2">
                                                            <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full" />
                                                        </div>
                                                        <input
                                                            type="range" min={3} max={10}
                                                            value={form.questionCount}
                                                            onChange={e => setForm(f => ({ ...f, questionCount: Number(e.target.value) }))}
                                                            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10"
                                                        />
                                                        <div
                                                            className="absolute h-2 bg-indigo-500 rounded-full pointer-events-none top-2"
                                                            style={{ width: `${((form.questionCount - 3) / 7) * 100}%` }}
                                                        />
                                                        <div
                                                            className="absolute w-5 h-5 bg-white border-4 border-indigo-500 rounded-full pointer-events-none top-0.5 shadow-md -ml-2.5"
                                                            style={{ left: `${((form.questionCount - 3) / 7) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-12 text-center text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                                        {form.questionCount}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-xs font-medium text-gray-400">
                                                    <span>3</span>
                                                    <span>10</span>
                                                </div>
                                            </div>
                                        </FormSection>

                                        <FormSection title="Total Interview Duration">
                                            <div className="relative">
                                                <select
                                                    value={form.totalDurationMinutes}
                                                    onChange={e => setForm(f => ({ ...f, totalDurationMinutes: Number(e.target.value) }))}
                                                    className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                                >
                                                    {[15, 20, 30, 45, 60, 75, 90].map(m => (
                                                        <option key={m} value={m}>{m} minutes</option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                                    <ChevronDown className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                ~{Math.round(form.totalDurationMinutes / form.questionCount)} min per question
                                            </p>
                                        </FormSection>
                                    </div>

                                    <div className="bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/10 flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                                            {form.questionCount} questions × ~{Math.round(form.totalDurationMinutes / form.questionCount)} min = <span className="text-indigo-600 dark:text-indigo-400 font-black">{form.totalDurationMinutes} min total</span>
                                        </p>
                                    </div>

                                    <FormSection title="Custom Instructions" subtitle="(optional)">
                                        <textarea
                                            rows={3}
                                            value={form.customInstructions}
                                            onChange={e => setForm(f => ({ ...f, customInstructions: e.target.value }))}
                                            placeholder="e.g. Focus on distributed systems and scalability. Avoid repetitive questions."
                                            className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 resize-none"
                                        />
                                    </FormSection>
                                </div>
                            )}

                            {activeTab === "weights" && (
                                <ScoringWeightsEditor weights={weights} onChange={setWeights} />
                            )}

                            {activeTab === "questions" && (
                                <div className="space-y-6">
                                    {config ? (
                                        <div className="space-y-4">
                                            {(config.questions || []).map((q, i) => (
                                                <div key={i} className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black flex-shrink-0 mt-0.5">
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 leading-snug">{q.questionText}</h3>
                                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                                                                <span className="text-gray-700 dark:text-gray-300 font-bold">Expectation:</span> {q.expectedKeyPoints?.join(', ') || ''}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400">
                                                                    {q.type || 'General'}
                                                                </span>

                                                                {q.isCodingChallenge && (
                                                                    <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                                                                        <Code2 className="w-3.5 h-3.5" /> Coding Challenge
                                                                    </span>
                                                                )}

                                                                <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-400">
                                                                    2 min
                                                                </span>
                                                            </div>
                                                            {q.isCodingChallenge && q.starterCode && (
                                                                <div className="mt-4 p-4 rounded-xl bg-gray-900 dark:bg-black overflow-x-auto text-sm text-gray-300 font-mono">
                                                                    <pre>{q.starterCode}</pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                                                <Sparkles className="w-10 h-10 text-indigo-500" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Generate Questions</h3>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
                                                The AI will generate highly relevant questions based on your JD and weights configuration.
                                            </p>
                                            <button
                                                onClick={handleGenerate}
                                                disabled={generating}
                                                className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 flex items-center gap-2"
                                            >
                                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                                {generating ? "Generating..." : "Generate Custom Questions"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer — always visible, context-aware */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex-shrink-0">
                {/* Left: Back button or weight status */}
                <div>
                    {activeTab === "weights" && (
                        <button
                            onClick={() => setActiveTab("setup")}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-bold hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    )}
                    {activeTab === "questions" && (
                        <button
                            onClick={() => setActiveTab("weights")}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-bold hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    )}
                    {activeTab === "setup" && (
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${weightsValid ? "bg-emerald-500" : "bg-amber-400"}`} />
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {weightsValid ? "Weights valid" : `Weights: ${totalWeight}% — fix before generating`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right: Next or Generate */}
                {activeTab === "setup" && (
                    <button
                        onClick={() => setActiveTab("weights")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-500/20"
                    >
                        Scoring Criteria <ChevronRight className="w-4 h-4" />
                    </button>
                )}
                {activeTab === "weights" && (
                    <button
                        onClick={() => setActiveTab("questions")}
                        disabled={!weightsValid}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-500/20"
                    >
                        {draftMode ? "Save & Close" : "Review Questions"} <ChevronRight className="w-4 h-4" />
                    </button>
                )}
                {activeTab === "questions" && (
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !weightsValid}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${success
                            ? "bg-emerald-500 text-white"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20"
                            }`}
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> :
                            success ? <CheckCircle2 className="w-4 h-4" /> :
                                draftMode ? <CheckCircle2 className="w-4 h-4" /> :
                                    config ? <RefreshCw className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        {generating ? "Generating…" :
                            success ? "Saved!" :
                                draftMode ? "Save Settings" :
                                    config ? "Regenerate Questions" : "Generate AI Questions"}
                    </button>
                )}
            </div>
        </div>
    );

    // ── Embedded mode: just return the content panel ──────────────────────────
    if (embedded) {
        return (
            <div className="bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5 h-full flex flex-col overflow-hidden">
                {content}
            </div>
        );
    }

    // ── Standalone: full-screen modal overlay ─────────────────────────────────
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl flex flex-col overflow-hidden"
                >
                    {content}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
