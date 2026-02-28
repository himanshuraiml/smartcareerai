"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    User,
    Award,
    ExternalLink,
    FileText,
    Target,
    BookOpen,
    X,
    SlidersHorizontal,
    Upload,
    CheckCircle,
    AlertCircle,
    Download,
    Users
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface Student {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    targetJobRole?: { id: string; title: string };
    interviewScore: number | null;
    atsScore: number | null;
    skillScore: number | null;
    combinedScore: number | null;
    interviewCount: number;
    testCount: number;
    badgeCount: number;
    lastActive: string;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface JobRole {
    id: string;
    title: string;
}

type ScoreType = "all" | "ats" | "skill" | "interview";
type SortBy = "name" | "score" | "atsScore" | "skillScore" | "interviewScore" | "lastActive";

interface ImportResult {
    email: string;
    name: string;
    status: "success" | "error";
    message: string;
}

function BulkImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState<ImportResult[] | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);

    const downloadTemplate = () => {
        const csv = "Name,Email\nJane Smith,jane@example.com\nJohn Doe,john@example.com";
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "student_import_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const parseCSV = (text: string): { name: string; email: string }[] => {
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const nameIdx = headers.indexOf("name");
        const emailIdx = headers.indexOf("email");
        if (nameIdx === -1 || emailIdx === -1) throw new Error("CSV must have 'Name' and 'Email' columns.");
        return lines.slice(1).map((line) => {
            const cols = line.split(",").map((c) => c.trim());
            return { name: cols[nameIdx] || "", email: cols[emailIdx] || "" };
        }).filter((r) => r.email);
    };

    const handleImport = async () => {
        if (!file) return;
        setParseError(null);
        setImporting(true);
        try {
            const text = await file.text();
            const rows = parseCSV(text);
            if (rows.length === 0) { setParseError("No valid rows found in CSV."); setImporting(false); return; }
            const res = await authFetch("/admin/institution/students/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ students: rows }),
            });
            const data = await res.json();
            setResults(data.results || []);
            onSuccess();
        } catch (err: any) {
            setParseError(err.message || "Failed to import students.");
        } finally {
            setImporting(false);
        }
    };

    const successCount = results?.filter((r) => r.status === "success").length ?? 0;
    const errorCount = results?.filter((r) => r.status === "error").length ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
                className="bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl w-full max-w-lg overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Bulk Import Students</h2>
                            <p className="text-sm font-medium text-gray-500 mt-0.5">Add multiple students via CSV</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Template download */}
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">1. Download and fill out the template</p>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                        >
                            <Download className="w-4 h-4" /> Template.csv
                        </button>
                    </div>

                    {/* File picker */}
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">2. Upload filled CSV file</p>
                        <div
                            onClick={() => fileRef.current?.click()}
                            className={`flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${file
                                ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5"
                                : "border-gray-200 dark:border-gray-800 hover:border-emerald-500/30 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                                }`}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(e) => { setFile(e.target.files?.[0] || null); setResults(null); setParseError(null); }}
                            />
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${file ? "bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20" : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"}`}>
                                <Upload className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                {file ? (
                                    <>
                                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{file.name}</p>
                                        <p className="text-sm text-emerald-500/80 mt-1">Ready to import</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-base font-medium text-gray-900 dark:text-white">Click or drag file to upload</p>
                                        <p className="text-sm font-medium text-gray-500 mt-1">CSV format only</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {parseError && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-sm font-medium">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {parseError}
                        </div>
                    )}

                    {/* Results */}
                    {results && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-900 dark:text-white">Import Results</span>
                                <div className="flex gap-3">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">+{successCount} matched</span>
                                    {errorCount > 0 && <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-lg">{errorCount} failed</span>}
                                </div>
                            </div>
                            <div className="max-h-52 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {results.map((r, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm border ${r.status === "success" ? "bg-emerald-50/50 border-emerald-100 text-emerald-700 dark:bg-white/[0.02] dark:border-emerald-500/20 dark:text-emerald-400" : "bg-red-50/50 border-red-100 text-red-700 dark:bg-white/[0.02] dark:border-red-500/20 dark:text-red-400"
                                        }`}>
                                        {r.status === "success"
                                            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate text-gray-900 dark:text-white">{r.name || r.email}</p>
                                            <p className="text-xs font-medium opacity-80 truncate mt-0.5">{r.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            {results ? "Close" : "Cancel"}
                        </button>
                        {!results && (
                            <button
                                onClick={handleImport}
                                disabled={!file || importing}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                                {importing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Import Students
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function InstitutionStudentsPage() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();

    const [students, setStudents] = useState<Student[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBulkImport, setShowBulkImport] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [scoreType, setScoreType] = useState<ScoreType>("all");
    const [minAtsScore, setMinAtsScore] = useState("");
    const [minSkillScore, setMinSkillScore] = useState("");
    const [minInterviewScore, setMinInterviewScore] = useState("");
    const [minCombinedScore, setMinCombinedScore] = useState("");
    const [sortBy, setSortBy] = useState<SortBy>("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [showFilters, setShowFilters] = useState(false);

    // Job roles for filter dropdown
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);

    useEffect(() => {
        const urlSortBy = searchParams.get("sortBy");
        const urlSortOrder = searchParams.get("sortOrder");
        if (urlSortBy) setSortBy(urlSortBy as SortBy);
        if (urlSortOrder) setSortOrder(urlSortOrder as "asc" | "desc");
    }, [searchParams]);

    useEffect(() => {
        const fetchJobRoles = async () => {
            try {
                const response = await authFetch(`/job-roles`);
                if (response.ok) {
                    const data = await response.json();
                    setJobRoles(data.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch job roles:", err);
            }
        };

        if (user) {
            fetchJobRoles();
        }
    }, [user]);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search) params.append("search", search);
                if (selectedRole) params.append("targetJobRoleId", selectedRole);
                if (scoreType !== "all") params.append("scoreType", scoreType);
                if (minAtsScore) params.append("minAtsScore", minAtsScore);
                if (minSkillScore) params.append("minSkillScore", minSkillScore);
                if (minInterviewScore) params.append("minInterviewScore", minInterviewScore);
                if (minCombinedScore) params.append("minScore", minCombinedScore);
                params.append("sortBy", sortBy);
                params.append("sortOrder", sortOrder);
                params.append("page", String(pagination.page));
                params.append("limit", String(pagination.limit));

                const response = await authFetch(`/admin/institution/students?${params}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch students");
                }

                const result = await response.json();
                setStudents(result.data || []);
                setPagination(result.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
            } catch (err) {
                console.error("Error fetching students:", err);
                setError("Failed to load students");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            const timer = setTimeout(() => {
                fetchStudents();
            }, 300); // Debounce search
            return () => clearTimeout(timer);
        }
    }, [user, search, selectedRole, scoreType, minAtsScore, minSkillScore, minInterviewScore, minCombinedScore, sortBy, sortOrder, pagination.page, pagination.limit]);

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedRole("");
        setScoreType("all");
        setMinAtsScore("");
        setMinSkillScore("");
        setMinInterviewScore("");
        setMinCombinedScore("");
        setSortBy("name");
        setSortOrder("asc");
    };

    const hasActiveFilters = search || selectedRole || scoreType !== "all" || minAtsScore || minSkillScore || minInterviewScore || minCombinedScore;

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-gray-400 dark:text-gray-500";
        if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
        if (score >= 60) return "text-amber-600 dark:text-amber-400";
        return "text-rose-600 dark:text-rose-400";
    };

    const getScoreBg = (score: number | null) => {
        if (score === null) return "bg-gray-50 dark:bg-gray-800/50";
        if (score >= 80) return "bg-emerald-50 dark:bg-emerald-500/10";
        if (score >= 60) return "bg-amber-50 dark:bg-amber-500/10";
        return "bg-rose-50 dark:bg-rose-500/10";
    };

    const ScoreBadge = ({ score, label, icon: Icon }: { score: number | null; label: string; icon: React.ElementType }) => (
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border focus:outline-none transition-colors ${score === null
                ? "border-transparent bg-gray-50 dark:bg-white/[0.02]"
                : score >= 80
                    ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10"
                    : score >= 60
                        ? "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10"
                        : "border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10"
            }`} title={label}>
            <Icon className={`w-4 h-4 ${getScoreColor(score)}`} />
            <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                {score !== null ? `${score}%` : "—"}
            </span>
        </div>
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Bulk Import Modal */}
            <AnimatePresence>
                {showBulkImport && (
                    <BulkImportModal
                        onClose={() => setShowBulkImport(false)}
                        onSuccess={() => {
                            setPagination((p) => ({ ...p, page: 1 }));
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">Students Directory</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-500" />
                        Manage, track, and support student success
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Find students by name or email"
                            className="pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full md:w-72 shadow-sm transition-all"
                        />
                    </div>

                    {/* Bulk Import Button */}
                    <button
                        onClick={() => setShowBulkImport(true)}
                        className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-sm hover:shadow-md"
                    >
                        <Upload className="w-4 h-4" />
                        Bulk Add
                    </button>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border transition-all shadow-sm ${showFilters || hasActiveFilters
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400"
                            : "bg-white dark:bg-[#111827] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] ml-1">
                                !
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-emerald-500" />
                                    Advanced Filtering
                                </h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm font-bold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Reset everything
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                                {/* Score Type Tabs (Repurposed as a select for space) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Score Type Focus</label>
                                    <select
                                        value={scoreType}
                                        onChange={(e) => setScoreType(e.target.value as ScoreType)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="all">All Scores</option>
                                        <option value="interview">Interview Score</option>
                                        <option value="ats">ATS Score</option>
                                        <option value="skill">Skill Score</option>
                                    </select>
                                </div>

                                {/* Target Role */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Role</label>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="">Any Role</option>
                                        {jobRoles.map((role) => (
                                            <option key={role.id} value={role.id}>{role.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Min Interview Score */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                                        Min Interview
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={minInterviewScore}
                                            onChange={(e) => setMinInterviewScore(e.target.value)}
                                            placeholder="Eg: 80"
                                            min="0"
                                            max="100"
                                            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                    </div>
                                </div>

                                {/* Min ATS Score */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                        Min ATS
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={minAtsScore}
                                            onChange={(e) => setMinAtsScore(e.target.value)}
                                            placeholder="Eg: 75"
                                            min="0"
                                            max="100"
                                            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                    </div>
                                </div>

                                {/* Sort By */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sort Criteria</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="name">Alphabetical (Name)</option>
                                        <option value="score">Combined Score</option>
                                        <option value="interviewScore">Interview Score</option>
                                        <option value="atsScore">ATS Score</option>
                                        <option value="skillScore">Skill Score</option>
                                        <option value="lastActive">Most Recently Active</option>
                                    </select>
                                </div>

                                {/* Sort Order */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sort Direction</label>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="asc">Ascending / Oldest / A-Z</option>
                                        <option value="desc">Descending / Newest / Z-A</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Students List Container */}
            <div className="bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col min-h-[500px]">

                {/* Table Header/Info Bar */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Directory</h3>
                    </div>
                    {!loading && !error && (
                        <div className="flex gap-2 items-center">
                            <span className="px-3 py-1 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold shadow-sm">
                                {pagination.total} <span className="text-gray-500 font-medium">total</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-[#111827]/50 backdrop-blur-sm z-10">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                            </div>
                            <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-wider animate-pulse">Scanning database...</p>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Connection Error</h3>
                            <p className="text-gray-500 text-center max-w-sm">{error}</p>
                            <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                                Retry Connection
                            </button>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center mb-4">
                                <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No matches found</h3>
                            <p className="text-gray-500 max-w-sm mb-6">We couldn&apos;t find any students matching your current filter criteria.</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white dark:bg-[#111827] border-b border-gray-100 dark:border-white/5">
                                        <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[250px] sticky left-0 bg-white dark:bg-[#111827] z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">
                                            Student Profile
                                        </th>
                                        <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[150px]">
                                            Goal Role
                                        </th>
                                        <th className="px-4 py-5 font-bold text-gray-500 text-center uppercase tracking-wider min-w-[120px]">
                                            <div className="flex flex-col items-center gap-1 text-[10px]">
                                                <Target className="w-4 h-4 text-emerald-500" />
                                                Interview
                                            </div>
                                        </th>
                                        <th className="px-4 py-5 font-bold text-gray-500 text-center uppercase tracking-wider min-w-[120px]">
                                            <div className="flex flex-col items-center gap-1 text-[10px]">
                                                <FileText className="w-4 h-4 text-emerald-500" />
                                                ATS
                                            </div>
                                        </th>
                                        <th className="px-4 py-5 font-bold text-gray-500 text-center uppercase tracking-wider min-w-[120px]">
                                            <div className="flex flex-col items-center gap-1 text-[10px]">
                                                <BookOpen className="w-4 h-4 text-emerald-500" />
                                                Skill
                                            </div>
                                        </th>
                                        <th className="px-4 py-5 font-bold text-gray-500 text-center uppercase tracking-wider min-w-[100px]">
                                            <div className="flex flex-col items-center gap-1 text-[10px]">
                                                <Award className="w-4 h-4 text-amber-500" />
                                                Badges
                                            </div>
                                        </th>
                                        <th className="px-6 py-5 text-xs font-bold text-gray-500 text-right uppercase tracking-wider w-[120px]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <motion.tbody
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="divide-y divide-gray-100 dark:divide-white/5"
                                >
                                    {students.map((student) => (
                                        <motion.tr
                                            variants={itemVariants}
                                            key={student.id}
                                            className="group hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-all bg-white dark:bg-[#111827]"
                                        >
                                            <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-gray-50/80 dark:bg-[#111827] dark:group-hover:bg-[#161f31] z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:border-emerald-500 transition-colors shadow-sm">
                                                        {student.avatarUrl ? (
                                                            <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-lg font-black text-emerald-600 dark:text-gray-300">
                                                                {student.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 pr-4">
                                                        <Link href={`/institution-admin/students/${student.id}`} className="font-bold text-base text-gray-900 dark:text-white truncate hover:underline hover:text-emerald-600 dark:hover:text-emerald-400">
                                                            {student.name || "Unnamed Student"}
                                                        </Link>
                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.targetJobRole ? (
                                                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                                                        {student.targetJobRole.title}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-medium text-gray-400 italic">Not specified</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 align-middle">
                                                <div className="flex justify-center group-hover:scale-105 transition-transform">
                                                    <ScoreBadge score={student.interviewScore} label="Interview" icon={Target} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-middle">
                                                <div className="flex justify-center group-hover:scale-105 transition-transform">
                                                    <ScoreBadge score={student.atsScore} label="ATS" icon={FileText} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-middle">
                                                <div className="flex justify-center group-hover:scale-105 transition-transform">
                                                    <ScoreBadge score={student.skillScore} label="Skill" icon={BookOpen} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-middle">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${student.badgeCount > 0 ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20" : "bg-gray-50 border-transparent dark:bg-white/[0.02]"}`}>
                                                        <Award className={`w-4 h-4 ${student.badgeCount > 0 ? "text-amber-500" : "text-gray-400"}`} />
                                                    </div>
                                                    <span className={`text-sm font-bold ${student.badgeCount > 0 ? "text-gray-900 dark:text-amber-400" : "text-gray-400"}`}>
                                                        {student.badgeCount}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle">
                                                <Link
                                                    href={`/institution-admin/students/${student.id}`}
                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-white/[0.02] dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all"
                                                    title="View Full Profile"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </motion.tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                {!loading && !error && students.length > 0 && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between mt-auto">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Showing <span className="text-gray-900 dark:text-white font-bold">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="text-gray-900 dark:text-white font-bold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                        </p>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-[#111827] p-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.page === 1}
                                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                            >
                                First
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-1.5 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="px-4 py-1.5 text-sm font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg">
                                Page {pagination.page} / {pagination.totalPages}
                            </div>

                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-1.5 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
