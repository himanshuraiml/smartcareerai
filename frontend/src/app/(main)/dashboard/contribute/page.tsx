"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PenSquare, Send, CheckCircle2, AlertCircle, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import QuestionReviewCard from "@/components/community/QuestionReviewCard";

interface Mastery {
    skillId: string;
    skill: {
        id: string;
        name: string;
    };
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | "MASTER";
}

interface Submission {
    id: string;
    questionText: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    status: "DRAFT" | "SUBMITTED" | "AI_REVIEW" | "PEER_REVIEW" | "APPROVED" | "REJECTED";
    aiQualityScore?: number;
    aiNotes?: string;
    upvotes: number;
    downvotes: number;
    peerReviewCount: number;
    createdAt: string;
    skill: {
        name: string;
    };
}

export default function ContributePage() {
    const [eligibleSkills, setEligibleSkills] = useState<{ id: string; name: string }[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form fields
    const [selectedSkillId, setSelectedSkillId] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState<string[]>(["", "", "", ""]);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
    const [explanation, setExplanation] = useState("");
    const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
    const [tagsInput, setTagsInput] = useState("");

    // Active sub-tab
    const [activeTab, setActiveTab] = useState<"submit" | "my_submissions" | "peer_review">("submit");

    const fetchContributeData = async () => {
        setLoading(true);
        try {
            // 1. Fetch user masteries to check eligibility
            const masteryRes = await authFetch("/skills/mastery");
            if (masteryRes.ok) {
                const masteries: Mastery[] = await masteryRes.json();
                const experts = masteries
                    .filter((m) => m.level === "EXPERT" || m.level === "MASTER")
                    .map((m) => ({ id: m.skill.id, name: m.skill.name }));
                setEligibleSkills(experts);
                if (experts.length > 0) {
                    setSelectedSkillId(experts[0].id);
                }
            }

            // 2. Fetch user's prior submissions
            const submissionsRes = await authFetch("/community/questions/mine");
            if (submissionsRes.ok) {
                const subData = await submissionsRes.json();
                if (subData.success) {
                    setSubmissions(subData.data);
                }
            }
        } catch (err) {
            console.error("Failed to load contribution data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContributeData();
    }, []);

    const handleOptionChange = (index: number, val: string) => {
        const newOptions = [...options];
        newOptions[index] = val;
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Client side validations
        if (!selectedSkillId) {
            setMessage({ type: "error", text: "Please select a skill." });
            return;
        }
        if (!questionText.trim()) {
            setMessage({ type: "error", text: "Question text is required." });
            return;
        }
        if (options.some((o) => !o.trim())) {
            setMessage({ type: "error", text: "All 4 options must be filled." });
            return;
        }
        if (!explanation.trim()) {
            setMessage({ type: "error", text: "Explanation is required." });
            return;
        }

        setSubmitting(true);
        try {
            const tags = tagsInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);

            const payload = {
                skillId: selectedSkillId,
                questionText,
                options,
                correctAnswer: options[correctAnswerIndex],
                explanation,
                difficulty,
                tags,
            };

            const res = await authFetch("/community/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: "success", text: "🎉 Question submitted! AI verification has started." });
                // Reset form
                setQuestionText("");
                setOptions(["", "", "", ""]);
                setExplanation("");
                setTagsInput("");
                setCorrectAnswerIndex(0);
                // Refresh data
                fetchContributeData();
            } else {
                setMessage({ type: "error", text: data.error?.message || "Failed to submit question." });
            }
        } catch {
            setMessage({ type: "error", text: "Server error occurred." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (eligibleSkills.length === 0) {
        return (
            <div className="p-8 max-w-2xl mx-auto rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 shadow-xl text-center">
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Contribute a Question</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    To maintain high standard mock challenges, only students who have reached the <strong className="text-indigo-400">Expert</strong> or <strong className="text-indigo-400">Master</strong> tier in a skill are allowed to submit community questions.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 inline-block text-xs">
                    💡 Complete daily quizzes & skill tests to level up your mastery tiers!
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <PenSquare className="w-8 h-8 text-teal-400" />
                        Placement Contribution Hub
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Help other students prepare by sharing high-quality interview questions. Earn +150 XP per approved question!
                    </p>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-gray-200 dark:border-white/5">
                <button
                    onClick={() => setActiveTab("submit")}
                    className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
                        activeTab === "submit"
                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                >
                    Submit a Question
                </button>
                <button
                    onClick={() => setActiveTab("my_submissions")}
                    className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
                        activeTab === "my_submissions"
                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                >
                    My Submissions ({submissions.length})
                </button>
                <button
                    onClick={() => setActiveTab("peer_review")}
                    className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
                        activeTab === "peer_review"
                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                >
                    Peer Review Group
                </button>
            </div>

            {/* Tab: Submit a Question */}
            {activeTab === "submit" && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 md:p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-3xl shadow-xl space-y-6"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message && (
                            <div
                                className={`p-4 rounded-2xl flex items-start gap-3 text-sm border ${
                                    message.type === "success"
                                        ? "bg-green-50 dark:bg-green-950/20 border-green-500/20 text-green-600 dark:text-green-400"
                                        : "bg-red-50 dark:bg-red-950/20 border-red-500/20 text-red-600 dark:text-red-400"
                                }`}
                            >
                                {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">
                                    Target Skill
                                </label>
                                <select
                                    value={selectedSkillId}
                                    onChange={(e) => setSelectedSkillId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-sm"
                                >
                                    {eligibleSkills.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">
                                    Difficulty
                                </label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as any)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-sm"
                                >
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    placeholder="arrays, closures, hooks"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">
                                Question Text
                            </label>
                            <textarea
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                rows={3}
                                placeholder="What is the output of..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-sm"
                            />
                        </div>

                        {/* Options */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                                Options & Correct Answer
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {options.map((option, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={correctAnswerIndex === idx}
                                            onChange={() => setCorrectAnswerIndex(idx)}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            title="Mark as Correct Option"
                                        />
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">
                                Explanation
                            </label>
                            <textarea
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                rows={3}
                                placeholder="Explain why the marked option is correct..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-bold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Submit for Peer Review
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Tab: My Submissions */}
            {activeTab === "my_submissions" && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {submissions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/5 rounded-3xl bg-white dark:bg-gray-900">
                            You haven't submitted any questions yet.
                        </div>
                    ) : (
                        submissions.map((sub) => (
                            <div
                                key={sub.id}
                                className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                            >
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                            {sub.skill.name}
                                        </span>
                                        <span className="text-[10px] font-bold bg-gray-50 dark:bg-white/5 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/5">
                                            {sub.difficulty}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            sub.status === "APPROVED"
                                                ? "bg-green-50 dark:bg-green-950/20 border-green-500/20 text-green-500"
                                                : sub.status === "REJECTED"
                                                ? "bg-red-50 dark:bg-red-950/20 border-red-500/20 text-red-500"
                                                : "bg-amber-50 dark:bg-amber-950/20 border-amber-500/20 text-amber-500"
                                        }`}>
                                            {sub.status}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mt-2 text-sm">
                                        {sub.questionText}
                                    </h4>
                                    {sub.aiNotes && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 border-l-2 border-gray-200 dark:border-white/10 pl-2">
                                            {sub.aiNotes}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-4 shrink-0 text-xs">
                                    <div className="text-center">
                                        <span className="text-gray-500 dark:text-gray-400 block">Upvotes</span>
                                        <strong className="text-sm text-green-500 font-bold">{sub.upvotes}</strong>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-gray-500 dark:text-gray-400 block">Downvotes</span>
                                        <strong className="text-sm text-red-400 font-bold">{sub.downvotes}</strong>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </motion.div>
            )}

            {/* Tab: Peer Review Group */}
            {activeTab === "peer_review" && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <QuestionReviewCard />
                </motion.div>
            )}
        </div>
    );
}
