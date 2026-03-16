"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Activity, TrendingUp, Users, Target, Calendar,
    CheckCircle, MessageSquare, Briefcase, GraduationCap, Sparkles,
    X, AlertCircle, ChevronRight, BarChart3, Rocket, Award, Play, RefreshCw, Loader2,
    Download
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { safeEffectStateUpdate } from "@/lib/purity-helpers";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SkillGap {
    skill: string;
    acquiredPercentage: number;
    gapLevel: "LOW" | "MEDIUM" | "HIGH";
    averageProficiency: number;
}

interface RoleHeatmap {
    targetRole: string;
    studentCount: number;
    skillGaps: SkillGap[];
}

interface TrainingPlanPhase {
    phase: number;
    title: string;
    duration: string;
    priority: string;
    description: string;
    skills: Array<{
        skill: string;
        currentCoverage: string;
        targetCoverage: string;
        resources: string[];
        suggestedFormat: string;
    }>;
}

interface TrainingPlan {
    targetRole: string;
    generatedAt: string;
    totalDuration: string;
    expectedOutcome: string;
    phases: TrainingPlanPhase[];
    kpis: string[];
}

interface LinkedInTrends {
    alignmentScore: number;
    trendingSkills: Array<{ skill: string; demand: number; growth: string; category: string; isNew: boolean }>;
    alignedCount: number;
    missingCount: number;
    topMissingSkills: Array<{ skill: string; demand: number; growth: string; category: string; isNew: boolean }>;
}

