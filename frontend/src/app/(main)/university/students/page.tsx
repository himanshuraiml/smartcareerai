// src/app/(main)/university/students/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Search, Loader2, Download, Filter, GraduationCap, Building, Star, ExternalLink, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import Link from 'next/link';

interface Student {
    id: string;
    userId: string;
    studentId: string;
    department: string;
    batch: string;
    gpa: number;
    aiScore: number;
    skills: string[];
    placementStatus: 'PLACED' | 'NOT_PLACED' | 'IN_PROCESS';
    company?: string;
    user: {
        name: string;
        email: string;
        avatar?: string;
    };
}

export default function UniversityStudentsPage() {
    const { user } = useAuthStore();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterDepartment, setFilterDepartment] = useState<string>('ALL');

    useEffect(() => {
        if (user) {
            loadStudents();
        }
    }, [user]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            // Simulated fetch for university students
            const res = await authFetch('/university/students');
            if (res.ok) {
                const data = await res.json();
                setStudents(data.data || []);
            } else {
                // Mock data
                setStudents([
                    {
                        id: '1', userId: 'u1', studentId: 'CS2024001', department: 'Computer Science', batch: '2024', gpa: 3.8, aiScore: 85,
                        skills: ['React', 'Node.js', 'Python'], placementStatus: 'PLACED', company: 'Google',
                        user: { name: 'Alice Smith', email: 'alice@institution.edu' }
                    },
                    {
                        id: '2', userId: 'u2', studentId: 'ME2024045', department: 'Mechanical', batch: '2024', gpa: 3.5, aiScore: 72,
                        skills: ['AutoCAD', 'SolidWorks'], placementStatus: 'IN_PROCESS',
                        user: { name: 'Bob Johnson', email: 'bob@institution.edu' }
                    },
                    {
                        id: '3', userId: 'u3', studentId: 'EE2024112', department: 'Electrical', batch: '2024', gpa: 3.9, aiScore: 91,
                        skills: ['Circuit Design', 'IoT', 'C++'], placementStatus: 'NOT_PLACED',
                        user: { name: 'Charlie Davis', email: 'charlie@institution.edu' }
                    },
                    {
                        id: '4', userId: 'u4', studentId: 'CS2024088', department: 'Computer Science', batch: '2024', gpa: 3.2, aiScore: 68,
                        skills: ['Java', 'SQL'], placementStatus: 'NOT_PLACED',
                        user: { name: 'Diana Evans', email: 'diana@institution.edu' }
                    },
                    {
                        id: '5', userId: 'u5', studentId: 'CS2024015', department: 'Computer Science', batch: '2024', gpa: 3.7, aiScore: 88,
                        skills: ['Python', 'Machine Learning', 'AWS'], placementStatus: 'PLACED', company: 'Amazon',
                        user: { name: 'Edward Brown', email: 'edward@institution.edu' }
                    },
                ]);
            }
        } catch (err) {
            console.error('Failed to fetch students', err);
        } finally {
            setLoading(false);
        }
    };

    const departments = Array.from(new Set(students.map(s => s.department)));

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || student.placementStatus === filterStatus;
        const matchesDept = filterDepartment === 'ALL' || student.department === filterDepartment;

        return matchesSearch && matchesStatus && matchesDept;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PLACED':
                return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30">Placed</span>;
            case 'IN_PROCESS':
                return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-500/30">Interviewing</span>;
            case 'NOT_PLACED':
                return <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold border border-gray-200 dark:border-gray-700">Seeking</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        Student Directory
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and monitor your institution's candidates.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition">
                        Import Students
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 rounded-2xl glass border border-gray-200 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                </div>

                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex items-center gap-2 min-w-max">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Status:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-violet-500 outline-none text-gray-700 dark:text-gray-300"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PLACED">Placed</option>
                            <option value="IN_PROCESS">Interviewing</option>
                            <option value="NOT_PLACED">Seeking</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 min-w-max">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Dept:</span>
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-violet-500 outline-none text-gray-700 dark:text-gray-300"
                        >
                            <option value="ALL">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Students List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-white/5">
                    <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No students found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or search query.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-800/30 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/5">
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Candidate</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score & GPA</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Skills</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {filteredStudents.map((student, idx) => (
                                    <motion.tr
                                        key={student.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                                                    {student.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{student.user.name}</div>
                                                    <div className="text-xs text-gray-500">{student.studentId} • Batch {student.batch}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{student.department}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                    <span className="font-bold text-gray-900 dark:text-white">{student.aiScore}</span>
                                                    <span className="text-xs text-gray-500 ml-1">AI Ready Score</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {student.gpa.toFixed(1)} / 4.0 GPA
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                                                {student.skills.slice(0, 3).map(skill => (
                                                    <span key={skill} className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {student.skills.length > 3 && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-800">
                                                        +{student.skills.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {getStatusBadge(student.placementStatus)}
                                                {student.company && (
                                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        <Building className="w-3 h-3" />
                                                        {student.company}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Link
                                                href={`/university/students/${student.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition"
                                            >
                                                View Profile <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-gray-900/30 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Showing {filteredStudents.length} of {students.length} students</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">Prev</button>
                            <button className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
