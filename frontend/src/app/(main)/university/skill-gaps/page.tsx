"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Activity, ArrowRight, Brain, Briefcase,
    ExternalLink, Map, Sparkles, Target, Zap
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

export default function SkillGapPage() {
    const [heatmap, setHeatmap] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSkillGaps();
    }, []);

    const fetchSkillGaps = async () => {
        try {
            const res = await authFetch("/university/analytics/skill-gap");
            if (res.ok) {
                const json = await res.json();
                setHeatmap(json.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch heatmap", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
    );

    return (
        <div className="space-y-12 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                        Skill Matrix Explorer
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">AI-powered skill gap analysis. Identifying student readiness for their target career paths.</p>
                </div>
            </div>

            {heatmap.length === 0 && (
                <div className="glass border border-gray-200 dark:border-white/10 p-12 rounded-[40px] text-center">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-black text-gray-900 dark:text-white">Mapping Your Talent Landscape</h3>
                    <p className="text-sm text-gray-500 mt-2">Students need to set their target job roles and complete skills for mapping. Please wait or encourage students.</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-12">
                {heatmap.map((role, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="glass border border-gray-200 dark:border-white/10 overflow-hidden rounded-[40px] shadow-2xl shadow-violet-500/5"
                    >
                        <div className="p-10 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <Target className="w-6 h-6 text-violet-500" />
                                    Target Role: {role.targetRole}
                                </h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full">
                                        {role.studentCount} STUDENTS TRACKING
                                    </span>
                                </div>
                            </div>
                            <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-violet-500/25">
                                <Sparkles className="w-4 h-4" />
                                Generate Training Plan
                            </button>
                        </div>

                        <div className="p-10">
                            <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase mb-8">Skill Readiness Map</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {role.skillGaps.map((skill: any, sIdx: number) => (
                                    <div key={sIdx} className="relative group">
                                        <div className={`absolute -inset-0.5 rounded-[32px] blur opacity-25 group-hover:opacity-100 transition duration-500 ${skill.gapLevel === 'LOW' ? 'bg-emerald-500' :
                                            skill.gapLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}></div>
                                        <div className="relative glass border border-gray-200 dark:border-white/10 p-6 rounded-[32px] bg-white dark:bg-black/40 h-full flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{skill.skill}</p>
                                                    <div className={`p-1.5 rounded-lg ${skill.gapLevel === 'LOW' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' :
                                                        skill.gapLevel === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' :
                                                            'bg-rose-100 dark:bg-rose-900/20 text-rose-600'
                                                        }`}>
                                                        <Activity className="w-4 h-4" />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-2">
                                                            <span>Global Coverage</span>
                                                            <span className="text-gray-900 dark:text-white">{skill.acquiredPercentage}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${skill.acquiredPercentage}%` }}
                                                                className={`h-full rounded-full ${skill.gapLevel === 'LOW' ? 'bg-emerald-500' :
                                                                    skill.gapLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'
                                                                    }`}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-white/[0.03] p-3 rounded-2xl">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Avg Mastery</span>
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4].map(star => (
                                                                <div
                                                                    key={star}
                                                                    className={`w-3 h-1.5 rounded-full ${star <= Math.round(skill.averageProficiency)
                                                                        ? 'bg-violet-500'
                                                                        : 'bg-gray-200 dark:bg-white/10'
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 transition-colors flex items-center justify-center gap-2">
                                                    Assign Training
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* AI Recommendations */}
                            <div className="mt-12 p-8 bg-violet-600/5 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/20 rounded-[32px] flex flex-col md:flex-row gap-8 items-center">
                                <div className="p-4 bg-violet-600 rounded-3xl shrink-0">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-lg font-black text-violet-900 dark:text-violet-400">Strategic Intervention Required</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                        For the **{role.targetRole}** path, critical gaps detected in specialized domains.
                                        Suggested intervention: **Intensive Bootcamps** and **External Certifications** for core skills below 40% coverage.
                                    </p>
                                </div>
                                <button className="shrink-0 text-violet-600 dark:text-violet-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                                    View Full Blueprint
                                    <ArrowRight className="w-4 h-4 cursor-pointer" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Platform Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px] relative overflow-hidden">
                    <Map className="absolute -right-4 -bottom-4 w-32 h-32 text-violet-500/10 -rotate-12" />
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Curriculum Alignment Map</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Cross-referencing campus syllabus with real-world JDs reveals an 18% misalignment in Tech Stack relevance for Year 4 students.</p>
                        <button className="mt-6 flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider group">
                            Sync with LinkedIn Trends
                            <ExternalLink className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="glass border border-gray-200 dark:border-white/10 p-8 rounded-[40px] relative overflow-hidden bg-black dark:bg-white/[0.02]">
                    <Brain className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-500/10 rotate-12" />
                    <div className="relative z-10 text-white dark:text-white">
                        <h3 className="text-xl font-black">Next-Gen Talent Prediction</h3>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">AI predicts a potential 12% increase in Cloud Engineering placements if AWS Certification is introduced this semester.</p>
                        <button className="mt-6 flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                            Run Simulations
                            <Activity className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
