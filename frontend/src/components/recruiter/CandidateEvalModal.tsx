"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Brain, Loader2, CheckCircle2, AlertCircle, Star,
    TrendingUp, TrendingDown, BarChart3, Users, Target,
    Award, ThumbsUp, ThumbsDown, HelpCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface Evaluation {
    questionId: string;
    questionText: string;
    answer: string;
    score: number;
    feedback: string;
    keyPointsCovered: string[];
    improvementSuggestions: string[];
    evidenceSnippets?: string[];
    riskFlags?: string[];
}

interface DimensionScores {
    technical: number;
    communication: number;
    problemSolving: number;
    cultural: number;
}

interface InterviewResult {
    overallScore: number;
    evaluations: Evaluation[];
    recommendation: "STRONG_HIRE" | "HIRE" | "MAYBE" | "NO_HIRE";
    summaryFeedback: string;
    dimensionScores: DimensionScores;
    confidenceScore?: number;
    skillScoreBreakdown?: Record<string, number>;
}

interface Question {
    id: string;
    questionText: string;
    type: string;
    expectedKeyPoints: string[];
}

interface Props {
    jobId: string;
    applicationId: string;
    candidateName: string;
    onClose: () => void;
    onComplete: (result: InterviewResult) => void;
}

const RECOMMENDATION_STYLES: Record<string, { color: string; icon: typeof ThumbsUp; label: string }> = {
    STRONG_HIRE: { color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30", icon: Award, label: "Strong Hire" },
    HIRE: { color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30", icon: ThumbsUp, label: "Hire" },
    MAYBE: { color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30", icon: HelpCircle, label: "Maybe" },
    NO_HIRE: { color: "text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30", icon: ThumbsDown, label: "No Hire" },
};

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span className={color}>{score}/100</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                />
            </div>
        </div>
    );
}

export default function CandidateEvalModal({ jobId, applicationId, candidateName, onClose, onComplete }: Props) {
    const [step, setStep] = useState<"loading" | "answering" | "submitting" | "result" | "error">("loading");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQ, setCurrentQ] = useState(0);
    const [result, setResult] = useState<InterviewResult | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [expandedEval, setExpandedEval] = useState<string | null>(null);

    const loadQuestions = useCallback(async () => {
        try {
            const res = await authFetch(`/recruiter/jobs/${jobId}/ai-interview/config`);
            const data = await res.json();
            if (!res.ok || !data.data?.questions?.length) {
                setErrorMsg("No AI interview configured for this job. Generate a config first.");
                setStep("error");
                return;
            }
            setQuestions(data.data.questions);
            setStep("answering");
        } catch {
            setErrorMsg("Failed to load interview config.");
            setStep("error");
        }
    }, [jobId]);

    useEffect(() => { loadQuestions(); }, [loadQuestions]);

    const handleSubmit = async () => {
        setStep("submitting");
        try {
            const submissions = questions.map(q => ({
                questionId: q.id,
                answer: answers[q.id] || "",
            }));

            const res = await authFetch(`/recruiter/jobs/${jobId}/ai-interview/evaluate/${applicationId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissions }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Evaluation failed");

            setResult(data.data);
            setStep("result");
            onComplete(data.data);
        } catch (err: any) {
            setErrorMsg(err.message);
            setStep("error");
        }
    };

    const q = questions[currentQ];
    const allAnswered = questions.length > 0 && questions.every(q => (answers[q.id] || "").trim().length > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-sm rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Brain className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white">AI Interview Evaluation</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{candidateName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <AnimatePresence mode="wait">

                        {/* Loading */}
                        {step === "loading" && (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12 gap-3">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                <p className="text-sm text-gray-500 font-medium">Loading interview questions…</p>
                            </motion.div>
                        )}

                        {/* Answering */}
                        {step === "answering" && q && (
                            <motion.div key="answering" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                {/* Progress */}
                                <div className="flex items-center gap-2">
                                    {questions.map((qq, i) => (
                                        <button
                                            key={qq.id}
                                            onClick={() => setCurrentQ(i)}
                                            className={`h-1.5 flex-1 rounded-full transition-all ${i === currentQ ? "bg-indigo-500" : (answers[qq.id] || "").trim() ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"}`}
                                        />
                                    ))}
                                </div>

                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Question {currentQ + 1} of {questions.length} — <span className="text-indigo-500 normal-case">{q.type}</span>
                                </div>

                                <p className="text-base font-semibold text-gray-900 dark:text-white leading-relaxed">{q.questionText}</p>

                                {q.expectedKeyPoints.length > 0 && (
                                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5">Points to cover:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {q.expectedKeyPoints.map((pt, i) => (
                                                <span key={i} className="text-xs bg-white/60 dark:bg-white/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-500/30 font-medium">{pt}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <textarea
                                    value={answers[q.id] || ""}
                                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    placeholder="Enter candidate's answer here…"
                                    rows={5}
                                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-medium resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder-gray-400"
                                />

                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                                        disabled={currentQ === 0}
                                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 disabled:opacity-40 transition"
                                    >← Previous</button>

                                    {currentQ < questions.length - 1 ? (
                                        <button
                                            onClick={() => setCurrentQ(currentQ + 1)}
                                            className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
                                        >Next Question →</button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!allAnswered}
                                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                        >
                                            <Brain className="w-4 h-4" /> Evaluate with AI
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Submitting */}
                        {step === "submitting" && (
                            <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12 gap-4">
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                                    <div className="absolute inset-3 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                        <Brain className="w-5 h-5 text-indigo-500" />
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white">AI is evaluating answers…</p>
                                <p className="text-sm text-gray-500">This may take a few seconds</p>
                            </motion.div>
                        )}

                        {/* Result */}
                        {step === "result" && result && (
                            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                {/* Score Header */}
                                <div className="text-center py-4">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/30 mb-3">
                                        <span className="text-2xl font-black text-white">{result.overallScore}</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Overall Score</p>
                                    {(() => {
                                        const style = RECOMMENDATION_STYLES[result.recommendation];
                                        const Icon = style.icon;
                                        return (
                                            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-sm font-bold border ${style.color}`}>
                                                <Icon className="w-4 h-4" /> {style.label}
                                            </span>
                                        );
                                    })()}
                                    {result.confidenceScore && (
                                        <div className="mt-3 text-xs font-bold text-gray-400 dark:text-gray-500">
                                            AI Confidence: <span className="text-indigo-500">{result.confidenceScore}%</span>
                                        </div>
                                    )}
                                </div>

                                {/* Summary */}
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.summaryFeedback}</p>
                                </div>

                                {/* Dimension Scores */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Score Breakdown</p>
                                    <ScoreBar label="Technical" score={Math.round(result.dimensionScores.technical)} color="text-blue-500" />
                                    <ScoreBar label="Communication" score={Math.round(result.dimensionScores.communication)} color="text-indigo-500" />
                                    <ScoreBar label="Problem Solving" score={Math.round(result.dimensionScores.problemSolving)} color="text-purple-500" />
                                    <ScoreBar label="Cultural Fit" score={Math.round(result.dimensionScores.cultural)} color="text-emerald-500" />
                                </div>

                                {/* Skill Score Breakdown */}
                                {result.skillScoreBreakdown && Object.keys(result.skillScoreBreakdown).length > 0 && (
                                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 space-y-3">
                                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Skill Breakdown</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(result.skillScoreBreakdown).map(([skill, sScore]) => (
                                                <ScoreBar key={skill} label={skill} score={Math.round(sScore)} color="text-indigo-600" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Per-question results */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Per-Question Results</p>
                                    {result.evaluations.map((ev, i) => (
                                        <div key={ev.questionId} className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                            <button
                                                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                                                onClick={() => setExpandedEval(expandedEval === ev.questionId ? null : ev.questionId)}
                                            >
                                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${ev.score >= 70 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ev.score >= 50 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                                                    {ev.score}
                                                </span>
                                                <span className="flex-1 text-xs font-semibold text-gray-700 dark:text-gray-300 line-clamp-1">{ev.questionText}</span>
                                                {expandedEval === ev.questionId ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                                            </button>
                                            <AnimatePresence>
                                                {expandedEval === ev.questionId && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">{ev.feedback}</p>
                                                            {ev.keyPointsCovered.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {ev.keyPointsCovered.map((pt, pi) => (
                                                                        <span key={pi} className="text-xs px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-100 dark:border-emerald-500/20">✓ {pt}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {ev.improvementSuggestions.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {ev.improvementSuggestions.map((s, si) => (
                                                                        <span key={si} className="text-xs px-1.5 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded border border-rose-100 dark:border-rose-500/20">↑ {s}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {ev.evidenceSnippets && ev.evidenceSnippets.length > 0 && (
                                                                <div className="mt-2 p-2 bg-gray-50 dark:bg-white/[0.02] rounded-lg border border-gray-100 dark:border-gray-800">
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Evidence from Transcript</p>
                                                                    <ul className="space-y-1">
                                                                        {ev.evidenceSnippets.map((snip, sni) => (
                                                                            <li key={sni} className="text-xs text-gray-600 dark:text-gray-400 italic">"{snip}"</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {ev.riskFlags && ev.riskFlags.length > 0 && (
                                                                <div className="mt-2 p-2 bg-rose-50/50 dark:bg-rose-500/10 rounded-lg border border-rose-100 dark:border-rose-500/20">
                                                                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Risk Flags</p>
                                                                    <ul className="space-y-1">
                                                                        {ev.riskFlags.map((flag, fi) => (
                                                                            <li key={fi} className="text-xs text-rose-600 dark:text-rose-400 font-medium">• {flag}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all">
                                    Done
                                </button>
                            </motion.div>
                        )}

                        {/* Error */}
                        {step === "error" && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10 gap-3 text-center">
                                <AlertCircle className="w-10 h-10 text-rose-400" />
                                <p className="font-bold text-gray-900 dark:text-white">Something went wrong</p>
                                <p className="text-sm text-gray-500">{errorMsg}</p>
                                <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition">Close</button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
