"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle, Brain, CheckCircle, ChevronRight,
    PieChart, RefreshCw, Search, ShieldAlert,
    Sparkles, TrendingUp, User, Zap
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import {
    PieChart as RePieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function IntelligencePage() {
    const [stats, setStats] = useState<any>(null);
    const [riskyStudents, setRiskyStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        fetchIntelligenceData();
    }, []);

    const fetchIntelligenceData = async () => {
        try {
            const dashboardRes = await authFetch("/university/dashboard");
            if (dashboardRes.ok) {
                const json = await dashboardRes.json();
                setStats(json.data.placementIntelligence);
            }

            const riskRes = await authFetch("/university/ai/risk-assessments");
            if (riskRes.ok) {
                const json = await riskRes.json();
                setRiskyStudents(json.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch intelligence data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        setCalculating(true);
        // In a real app, this might trigger a background job for all students
        // For now, we'll just simulate/wait
        setTimeout(() => {
            setCalculating(false);
            fetchIntelligenceData();
        }, 3000);
    };

    const resolveAlert = async (alertId: string) => {
        try {
            const res = await authFetch(`/university/ai/resolve-alert/${alertId}`, {
                method: 'POST'
            });
            if (res.ok) {
                fetchIntelligenceData();
            }
        } catch (error) {
            console.error("Failed to resolve alert", error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-emerald-500 animate-spin" />
        </div>
    );

    const riskData = [
        { name: 'Low Risk', value: stats?.riskBreakdown?.LOW || 0, color: '#10b981' },
        { name: 'Medium Risk', value: stats?.riskBreakdown?.MEDIUM || 0, color: '#f59e0b' },
        { name: 'High Risk', value: stats?.riskBreakdown?.HIGH || 0, color: '#ef4444' }
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-violet-500/10">
                            <Brain className="w-5 h-5 text-violet-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">AI Placement Intelligence</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">Predictive analytics and risk assessment engine powered by PlaceNxt AI.</p>
                </div>
                <button
                    onClick={handleRecalculate}
                    disabled={calculating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
                    {calculating ? 'Processing...' : 'Sync AI Engine'}
                </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-20 h-20 text-violet-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Avg Readiness</p>
                    <h3 className="text-5xl font-black text-gray-900 dark:text-white">{stats?.averageReadiness}%</h3>
                    <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-xs">
                        <CheckCircle className="w-4 h-4" />
                        +4.2% from last month
                    </div>
                </div>

                <div className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <ShieldAlert className="w-20 h-20 text-amber-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Risky Profiles</p>
                    <h3 className="text-5xl font-black text-gray-900 dark:text-white">{stats?.totalRiskyStudents}</h3>
                    <div className="mt-4 flex items-center gap-2 text-amber-500 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        Requires Intervention
                    </div>
                </div>

                <div className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap className="w-20 h-20 text-rose-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Active AI Alerts</p>
                    <h3 className="text-5xl font-black text-gray-900 dark:text-white">{stats?.activeAlerts}</h3>
                    <div className="mt-4 flex items-center gap-2 text-rose-500 font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                        Urgent Attention
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Risk Distribution Chart */}
                <div className="glass border border-gray-200 dark:border-white/10 p-10 rounded-[40px]">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black flex items-center gap-3">
                            <PieChart className="w-6 h-6 text-violet-500" />
                            Risk Distribution
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={riskData}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '20px',
                                        border: 'none',
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                                        background: 'rgba(255,255,255,0.9)'
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Performance Breakdown */}
                <div className="glass border border-gray-200 dark:border-white/10 p-10 rounded-[40px] bg-black dark:bg-white/[0.02]">
                    <h3 className="text-xl font-black text-white dark:text-white flex items-center gap-3 mb-8">
                        <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400" />
                        Talent Index Benchmarks
                    </h3>
                    <div className="space-y-8">
                        {[
                            { label: "Technical Proficiency", value: 78, color: "bg-emerald-500" },
                            { label: "Behavioral Readiness", value: 64, color: "bg-amber-500" },
                            { label: "Communication Score", value: 45, color: "bg-rose-500" },
                            { label: "Mock Interview Success", value: 82, color: "bg-violet-500" }
                        ].map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                                    <span>{item.label}</span>
                                    <span className="text-white">{item.value}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        className={`h-full rounded-full ${item.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Risky Students List */}
            <div className="glass border border-gray-200 dark:border-white/10 rounded-[40px] overflow-hidden">
                <div className="p-10 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
                    <h3 className="text-xl font-black flex items-center gap-4">
                        <ShieldAlert className="w-6 h-6 text-rose-500" />
                        Critical Intervention List
                    </h3>
                    <div className="flex bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 p-2 rounded-2xl items-center gap-3 px-4">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search risky profiles..." className="bg-transparent border-none focus:outline-none text-xs font-bold w-48" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Student</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Branch</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Readiness</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Risk Factor</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {riskyStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center">
                                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                        <h4 className="font-black text-gray-900 dark:text-white">All Talent Secured</h4>
                                        <p className="text-sm text-gray-500 mt-2">No students currently in high-risk categories.</p>
                                    </td>
                                </tr>
                            ) : (
                                riskyStudents.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center font-black text-violet-600 overflow-hidden">
                                                    {student.user.avatarUrl ? (
                                                        <img
                                                            src={student.user.avatarUrl}
                                                            alt={student.user.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                                if (parent) parent.innerHTML = `<span>${student.user.name?.[0]}</span>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        student.user.name?.[0] || <User className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-white leading-tight">{student.user.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{student.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-[10px] font-black uppercase text-gray-500">{student.branch}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${student.atRiskLevel === 'HIGH' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                                                <span className="font-black text-gray-900 dark:text-white">{student.readinessScore}%</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="space-y-1">
                                                {student.alerts.map((alert: any, aIdx: number) => (
                                                    <div key={aIdx} className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg inline-block mr-2 uppercase">
                                                        {alert.type}
                                                    </div>
                                                ))}
                                                {student.alerts.length === 0 && <span className="text-[10px] text-gray-400">No formal alerts</span>}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {/* Navigate to profile */ }}
                                                    className="p-3 bg-gray-100 hover:bg-violet-600 hover:text-white dark:bg-white/5 dark:hover:bg-violet-500 rounded-xl transition-all"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => student.alerts[0] && resolveAlert(student.alerts[0].id)}
                                                    className="p-3 bg-gray-100 hover:bg-emerald-600 hover:text-white dark:bg-white/5 dark:hover:bg-emerald-500 rounded-xl transition-all"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Action Hub */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px] relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700">
                    <Sparkles className="absolute -right-4 -bottom-4 w-40 h-40 text-white/10 -rotate-12" />
                    <div className="relative z-10 text-white">
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Automated Interventions</h3>
                        <p className="text-sm text-white/70 mt-3 leading-relaxed font-medium">Auto-enroll high-risk students into "Placement Recovery Camp" starting next Monday.</p>
                        <button className="mt-8 bg-white text-violet-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/20">
                            Enable Auto-Pilot
                        </button>
                    </div>
                </div>

                <div className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px] relative overflow-hidden">
                    <AlertTriangle className="absolute -right-4 -bottom-4 w-40 h-40 text-amber-500/10 rotate-12" />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Compliance Monitor</h3>
                        <p className="text-sm text-gray-500 mt-3 leading-relaxed font-medium">12 students currently bypass placement policy restrictions for "Dream Company" applications due to inconsistent profile data.</p>
                        <button className="mt-8 border-2 border-gray-200 dark:border-white/10 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95">
                            Run Audit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
