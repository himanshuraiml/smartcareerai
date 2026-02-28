"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    User,
    Award,
    FileText,
    Calendar,
    Target,
    TrendingUp,
    ExternalLink,
    Mail,
    Clock,
    Briefcase,
    Zap
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface Interview {
    id: string;
    type: string;
    targetRole: string;
    difficulty: string;
    status: string;
    overallScore: number | null;
    feedback: string | null;
    completedAt: string | null;
    createdAt: string;
}

interface SkillBadge {
    id: string;
    badgeType: string;
    issuedAt: string;
    skill: { id: string; name: string; category: string };
}

interface AtsScore {
    id: string;
    jobRole: string;
    overallScore: number;
    createdAt: string;
}

interface StudentDetail {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
    targetJobRole?: { id: string; title: string; category: string };
    interviews: Interview[];
    skillBadges: SkillBadge[];
    atsScores: AtsScore[];
    summary: {
        averageInterviewScore: number | null;
        totalInterviews: number;
        badgesEarned: number;
        latestAtsScore: number | null;
    };
}

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const response = await authFetch(`/admin/institution/students/${params.id}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch student");
                }

                const result = await response.json();
                setStudent(result.data);
            } catch (err) {
                console.error("Error fetching student:", err);
                setError("Failed to load student details");
            } finally {
                setLoading(false);
            }
        };

        if (user && params.id) {
            fetchStudent();
        }
    }, [user, params.id]);

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-gray-500 dark:text-gray-400";
        if (score >= 80) return "text-emerald-500 dark:text-emerald-400";
        if (score >= 60) return "text-amber-500 dark:text-amber-400";
        return "text-rose-500 dark:text-rose-400";
    };

    const getScoreBg = (score: number | null) => {
        if (score === null) return "bg-gray-100 dark:bg-white/5";
        if (score >= 80) return "bg-emerald-50 dark:bg-emerald-500/10";
        if (score >= 60) return "bg-amber-50 dark:bg-amber-500/10";
        return "bg-rose-50 dark:bg-rose-500/10";
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY": return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20";
            case "MEDIUM": return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20";
            case "HARD": return "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20";
            default: return "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700";
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-teal-500 animate-spin flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Profile...</p>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4 max-w-sm mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
                    <User className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Student Not Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "The student profile you're looking for doesn't exist or has been removed."}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg active:scale-95"
                    >
                        Return to Directory
                    </button>
                </div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto space-y-8 pb-10"
        >
            {/* Header Navigation */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Student Insights</h1>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Detailed analytics and progress tracking</p>
                    </div>
                </div>
            </motion.div>

            {/* Profile Overview Card */}
            <motion.div variants={itemVariants} className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none transition-opacity duration-500 group-hover:from-emerald-500/10" />

                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    <div className="flex-shrink-0">
                        <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-1 shadow-lg group-hover:shadow-xl transition-all duration-300">
                            <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-900 overflow-hidden flex items-center justify-center relative">
                                {student.avatarUrl ? (
                                    <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                                        <span className="text-4xl font-black text-gray-300 dark:text-gray-700">
                                            {student.name ? student.name.charAt(0).toUpperCase() : "U"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                                    {student.name || "Unnamed Student"}
                                </h2>
                                <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/[0.03] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        {student.email}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Joined {new Date(student.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {student.targetJobRole && (
                                <div className="inline-flex px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-[#111827] rounded-xl shadow-sm">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">Target Role</p>
                                            <p className="font-bold">{student.targetJobRole.title}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Core Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Avg Score */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${getScoreBg(student.summary.averageInterviewScore)}`}>
                            <TrendingUp className={`w-5 h-5 ${getScoreColor(student.summary.averageInterviewScore)}`} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Performance</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Avg. Interview Score</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {student.summary.averageInterviewScore !== null ? (
                            <span className={getScoreColor(student.summary.averageInterviewScore)}>
                                {student.summary.averageInterviewScore}%
                            </span>
                        ) : (
                            <span className="text-gray-300 dark:text-gray-700">N/A</span>
                        )}
                    </p>
                </div>

                {/* ATS Score */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${getScoreBg(student.summary.latestAtsScore)}`}>
                            <FileText className={`w-5 h-5 ${getScoreColor(student.summary.latestAtsScore)}`} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resume</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Latest ATS Score</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {student.summary.latestAtsScore !== null ? (
                            <span className={getScoreColor(student.summary.latestAtsScore)}>
                                {student.summary.latestAtsScore}%
                            </span>
                        ) : (
                            <span className="text-gray-300 dark:text-gray-700">N/A</span>
                        )}
                    </p>
                </div>

                {/* Interviews count */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Activity</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Total Interviews</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {student.summary.totalInterviews}
                    </p>
                </div>

                {/* Badges */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500">
                            <Award className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Skills</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Badges Earned</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                        {student.summary.badgesEarned}
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Interviews & ATS */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Interview History */}
                    <motion.div variants={itemVariants} className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                Interview History
                            </h3>
                        </div>

                        {student.interviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-gray-800">
                                <Zap className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No mock interviews completed yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {student.interviews.map((interview) => (
                                    <div
                                        key={interview.id}
                                        className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 group"
                                    >
                                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-lg truncate pr-2">
                                                    {interview.targetRole}
                                                </h4>
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getDifficultyColor(interview.difficulty)}`}>
                                                    {interview.difficulty}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold capitalize">
                                                    {interview.type.toLowerCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {interview.completedAt
                                                    ? new Date(interview.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                    : <span className="text-amber-500">{interview.status}</span>
                                                }
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1 pl-4 sm:pl-0 sm:border-l-0 border-l border-gray-200 dark:border-gray-800">
                                            {interview.overallScore !== null ? (
                                                <>
                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Score</span>
                                                    <div className={`text-3xl font-black ${getScoreColor(interview.overallScore)}`}>
                                                        {interview.overallScore}%
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-sm font-bold text-gray-400">Pending</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Right Column - Skill Badges */}
                <div className="lg:col-span-1 space-y-8">
                    <motion.div variants={itemVariants} className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500">
                                    <Award className="w-5 h-5" />
                                </div>
                                Skill Badges
                            </h3>
                        </div>

                        {student.skillBadges.length === 0 ? (
                            <div className="py-8 text-center text-gray-500 dark:text-gray-400 font-medium text-sm">
                                No badges earned yet.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {student.skillBadges.map((badge) => (
                                    <div
                                        key={badge.id}
                                        className="flex-1 min-w-[140px] flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-colors text-center gap-2 group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white dark:bg-indigo-500/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <Award className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-0.5 leading-tight">{badge.skill.name}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">{badge.badgeType}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
