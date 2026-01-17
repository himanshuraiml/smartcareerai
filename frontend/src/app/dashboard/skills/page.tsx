'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Target, TrendingUp, BookOpen, Zap, ChevronRight,
    Loader2, AlertCircle, CheckCircle, Plus, RefreshCw, Award, PlayCircle
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
    userSkills: Skill[];
}

interface Certification {
    name: string;
    issuer: string;
    level: string;
    url: string;
    description: string;
}

interface TestAttempt {
    id: string;
    passed: boolean;
    score: number;
    test: {
        id: string;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        skillId: string;
        title: string;
    };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function SkillsPage() {
    const router = useRouter();
    const { accessToken, user } = useAuthStore();
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const [attempts, setAttempts] = useState<TestAttempt[]>([]);
    const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<'skills' | 'gap' | 'roadmap' | 'certifications'>('skills');
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loadingCerts, setLoadingCerts] = useState(false);

    // Use user's registered target role
    const selectedRole = user?.targetJobRole?.title || 'Software Developer';

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
            console.error('Failed to fetch user skills:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    const fetchAllSkills = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/skills/skills`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAllSkills(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch all skills:', err);
        }
    }, [accessToken]);

    const fetchAttempts = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/validation/attempts`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAttempts(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch attempts:', err);
        }
    }, [accessToken]);

    const getNextTestLevel = (skillId: string): 'EASY' | 'MEDIUM' | 'HARD' | 'COMPLETED' => {
        const passedAttempts = attempts.filter(a => a.test.skillId === skillId && a.passed);
        const hasHard = passedAttempts.some(a => a.test.difficulty === 'HARD');
        const hasMedium = passedAttempts.some(a => a.test.difficulty === 'MEDIUM');
        const hasEasy = passedAttempts.some(a => a.test.difficulty === 'EASY');

        if (hasHard) return 'COMPLETED';
        if (hasMedium) return 'HARD';
        if (hasEasy) return 'MEDIUM';
        return 'EASY';
    };

    const handleTakeTest = (skillNameOrId: string, _difficulty?: string, isId: boolean = false) => {
        let skillId = skillNameOrId;
        if (!isId) {
            const skill = allSkills.find(s => s.name.toLowerCase() === skillNameOrId.toLowerCase());
            if (!skill) {
                alert(`Skill "${skillNameOrId}" not found in database.`);
                return;
            }
            skillId = skill.id;
        }

        const nextLevel = getNextTestLevel(skillId);
        if (nextLevel === 'COMPLETED') {
            alert('You have already mastered this skill!');
            return;
        }

        router.push(`/dashboard/test/test-${skillId}-${nextLevel}`);
    };

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
            fetchAllSkills();
            fetchAttempts();
        }
    }, [accessToken, fetchUserSkills, fetchAllSkills, fetchAttempts]);

    useEffect(() => {
        if (accessToken && activeTab === 'gap') {
            fetchGapAnalysis();
        } else if (accessToken && activeTab === 'roadmap') {
            fetchRoadmap();
        } else if (activeTab === 'certifications') {
            fetchCertifications();
        }
    }, [accessToken, activeTab, selectedRole, fetchGapAnalysis, fetchRoadmap]);

    const fetchCertifications = async () => {
        setLoadingCerts(true);
        try {
            const response = await fetch(
                `${API_URL}/skills/certifications?targetRole=${encodeURIComponent(selectedRole)}`
            );
            if (response.ok) {
                const data = await response.json();
                setCertifications(data.data?.certifications || []);
            }
        } catch (err) {
            console.error('Failed to fetch certifications:', err);
        } finally {
            setLoadingCerts(false);
        }
    };

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

            {/* Target Role Display */}
            <div className="flex items-center gap-4 p-4 rounded-xl glass">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400">Target Role:</span>
                </div>
                <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white font-medium">
                    {selectedRole}
                </span>
                <a
                    href="/dashboard/settings"
                    className="text-sm text-purple-400 hover:text-purple-300 underline transition-colors"
                >
                    Change in Settings
                </a>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
                {[
                    { id: 'skills', label: 'My Skills', icon: Zap },
                    { id: 'gap', label: 'Gap Analysis', icon: Target },
                    { id: 'roadmap', label: 'Learning Roadmap', icon: TrendingUp },
                    { id: 'certifications', label: 'Certifications', icon: Award },
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
                                            {us.isVerified ? (
                                                <div className="flex items-center gap-1 text-green-400 text-xs">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span>Verified</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleTakeTest(us.skill.id, undefined, true)}
                                                    className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded hover:bg-purple-500/30 transition-colors"
                                                >
                                                    <PlayCircle className="w-3 h-3" />
                                                    <span>{getNextTestLevel(us.skill.id) === 'COMPLETED' ? 'Mastered' : `Take ${getNextTestLevel(us.skill.id)} Test`}</span>
                                                </button>
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
                                {/* Matched Skills & Other Skills */}
                                <div className="p-6 rounded-2xl glass">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        Skills You Have
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Render ALL user skills, highlighting matches */}
                                        {gapAnalysis.userSkills.map((skill, i) => {
                                            const isRequired = gapAnalysis.matchedSkills.required.includes(skill.name);
                                            const isPreferred = gapAnalysis.matchedSkills.preferred.includes(skill.name);

                                            // Determine style based on match status
                                            let style = "bg-white/5 text-gray-400"; // Default (unmatched)
                                            if (isRequired) style = "bg-green-500/10 text-green-400";
                                            if (isPreferred) style = "bg-blue-500/10 text-blue-400";

                                            return (
                                                <span key={i} className={`px-3 py-1 rounded-full text-sm ${style}`}>
                                                    {skill.name}
                                                </span>
                                            );
                                        })}

                                        {gapAnalysis.userSkills.length === 0 && (
                                            <p className="text-gray-400">No skills added yet</p>
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
                                            <div key={i} className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm group">
                                                <span>{skill} (Required)</span>
                                                <button
                                                    onClick={() => handleTakeTest(skill)}
                                                    className="ml-1 p-0.5 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Take Assessment"
                                                >
                                                    <PlayCircle className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {gapAnalysis.missingSkills.preferred.map((skill, i) => (
                                            <div key={i} className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm group">
                                                <span>{skill}</span>
                                                <button
                                                    onClick={() => handleTakeTest(skill)}
                                                    className="ml-1 p-0.5 rounded hover:bg-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Take Assessment"
                                                >
                                                    <PlayCircle className="w-3 h-3" />
                                                </button>
                                            </div>
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

            {activeTab === 'certifications' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-purple-400" />
                                Recommended Certifications for {selectedRole}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Industry-recognized certifications to boost your career
                            </p>
                        </div>
                    </div>

                    {loadingCerts ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading certifications...</p>
                        </div>
                    ) : certifications.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {certifications.map((cert, index) => (
                                <div
                                    key={index}
                                    className="p-6 rounded-xl glass-card hover:border-purple-500/30 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                                            <Award className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold mb-1">{cert.name}</h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm text-gray-400">{cert.issuer}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${cert.level === 'Expert' ? 'bg-purple-500/20 text-purple-400' :
                                                    cert.level === 'Professional' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-green-500/20 text-green-400'
                                                    }`}>
                                                    {cert.level}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm mb-3">{cert.description}</p>
                                            <a
                                                href={cert.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                            >
                                                View Certification <ChevronRight className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 rounded-2xl glass text-center">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                <Award className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No certifications found</h3>
                            <p className="text-gray-400">Try selecting a different role to see recommended certifications</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
