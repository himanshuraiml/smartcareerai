'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Code2, Filter, CheckCircle2, Clock, XCircle,
    Loader2, ChevronRight, Terminal, Zap, Lock
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface Challenge {
    id: string;
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    category: string;
    tags: string[];
    languages: string[];
    userBestStatus: string | null;
    userBestScore: number | null;
}

const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    MEDIUM: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    HARD: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
    ACCEPTED: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    WRONG_ANSWER: <XCircle className="w-4 h-4 text-red-400" />,
    RUNTIME_ERROR: <XCircle className="w-4 h-4 text-red-400" />,
    COMPILATION_ERROR: <XCircle className="w-4 h-4 text-red-400" />,
};

const CATEGORIES = ['All', 'arrays', 'strings', 'graphs', 'dynamic-programming', 'trees', 'sorting', 'math'];

export default function CodingChallengesPage() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const fetchChallenges = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (difficultyFilter) params.set('difficulty', difficultyFilter);
            if (categoryFilter && categoryFilter !== 'All') params.set('category', categoryFilter);

            const res = await authFetch(`/coding/challenges?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setChallenges(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch challenges:', err);
        } finally {
            setLoading(false);
        }
    }, [difficultyFilter, categoryFilter]);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    const solvedCount = challenges.filter((c) => c.userBestStatus === 'ACCEPTED').length;
    const attemptedCount = challenges.filter(
        (c) => c.userBestStatus && c.userBestStatus !== 'ACCEPTED'
    ).length;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <Terminal className="w-6 h-6 text-violet-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Technical Simulations</h1>
                </div>
                <p className="text-gray-400 text-sm">
                    Solve coding challenges in-browser and get instant AI feedback on your solution quality and complexity.
                </p>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{challenges.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Challenges</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{solvedCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Solved</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-400">{attemptedCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Attempted</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Filter className="w-4 h-4" />
                    <span>Filter:</span>
                </div>

                {/* Difficulty filter */}
                <div className="flex gap-2">
                    {['', 'EASY', 'MEDIUM', 'HARD'].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDifficultyFilter(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                difficultyFilter === d
                                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                        >
                            {d || 'All Levels'}
                        </button>
                    ))}
                </div>

                {/* Category filter */}
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
                >
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat === 'All' ? '' : cat}>
                            {cat === 'All' ? 'All Categories' : cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                    ))}
                </select>
            </div>

            {/* Challenge list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                </div>
            ) : challenges.length === 0 ? (
                <div className="text-center py-20">
                    <Code2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No challenges found. Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {challenges.map((challenge, index) => (
                        <Link
                            key={challenge.id}
                            href={`/dashboard/coding/${challenge.id}`}
                            className="block"
                        >
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-violet-500/40 hover:bg-gray-900/80 transition-all group">
                                <div className="flex items-center gap-4">
                                    {/* Index */}
                                    <span className="text-gray-600 text-sm w-6 text-right flex-shrink-0">
                                        {index + 1}
                                    </span>

                                    {/* Status icon */}
                                    <div className="w-5 flex-shrink-0">
                                        {challenge.userBestStatus
                                            ? STATUS_ICON[challenge.userBestStatus] ?? (
                                                  <Clock className="w-4 h-4 text-amber-400" />
                                              )
                                            : <div className="w-4 h-4 rounded-full border border-gray-700" />}
                                    </div>

                                    {/* Title + tags */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-white group-hover:text-violet-300 transition-colors">
                                                {challenge.title}
                                            </span>
                                            {challenge.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400 border border-gray-700"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-500 capitalize">
                                                {challenge.category.replace(/-/g, ' ')}
                                            </span>
                                            <span className="text-gray-700">·</span>
                                            <span className="text-xs text-gray-500">
                                                {challenge.languages.join(', ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Score badge */}
                                    {challenge.userBestScore !== null && (
                                        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                                            <Zap className="w-3 h-3 text-amber-400" />
                                            {challenge.userBestScore}%
                                        </div>
                                    )}

                                    {/* Difficulty */}
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${DIFFICULTY_COLORS[challenge.difficulty]}`}
                                    >
                                        {challenge.difficulty}
                                    </span>

                                    {/* Arrow */}
                                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Info footer */}
            <div className="mt-8 p-4 rounded-xl border border-dashed border-gray-700 flex items-start gap-3">
                <Lock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-400">Submissions cost 1 Skill Test credit.</span>{' '}
                    Running code against visible test cases is free and unlimited.
                    Use submissions for your final, optimized solution.
                </p>
            </div>
        </div>
    );
}
