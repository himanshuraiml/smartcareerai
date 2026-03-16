"use client";

import { useState } from "react";
import { X, Send, Users, CheckCircle, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/lib/auth-fetch";

interface Applicant {
    applicationId: string;
    candidateId: string;
    name: string;
    email: string;
    status: string;
}

interface Props {
    jobTitle: string;
    applicants: Applicant[];
    onClose: () => void;
    onSuccess: (sent: number) => void;
}

const STAGE_OPTIONS = [
    { value: "all",          label: "All candidates" },
    { value: "APPLIED",      label: "Applied" },
    { value: "SCREENING",    label: "Screening" },
    { value: "INTERVIEWING", label: "Interviewing" },
    { value: "OFFER",        label: "Offer Extended" },
];

const MESSAGE_TEMPLATES = [
    { label: "Interview reminder",    text: "Hi {{name}}, we wanted to remind you about your upcoming interview. Please confirm your availability. Looking forward to speaking with you!" },
    { label: "Assessment nudge",      text: "Hi {{name}}, we noticed you haven't completed your assessment yet. Please complete it at your earliest convenience to move forward in our hiring process." },
    { label: "Status update",         text: "Hi {{name}}, we wanted to update you that your application is progressing well. We'll be in touch shortly with the next steps." },
    { label: "Document request",      text: "Hi {{name}}, could you please share your latest resume and any relevant portfolio links? This will help us complete your evaluation." },
];

export default function BulkMessageModal({ jobTitle, applicants, onClose, onSuccess }: Props) {
    const [stageFilter, setStageFilter] = useState("all");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const targets = stageFilter === "all"
        ? applicants
        : applicants.filter(a => a.status === stageFilter);

    const handleSend = async () => {
        if (!message.trim() || targets.length === 0) return;
        setSending(true);
        setError(null);
        let sent = 0;
        let failed = 0;

        for (const applicant of targets) {
            const personalizedMsg = message.replace(/\{\{name\}\}/g, applicant.name.split(" ")[0] ?? applicant.name);
            try {
                const res = await authFetch("/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        receiverId: applicant.candidateId,
                        content: personalizedMsg,
                    }),
                });
                if (res.ok) sent++;
                else failed++;
            } catch {
                failed++;
            }
        }

        setSending(false);
        setResult({ sent, failed });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900 dark:text-white">Broadcast Message</h2>
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[250px]">{jobTitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {result ? (
                        /* Success/Result view */
                        <div className="text-center py-6">
                            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${result.failed === 0 ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-amber-100 dark:bg-amber-500/10"}`}>
                                {result.failed === 0
                                    ? <CheckCircle className="w-8 h-8 text-emerald-500" />
                                    : <AlertCircle className="w-8 h-8 text-amber-500" />
                                }
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                                {result.failed === 0 ? "Messages Sent!" : "Partially Sent"}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{result.sent} sent</span>
                                {result.failed > 0 && <span className="text-rose-500 font-bold"> · {result.failed} failed</span>}
                            </p>
                            <div className="flex gap-3 justify-center mt-6">
                                <button
                                    onClick={() => { setResult(null); setMessage(""); }}
                                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    Send Another
                                </button>
                                <button
                                    onClick={() => { onSuccess(result.sent); onClose(); }}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Stage filter */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Send to</label>
                                <div className="flex flex-wrap gap-2">
                                    {STAGE_OPTIONS.map(opt => {
                                        const count = opt.value === "all" ? applicants.length : applicants.filter(a => a.status === opt.value).length;
                                        if (opt.value !== "all" && count === 0) return null;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => setStageFilter(opt.value)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${stageFilter === opt.value
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300"
                                                    }`}
                                            >
                                                {opt.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                                {targets.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Will send to {targets.length} candidate{targets.length !== 1 ? "s" : ""}
                                    </p>
                                )}
                            </div>

                            {/* Template picker */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Templates</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {MESSAGE_TEMPLATES.map(t => (
                                        <button
                                            key={t.label}
                                            onClick={() => setMessage(t.text)}
                                            className="text-left px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all"
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message textarea */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                                    Message <span className="normal-case font-normal text-gray-400">— use <code className="bg-gray-100 dark:bg-white/5 px-1 rounded">{"{{name}}"}</code> for personalisation</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={5}
                                    placeholder="Hi {{name}}, ..."
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 text-right">{message.length} chars</p>
                            </div>

                            {error && (
                                <p className="text-xs text-rose-500 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-xl">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !message.trim() || targets.length === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {sending ? "Sending..." : `Send to ${targets.length}`}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
