import React from 'react';
import {
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip
} from 'recharts';
import {
    Check,
    AlertTriangle,
    Lightbulb,
    ArrowRight,
    Download,
    Share2,
    X,
    Cpu,
    Target,
    Layout,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';

interface AtsScore {
    id: string;
    overallScore: number;
    keywordMatchPercent: number;
    formattingScore: number;
    experienceScore?: number;
    educationScore?: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    formattingIssues?: string[];
    suggestions: string[];
    createdAt?: string;
}

interface ResumeAnalysisReportProps {
    data: AtsScore;
    fileName: string;
    onClose: () => void;
    onReanalyze?: () => void;
}

export default function ResumeAnalysisReport({ data, fileName, onClose, onReanalyze }: ResumeAnalysisReportProps) {
    const { theme } = useTheme();
    const isLightMode = theme === 'light';

    // Transform data for Radar Chart
    const radarData = [
        { subject: 'Keywords', A: data.keywordMatchPercent, fullMark: 100 },
        { subject: 'Skills', A: data.keywordMatchPercent, fullMark: 100 },
        { subject: 'Formatting', A: data.formattingScore, fullMark: 100 },
        { subject: 'Experience', A: data.experienceScore || 0, fullMark: 100 },
        { subject: 'Education', A: data.educationScore || 0, fullMark: 100 },
        { subject: 'Overall', A: data.overallScore, fullMark: 100 },
    ];

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-rose-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (score >= 60) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    };

    // Theme-based styles
    const backdropStyle = isLightMode
        ? { backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }
        : { backgroundColor: 'rgba(0, 0, 0, 0.8)' };

    const modalBgStyle = isLightMode
        ? { backgroundColor: '#ffffff' }
        : { backgroundColor: '#0F111A' };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={backdropStyle}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl"
                style={modalBgStyle}
            >
                {/* Header */}
                <div
                    className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/5"
                    style={modalBgStyle}
                >
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            <ArrowRight className="w-5 h-5 rotate-180" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                                RESUME ANALYSIS
                            </h2>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <FileText className="w-3 h-3" />
                                {fileName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {onReanalyze && (
                            <button
                                onClick={onReanalyze}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                            >
                                <Cpu className="w-4 h-4" />
                                Re-analyze
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6" style={modalBgStyle}>
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Overall Score Gauge */}
                        <div className="md:col-span-4 lg:col-span-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-6 border border-indigo-200 dark:border-indigo-500/20 relative overflow-hidden flex flex-col items-center justify-center">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Target className="w-24 h-24 text-indigo-500" />
                            </div>

                            <div className="relative w-48 h-48 flex items-center justify-center">
                                {/* SVG Gauge */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="50%" cy="50%" r="45%"
                                        className="text-gray-200 dark:text-gray-800 stroke-current"
                                        strokeWidth="8"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="50%" cy="50%" r="45%"
                                        className={`${getScoreColor(data.overallScore)} stroke-current transition-all duration-1000 ease-out`}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        fill="transparent"
                                        strokeDasharray={283} // 2 * pi * 45
                                        strokeDashoffset={283 - (283 * data.overallScore) / 100}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-900 dark:text-white">
                                    <span className={`text-6xl font-bold ${getScoreColor(data.overallScore)}`}>{data.overallScore}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Score</span>
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Keyword Match */}
                            <div className="bg-gray-50 dark:bg-[#131620] rounded-2xl p-5 border border-gray-200 dark:border-white/5 flex flex-col justify-between group hover:border-indigo-500/30 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <span className={`text-2xl font-bold ${getScoreColor(data.keywordMatchPercent)}`}>
                                        {data.keywordMatchPercent}%
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-gray-600 dark:text-gray-300 font-medium mb-1">Keyword Match</h4>
                                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${data.keywordMatchPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Formatting */}
                            <div className="bg-gray-50 dark:bg-[#131620] rounded-2xl p-5 border border-gray-200 dark:border-white/5 flex flex-col justify-between group hover:border-purple-500/30 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                                        <Layout className="w-6 h-6" />
                                    </div>
                                    <span className={`text-2xl font-bold ${getScoreColor(data.formattingScore)}`}>
                                        {data.formattingScore}%
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-gray-600 dark:text-gray-300 font-medium mb-1">Formatting Score</h4>
                                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${data.formattingScore}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* AI Insights */}
                            <div className="sm:col-span-2 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-[#131620] rounded-2xl p-5 border border-gray-200 dark:border-white/5 flex items-center gap-6">
                                <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0">
                                    <Cpu className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-gray-700 dark:text-gray-300 font-medium">AI Insight:</h4>
                                        <span className={`font-bold ${data.overallScore >= 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                            {data.overallScore >= 70 ? 'STRONG' : 'NEEDS IMPROVEMENT'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        {data.overallScore >= 70
                                            ? "Your resume is well-structured and contains many relevant keywords. Keep it up!"
                                            : "Focus on adding more keywords and improving formatting to pass ATS filters."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Radar & Skills */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Radar Chart */}
                        <div className="bg-gray-50 dark:bg-[#131620] rounded-3xl p-6 border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Competency Radar</h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="#374151" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Score"
                                            dataKey="A"
                                            stroke="#818CF8"
                                            strokeWidth={2}
                                            fill="#6366F1"
                                            fillOpacity={0.3}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                            itemStyle={{ color: '#818CF8' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Skills Analysis */}
                        <div className="bg-gray-50 dark:bg-[#131620] rounded-3xl p-6 border border-gray-200 dark:border-white/5 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Skills Analysis</h3>
                            </div>

                            <div className="space-y-6 flex-1">
                                {/* Matched Skills */}
                                <div>
                                    <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                                        <Check className="w-4 h-4" /> MATCHED SKILLS
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.matchedKeywords && data.matchedKeywords.length > 0 ? (
                                            data.matchedKeywords.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500 text-sm italic">No specific skills matched yet.</span>
                                        )}
                                    </div>
                                </div>

                                {/* Missing Skills */}
                                <div>
                                    <h4 className="text-sm font-medium text-rose-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> MISSING SKILLS
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.missingKeywords && data.missingKeywords.length > 0 ? (
                                            data.missingKeywords.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500 text-sm italic">Great job! No major skills missing.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Improvement Tips */}
                    <div className="bg-gray-50 dark:bg-[#131620] rounded-3xl p-6 border border-gray-200 dark:border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Improvement Tips</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.suggestions && data.suggestions.map((suggestion, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-indigo-500/30 transition-colors">
                                    <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Lightbulb className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{suggestion}</p>
                                    </div>
                                </div>
                            ))}
                            {(!data.suggestions || data.suggestions.length === 0) && (
                                <p className="text-gray-500 italic">No specific suggestions available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
