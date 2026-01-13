"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    FileText,
    Zap,
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

export default function CareerRoadmap({ stages }: CareerRoadmapProps) {
    return (
        <div className="relative py-8">
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative space-y-4">
                {stages.map((stage, index) => (
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
                                        ? "glass-card border-gradient neon-purple"
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
                      ${stage.status === "current" ? "active bg-gradient-to-br from-purple-500 to-pink-500" : ""}
                      ${stage.status === "completed" ? "completed" : ""}
                      ${stage.status === "available" ? "bg-gradient-to-br from-purple-500/50 to-pink-500/50" : ""}
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
                                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-400 animate-pulse">
                                                    CURRENT
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={`text-xl font-bold mb-1 ${stage.status === "locked" ? "text-gray-500" : "text-white"
                                            }`}>
                                            {stage.title}
                                        </h3>
                                        <p className="text-sm text-gray-400">{stage.subtitle}</p>

                                        {/* Progress Bar (for current stage) */}
                                        {stage.status === "current" && stage.progress !== undefined && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>Progress</span>
                                                    <span>{stage.progress}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
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
                                        <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                    )}
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Completion Message */}
            {stages.every(s => s.status === "completed") && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 p-6 rounded-2xl glass-premium text-center border-gradient"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 neon-cyan">
                        <Gem className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Journey Complete! 🎉</h3>
                    <p className="text-gray-400">You've mastered all stages. Keep exploring to level up!</p>
                </motion.div>
            )}
        </div>
    );
}

// Default stages configuration
export const DEFAULT_ROADMAP_STAGES: RoadmapStage[] = [
    {
        id: "profile",
        title: "Profile DNA",
        subtitle: "Upload your resume and optimize your professional profile",
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
        title: "Skill Synchronization",
        subtitle: "Take skill assessments and earn verified badges",
        icon: Zap,
        href: "/dashboard/tests",
        status: "locked",
    },
    {
        id: "interviews",
        title: "Simulation Training",
        subtitle: "Practice with AI-powered mock interviews",
        icon: Mic,
        href: "/dashboard/interviews",
        status: "locked",
    },
    {
        id: "jobs",
        title: "Career Launchpad",
        subtitle: "Find matching jobs and track applications",
        icon: Rocket,
        href: "/dashboard/jobs",
        status: "locked",
    },
    {
        id: "growth",
        title: "Career Ascension",
        subtitle: "Analyze offers and negotiate your worth",
        icon: Gem,
        href: "/dashboard/growth",
        status: "locked",
    },
];
