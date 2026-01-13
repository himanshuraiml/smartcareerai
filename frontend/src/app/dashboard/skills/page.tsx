'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Target, TrendingUp, BookOpen, Zap, ChevronRight,
    Loader2, AlertCircle, CheckCircle, Plus, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface Skill {
    id: string;
    name: string;
    category: string;
    demandScore: number;
}

interface UserSkill {
    id: string;
    skill: Skill;
    proficiencyLevel: string;
    isVerified: boolean;
}

interface GapAnalysis {
    targetRole: string;
    matchPercent: number;
    matchedSkills: { required: string[]; preferred: string[] };
    missingSkills: { required: string[]; preferred: string[] };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function SkillsPage() {
    const { accessToken } = useAuthStore();
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
    const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [selectedRole, setSelectedRole] = useState('Software Developer');
    const [activeTab, setActiveTab] = useState<'skills' | 'gap' | 'roadmap'>('skills');

    const jobRoles = [
        'Software Developer',
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Data Scientist',
        'Data Analyst',
        'Machine Learning Engineer',
        'DevOps Engineer',
        'Cloud Engineer',
        'Product Manager',
        'Project Manager',
        'UI/UX Designer',
        'Mobile Developer',
        'QA Engineer',
        'Cybersecurity Analyst',
    ];

    const fetchUserSkills = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/skills/user-skills`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setUserSkills(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch skills:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    const fetchGapAnalysis = useCallback(async () => {
        setAnalyzing(true);
        try {
            const response = await fetch(
                `${API_URL}/skills/gap-analysis?targetRole=${encodeURIComponent(selectedRole)}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (response.ok) {
                const data = await response.json();
                setGapAnalysis(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch gap analysis:', err);
        } finally {
            setAnalyzing(false);
        }
    }, [accessToken, selectedRole]);