// ─── Reusable Modal ───────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, icon: Icon, wide }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    icon?: any;
    wide?: boolean;
}) {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#070B14]/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative ${wide ? "max-w-4xl" : "max-w-2xl"} w-full bg-white dark:bg-[#0A0E1A] border border-gray-100 dark:border-white/[0.08] rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                {Icon && (
                                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                        <Icon className="w-5 h-5 text-teal-500" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">{title}</h3>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// ─── Training Plan Modal ──────────────────────────────────────────────────────
function TrainingPlanModal({ open, onClose, role }: { open: boolean; onClose: () => void; role: RoleHeatmap | null }) {
    const [plan, setPlan] = useState<TrainingPlan | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && role) {
            safeEffectStateUpdate(() => {
                setLoading(true);
                setPlan(null);
            });
            authFetch("/university/training-plan/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetRole: role.targetRole, skillGaps: role.skillGaps }),
            })
                .then(r => r.json())
                .then(d => setPlan(d.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, role]);

    const priorityColor: Record<string, string> = {
        HIGH: "rose", MEDIUM: "amber", LOW: "emerald",
    };

    return (
        <Modal open={open} onClose={onClose} title="AI Training Plan" icon={Sparkles} wide>
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Generating personalised training plan…</p>
                </div>
            )}

            {plan && (
                <div className="p-8 space-y-6">
                    {/* Summary bar */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Target Role", value: plan.targetRole, icon: Target },
                            { label: "Total Duration", value: plan.totalDuration, icon: Calendar },
                            { label: "Expected Outcome", value: plan.expectedOutcome, icon: TrendingUp },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className="w-3.5 h-3.5 text-teal-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                                </div>
                                <p className="text-sm font-black text-gray-900 dark:text-white">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Phases */}
                    {plan.phases.map((phase: TrainingPlanPhase) => {
                        const col = priorityColor[phase.priority] || "teal";
                        return (
                            <div key={phase.phase} className={`border border-${col}-100 dark:border-${col}-500/20 rounded-2xl overflow-hidden`}>
                                <div className={`bg-gray-50 dark:bg-${col}-500/10 px-6 py-4 flex items-center justify-between`}>
                                    <div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest text-${col}-600 dark:text-${col}-400`}>Phase {phase.phase}</span>
                                        <h4 className="font-black text-gray-900 dark:text-white text-md">{phase.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{phase.description}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <span className={`text-xs font-bold text-${col}-600 dark:text-${col}-400`}>{phase.duration}</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                                    {phase.skills.map((skill: any) => (
                                        <div key={skill.skill} className="px-6 py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{skill.skill}</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">{skill.suggestedFormat}</p>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {skill.resources.map((r: string) => (
                                                            <span key={r} className="text-[10px] bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">{r}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] text-gray-400">Coverage</p>
                                                    <p className="text-sm font-black text-gray-900 dark:text-white">{skill.currentCoverage} → <span className="text-emerald-500">{skill.targetCoverage}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* KPIs */}
                    <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 rounded-2xl p-6">
                        <h5 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3">Success KPIs</h5>
                        <ul className="space-y-2">
                            {plan.kpis.map((kpi, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                    {kpi}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ─── LinkedIn Trends Modal ──────────────────────────────────────────────────────
function LinkedInTrendsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (open && !data) {
            safeEffectStateUpdate(() => setLoading(true));
            authFetch("/university/analytics/linkedin-trends")
                .then(r => r.json())
                .then(d => setData(d.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, data]);

    return (
        <Modal open={open} onClose={onClose} title="LinkedIn Market Intelligence" icon={Activity} wide>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 text-[#0077b5] animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing LinkedIn ecosystem...</p>
                </div>
            ) : data ? (
                <div className="p-8 space-y-6">
                    {/* Highlights */}
                    <div className="grid grid-cols-3 gap-6">
                        {data?.topRoles?.slice(0, 3)?.map((role: any, idx: number) => (
                            <div key={idx} className="bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] font-bold text-emerald-400">+{role.demandGrowth}</span>
                                </div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">{role.role}</div>
                                <div className="text-[11px] text-gray-500">Highest growth role</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">Top Trending Roles</h3>
                            <div className="space-y-3">
                                {data?.topRoles?.map((role: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-xl">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{role.role}</span>
                                        <span className="text-xs font-bold text-teal-400">{role.demandGrowth}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">Critical Skill Gap Trends</h3>
                            <div className="space-y-3">
                                {data?.criticalSkills?.map((skill: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-xl">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{skill.skill}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-1 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                                <div className="h-full bg-rose-500/60" style={{ width: `${skill.shortage}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-rose-400">{skill.shortage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation Modal
// ─────────────────────────────────────────────────────────────────────────────
function SimulationModal({ open, onClose, run }: { open: boolean; onClose: () => void; run: () => void }) {
    useEffect(() => {
        if (open) {
            safeEffectStateUpdate(() => run());
        }
    }, [open, run]);

    return (
        <Modal open={open} onClose={onClose} title="AI Readiness Simulation" icon={Rocket}>
            <div className="p-10 flex flex-col items-center justify-center text-center gap-6">
                <div className="w-20 h-20 rounded-[32px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Rocket className="w-10 h-10 text-emerald-500 animate-bounce" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Simulating Next 6 Months...</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">We are running AI projections based on current skill trends and your institutional training velocity.</p>
                </div>
                <div className="w-full max-w-xs h-1.5 bg-gray-100 dark:bg-white/[0.05] rounded-full overflow-hidden mt-4">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="w-1/3 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                </div>
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function SkillGapsPage() {
    const [data, setData] = useState<RoleHeatmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<RoleHeatmap | null>(null);
    const [trendsOpen, setTrendsOpen] = useState(false);
    const [simulationOpen, setSimulationOpen] = useState(false);
    const [simulationResult, setSimulationResult] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/university/analytics/skill-gap");
            if (res.ok) {
                const d = await res.json();
                setData(d.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch skill gaps:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const runSimulation = useCallback(async () => {
        try {
            const res = await authFetch("/university/analytics/placement-simulation", { method: "POST" });
            if (res.ok) {
                const d = await res.json();
                setSimulationResult(d.data);
                // Auto close simulation loader after min delay
                setTimeout(() => setSimulationOpen(false), 2000);
            }
        } catch (err) {
            console.error("Simulation failed:", err);
            setSimulationOpen(false);
        }
    }, []);

    const stats = useMemo(() => {
        if (!data.length) return { avg: 0, high: 0, total: 0 };
        const allGaps = data.flatMap(r => r.skillGaps);
        const avg = allGaps.reduce((acc, g) => acc + g.acquiredPercentage, 0) / allGaps.length;
        const high = allGaps.filter(g => g.gapLevel === "HIGH").length;
        return { avg: Math.round(avg), high, total: data.length };
    }, [data]);

    return (
        <div className="space-y-10 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                            Intelligence
                        </div>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Skill Readiness</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Institutional <span className="text-teal-500">Skill Readiness</span></h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl font-medium">Identify curriculum gaps and generate AI-powered training plans based on real-time industry demand.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setTrendsOpen(true)}
                        className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.08] text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all shadow-sm"
                    >
                        <Activity className="w-4 h-4 text-teal-500" />
                        Industry Trends
                    </button>
                    <button
                        onClick={() => setSimulationOpen(true)}
                        className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-500/25"
                    >
                        <Rocket className="w-4 h-4" />
                        Run AI Projection
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Overall Readiness", value: `${stats.avg}%`, icon: null, color: "teal", sub: "Institutional average" },
                    { label: "High Risk Skills", value: stats.high, icon: AlertCircle, color: "rose", sub: "Requiring immediate focus" },
                    { label: "Tracked Roles", value: stats.total, icon: Target, color: "amber", sub: "Market aligned roles" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#0A0E1A] border border-gray-100 dark:border-white/[0.08] rounded-[32px] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center border border-${stat.color}-500/20`}>
                                {stat.label === "Overall Readiness" ? (
                                    <CircularProgress percentage={stats.avg} color={stat.color} />
                                ) : (
                                    stat.icon && <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                                )}
                            </div>
                        </div>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-medium">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Heatmap Section */}
            <div className="bg-white dark:bg-[#0A0E1A] border border-gray-100 dark:border-white/[0.08] rounded-[40px] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 dark:border-white/[0.04] flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.01]">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Role-Wise Skill Gap Analysis</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Cross-referencing student performance with target role requirements.</p>
                    </div>
                    <button onClick={fetchData} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-400 transition-all">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                            <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-[0.1em]">Crunching cross-role data…</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-black/20">
                                    <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/[0.04]">Target Role</th>
                                    <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/[0.04]">Critical Skill Gaps</th>
                                    <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/[0.04]">Avg. Readiness</th>
                                    <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/[0.04] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                                {data.map((role, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-sm">
                                                    <Briefcase className="w-4 h-4 text-teal-500" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{role.targetRole}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium">{role.studentCount} aspirants</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8">
                                            <div className="flex flex-wrap gap-2">
                                                {role.skillGaps.map((gap, gidx) => (
                                                    <span
                                                        key={gidx}
                                                        className={`text-[10px] font-bold px-3 py-1 rounded-lg border ${gap.gapLevel === "HIGH"
                                                            ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                                            : gap.gapLevel === "MEDIUM"
                                                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                                            }`}
                                                    >
                                                        {gap.skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 max-w-[100px] h-1.5 bg-gray-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-teal-500 transition-all duration-1000"
                                                        style={{ width: `${role.skillGaps.reduce((acc, g) => acc + g.acquiredPercentage, 0) / role.skillGaps.length}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-gray-900 dark:text-white">
                                                    {Math.round(role.skillGaps.reduce((acc, g) => acc + g.acquiredPercentage, 0) / role.skillGaps.length)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <button
                                                onClick={() => setSelectedRole(role)}
                                                className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white/[0.04] text-white text-[11px] font-bold hover:bg-teal-600 dark:hover:bg-teal-500 transition-all shadow-sm"
                                            >
                                                Design Training
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Simulation Results (only if simulation run) */}
            {simulationResult && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-900/10 border border-emerald-500/20 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-10"
                >
                    <div className="w-32 h-32 rounded-full border-[6px] border-emerald-500/20 flex items-center justify-center relative shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-emerald-500/10" />
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - simulationResult.predictedReadiness / 100)} className="text-emerald-500" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white">{simulationResult.predictedReadiness}%</span>
                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Readiness</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <Rocket className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-2xl font-black text-white tracking-tight">AI Projection for {simulationResult.targetMonth}</h3>
                        </div>
                        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-3xl">Based on current specialized training adoption, institutional readiness will improve by <span className="text-emerald-400 font-black">+{simulationResult.projectedGrowth}%</span>. Suggested focus for next quarter: <span className="text-white font-bold">{simulationResult.priorityAction}</span>.</p>
                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Impact Level</span>
                                <span className="text-xs font-bold text-teal-400 uppercase">Strategic Priority</span>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Recommended Credits</span>
                                <span className="text-xs font-bold text-cyan-400 uppercase">12 Module Hours</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setSimulationResult(null)}
                        className="px-6 py-3 rounded-2xl bg-white/[0.05] text-[10px] font-bold text-gray-400 hover:text-white transition-all uppercase tracking-widest"
                    >
                        Dismiss
                    </button>
                </motion.div>
            )}

            {/* Modals */}
            <TrainingPlanModal open={!!selectedRole} onClose={() => setSelectedRole(null)} role={selectedRole} />
            <LinkedInTrendsModal open={trendsOpen} onClose={() => setTrendsOpen(false)} />
            <SimulationModal open={simulationOpen} onClose={() => setSimulationOpen(false)} run={runSimulation} />
        </div>
    );
}

// ─── Visual Helpers ──────────────────────────────────────────────────────────
function CircularProgress({ percentage, color }: { percentage: number; color: string }) {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg className="w-10 h-10 transform -rotate-90">
            <circle cx="20" cy="20" r={radius} stroke="currentColor" strokeWidth="2" fill="transparent" className={`text-${color}-500/10`} />
            <circle cx="20" cy="20" r={radius} stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className={`text-${color}-500`} strokeLinecap="round" />
        </svg>
    );
}
