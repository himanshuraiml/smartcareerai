import { useState } from "react";
import { X, Brain, AlertCircle, Award, FileText, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { motion } from "framer-motion";

interface AISummaryModalProps {
    applicationId: string;
    candidateName: string;
    type: 'summary' | 'justification';
    onClose: () => void;
    onComplete: () => void;
}

export default function AISummaryModal({ applicationId, candidateName, type, onClose, onComplete }: AISummaryModalProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = type === 'summary'
                ? `/recruiter/applications/${applicationId}/ai-summary`
                : `/recruiter/applications/${applicationId}/ai-justification`;

            const res = await authFetch(endpoint, { method: "POST" });
            if (!res.ok) throw new Error(`Failed to generate ${type}`);

            const data = await res.json();
            setResult(data.data.generatedText);
            onComplete();
        } catch (err: any) {
            setError(err.message || "An error occurred");
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
                className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-white/5"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl flex items-center justify-center ${type === 'summary' ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            }`}>
                            {type === 'summary' ? <FileText className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                {type === 'summary' ? 'AI Candidate Summary' : 'AI Shortlist Justification'}
                            </h2>
                            <p className="text-sm font-medium flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                {candidateName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {!result && !loading && !error && (
                        <div className="text-center py-8">
                            <Brain className={`w-12 h-12 mx-auto mb-4 ${type === 'summary' ? 'text-violet-400' : 'text-blue-400'}`} />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Ready to generate {type === 'summary' ? 'a 5-line summary' : 'a shortlist justification'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                The AI will analyze the candidate's profile, interview transcripts, and performance to create a concise AI-generated {type}.
                            </p>
                            <button
                                onClick={handleGenerate}
                                className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 mx-auto ${type === 'summary' ? "bg-violet-600 hover:bg-violet-700 shadow-violet-500/25" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25"
                                    }`}
                            >
                                <Brain className="w-4 h-4" />
                                Generate {type === 'summary' ? 'Summary' : 'Justification'}
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative w-16 h-16 mb-4">
                                <div className={`absolute inset-0 rounded-full border-t-2 animate-spin ${type === 'summary' ? 'border-violet-500' : 'border-blue-500'}`} />
                                <div className="absolute inset-2 rounded-full border-r-2 border-indigo-500 animate-spin flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-indigo-500 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 animate-pulse">
                                Analyzing candidate data...
                            </p>
                            <p className="text-xs text-gray-400 mt-2">This may take a few seconds.</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                            <p className="text-gray-900 dark:text-white font-bold mb-2">Generation Failed</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">{error}</p>
                            <button
                                onClick={handleGenerate}
                                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                                {result}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-5 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    className={`flex-1 px-5 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${type === 'summary' ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                                        }`}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Regenerate
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
