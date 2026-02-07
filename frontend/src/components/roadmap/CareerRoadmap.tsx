"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    FileText,
    Zap,
    Target,
    Mic,
    Rocket,
    Gem,
    Check,
    Lock,
    ChevronRight
} from "lucide-react";

export interface RoadmapStage {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    href: string;
    status: "completed" | "current" | "locked" | "available";
    progress?: number; // 0-100
}

interface CareerRoadmapProps {
    stages: RoadmapStage[];
}

// Per-stage color themes for visual variety
const stageThemes: Record<string, {
    iconGradient: string;
    progressGradient: string;
    neonClass: string;
    badgeBg: string;
    badgeText: string;
    arrowHover: string;
}> = {
    profile: {
        iconGradient: "from-indigo-500 to-violet-500",
        progressGradient: "from-indigo-500 to-violet-500",
        neonClass: "neon-purple",
        badgeBg: "bg-indigo-500/20",
        badgeText: "text-indigo-400",
        arrowHover: "group-hover:text-indigo-400",
    },
    "skills-gap": {
        iconGradient: "from-cyan-500 to-blue-500",
        progressGradient: "from-cyan-400 to-blue-500",
        neonClass: "neon-cyan",
        badgeBg: "bg-cyan-500/20",
        badgeText: "text-cyan-400",
        arrowHover: "group-hover:text-cyan-400",
    },
    "skills-tests": {
        iconGradient: "from-amber-500 to-orange-500",
        progressGradient: "from-amber-400 to-orange-500",
        neonClass: "neon-amber",
        badgeBg: "bg-amber-500/20",
        badgeText: "text-amber-400",
        arrowHover: "group-hover:text-amber-400",
    },
    interviews: {
        iconGradient: "from-rose-500 to-pink-500",
        progressGradient: "from-rose-400 to-pink-500",
        neonClass: "neon-pink",
        badgeBg: "bg-rose-500/20",
        badgeText: "text-rose-400",
        arrowHover: "group-hover:text-rose-400",
    },
    jobs: {
        iconGradient: "from-emerald-500 to-teal-500",
        progressGradient: "from-emerald-400 to-teal-500",
        neonClass: "neon-emerald",
        badgeBg: "bg-emerald-500/20",
        badgeText: "text-emerald-400",
        arrowHover: "group-hover:text-emerald-400",
    },
    growth: {
        iconGradient: "from-indigo-500 via-violet-500 to-pink-500",
        progressGradient: "from-indigo-500 via-violet-500 to-pink-500",
        neonClass: "neon-purple",
        badgeBg: "bg-violet-500/20",
        badgeText: "text-violet-400",
        arrowHover: "group-hover:text-violet-400",
    },
};

const defaultTheme = stageThemes.profile;

export default function CareerRoadmap({ stages }: CareerRoadmapProps) {
    return (
        <div className="relative py-8">
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative space-y-4">
                {stages.map((stage, index) => {
                    const theme = stageThemes[stage.id] || defaultTheme;

                    return (
                        <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {/* Connector Line (except for first) */}
                            {index > 0 && (
                                <div className="flex justify-center -mt-4 mb-2">
                                    <div
                                        className={`w-1 h-8 rounded-full ${stages[index - 1].status === "completed"
                                            ? "roadmap-path completed"
                                            : "roadmap-path"
                                            }`}
                                    />
                                </div>
                            )}

                            {/* Stage Card */}
                            <Link
                                href={stage.status === "locked" ? "#" : stage.href}
                                className={`block group ${stage.status === "locked" ? "cursor-not-allowed" : ""}`}
                            >
                                <div
                                    className={`
                      relative p-6 rounded-2xl transition-all duration-300
                      ${stage.status === "current"
                                            ? `glass-card border-gradient ${theme.neonClass}`
                                            : stage.status === "completed"
                                                ? "glass-card border-green-500/30"
                                                : stage.status === "locked"
                                                    ? "glass opacity-50"
                                                    : "glass-card"
                                        }
                    `}
                                >
                                    <div className="flex items-center gap-5">
                                        {/* Icon Node */}
                                        <div
                                            className={`
                          roadmap-node w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0
                          ${stage.status === "current" ? `active bg-gradient-to-br ${theme.iconGradient}` : ""}
                          ${stage.status === "completed" ? "completed" : ""}
                          ${stage.status === "available" ? `bg-gradient-to-br ${theme.iconGradient} opacity-60` : ""}
                          ${stage.status === "locked" ? "locked bg-gray-700" : ""}
                        `}
                                        >
                                            {stage.status === "completed" ? (
                                                <Check className="w-8 h-8 text-white" />
                                            ) : stage.status === "locked" ? (
                                                <Lock className="w-6 h-6 text-gray-400" />
                                            ) : (
                                                <stage.icon className="w-8 h-8 text-white" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                                    Stage {index + 1}
                                                </span>
                                                {stage.status === "current" && (
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${theme.badgeBg} ${theme.badgeText} animate-pulse`}>
                                                        CURRENT
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={`text-xl font-bold mb-1 ${stage.status === "locked" ? "text-gray-500" : "text-white"
                                                }`}>
                                                {stage.title}
                                            </h3>
                                            <p className="text-sm text-gray-400">{stage.subtitle}</p>

                                            {/* Progress Bar (for current/active stages) */}
                                            {(stage.status === "current" || stage.status === "available") && stage.progress !== undefined && (
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                        <span>Progress</span>
                                                        <span>{stage.progress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className={`h-full bg-gradient-to-r ${theme.progressGradient} rounded-full`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${stage.progress}%` }}
                                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Arrow */}
                                        {stage.status !== "locked" && (
                                            <ChevronRight className={`w-6 h-6 text-gray-500 ${theme.arrowHover} group-hover:translate-x-1 transition-all flex-shrink-0`} />
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            {/* Completion Message */}
            {stages.every(s => s.status === "completed") && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 p-6 rounded-2xl glass-premium text-center border-gradient"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 neon-emerald">
                        <Gem className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Journey Complete!</h3>
                    <p className="text-gray-400">You&apos;ve mastered all stages. Keep exploring to level up!</p>
                </motion.div>
            )}
        </div>
    );
}

// Default stages configuration
export const DEFAULT_ROADMAP_STAGES: RoadmapStage[] = [
    {
        id: "profile",
        title: "Resume Score",
        subtitle: "Upload your resume and get instant ATS scores",
        icon: FileText,
        href: "/dashboard/resumes",
        status: "current",
        progress: 0,
    },
    {
        id: "skills-gap",
        title: "Skill Analysis",
        subtitle: "Analyze skill gaps and build your learning roadmap",
        icon: Zap,
        href: "/dashboard/skills",
        status: "available",
    },
    {
        id: "skills-tests",
        title: "Skill Lab",
        subtitle: "Prove your skills with assessments and earn verified badges",
        icon: Target,
        href: "/dashboard/tests",
        status: "locked",
    },
    {
        id: "interviews",
        title: "Interview Arena",
        subtitle: "Practice with AI-powered mock interviews",
        icon: Mic,
        href: "/dashboard/interviews",
        status: "locked",
    },
    {
        id: "jobs",
        title: "Job Board",
        subtitle: "Find matching jobs and track all applications",
        icon: Rocket,
        href: "/dashboard/jobs",
        status: "locked",
    },
    {
        id: "growth",
        title: "Offer Hub",
        subtitle: "Compare offers and negotiate your worth",
        icon: Gem,
        href: "/dashboard/growth",
        status: "locked",
    },
];
