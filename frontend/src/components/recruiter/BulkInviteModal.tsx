"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, Users, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface BulkInviteModalProps {
    jobId: string;
    onClose: () => void;
    onSuccess: (results: any) => void;
}

export default function BulkInviteModal({ jobId, onClose, onSuccess }: BulkInviteModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<{ name: string; email: string }[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (selected.type !== "text/csv" && !selected.name.endsWith(".csv")) {
            setError("Please upload a valid CSV file.");
            setFile(null);
            setParsedData(null);
            return;
        }

        setFile(selected);
        setError(null);
        parseCSV(selected);
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            // Simple CSV parser
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
            if (lines.length < 2) {
                setError("The CSV file must contain a header row and at least one candidate.");
                return;
            }

            const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
            const nameIdx = headers.findIndex(h => h.includes("name"));
            const emailIdx = headers.findIndex(h => h.includes("email"));

            if (emailIdx === -1) {
                setError("Could not find an 'Email' column in the CSV.");
                return;
            }

            const candidates: { name: string; email: string }[] = [];
            for (let i = 1; i < lines.length; i++) {
                // Handle basic comma separation (ignoring quotes for simplicity of a basic feature)
                const row = lines[i].split(",").map(c => c.trim());
                const email = row[emailIdx];
                if (!email) continue;

                const name = nameIdx !== -1 ? row[nameIdx] : email.split("@")[0];
                candidates.push({ name, email });
            }

            if (candidates.length === 0) {
                setError("No valid candidates found in the CSV.");
                return;
            }

            setParsedData(candidates);
        };
        reader.onerror = () => {
            setError("Failed to read the file.");
        };
        reader.readAsText(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async () => {
        if (!parsedData || parsedData.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const res = await authFetch(`/recruiter/jobs/${jobId}/bulk-invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ candidates: parsedData })
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.message || "Failed to bulk invite candidates.");
            }

            onSuccess(json.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bulk Invite Candidates</h2>
                            <p className="text-xs font-medium text-gray-500">Upload a CSV to invite multiple candidates</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:bg-gray-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex gap-3 text-sm text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {!file ? (
                        <div
                            onClick={handleUploadClick}
                            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition group"
                        >
                            <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Upload CSV File</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">
                                Ensure your CSV contains at least an{" "}
                                <span className="font-bold text-gray-700 dark:text-gray-300">Email</span> column, and optionally a{" "}
                                <span className="font-bold text-gray-700 dark:text-gray-300">Name</span> column.
                            </p>
                            <span className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition">
                                Browse Files
                            </span>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                    onClick={() => { setFile(null); setParsedData(null); }}
                                    className="p-2 text-gray-400 hover:text-rose-500 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {parsedData && (
                                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle className="w-5 h-5 text-indigo-500" />
                                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Valid Candidates Found: <span className="text-indigo-600 dark:text-indigo-400">{parsedData.length}</span></h4>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {parsedData.slice(0, 5).map((c, i) => (
                                            <div key={i} className="flex flex-col text-xs">
                                                <span className="font-bold text-gray-900 dark:text-white truncate">{c.name}</span>
                                                <span className="text-gray-500 truncate">{c.email}</span>
                                            </div>
                                        ))}
                                        {parsedData.length > 5 && (
                                            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 pt-2 text-center">
                                                + {parsedData.length - 5} more...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !parsedData}
                                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UploadCloud className="w-4 h-4" />
                                        Process Invites
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
