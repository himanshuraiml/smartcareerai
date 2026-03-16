"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type State = "loading" | "invalid" | "form" | "submitted";

interface SurveyMeta {
    candidateName: string;
    jobTitle: string;
    recruiterName: string;
}

const EASE_OPTIONS = [
    { value: "Very Difficult", label: "Very Difficult" },
    { value: "Difficult", label: "Difficult" },
    { value: "Neutral", label: "Neutral" },
    { value: "Easy", label: "Easy" },
    { value: "Very Easy", label: "Very Easy" },
];

function npsColor(score: number): string {
    if (score <= 6) return "bg-rose-500 text-white";
    if (score <= 8) return "bg-amber-400 text-white";
    return "bg-emerald-500 text-white";
}

function npsRingColor(score: number): string {
    if (score <= 6) return "ring-rose-400";
    if (score <= 8) return "ring-amber-400";
    return "ring-emerald-400";
}

export default function SurveyPage() {
    const { token } = useParams<{ token: string }>();
    const [state, setState] = useState<State>("loading");
    const [meta, setMeta] = useState<SurveyMeta | null>(null);
    const [invalidReason, setInvalidReason] = useState("");
    const [npsScore, setNpsScore] = useState<number | null>(null);
    const [ease, setEase] = useState("");
    const [feedback, setFeedback] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch(`/api/v1/public/surveys/${token}`);
                const data = await res.json();
                if (data.data?.valid) {
                    setMeta({
                        candidateName: data.data.candidateName,
                        jobTitle: data.data.jobTitle,
                        recruiterName: data.data.recruiterName,
                    });
                    setState("form");
                } else {
                    setInvalidReason(data.data?.reason || "This survey link is invalid or has expired.");
                    setState("invalid");
                }
            } catch {
                setInvalidReason("Could not load the survey. Please try again later.");
                setState("invalid");
            }
        })();
    }, [token]);

    const handleSubmit = async () => {
        if (npsScore === null) { setError("Please select a score."); return; }
        if (!ease) { setError("Please rate the interview process difficulty."); return; }
        setError(null);
        setSubmitting(true);
        try {
            const res = await fetch(`/api/v1/public/surveys/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ npsScore, ease, feedback }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || "Submission failed");
            }
            setState("submitted");
        } catch (err: any) {
            setError(err.message || "Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Brand */}
                <div className="text-center mb-8">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">PlaceNxt</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Candidate Experience Survey</p>
                </div>

                <AnimatePresence mode="wait">
                    {state === "loading" && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 p-10 flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-gray-500 font-medium">Loading your survey...</p>
                        </motion.div>
                    )}

                    {state === "invalid" && (
                        <motion.div key="invalid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 p-10 flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Survey Unavailable</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs">{invalidReason}</p>
                        </motion.div>
                    )}

                    {state === "form" && meta && (
                        <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                            {/* Card header */}
                            <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-white/5">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Hi {meta.candidateName}!
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Thank you for interviewing for <span className="font-semibold text-gray-700 dark:text-gray-300">{meta.jobTitle}</span>. We'd love your feedback — it takes under 2 minutes.
                                </p>
                            </div>

                            <div className="px-8 py-6 space-y-7">
                                {/* NPS Scale */}
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                                        How likely are you to recommend this company to a friend?
                                    </p>
                                    <p className="text-xs text-gray-400 mb-4">1 = Not at all likely &nbsp;·&nbsp; 10 = Extremely likely</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setNpsScore(n)}
                                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ring-2 ring-transparent ${
                                                    npsScore === n
                                                        ? `${npsColor(n)} ${npsRingColor(n)} scale-110`
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Ease */}
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-3">
                                        How easy was the interview process?
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {EASE_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setEase(opt.value)}
                                                className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                                                    ease === opt.value
                                                        ? "bg-indigo-600 text-white border-indigo-600"
                                                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-2">
                                        Any feedback for the hiring team? <span className="font-normal text-gray-400">(optional)</span>
                                    </p>
                                    <textarea
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        rows={3}
                                        placeholder="Share anything that would help us improve..."
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-sm text-rose-600 dark:text-rose-400">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || npsScore === null || !ease}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm transition-colors"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                                    {submitting ? "Submitting..." : "Submit Feedback"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {state === "submitted" && (
                        <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 p-10 flex flex-col items-center gap-5 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Thank You!</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                                    Your feedback helps us improve the hiring experience. Good luck with your application!
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-center text-xs text-gray-400 mt-6">Powered by PlaceNxt · Your responses are kept confidential</p>
            </div>
        </div>
    );
}
