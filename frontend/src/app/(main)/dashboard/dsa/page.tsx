'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Code2, ChevronRight, Clock, Layers, Zap, GitBranch,
    BookOpen, Terminal, FlaskConical, Lock, CheckCircle2,
} from 'lucide-react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Topic {
    id: string;
    title: string;
    difficulty: Difficulty;
    estMinutes: number;
}

interface Category {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
    topics: Topic[];
}

const CATEGORIES: Category[] = [
    {
        id: 'arrays',
        label: 'Arrays & Strings',
        icon: Layers,
        color: 'text-blue-400',
        topics: [
            { id: 'two-pointers', title: 'Two Pointers', difficulty: 'Easy', estMinutes: 20 },
            { id: 'sliding-window', title: 'Sliding Window', difficulty: 'Medium', estMinutes: 25 },
            { id: 'prefix-sum', title: 'Prefix Sum', difficulty: 'Easy', estMinutes: 15 },
            { id: 'kadane', title: "Kadane's Algorithm", difficulty: 'Medium', estMinutes: 20 },
        ],
    },
    {
        id: 'linked-lists',
        label: 'Linked Lists',
        icon: GitBranch,
        color: 'text-violet-400',
        topics: [
            { id: 'reverse-ll', title: 'Reverse Linked List', difficulty: 'Easy', estMinutes: 15 },
            { id: 'floyd-cycle', title: "Floyd's Cycle Detection", difficulty: 'Medium', estMinutes: 20 },
            { id: 'merge-sorted-ll', title: 'Merge Two Sorted Lists', difficulty: 'Easy', estMinutes: 15 },
            { id: 'll-nth-end', title: 'Remove Nth from End', difficulty: 'Medium', estMinutes: 20 },
        ],
    },
    {
        id: 'trees',
        label: 'Trees',
        icon: GitBranch,
        color: 'text-emerald-400',
        topics: [
            { id: 'tree-traversals', title: 'DFS & BFS Traversals', difficulty: 'Easy', estMinutes: 25 },
            { id: 'bst-ops', title: 'Binary Search Tree', difficulty: 'Medium', estMinutes: 30 },
            { id: 'lca', title: 'Lowest Common Ancestor', difficulty: 'Medium', estMinutes: 25 },
            { id: 'max-depth', title: 'Max Depth of Tree', difficulty: 'Easy', estMinutes: 15 },
        ],
    },
    {
        id: 'graphs',
        label: 'Graphs',
        icon: GitBranch,
        color: 'text-orange-400',
        topics: [
            { id: 'graph-bfs-dfs', title: 'BFS & DFS on Graphs', difficulty: 'Medium', estMinutes: 30 },
            { id: 'topo-sort', title: 'Topological Sort', difficulty: 'Medium', estMinutes: 30 },
            { id: 'dijkstra', title: "Dijkstra's Algorithm", difficulty: 'Hard', estMinutes: 40 },
            { id: 'union-find', title: 'Union Find (DSU)', difficulty: 'Medium', estMinutes: 35 },
        ],
    },
    {
        id: 'dp',
        label: 'Dynamic Programming',
        icon: Zap,
        color: 'text-amber-400',
        topics: [
            { id: 'dp-1d', title: '1D DP — Fibonacci & Climbing Stairs', difficulty: 'Easy', estMinutes: 20 },
            { id: 'dp-knapsack', title: '0/1 Knapsack', difficulty: 'Medium', estMinutes: 35 },
            { id: 'dp-lcs', title: 'LCS & Edit Distance', difficulty: 'Hard', estMinutes: 45 },
            { id: 'dp-trees', title: 'DP on Trees', difficulty: 'Hard', estMinutes: 50 },
        ],
    },
    {
        id: 'sorting',
        label: 'Sorting & Searching',
        icon: Layers,
        color: 'text-cyan-400',
        topics: [
            { id: 'binary-search', title: 'Binary Search', difficulty: 'Easy', estMinutes: 20 },
            { id: 'quick-merge', title: 'Quick Sort & Merge Sort', difficulty: 'Medium', estMinutes: 30 },
            { id: 'rotated-array', title: 'Search in Rotated Array', difficulty: 'Medium', estMinutes: 25 },
        ],
    },
    {
        id: 'stack-queue',
        label: 'Stack & Queue',
        icon: Layers,
        color: 'text-rose-400',
        topics: [
            { id: 'monotonic-stack', title: 'Monotonic Stack', difficulty: 'Medium', estMinutes: 25 },
            { id: 'next-greater', title: 'Next Greater Element', difficulty: 'Medium', estMinutes: 20 },
            { id: 'sliding-max', title: 'Sliding Window Maximum', difficulty: 'Hard', estMinutes: 35 },
        ],
    },
    {
        id: 'backtracking',
        label: 'Backtracking',
        icon: FlaskConical,
        color: 'text-pink-400',
        topics: [
            { id: 'subsets-perms', title: 'Subsets & Permutations', difficulty: 'Medium', estMinutes: 30 },
            { id: 'n-queens', title: 'N-Queens', difficulty: 'Hard', estMinutes: 45 },
            { id: 'sudoku', title: 'Sudoku Solver', difficulty: 'Hard', estMinutes: 45 },
        ],
    },
    {
        id: 'bits',
        label: 'Bit Manipulation',
        icon: Terminal,
        color: 'text-indigo-400',
        topics: [
            { id: 'xor-tricks', title: 'XOR Tricks', difficulty: 'Medium', estMinutes: 20 },
            { id: 'bit-count', title: 'Bit Counting (Hamming Weight)', difficulty: 'Easy', estMinutes: 15 },
            { id: 'power-of-2', title: 'Power of Two', difficulty: 'Easy', estMinutes: 10 },
        ],
    },
];

