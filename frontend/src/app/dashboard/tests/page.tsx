'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    FileQuestion, Clock, Target, Award, Loader2, ChevronRight,
    CheckCircle, Trophy
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

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

interface GapAnalysis {
    targetRole: string;
    matchPercent: number;
    matchedSkills: { required: string[]; preferred: string[] };
    missingSkills: { required: string[]; preferred: string[] };
    userSkills: { id: string; name: string }[];
}

interface SkillTest {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    durationMinutes: number;
    passingScore: number;
    questionsCount: number;
    skill: { id: string; name: string; category: string };
    _count: { questions: number; attempts: number };
}

interface Badge {
    id: string;
    badgeType: string;
    issuedAt: string;
    skill: { id: string; name: string };
    testAttempt?: { score: number; completedAt: string };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function TestsPage() {
    const { accessToken, user } = useAuthStore();
    const [tests, setTests] = useState<SkillTest[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [attempts, setAttempts] = useState<TestAttempt[]>([]);
    const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tests' | 'badges'>('tests');

    // Use user's registered target role
    const selectedRole = user?.targetJobRole?.title;

    const fetchData = useCallback(async () => {
        try {
            const requests = [
                fetch(`${API_URL}/validation/tests`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${API_URL}/validation/badges`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch(`${API_URL}/validation/attempts`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
            ];

            if (selectedRole) {
                requests.push(
                    fetch(`${API_URL}/skills/gap-analysis?targetRole=${encodeURIComponent(selectedRole)}`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    })
                );
            }

            const responses = await Promise.all(requests);
            const [testsRes, badgesRes, attemptsRes, gapRes] = responses;

            if (testsRes.ok) {
                const data = await testsRes.json();
                setTests(data.data || []);
            }
            if (badgesRes.ok) {
                const data = await badgesRes.json();
                setBadges(data.data || []);
            }
            if (attemptsRes.ok) {
                const data = await attemptsRes.json();
                setAttempts(data.data || []);
            }
            if (gapRes && gapRes.ok) {
                const data = await gapRes.json();
                setGapAnalysis(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken, selectedRole]);

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

    // Filter tests based on relevance and progression
    const allDisplayedTests = tests.filter(test => {
        // 1. Relevance Filter
        if (gapAnalysis) {
            const relevantSkills = new Set([
                ...gapAnalysis.matchedSkills.required,
                ...gapAnalysis.matchedSkills.preferred,
                ...gapAnalysis.missingSkills.required,
                ...gapAnalysis.missingSkills.preferred,
                ...gapAnalysis.userSkills.map(s => s.name)
            ]);

            // Normalize for comparison
            const skillName = test.skill.name;
            const isRelevant = Array.from(relevantSkills).some(s => s.toLowerCase() === skillName.toLowerCase());

            if (!isRelevant) return false;
        }

        // 2. Progression Filter
        const nextLevel = getNextTestLevel(test.skill.id);
        return test.difficulty === nextLevel;
    });

    // Split into Recommended (Missing Skills) and Others
    const missingSkillsSet = new Set([
        ...(gapAnalysis?.missingSkills?.required || []).map(s => s.toLowerCase()),
        ...(gapAnalysis?.missingSkills?.preferred || []).map(s => s.toLowerCase())
    ]);

    const recommendedTests = allDisplayedTests.filter(test =>
        missingSkillsSet.has(test.skill.name.toLowerCase())
    );

    const otherTests = allDisplayedTests.filter(test =>
        !missingSkillsSet.has(test.skill.name.toLowerCase())
    );

    useEffect(() => {
        if (accessToken) {
            fetchData();
        }
    }, [accessToken, fetchData]);

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'EXPERT': return 'from-yellow-400 to-orange-500';
            case 'ADVANCED': return 'from-purple-400 to-pink-500';
            case 'INTERMEDIATE': return 'from-blue-400 to-cyan-500';
            case 'BEGINNER': return 'from-green-400 to-emerald-500';
            default: return 'from-gray-400 to-gray-500';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY': return 'text-green-400';
            case 'MEDIUM': return 'text-yellow-400';
            case 'HARD': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const TestCard = ({ test, isRecommended = false }: { test: SkillTest, isRecommended?: boolean }) => (
        <Link
            key={test.id}
            href={`/dashboard/test/${test.id}`}
            className={`p-6 rounded-xl glass hover:border-purple-500/30 transition-all group relative overflow-hidden ${isRecommended ? 'border-purple-500/50 bg-purple-500/5' : ''}`}
        >
            {isRecommended && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg font-medium">
                    Recommended
                </div>
            )}
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <FileQuestion className="w-6 h-6 text-purple-400" />
                </div>
                <span className={`text-sm font-medium ${getDifficultyColor(test.difficulty)}`}>
                    {test.difficulty}
                </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition">
                {test.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{test.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {test.durationMinutes} min
                </span>
                <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {test._count.questions} questions
                </span>
                <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {test.passingScore}% to pass
                </span>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-xs">
                    {test.skill.name}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition" />
            </div>
        </Link>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Skill Validation</h1>
                <p className="text-gray-400 mt-1">Take tests to verify your skills and earn badges</p>
                {selectedRole && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-purple-300 bg-purple-500/10 w-fit px-3 py-1.5 rounded-lg border border-purple-500/20">
                        <Target className="w-4 h-4" />
                        Target Role: {selectedRole}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl glass">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <FileQuestion className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{allDisplayedTests.length}</p>
                            <p className="text-gray-400 text-sm">Available Tests</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-xl glass">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{badges.length}</p>
                            <p className="text-gray-400 text-sm">Badges Earned</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-xl glass">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {badges.filter(b => b.badgeType === 'EXPERT' || b.badgeType === 'ADVANCED').length}
                            </p>
                            <p className="text-gray-400 text-sm">Expert/Advanced</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 rounded-lg bg-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('tests')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'tests' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Skill Tests
                </button>
                <button
                    onClick={() => setActiveTab('badges')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'badges' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    My Badges ({badges.length})
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            ) : activeTab === 'tests' ? (
                <div className="space-y-8">
                    {allDisplayedTests.length === 0 ? (
                        <div className="p-12 rounded-2xl glass text-center">
                            <FileQuestion className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No tests available</h3>
                            <p className="text-gray-400">Check back soon for skill validation tests</p>
                        </div>
                    ) : (
                        <>
                            {/* Recommended Tests Section */}
                            {recommendedTests.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-purple-400" />
                                        Recommended for You
                                        <span className="text-sm font-normal text-gray-400 ml-2">
                                            (Skills to Learn)
                                        </span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {recommendedTests.map(test => (
                                            <TestCard key={test.id} test={test} isRecommended={true} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Tests Section */}
                            {otherTests.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                        <FileQuestion className="w-5 h-5 text-gray-400" />
                                        All Tests
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {otherTests.map(test => (
                                            <TestCard key={test.id} test={test} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {badges.length === 0 ? (
                        <div className="col-span-4 p-12 rounded-2xl glass text-center">
                            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No badges yet</h3>
                            <p className="text-gray-400">Complete skill tests to earn badges</p>
                        </div>
                    ) : badges.map(badge => (
                        <div key={badge.id} className="p-6 rounded-xl glass text-center">
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getBadgeColor(badge.badgeType)} flex items-center justify-center mx-auto mb-3`}>
                                <Trophy className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-white font-semibold">{badge.skill.name}</h4>
                            <p className={`text-sm font-medium bg-gradient-to-r ${getBadgeColor(badge.badgeType)} bg-clip-text text-transparent`}>
                                {badge.badgeType}
                            </p>
                            {badge.testAttempt && (
                                <p className="text-gray-400 text-xs mt-2">
                                    Score: {badge.testAttempt.score}%
                                </p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                                {new Date(badge.issuedAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
