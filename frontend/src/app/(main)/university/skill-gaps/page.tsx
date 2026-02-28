// src/app/(main)/university/skill-gaps/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Target, Search, BarChart2, Briefcase, Zap, TrendingUp, Filter, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

interface SkillGapData {
    department: string;
    skills: { name: string; required: number; actual: number }[];
    topMissingSkills: { name: string; count: number }[];
    marketDemand: { skill: string; demandTrend: 'up' | 'down' | 'flat'; jobs: number }[];
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

export default function SkillGapsPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SkillGapData | null>(null);
    const [selectedDept, setSelectedDept] = useState('All Departments');

    useEffect(() => {
        if (user) {
            loadSkillGaps();
        }
    }, [user, selectedDept]);

    const loadSkillGaps = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/university/analytics/skill-gaps?dept=${selectedDept}`);
            if (res.ok) {
                const resData = await res.json();
                setData(resData.data);
            } else {
                // Mock Data
                setData({
                    department: selectedDept,
                    skills: [
                        { name: 'System Design', required: 85, actual: 60 },
                        { name: 'Data Structures', required: 90, actual: 75 },
                        { name: 'Algorithms', required: 88, actual: 65 },
                        { name: 'Cloud Architecture', required: 75, actual: 40 },
                        { name: 'React/Frontend', required: 80, actual: 85 },
                        { name: 'Databases', required: 85, actual: 70 },
                    ],
                    topMissingSkills: [
                        { name: 'AWS/Cloud Providers', count: 145 },
                        { name: 'System Design Patterns', count: 120 },
                        { name: 'Redis/Caching', count: 95 },
                        { name: 'Docker/Kubernetes', count: 88 },
                        { name: 'Agile Methodologies', count: 65 }
                    ],
                    marketDemand: [
                        { skill: 'Cloud Architecture', demandTrend: 'up', jobs: 12500 },
                        { skill: 'System Design', demandTrend: 'up', jobs: 18200 },
                        { skill: 'React/Next.js', demandTrend: 'flat', jobs: 24000 },
                        { skill: 'Python/AI', demandTrend: 'up', jobs: 28500 },
                        { skill: 'Basic HTML/CSS', demandTrend: 'down', jobs: 4500 }
                    ]
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-r-2 border-fuchsia-500 animate-spin" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm animate-pulse">Analyzing skill gaps...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        Skill Gap Analysis
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Identify discrepancies between student readiness and market demand.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-500 transition">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={selectedDept}
                            onChange={e => setSelectedDept(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                        >
                            <option>All Departments</option>
                            <option>Computer Science</option>
                            <option>Data Science</option>
                            <option>Mechanical</option>
                            <option>Electrical</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart for Overall Readiness */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-800/30 flex flex-col"
                >
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-500" />
                            Core Competency Radar
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Actual student proficiency vs Market Requirement</p>
                    </div>

                    <div className="h-[350px] w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data?.skills}>
                                <PolarGrid stroke="#e5e7eb" className="dark:opacity-10" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                <Radar name="Market Requirement" dataKey="required" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} />
                                <Radar name="Student Actual" dataKey="actual" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(17, 24, 39, 0.9)' }}
                                    itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-violet-500 bg-violet-500/10" />
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Market Required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-amber-500 bg-amber-500/40" />
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Student Average</span>
                        </div>
                    </div>
                </motion.div>

                {/* Top Missing Skills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-800/30 flex flex-col"
                >
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            Critical Skill Deficits
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Skills most frequently missing from student resumes & tests</p>
                    </div>

                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <BarChart data={data?.topMissingSkills} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} width={120} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2 shadow-xl">
                                                    <p className="font-bold text-rose-500">{payload[0].value} students missing</p>
                                                </div>
                                            )
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                                    {data?.topMissingSkills.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="url(#colorDeficit)" />
                                    ))}
                                </Bar>
                                <defs>
                                    <linearGradient id="colorDeficit" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#FB923C" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Market Trends */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 p-6 rounded-2xl border border-gray-200 dark:border-white/5 bg-gradient-to-br from-indigo-900/5 to-purple-900/5 dark:from-indigo-500/5 dark:to-purple-500/5"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-500" />
                                Live Market Demand
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on global ATS parsing and active recruiter job posts</p>
                        </div>
                        <button className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm">
                            Curriculum Recommendations
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {data?.marketDemand.map((trend, i) => (
                            <div key={trend.skill} className="bg-white dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center group hover:border-indigo-500/30 transition-colors">
                                <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{trend.skill}</h4>
                                <div className="mt-auto flex flex-col items-center">
                                    <div className={`p-2 rounded-full mb-2 ${trend.demandTrend === 'up' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                        trend.demandTrend === 'down' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                        {trend.demandTrend === 'up' ? <TrendingUp className="w-5 h-5" /> :
                                            trend.demandTrend === 'down' ? <TrendingUp className="w-5 h-5 rotate-180" /> :
                                                <TrendingUp className="w-5 h-5 opacity-50" />}
                                    </div>
                                    <span className="text-lg font-black text-gray-900 dark:text-white">{(trend.jobs / 1000).toFixed(1)}k</span>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active Jobs</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
