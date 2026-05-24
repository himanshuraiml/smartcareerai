'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Code2, ChevronRight, Clock, Layers, Zap, GitBranch,
    BookOpen, Terminal, FlaskConical, CheckCircle2, ExternalLink,
    Lightbulb, AlertTriangle, Target, Trophy, ChevronDown, ChevronUp,
    Copy, Check, ArrowRight,
} from 'lucide-react';
import { DSA_CONTENT, TopicContent } from '@/data/dsa-content';

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
        id: 'arrays', label: 'Arrays & Strings', icon: Layers, color: 'text-blue-400',
        topics: [
            { id: 'two-pointers', title: 'Two Pointers', difficulty: 'Easy', estMinutes: 20 },
            { id: 'sliding-window', title: 'Sliding Window', difficulty: 'Medium', estMinutes: 25 },
            { id: 'prefix-sum', title: 'Prefix Sum', difficulty: 'Easy', estMinutes: 15 },
            { id: 'kadane', title: "Kadane's Algorithm", difficulty: 'Medium', estMinutes: 20 },
        ],
    },
    {
        id: 'linked-lists', label: 'Linked Lists', icon: GitBranch, color: 'text-violet-400',
        topics: [
            { id: 'reverse-ll', title: 'Reverse Linked List', difficulty: 'Easy', estMinutes: 15 },
            { id: 'floyd-cycle', title: "Floyd's Cycle Detection", difficulty: 'Medium', estMinutes: 20 },
            { id: 'merge-sorted-ll', title: 'Merge Two Sorted Lists', difficulty: 'Easy', estMinutes: 15 },
            { id: 'll-nth-end', title: 'Remove Nth from End', difficulty: 'Medium', estMinutes: 20 },
        ],
    },
    {
        id: 'trees', label: 'Trees', icon: GitBranch, color: 'text-emerald-400',
        topics: [
            { id: 'tree-traversals', title: 'DFS & BFS Traversals', difficulty: 'Easy', estMinutes: 25 },
            { id: 'bst-ops', title: 'Binary Search Tree', difficulty: 'Medium', estMinutes: 30 },
            { id: 'lca', title: 'Lowest Common Ancestor', difficulty: 'Medium', estMinutes: 25 },
            { id: 'max-depth', title: 'Max Depth of Tree', difficulty: 'Easy', estMinutes: 15 },
        ],
    },
    {
        id: 'graphs', label: 'Graphs', icon: GitBranch, color: 'text-orange-400',
        topics: [
            { id: 'graph-bfs-dfs', title: 'BFS & DFS on Graphs', difficulty: 'Medium', estMinutes: 30 },
            { id: 'topo-sort', title: 'Topological Sort', difficulty: 'Medium', estMinutes: 30 },
            { id: 'dijkstra', title: "Dijkstra's Algorithm", difficulty: 'Hard', estMinutes: 40 },
            { id: 'union-find', title: 'Union Find (DSU)', difficulty: 'Medium', estMinutes: 35 },
        ],
    },
    {
        id: 'dp', label: 'Dynamic Programming', icon: Zap, color: 'text-amber-400',
        topics: [
            { id: 'dp-1d', title: '1D DP — Fibonacci & Climbing Stairs', difficulty: 'Easy', estMinutes: 20 },
            { id: 'dp-knapsack', title: '0/1 Knapsack', difficulty: 'Medium', estMinutes: 35 },
            { id: 'dp-lcs', title: 'LCS & Edit Distance', difficulty: 'Hard', estMinutes: 45 },
            { id: 'dp-trees', title: 'DP on Trees', difficulty: 'Hard', estMinutes: 50 },
        ],
    },
    {
        id: 'sorting', label: 'Sorting & Searching', icon: Layers, color: 'text-cyan-400',
        topics: [
            { id: 'binary-search', title: 'Binary Search', difficulty: 'Easy', estMinutes: 20 },
            { id: 'quick-merge', title: 'Quick Sort & Merge Sort', difficulty: 'Medium', estMinutes: 30 },
            { id: 'rotated-array', title: 'Search in Rotated Array', difficulty: 'Medium', estMinutes: 25 },
        ],
    },
    {
        id: 'stack-queue', label: 'Stack & Queue', icon: Layers, color: 'text-rose-400',
        topics: [
            { id: 'monotonic-stack', title: 'Monotonic Stack', difficulty: 'Medium', estMinutes: 25 },
            { id: 'next-greater', title: 'Next Greater Element', difficulty: 'Medium', estMinutes: 20 },
            { id: 'sliding-max', title: 'Sliding Window Maximum', difficulty: 'Hard', estMinutes: 35 },
        ],
    },
    {
        id: 'backtracking', label: 'Backtracking', icon: FlaskConical, color: 'text-pink-400',
        topics: [
            { id: 'subsets-perms', title: 'Subsets & Permutations', difficulty: 'Medium', estMinutes: 30 },
            { id: 'n-queens', title: 'N-Queens', difficulty: 'Hard', estMinutes: 45 },
            { id: 'sudoku', title: 'Sudoku Solver', difficulty: 'Hard', estMinutes: 45 },
        ],
    },
    {
        id: 'bits', label: 'Bit Manipulation', icon: Terminal, color: 'text-indigo-400',
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

const DIFF_DOT: Record<Difficulty, string> = {
    Easy: 'bg-emerald-400',
    Medium: 'bg-amber-400',
    Hard: 'bg-rose-400',
};

function ComplexityBadge({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col items-center gap-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/8 rounded-xl px-4 py-3 min-w-[110px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-black text-gray-900 dark:text-white font-mono">{value}</span>
        </div>
    );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-white/[0.04] border-b border-gray-200 dark:border-white/8">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="text-xs text-gray-400 font-mono ml-2">{language}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm leading-relaxed bg-gray-50 dark:bg-[#0B0F19]">
                <code className="text-gray-800 dark:text-gray-200 font-mono whitespace-pre">{code}</code>
            </pre>
        </div>
    );
}

function LCProblemBadge({ difficulty }: { difficulty: Difficulty }) {
    const colors: Record<Difficulty, string> = {
        Easy: 'text-emerald-500 dark:text-emerald-400',
        Medium: 'text-amber-500 dark:text-amber-400',
        Hard: 'text-rose-500 dark:text-rose-400',
    };
    return <span className={`text-xs font-bold ${colors[difficulty]}`}>{difficulty}</span>;
}

function Section({ title, icon: Icon, iconColor, children }: {
    title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode;
}) {
    const [open, setOpen] = useState(true);
    return (
        <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#0D1117] overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/[0.05]`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white flex-1">{title}</span>
                {open
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                }
            </button>
            {open && <div className="px-6 pb-6 pt-1">{children}</div>}
        </div>
    );
}

function TopicContentView({ content, topicTitle }: { content: TopicContent; topicTitle: string }) {
    return (
        <div className="space-y-4">

            {/* Complexity Strip */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#0D1117] p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Complexity</p>
                <div className="flex flex-wrap gap-3">
                    <ComplexityBadge label="Time" value={content.timeComplexity} />
                    <ComplexityBadge label="Space" value={content.spaceComplexity} />
                </div>
                {content.complexityNote && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/6 pt-3">
                        {content.complexityNote}
                    </p>
                )}
            </div>

            {/* Intuition */}
            <Section title="Core Intuition" icon={Lightbulb} iconColor="text-amber-400">
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{content.intuition}</p>
                </div>
            </Section>

            {/* When to Use */}
            <Section title="When to Use This Pattern" icon={Target} iconColor="text-blue-400">
                <ul className="space-y-2">
                    {content.whenToUse.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                            <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </Section>

            {/* Step-by-Step Approach */}
            <Section title="Step-by-Step Approach" icon={CheckCircle2} iconColor="text-emerald-400">
                <ol className="space-y-3">
                    {content.approach.map((s) => (
                        <li key={s.step} className="flex gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {s.step}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 leading-relaxed">{s.text}</span>
                        </li>
                    ))}
                </ol>
            </Section>

            {/* Code */}
            <Section title="Annotated Implementation" icon={Code2} iconColor="text-violet-400">
                <div className="space-y-4">
                    <CodeBlock code={content.code.code} language={content.code.language} />
                    {content.annotations.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key Lines Explained</p>
                            {content.annotations.map((ann, i) => (
                                <div key={i} className="rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/6 p-3">
                                    <code className="text-xs font-mono text-violet-600 dark:text-violet-400 block mb-1.5 break-all">{ann.line}</code>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ann.note}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Section>

            {/* Patterns */}
            {content.patterns.length > 0 && (
                <Section title="Common Patterns & Variants" icon={Zap} iconColor="text-cyan-400">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {content.patterns.map((p, i) => (
                            <div key={i} className="rounded-xl border border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/[0.02] p-4">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">{p.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{p.description}</p>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Comparison */}
            {content.comparison && content.comparison.length > 0 && (
                <Section title="Pattern Comparison" icon={Layers} iconColor="text-orange-400">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/8">
                                    <th className="text-left py-2 pr-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Technique</th>
                                    <th className="text-left py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Use When</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {content.comparison.map((row, i) => (
                                    <tr key={i}>
                                        <td className="py-2.5 pr-4 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{row.technique}</td>
                                        <td className="py-2.5 text-gray-500 dark:text-gray-400 leading-relaxed">{row.useWhen}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            )}

            {/* Edge Cases */}
            <Section title="Edge Cases to Watch" icon={AlertTriangle} iconColor="text-rose-400">
                <div className="grid gap-2 sm:grid-cols-2">
                    {content.edgeCases.map((ec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/15">
                            <span className="text-rose-400 mt-0.5 shrink-0 font-bold text-xs">!</span>
                            <span className="text-gray-600 dark:text-gray-400 leading-relaxed">{ec}</span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Interview Tips */}
            {content.interviewTips && content.interviewTips.length > 0 && (
                <Section title="Interview Tips" icon={Trophy} iconColor="text-amber-400">
                    <div className="space-y-2.5">
                        {content.interviewTips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm">
                                <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{tip}</p>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* LeetCode Problems */}
            <Section title="Top LeetCode Problems" icon={BookOpen} iconColor="text-indigo-400">
                <div className="space-y-2">
                    {content.leetcodeProblems.map((p) => (
                        <a
                            key={p.id}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/6 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group"
                        >
                            <span className="text-xs font-bold text-gray-400 w-10 shrink-0">#{p.id}</span>
                            <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {p.title}
                            </span>
                            <LCProblemBadge difficulty={p.difficulty} />
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" />
                        </a>
                    ))}
                </div>
            </Section>

        </div>
    );
}

function ComingSoonContent({ topicTitle }: { topicTitle: string }) {
    return (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D1117] p-10">
            <div className="max-w-md mx-auto text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
                    <BookOpen className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Content Coming Soon</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    We&apos;re preparing an in-depth guide for{' '}
                    <strong className="text-gray-700 dark:text-gray-200">{topicTitle}</strong>{' '}
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
    );
}

export default function DSAGuidePage() {
    const [activeCatId, setActiveCatId] = useState<string>(CATEGORIES[0].id);
    const [activeTopicId, setActiveTopicId] = useState<string>(CATEGORIES[0].topics[0].id);

    const currentCat = CATEGORIES.find(c => c.id === activeCatId)!;
    const currentTopic = ALL_TOPICS.find(t => t.id === activeTopicId)!;
    const content = DSA_CONTENT[activeTopicId];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19]">

            {/* Page Header */}
            <div className="border-b border-gray-200 dark:border-white/8 bg-white dark:bg-[#0D1117] px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Code2 className="w-5 h-5 text-blue-500" />
                            <h1 className="text-xl font-black text-gray-900 dark:text-white">DSA Guide</h1>
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">New</span>
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
                            <Terminal className="w-4 h-4" /> Coding Challenges
                        </Link>
                        <Link
                            href="/dashboard/tests"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <FlaskConical className="w-4 h-4" /> Skill Tests
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

                {/* ── Sidebar ── */}
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
                                                    const hasContent = !!DSA_CONTENT[topic.id];
                                                    return (
                                                        <button
                                                            key={topic.id}
                                                            onClick={() => setActiveTopicId(topic.id)}
                                                            className={`w-full flex items-center gap-3 pl-10 pr-4 py-2.5 text-left transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                        >
                                                            <span className={`text-sm flex-1 ${isActive ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                {topic.title}
                                                            </span>
                                                            {hasContent && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Content available" />
                                                            )}
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

                {/* ── Main Content ── */}
                <main className="flex-1 min-w-0 space-y-4">

                    {/* Topic Header */}
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
                                    {content && (
                                        <>
                                            <span className="text-gray-300 dark:text-gray-600">·</span>
                                            <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                Guide Ready
                                            </span>
                                        </>
                                    )}
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
                                    <Code2 className="w-4 h-4" /> Solve Problems
                                </Link>
                                <Link
                                    href="/dashboard/tests"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/20"
                                >
                                    <FlaskConical className="w-4 h-4" /> Practice Test
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {content
                        ? <TopicContentView content={content} topicTitle={currentTopic.title} />
                        : <ComingSoonContent topicTitle={currentTopic.title} />
                    }

                    {/* More in category */}
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
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${DIFF_DOT[topic.difficulty]}`} />
                                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {topic.title}
                                        </span>
                                        {DSA_CONTENT[topic.id] && (
                                            <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                                Ready
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${DIFF_COLOR[topic.difficulty]} shrink-0`}>
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
