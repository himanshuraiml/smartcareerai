// src/app/(main)/university/students/page.tsx
"use client";

import { useState, useEffect } from 'react';
import {
    Search, Loader2, Download, Filter, GraduationCap,
    Star, ExternalLink, AlertTriangle, ShieldAlert,
    Brain, CheckCircle, User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';

interface Student {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    targetJobRole?: { title: string };
    studentProfile?: {
        branch: string;
        cgpa: number;
        graduationYear: number;
        backlogs: number;
        skills: string[];
    };
    interviewScore: number | null;
    atsScore: number | null;
    skillScore: number | null;
    combinedScore: number | null;
    readinessScore?: number | null;
    atRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    interviewCount: number;
    testCount: number;
    badgeCount: number;
    lastActive: string;
}

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function ImportStudentsModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    if (!isOpen) return null;

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const students = results.data.map((row: any) => ({
                        name: row.name || row.Name || '',
                        email: row.email || row.Email || '',
                        branch: row.branch || row.Branch || '',
                        cgpa: parseFloat(row.cgpa || row.CGPA || '0'),
                        graduationYear: parseInt(row.graduationYear || row.Year || '2024'),
                        backlogs: parseInt(row.backlogs || row.Backlogs || '0'),
                        skills: (row.skills || row.Skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
                    }));

                    const res = await authFetch('/university/students/bulk-import', {
                        method: 'POST',
                        body: JSON.stringify({ students }),
                    });

                    if (res.ok) {
                        toast.success('Students imported successfully');
                        onSuccess();
                        onClose();
                    } else {
                        const err = await res.json();
                        toast.error(err.message || 'Failed to import students');
                    }
                } catch (err) {
                    console.error(err);
                    toast.error('Failed to process CSV file');
                } finally {
                    setImporting(false);
                }
            },
            error: (err) => {
                console.error(err);
                toast.error('Failed to parse CSV file');
                setImporting(false);
            }
        });
    };

    const downloadSample = () => {
        const csvContent = "data:text/csv;charset=utf-8,name,email,branch,cgpa,graduationYear,backlogs,skills\nJohn Doe,john@example.com,Computer Science,8.5,2025,0,\"React, Node.js, Python\"";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-2xl"
            >
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Import Talent</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">Upload a CSV file with student details (Name, Email, Branch, CGPA, Year, Backlogs, Skills).</p>

                <div className="space-y-4">
                    <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-3">
                        <Download className="w-8 h-8 text-gray-300" />
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="text-xs text-gray-500"
                        />
                    </div>
                    <div className="flex justify-end px-1 -mt-2 mb-2">
                        <button onClick={downloadSample} className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                            <Download className="w-3 h-3" /> Download Sample Template
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!file || importing}
                            className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                            {importing ? 'Processing...' : 'Upload Data'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function UniversityStudentsPage() {
    const { user } = useAuthStore();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRisk, setFilterRisk] = useState<string>('ALL');
    const [filterBranch, setFilterBranch] = useState<string>('ALL');
    const [filterYear, setFilterYear] = useState<string>('ALL');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            loadStudents();
        }
    }, [user, filterRisk, filterBranch, filterYear]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (filterBranch !== 'ALL') params.append('branch', filterBranch);
            if (filterYear !== 'ALL') params.append('graduationYear', filterYear);
            if (filterRisk !== 'ALL') params.append('atRiskLevel', filterRisk);

            const res = await authFetch(`/university/students?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch students', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskBadge = (level?: string) => {
        switch (level) {
            case 'HIGH':
                return <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> High Risk</span>;
            case 'MEDIUM':
                return <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> Medium Risk</span>;
            case 'LOW':
                return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Secure</span>;
            default:
                return <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Analyzing...</span>;
        }
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-4 tracking-tight">
                        <div className="p-2.5 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/20">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        Student Directory
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Real-time talent monitoring and AI-driven placement readiness assessments.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95 shadow-lg shadow-black/5">
                        <Download className="w-4 h-4 text-violet-500" />
                        Export Data
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-105 transition active:scale-95"
                    >
                        Bulk Import Student
                    </button>
                </div>
            </div>

            <ImportStudentsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={loadStudents}
            />

            {/* AI Insights Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "High Risk Talents", count: students.filter(s => s.atRiskLevel === 'HIGH').length, icon: AlertTriangle, color: "text-rose-500" },
                    { label: "Medium Risk", count: students.filter(s => s.atRiskLevel === 'MEDIUM').length, icon: ShieldAlert, color: "text-amber-500" },
                    { label: "Placement Ready", count: students.filter(s => s.readinessScore && s.readinessScore > 80).length, icon: CheckCircle, color: "text-emerald-500" },
                    { label: "Avg Readiness", count: `${Math.round(students.reduce((acc, curr) => acc + (curr.readinessScore || 0), 0) / (students.length || 1))}%`, icon: Brain, color: "text-violet-500" }
                ].map((stat, i) => (
                    <div key={i} className="glass p-6 rounded-[32px] border border-gray-200 dark:border-white/5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.count}</p>
                        </div>
                        <stat.icon className={`w-10 h-10 ${stat.color} opacity-20`} />
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="p-4 rounded-[32px] glass border border-gray-200 dark:border-white/5 flex flex-col md:flex-row gap-6 items-center">
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search talent name, ID, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-6 py-4 rounded-2xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-bold focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-4 w-full md:w-auto overflow-x-auto">
                    <div className="flex bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 p-1.5 rounded-2xl gap-1">
                        {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
                            <button
                                key={level}
                                onClick={() => setFilterRisk(level)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterRisk === level ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            >
                                {level} Risk
                            </button>
                        ))}
                    </div>

                    <select
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                        className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest rounded-2xl px-6 py-4 focus:ring-2 focus:ring-violet-500 outline-none text-gray-700 dark:text-gray-300"
                    >
                        <option value="ALL">All Departments</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Civil">Civil</option>
                    </select>

                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest rounded-2xl px-6 py-4 focus:ring-2 focus:ring-violet-500 outline-none text-gray-700 dark:text-gray-300"
                    >
                        <option value="ALL">Batch Year</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>

            {/* Students List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Syncing Talent Cloud...</p>
                </div>
            ) : students.length === 0 ? (
                <div className="text-center py-32 glass rounded-[40px] border border-gray-200 dark:border-white/5">
                    <User className="w-20 h-20 text-gray-200 dark:text-white/5 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Zero Talent Matched</h3>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Try broadening your AI risk parameters or filters.</p>
                </div>
            ) : (
                <div className="rounded-[40px] border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Talent Identity</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Department</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Readiness Score</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Risk Assessment</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Engagement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {students.map((student, idx) => (
                                    <motion.tr
                                        key={student.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-black shadow-lg shadow-violet-500/20">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 dark:text-white tracking-tight">{student.name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">{student.studentProfile?.branch || 'General'}</span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">Class of {student.studentProfile?.graduationYear || '2024'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between gap-10">
                                                    <span className="text-xl font-black text-gray-900 dark:text-white">{student.readinessScore || 0}%</span>
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">AI Verified</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${(student.readinessScore || 0) > 80 ? 'bg-emerald-500' :
                                                        (student.readinessScore || 0) > 40 ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`} style={{ width: `${student.readinessScore || 0}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {getRiskBadge(student.atRiskLevel)}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link
                                                href={`/university/students/${student.id}`}
                                                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-500 transition-all active:scale-95 group"
                                            >
                                                Intelligence Profile <ExternalLink className="w-3 h-3 group-hover:rotate-45 transition-transform" />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-8 py-6 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/40 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Talent Record Index {students.length}</span>
                        <div className="flex gap-4">
                            <button className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-black dark:hover:text-white transition-all disabled:opacity-20">Previous</button>
                            <button className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-black dark:hover:text-white transition-all disabled:opacity-20">Next Entry</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
