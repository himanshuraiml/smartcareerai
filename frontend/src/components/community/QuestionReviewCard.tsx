"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, CheckCircle, HelpCircle, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface ReviewQuestion {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    author: {
        name: string;
    };
    skill: {
        name: string;
    };
}

export default function QuestionReviewCard() {
    const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [votedStatus, setVotedStatus] = useState<"up" | "down" | null>(null);

    const fetchReviewQuestions = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/community/questions/review");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setQuestions(data.data);
                    setCurrentIndex(0);
                }
            }
        } catch (err) {
            console.error("Failed to fetch review questions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviewQuestions();
    }, []);

    const handleVote = async (isUpvote: boolean) => {
        if (voting || questions.length === 0) return;

        const currentQuestion = questions[currentIndex];
        setVoting(true);
        setVotedStatus(isUpvote ? "up" : "down");

        try {
            const res = await authFetch(`/community/questions/${currentQuestion.id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isUpvote }),
            });

            if (res.ok) {
                // Wait briefly for animation
                setTimeout(() => {
                    setVotedStatus(null);
                    setCurrentIndex((prev) => prev + 1);
                    setVoting(false);
                }, 500);
            } else {
                setVoting(false);
                setVotedStatus(null);
            }
        } catch {
            setVoting(false);
            setVotedStatus(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-3xl min-h-[300px]">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const isFinished = currentIndex >= questions.length;

    if (isFinished || questions.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5 rounded-3xl bg-white dark:bg-gray-900 shadow-sm">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">All Caught Up!</h4>
                <p className="text-sm">No new community questions pending review in your expert skills.</p>
            </div>
        );
    }

    const q = questions[currentIndex];

    return (
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-3xl shadow-xl p-6 md:p-8 space-y-6">
            {/* Index counter */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5 pb-3">
                <span className="font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-md border border-indigo-500/10">
                    {q.skill.name}
                </span>
                <span>
                    Question {currentIndex + 1} of {questions.length}
                </span>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                >
                    {/* Meta info */}
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                            Submitted by: <strong className="font-semibold text-gray-700 dark:text-gray-300">{q.author.name}</strong>
                        </span>
                        <span className="font-bold bg-gray-50 dark:bg-white/5 text-gray-500 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/5 uppercase">
                            {q.difficulty}
                        </span>
                    </div>

                    {/* Question text */}
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
                            {q.questionText}
                        </h3>
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((option, idx) => {
                            const isCorrect = option === q.correctAnswer;
                            return (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                                        isCorrect
                                            ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 font-medium"
                                            : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                    <span>
                                        <strong className="mr-1.5">{String.fromCharCode(65 + idx)})</strong> {option}
                                    </span>
                                    {isCorrect && (
                                        <span className="text-[10px] uppercase font-black bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                            Correct
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Explanation box */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                            <HelpCircle className="w-4 h-4 text-indigo-400" />
                            Explanation:
                        </span>
                        <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Voting buttons */}
            <div className="flex gap-4 border-t border-gray-100 dark:border-white/5 pt-6 justify-around">
                <button
                    onClick={() => handleVote(false)}
                    disabled={voting}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl border border-red-500/20 text-red-500 font-bold bg-red-500/5 hover:bg-red-500/10 transition grow justify-center text-sm ${
                        votedStatus === "down" ? "scale-95 opacity-50" : ""
                    }`}
                    title="Downvote Question"
                >
                    <ThumbsDown className="w-4 h-4" />
                    Reject Question
                </button>
                <button
                    onClick={() => handleVote(true)}
                    disabled={voting}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl border border-green-500/20 text-green-500 font-bold bg-green-500/5 hover:bg-green-500/10 transition grow justify-center text-sm ${
                        votedStatus === "up" ? "scale-95 opacity-50" : ""
                    }`}
                    title="Upvote Question"
                >
                    <ThumbsUp className="w-4 h-4" />
                    Approve Question
                </button>
            </div>
        </div>
    );
}