    const fetchRoadmap = useCallback(async () => {
        setAnalyzing(true);
        try {
            const response = await fetch(
                `${API_URL}/skills/roadmap?targetRole=${encodeURIComponent(selectedRole)}&timeframe=12`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (response.ok) {
                const data = await response.json();
                setRoadmap(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch roadmap:', err);
        } finally {
            setAnalyzing(false);
        }
    }, [accessToken, selectedRole]);

    useEffect(() => {
        if (accessToken) {
            fetchUserSkills();
        }
    }, [accessToken, fetchUserSkills]);

    useEffect(() => {
        if (accessToken && activeTab === 'gap') {
            fetchGapAnalysis();
        } else if (accessToken && activeTab === 'roadmap') {
            fetchRoadmap();
        }
    }, [accessToken, activeTab, selectedRole, fetchGapAnalysis, fetchRoadmap]);

    const getProficiencyColor = (level: string) => {
        switch (level) {
            case 'expert': return 'bg-purple-500/20 text-purple-400';
            case 'advanced': return 'bg-green-500/20 text-green-400';
            case 'intermediate': return 'bg-blue-500/20 text-blue-400';
            default: return 'bg-yellow-500/20 text-yellow-400';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Skills</h1>
                    <p className="text-gray-400 mt-2">Analyze your skills and plan your career growth</p>
                </div>
                <button
                    onClick={fetchUserSkills}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Role Selector */}
            <div className="flex items-center gap-4">
                <label className="text-gray-400">Target Role:</label>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                >
                    {jobRoles.map((role) => (
                        <option key={role} value={role} className="bg-gray-900">{role}</option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
                {[
                    { id: 'skills', label: 'My Skills', icon: Zap },
                    { id: 'gap', label: 'Gap Analysis', icon: Target },
                    { id: 'roadmap', label: 'Learning Roadmap', icon: TrendingUp },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === tab.id
                            ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'skills' && (
                <div className="space-y-6">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading skills...</p>
                        </div>
                    ) : userSkills.length === 0 ? (
                        <div className="p-12 rounded-2xl glass text-center">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No skills yet</h3>
                            <p className="text-gray-400 mb-4">Upload a resume to automatically extract your skills</p>
                            <a href="/dashboard/resumes" className="text-purple-400 hover:text-purple-300">
                                Go to Resumes →
                            </a>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userSkills.map((us) => (
                                <div key={us.id} className="p-4 rounded-xl glass flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{us.skill.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-xs ${getProficiencyColor(us.proficiencyLevel)}`}>
                                                {us.proficiencyLevel}
                                            </span>
                                            {us.isVerified && (
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'gap' && (
                <div className="space-y-6">
                    {analyzing ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Analyzing skills...</p>
                        </div>
                    ) : gapAnalysis ? (
                        <>
                            {/* Match Score */}
                            <div className="p-6 rounded-2xl glass text-center">
                                <div className={`text-5xl font-bold ${getScoreColor(gapAnalysis.matchPercent)}`}>
                                    {gapAnalysis.matchPercent}%
                                </div>
                                <p className="text-gray-400 mt-2">Match for {gapAnalysis.targetRole}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Matched Skills */}
                                <div className="p-6 rounded-2xl glass">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        Skills You Have
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {gapAnalysis.matchedSkills.required.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                        {gapAnalysis.matchedSkills.preferred.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                        {gapAnalysis.matchedSkills.required.length === 0 &&
                                            gapAnalysis.matchedSkills.preferred.length === 0 && (
                                                <p className="text-gray-400">No matching skills yet</p>
                                            )}
                                    </div>
                                </div>

                                {/* Missing Skills */}
                                <div className="p-6 rounded-2xl glass">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                        Skills to Learn
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {gapAnalysis.missingSkills.required.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm">
                                                {skill} (Required)
                                            </span>
                                        ))}
                                        {gapAnalysis.missingSkills.preferred.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                        {gapAnalysis.missingSkills.required.length === 0 &&
                                            gapAnalysis.missingSkills.preferred.length === 0 && (
                                                <p className="text-green-400">You have all required skills! 🎉</p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-12 rounded-2xl glass text-center">
                            <p className="text-gray-400">Select a target role to see gap analysis</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'roadmap' && (
                <div className="space-y-6">
                    {analyzing ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Generating roadmap...</p>
                        </div>
                    ) : roadmap?.roadmap?.length > 0 ? (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl glass text-center">
                                    <p className="text-2xl font-bold text-purple-400">{roadmap.duration}</p>
                                    <p className="text-gray-400 text-sm">Duration</p>
                                </div>
                                <div className="p-4 rounded-xl glass text-center">
                                    <p className="text-2xl font-bold text-blue-400">{roadmap.totalHours}h</p>
                                    <p className="text-gray-400 text-sm">Total Hours</p>
                                </div>
                                <div className="p-4 rounded-xl glass text-center">
                                    <p className={`text-2xl font-bold ${getScoreColor(roadmap.readinessScore)}`}>
                                        {roadmap.readinessScore}%
                                    </p>
                                    <p className="text-gray-400 text-sm">Readiness</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {roadmap.roadmap.map((week: any, index: number) => (
                                    <div key={index} className="p-6 rounded-xl glass">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                                                {week.week}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold">{week.focus}</h3>
                                                <p className="text-gray-400 text-sm">{week.estimatedHours} hours</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {week.skills.map((skill: string, i: number) => (
                                                <span key={i} className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-sm">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                        <ul className="space-y-1 mb-4">
                                            {week.tasks.map((task: string, i: number) => (
                                                <li key={i} className="text-gray-300 text-sm flex items-center gap-2">
                                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                                    {task}
                                                </li>
                                            ))}
                                        </ul>
                                        {week.resources && week.resources.length > 0 && (
                                            <div className="border-t border-white/10 pt-3">
                                                <p className="text-gray-400 text-xs mb-2">📚 Recommended Resources:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {week.resources.map((resource: any, i: number) => (
                                                        <a
                                                            key={i}
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${resource.platform === 'Coursera' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' :
                                                                    resource.platform === 'YouTube' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                                                        resource.platform === 'Udemy' ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' :
                                                                            'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                                }`}
                                                        >
                                                            {resource.platform}: {resource.name}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="p-12 rounded-2xl glass text-center">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No roadmap available</h3>
                            <p className="text-gray-400">Add skills to your profile first</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
