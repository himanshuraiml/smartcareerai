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
    TrendingUp
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

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
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-amber-400";
        return "text-red-400";
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY": return "bg-emerald-500/10 text-emerald-400";
            case "MEDIUM": return "bg-amber-500/10 text-amber-400";
            case "HARD": return "bg-red-500/10 text-red-400";
            default: return "bg-gray-500/10 text-gray-500 dark:text-gray-400";
        }
    };

    if (loading) {
        return (
            <div className="text-gray-900 dark:text-white text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                Loading student details...
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="text-center py-20">
                <p className="text-red-400 mb-4">{error || "Student not found"}</p>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 rounded-lg bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/institution-admin/students"
                    className="p-2 rounded-lg bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Profile</h1>
                    <p className="text-gray-500 dark:text-gray-400">View detailed performance and progress</p>
                </div>
            </div>

            {/* Profile Header */}
            <div className="p-6 rounded-xl glass border border-gray-200 dark:border-white/5">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-white" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{student.name || "Unnamed Student"}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{student.email}</p>
                        {student.targetJobRole && (
                            <div className="flex items-center gap-2 mt-2">
                                <Target className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">{student.targetJobRole.title}</span>
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p>Joined: {new Date(student.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl glass border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Interview Score</p>
                            <p className={`text-2xl font-bold ${getScoreColor(student.summary.averageInterviewScore)}`}>
                                {student.summary.averageInterviewScore !== null ? `${student.summary.averageInterviewScore}%` : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl glass border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Interviews</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{student.summary.totalInterviews}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl glass border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10">
                            <Award className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Badges Earned</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{student.summary.badgesEarned}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl glass border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <FileText className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Latest ATS Score</p>
                            <p className={`text-2xl font-bold ${getScoreColor(student.summary.latestAtsScore)}`}>
                                {student.summary.latestAtsScore !== null ? `${student.summary.latestAtsScore}%` : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interview History */}
            <div className="p-6 rounded-xl glass border border-gray-200 dark:border-white/5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Interview History</h3>
                {student.interviews.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No interviews completed yet.</p>
                ) : (
                    <div className="space-y-3">
                        {student.interviews.map((interview) => (
                            <div key={interview.id} className="p-4 rounded-lg bg-white dark:bg-white/5 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900 dark:text-white">{interview.targetRole}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(interview.difficulty)}`}>
                                            {interview.difficulty}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                            ({interview.type.toLowerCase()})
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {interview.completedAt
                                            ? `Completed on ${new Date(interview.completedAt).toLocaleDateString()}`
                                            : interview.status}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {interview.overallScore !== null && (
                                        <p className={`text-xl font-bold ${getScoreColor(interview.overallScore)}`}>
                                            {interview.overallScore}%
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Skill Badges */}
            {student.skillBadges.length > 0 && (
                <div className="p-6 rounded-xl glass border border-gray-200 dark:border-white/5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Skill Badges</h3>
                    <div className="flex flex-wrap gap-3">
                        {student.skillBadges.map((badge) => (
                            <div key={badge.id} className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <p className="font-medium text-indigo-400">{badge.skill.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{badge.badgeType}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


