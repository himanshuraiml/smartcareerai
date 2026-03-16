"use client";

import { useState, useEffect } from "react";
import { X, FileText, Download, Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { authFetch } from "@/lib/auth-fetch";

interface Props {
    applicationId: string;
    candidateName: string;
    jobTitle: string;
    onClose: () => void;
}

const CURRENCIES = ["INR", "USD", "GBP", "EUR", "AED", "SGD"];

export default function OfferLetterModal({ applicationId, candidateName, jobTitle, onClose }: Props) {
    const [roleTitle, setRoleTitle] = useState(jobTitle);
    const [salaryAmount, setSalaryAmount] = useState("");
    const [salaryCurrency, setSalaryCurrency] = useState("INR");
    const [startDate, setStartDate] = useState("");
    const [benefits, setBenefits] = useState("Health insurance, Paid time off, Professional development budget");
    const [customClauses, setCustomClauses] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [existingUrl, setExistingUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generated, setGenerated] = useState(false);

    // Minimum start date: tomorrow
    const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    useEffect(() => {
        // Check if offer letter already exists
        (async () => {
            try {
                const res = await authFetch(`/recruiter/applications/${applicationId}/offer-letter`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data?.url) setExistingUrl(data.data.url);
                }
            } catch { /* silent */ }
            finally { setChecking(false); }
        })();
    }, [applicationId]);

    const handleGenerate = async () => {
        if (!salaryAmount || !startDate) {
            setError("Salary amount and start date are required.");
            return;
        }
        const salary = parseFloat(salaryAmount);
        if (isNaN(salary) || salary <= 0) {
            setError("Please enter a valid salary amount.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const body: any = {
                roleTitle,
                salaryAmount: salary,
                salaryCurrency,
                startDate,
            };
            if (benefits.trim()) {
                body.benefits = benefits.split(",").map(b => b.trim()).filter(Boolean);
            }
            if (customClauses.trim()) {
                body.customClauses = customClauses.trim();
            }

            const res = await authFetch(`/recruiter/applications/${applicationId}/offer-letter`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || "Failed to generate offer letter");
            }
            const data = await res.json();
            const url = data.data?.url;
            if (url) {
                setExistingUrl(url);
                window.open(url, "_blank");
            }
            setGenerated(true);
        } catch (err: any) {
            setError(err.message || "Failed to generate offer letter");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const res = await authFetch(`/recruiter/applications/${applicationId}/offer-letter`);
            if (!res.ok) throw new Error("Failed to get download link");
            const data = await res.json();
            if (data.data?.url) window.open(data.data.url, "_blank");
        } catch {
            setError("Could not retrieve download link. Please regenerate.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Offer Letter</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{candidateName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    {checking ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <>
                            {/* Existing offer banner */}
                            {existingUrl && (
                                <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                        <Check className="w-4 h-4" />
                                        Offer letter already generated
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDownload}
                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                                        >
                                            <Download className="w-3 h-3" /> Download
                                        </button>
                                        <button
                                            onClick={() => setExistingUrl(null)}
                                            title="Regenerate"
                                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            {(!existingUrl || existingUrl === null) && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Role Title</label>
                                        <input
                                            type="text"
                                            value={roleTitle}
                                            onChange={e => setRoleTitle(e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Salary Amount</label>
                                            <input
                                                type="number"
                                                value={salaryAmount}
                                                onChange={e => setSalaryAmount(e.target.value)}
                                                placeholder="e.g. 1200000"
                                                min="0"
                                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Currency</label>
                                            <select
                                                value={salaryCurrency}
                                                onChange={e => setSalaryCurrency(e.target.value)}
                                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            min={minDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                                            Benefits <span className="font-normal normal-case text-gray-400">(comma-separated)</span>
                                        </label>
                                        <textarea
                                            value={benefits}
                                            onChange={e => setBenefits(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                                            Custom Clauses <span className="font-normal normal-case text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            value={customClauses}
                                            onChange={e => setCustomClauses(e.target.value)}
                                            rows={3}
                                            placeholder="e.g. Signing bonus of ₹50,000 upon joining..."
                                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-sm text-rose-600 dark:text-rose-400">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!checking && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-3 flex-shrink-0">
                        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                            Cancel
                        </button>
                        {!existingUrl && (
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !salaryAmount || !startDate}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : generated ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                {generated ? "Generated!" : loading ? "Generating..." : "Generate & Download"}
                            </button>
                        )}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
