"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart, PieChart, TrendingUp, Users, Building2,
    ArrowUpRight, ArrowDownRight, Download, Calendar
} from "lucide-react";
import {
    BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, LineChart, Line,
    PieChart as RechartsPieChart, Pie, Cell
} from "recharts";
import { authFetch } from "@/lib/auth-fetch";

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await authFetch("/university/analytics/placement");
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-emerald-500 animate-spin" />
        </div>
    );

    if (!data) return <div>Failed to load analytics.</div>;

    const stats = [
        { label: "Total Students", value: data.totalStudents, icon: Users, color: "text-blue-500" },
        { label: "Students Placed", value: data.totalPlaced, icon: GraduationCap, color: "text-emerald-500" },
        { label: "Placement Rate", value: `${Math.round((data.totalPlaced / data.totalStudents) * 100 || 0)}%`, icon: TrendingUp, color: "text-violet-500" },
        { label: "Average Package", value: `${(data.salaryAggregates.average / 100000).toFixed(1)} LPA`, icon: ArrowUpRight, color: "text-pink-500" }
    ];

    function GraduationCap(props: any) {
        return <Users {...props} />; // Placeholder as GraduationCap might be missing in some versions
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-violet-500/10">
                            <BarChart className="w-5 h-5 text-violet-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Placement Intelligence</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">Deep insights into institutional hiring performance and trends.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <Download className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="glass border border-gray-200 dark:border-white/10 p-6 rounded-3xl"
                    >
                        <div className={`p-2 rounded-xl bg-gray-50 dark:bg-white/5 w-fit mb-4 ${s.color}`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{s.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Branch-wise Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px]"
                >
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                        <PieChart className="w-5 h-5 text-violet-500" />
                        Branch-wise Placement Rate
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={data.branchStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="branch" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="rate" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Monthly Trends */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px]"
                >
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                        <LineChart className="w-5 h-5 text-pink-500" />
                        Placement Progression
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={4} dot={{ r: 6, fill: '#ec4899' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Hiring Partners */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px] lg:col-span-2"
                >
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-blue-500" />
                            Our Top Hiring Partners
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {data.topCompanies.map((c: any, i: number) => (
                            <div key={i} className="p-6 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-center transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl mx-auto mb-4 flex items-center justify-center font-black text-xl text-violet-600">
                                    {c.name.charAt(0)}
                                </div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.name}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{c.count} Hires</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
