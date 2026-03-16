// src/app/(main)/institution-admin/reports/page.tsx
"use client";

import { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    Calendar,
    CheckCircle2,
    Info,
    Briefcase,
    TrendingUp,
    Users,
    GraduationCap,
    Loader2,
    FileSpreadsheet,
    X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import { useToast } from "@/hooks/use-toast";

interface ReportHeader {
    title: string;
    description: string;
    icon: any;
    color: string;
}

const REPORT_TYPES: ReportHeader[] = [
    { title: 'NIRF Report', description: 'National Institutional Ranking Framework data requirements including placement and higher studies stats.', icon: GraduationCap, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'NAAC Report', description: 'National Assessment and Accreditation Council qualitative and quantitative data metrics.', icon: FileText, color: 'text-violet-500 bg-violet-500/10' },
    { title: 'NBA Report', description: 'National Board of Accreditation - focused on outcome-based education and branch-wise placement ratio.', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
];

export default function ReportsPage() {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [showComplianceModal, setShowComplianceModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (user) {
            loadStats();
        }
    }, [user, selectedYear]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const instId = user?.adminForInstitutionId || user?.institutionId;
            // Fetch yearly stats for preview
            const res = await authFetch(`/university/reports/${instId}/yearly-stats?year=${selectedYear}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else {
                setStats(null);
            }
        } catch (err) {
            console.error('Failed to load stats', err);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (type: string, format: 'pdf' | 'excel') => {
        try {
            const instId = user?.adminForInstitutionId || user?.institutionId;
            const res = await authFetch(`/university/reports/${instId}/export?year=${selectedYear}&format=${format}&type=${type}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_Report_${selectedYear}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-blue-500/10">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Compliance & Accreditation Reports</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">Generate and export official institutional reports for NIRF, NAAC, and NBA.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent text-sm font-bold px-4 py-2 outline-none text-gray-700 dark:text-gray-200"
                        >
                            {[2023, 2024, 2025, 2026].map(year => (
                                <option key={year} value={year}>{year} - {year + 1}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5 space-y-1">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Graduating Students</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{stats?.totalStudents || 0}</p>
                </div>
                <div className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5 space-y-1">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total Placed</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats?.totalPlaced || 0}</p>
                </div>
                <div className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5 space-y-1">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Placement Rate</p>
                    <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{stats?.placementRate || 0}%</p>
                </div>
                <div className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5 space-y-1">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Median Package</p>
                    <p className="text-3xl font-black text-teal-600 dark:text-teal-400">{stats?.medianSalary || 0} <span className="text-sm">LPA</span></p>
                </div>
            </div>

            {/* Report Generator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {REPORT_TYPES.map((report, idx) => (
                    <motion.div
                        key={report.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative p-8 rounded-3xl glass border border-gray-200 dark:border-white/5 hover:border-violet-500/30 transition-all duration-300"
                    >
                        <div className={`w-14 h-14 rounded-2xl ${report.color} flex items-center justify-center mb-6 ring-4 ring-transparent group-hover:ring-violet-500/5 transition-all`}>
                            <report.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{report.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            {report.description}
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleDownload(report.title.split(' ')[0], 'pdf')}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all shadow-lg shadow-violet-500/20 active:scale-[0.98]"
                            >
                                <Download className="w-4 h-4" /> Download PDF Report
                            </button>
                            <button
                                onClick={() => handleDownload(report.title.split(' ')[0], 'excel')}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-600/20 transition-all active:scale-[0.98]"
                            >
                                <FileSpreadsheet className="w-4 h-4" /> Export to Excel
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Table Preview */}
            <div className="p-8 rounded-3xl glass border border-gray-200 dark:border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Yearly Branch-wise Statistics</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Numerical breakdown as required for NBA and Criterion 5 documentation.</p>
                    </div>
                    <button
                        onClick={() => setShowComplianceModal(true)}
                        className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold hover:underline transition"
                    >
                        <Info className="w-4 h-4" /> View Compliance Checklist
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/5">
                                <th className="py-4 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Academic Program (Branch)</th>
                                <th className="py-4 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Graduated</th>
                                <th className="py-4 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Placed</th>
                                <th className="py-4 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Placement %</th>
                                <th className="py-4 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Avg Package</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                            {stats?.branchWise.map((item: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                    <td className="py-5 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-violet-500' : 'bg-fuchsia-500'}`} />
                                            <span className="text-gray-900 dark:text-gray-200 font-bold">{item.branch}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 text-center text-gray-600 dark:text-gray-400">{item.totalStudents}</td>
                                    <td className="py-5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{item.placedStudents}</td>
                                    <td className="py-5 px-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-black ${item.placementPercentage >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                            {item.placementPercentage}%
                                        </span>
                                    </td>
                                    <td className="py-5 px-4 text-right">
                                        <span className="font-bold text-gray-900 dark:text-white">₹ {item.averagePackage}</span>
                                        <span className="text-[10px] ml-1 text-gray-400 uppercase font-black">LPA</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Note */}
            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 flex gap-4 items-start">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                    <span className="font-black underline mr-1">Compliance Check:</span> All data follows standard MHRD definitions. Placed students include those who received an offer and have a minimum salary of 2.4 LPA (NIRF Threshold). Higher studies data requires manual verification from student departure surveys.
                </div>
            </div>

            {/* Compliance Checklist Modal */}
            {showComplianceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowComplianceModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Compliance Checklist</h3>
                                <p className="text-sm text-gray-500">Accreditation Data Requirements</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: "Placement Data Synchronization", desc: "All placement records matched with verifiable offers.", status: "completed" },
                                { label: "Salary Threshold (NIRF)", desc: "Only offers >= 2.4 LPA are counted in the final statistics.", status: "completed" },
                                { label: "Branch-wise Breakdown", desc: "Data available for all active academic programs.", status: "completed" },
                                { label: "Higher Studies Verification", desc: "Requires manual update from student departure surveys.", status: "pending" },
                                { label: "Diversity & Inclusion Data", desc: "Gender and category ratios calculated.", status: "completed" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                    <div className="mt-1">
                                        {item.status === 'completed' ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.label}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                            <button
                                onClick={() => setShowComplianceModal(false)}
                                className="px-6 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl transition"
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