const ALL_TOPICS = CATEGORIES.flatMap(c => c.topics.map(t => ({ ...t, category: c.label })));
const TOTAL_TOPICS = ALL_TOPICS.length;

const DIFF_COLOR: Record<Difficulty, string> = {
    Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function DSAGuidePage() {
    const [activeCatId, setActiveCatId] = useState<string>(CATEGORIES[0].id);
    const [activeTopicId, setActiveTopicId] = useState<string>(CATEGORIES[0].topics[0].id);

    const currentCat = CATEGORIES.find(c => c.id === activeCatId)!;
    const currentTopic = ALL_TOPICS.find(t => t.id === activeTopicId)!;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19]">

            {/* Page Header */}
            <div className="border-b border-gray-200 dark:border-white/8 bg-white dark:bg-[#0D1117] px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Code2 className="w-5 h-5 text-blue-500" />
                            <h1 className="text-xl font-black text-gray-900 dark:text-white">DSA Guide</h1>
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                                New
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {TOTAL_TOPICS} essential topics — concept breakdowns, implementation patterns &amp; practice tests.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/coding"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <Terminal className="w-4 h-4" />
                            Coding Challenges
                        </Link>
                        <Link
                            href="/dashboard/tests"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <FlaskConical className="w-4 h-4" />
                            Skill Tests
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

                {/* ── Sidebar: category + topic list ── */}
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#0D1117] overflow-hidden sticky top-6">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/6 flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Topics</p>
                            <span className="text-xs text-gray-400">{TOTAL_TOPICS} total</span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-[72vh] overflow-y-auto">
                            {CATEGORIES.map(cat => {
                                const Icon = cat.icon;
                                const isCatActive = cat.id === activeCatId;
                                return (
                                    <div key={cat.id}>
                                        <button
                                            onClick={() => { setActiveCatId(cat.id); setActiveTopicId(cat.topics[0].id); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isCatActive ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}
                                        >
                                            <Icon className={`w-4 h-4 shrink-0 ${isCatActive ? 'text-blue-500' : cat.color}`} />
                                            <span className={`text-sm font-semibold flex-1 ${isCatActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {cat.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 tabular-nums">{cat.topics.length}</span>
                                        </button>

                                        {isCatActive && (
                                            <div className="bg-gray-50/50 dark:bg-white/[0.02]">
                                                {cat.topics.map(topic => {
                                                    const isActive = topic.id === activeTopicId;
                                                    return (
                                                        <button
                                                            key={topic.id}
                                                            onClick={() => setActiveTopicId(topic.id)}
                                                            className={`w-full flex items-center gap-3 pl-10 pr-4 py-2.5 text-left transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                        >
                                                            <span className={`text-sm flex-1 ${isActive ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                {topic.title}
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${DIFF_COLOR[topic.difficulty]}`}>
                                                                {topic.difficulty[0]}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* ── Main: topic detail ── */}
                <main className="flex-1 min-w-0 space-y-5">

                    {/* Topic header */}
                    <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#0D1117] p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        {currentTopic.category}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">·</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFF_COLOR[currentTopic.difficulty]}`}>
                                        {currentTopic.difficulty}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">·</span>
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" /> ~{currentTopic.estMinutes} min
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                    {currentTopic.title}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Link
                                    href="/dashboard/coding"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Code2 className="w-4 h-4" />
                                    Solve Problems
                                </Link>
                                <Link
                                    href="/dashboard/tests"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/20"
                                >
                                    <FlaskConical className="w-4 h-4" />
                                    Practice Test
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Content coming soon */}
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D1117] p-10">
                        <div className="max-w-md mx-auto text-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
                                <BookOpen className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Content Coming Soon
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                We&apos;re preparing an in-depth guide for{' '}
                                <strong className="text-gray-700 dark:text-gray-200">{currentTopic.title}</strong>{' '}
                                — intuition, step-by-step implementation, complexity analysis, and interview patterns.
                            </p>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                                <Link
                                    href="/dashboard/tests"
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
                                >
                                    <FlaskConical className="w-4 h-4" /> Take a Skill Test
                                </Link>
                                <Link
                                    href="/dashboard/practice-interview"
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    AI Mock Interview
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* What this guide covers */}
                    <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#0D1117] p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            What this guide will cover
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                'Core concept & intuition',
                                'Step-by-step implementation',
                                'Time & space complexity',
                                'Common interview patterns',
                                'Edge cases to watch out for',
                                'Annotated code walkthrough',
                                'Top LeetCode problems to try',
                                'Comparison with related patterns',
                            ].map(item => (
                                <div key={item} className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                                    <Lock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                                    <span>{item}</span>
                                    <span className="ml-auto text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20 shrink-0">
                                        Soon
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Other topics in category */}
                    {currentCat.topics.filter(t => t.id !== activeTopicId).length > 0 && (
                        <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#0D1117] p-6">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                                More in {currentCat.label}
                            </h3>
                            <div className="space-y-2">
                                {currentCat.topics.filter(t => t.id !== activeTopicId).map(topic => (
                                    <button
                                        key={topic.id}
                                        onClick={() => setActiveTopicId(topic.id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-left group"
                                    >
                                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {topic.title}
                                        </span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${DIFF_COLOR[topic.difficulty]}`}>
                                            {topic.difficulty}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
