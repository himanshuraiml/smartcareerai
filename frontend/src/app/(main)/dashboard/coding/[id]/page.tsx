'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    Play, Send, ChevronLeft, CheckCircle2, XCircle, Loader2,
    AlertTriangle, Clock, Zap, Code2, BookOpen, TestTube2,
    TrendingUp, Lightbulb, CreditCard, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

// Monaco Editor — loaded client-side only (heavy bundle)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface Example {
    input: string;
    output: string;
    explanation?: string;
}

interface TestCase {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    category: string;
    tags: string[];
    languages: string[];
    starterCode: Record<string, string>;
    testCases: TestCase[];
    examples: Example[];
    constraints: string | null;
    timeLimit: number;
    memoryLimit: number;
}

interface TestResult {
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
}

interface AIAnalysis {
    score: number;
    feedback: string;
    timeComplexity: string;
    spaceComplexity: string;
    improvements: string[];
    codeQuality: { readability: number; efficiency: number; correctness: number };
    alternativeApproach?: string;
}

interface SubmissionResult {
    submissionId: string;
    status: string;
    score: number;
    testsPassed: number;
    totalTests: number;
    visibleResults: TestResult[];
    hiddenSummary: { passed: number; total: number };
    executionTimeMs: number;
    aiAnalysis: AIAnalysis | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    MEDIUM: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    HARD: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const MONACO_LANGUAGE: Record<string, string> = {
    python: 'python',
    javascript: 'javascript',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    typescript: 'typescript',
    go: 'go',
    rust: 'rust',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    ACCEPTED: { label: 'Accepted', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: <CheckCircle2 className="w-4 h-4" /> },
    WRONG_ANSWER: { label: 'Wrong Answer', color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: <XCircle className="w-4 h-4" /> },
    RUNTIME_ERROR: { label: 'Runtime Error', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', icon: <AlertTriangle className="w-4 h-4" /> },
    COMPILATION_ERROR: { label: 'Compilation Error', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', icon: <AlertTriangle className="w-4 h-4" /> },
    TIME_LIMIT_EXCEEDED: { label: 'Time Limit Exceeded', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: <Clock className="w-4 h-4" /> },
};

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function CircleScore({ value, size = 56 }: { value: number; size?: number }) {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    const color = value >= 80 ? '#34d399' : value >= 50 ? '#fbbf24' : '#f87171';

    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#374151" strokeWidth={4} />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={4}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
        </svg>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export default function CodingRoomPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loadingChallenge, setLoadingChallenge] = useState(true);

    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState('');

    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [runResults, setRunResults] = useState<TestResult[] | null>(null);
    const [submission, setSubmission] = useState<SubmissionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showCreditsModal, setShowCreditsModal] = useState(false);

    // Active bottom tab: 'problem' | 'results' | 'analysis'
    const [activeTab, setActiveTab] = useState<'problem' | 'results' | 'analysis'>('problem');
    const [bottomOpen, setBottomOpen] = useState(true);

    const editorRef = useRef<any>(null);

    // ── Fetch challenge ──────────────────────────────────────────────────────

    const fetchChallenge = useCallback(async () => {
        try {
            const res = await authFetch(`/coding/challenges/${id}`);
            if (!res.ok) throw new Error('Failed to load challenge');
            const data = await res.json();
            const ch: Challenge = data.data;
            setChallenge(ch);

            // Initialise language to first supported
            const firstLang = ch.languages[0] || 'python';
            setLanguage(firstLang);
            setCode((ch.starterCode as any)[firstLang] || '');
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingChallenge(false);
        }
    }, [id]);

    useEffect(() => { fetchChallenge(); }, [fetchChallenge]);

    // ── Language switch ──────────────────────────────────────────────────────

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        if (challenge?.starterCode) {
            setCode((challenge.starterCode as any)[lang] || '');
        }
        setRunResults(null);
        setSubmission(null);
    };

    // ── Run (free, visible test cases only) ─────────────────────────────────

    const handleRun = async () => {
        if (!challenge) return;
        setRunning(true);
        setError(null);
        setRunResults(null);
        setSubmission(null);
        setActiveTab('results');
        setBottomOpen(true);

        try {
            const res = await authFetch(`/coding/challenges/${id}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Run failed');
            setRunResults(data.data.results);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRunning(false);
        }
    };

    // ── Submit (costs 1 credit, runs all tests + AI analysis) ───────────────

    const handleSubmit = async () => {
        if (!challenge) return;
        setSubmitting(true);
        setError(null);
        setRunResults(null);
        setSubmission(null);
        setActiveTab('results');
        setBottomOpen(true);

        try {
            const res = await authFetch(`/coding/challenges/${id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code }),
            });
            const data = await res.json();

            if (res.status === 402) {
                setShowCreditsModal(true);
                return;
            }
            if (!res.ok) throw new Error(data.error || 'Submission failed');

            setSubmission(data.data);
            if (data.data.aiAnalysis) setActiveTab('analysis');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Reset to starter code ────────────────────────────────────────────────

    const handleReset = () => {
        if (challenge?.starterCode) {
            setCode((challenge.starterCode as any)[language] || '');
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────────────────

    if (loadingChallenge) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center gap-4">
                <Code2 className="w-12 h-12 text-gray-600" />
                <p className="text-gray-400">Challenge not found.</p>
                <button onClick={() => router.back()} className="text-violet-400 hover:underline text-sm">
                    Go back
                </button>
            </div>
        );
    }

    const diffClass = DIFFICULTY_COLORS[challenge.difficulty] || 'text-gray-400';

    return (
        <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">

            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h1 className="font-semibold text-white text-sm truncate max-w-xs">{challenge.title}</h1>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${diffClass}`}>
                        {challenge.difficulty}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language selector */}
                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
                    >
                        {challenge.languages.map((l) => (
                            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                        ))}
                    </select>

                    {/* Reset */}
                    <button
                        onClick={handleReset}
                        title="Reset to starter code"
                        className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Run */}
                    <button
                        onClick={handleRun}
                        disabled={running || submitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                        Run
                    </button>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={running || submitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white disabled:opacity-50 transition-colors"
                    >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Submit
                    </button>
                </div>
            </div>

            {/* ── Main split ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left: Problem panel ── */}
                <div className="w-[42%] flex-shrink-0 flex flex-col border-r border-gray-800 overflow-y-auto">

                    {/* Problem tabs */}
                    <div className="flex border-b border-gray-800 px-4 pt-3 gap-4">
                        {(['problem', 'results', 'analysis'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setBottomOpen(true); }}
                                className={`pb-2 text-xs font-medium capitalize border-b-2 transition-colors ${
                                    activeTab === tab
                                        ? 'border-violet-500 text-violet-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {tab === 'problem' && <BookOpen className="w-3 h-3 inline mr-1" />}
                                {tab === 'results' && <TestTube2 className="w-3 h-3 inline mr-1" />}
                                {tab === 'analysis' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 p-4 overflow-y-auto">

                        {/* ── PROBLEM TAB ── */}
                        {activeTab === 'problem' && (
                            <div className="space-y-5">
                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5">
                                    {challenge.tags.map((tag) => (
                                        <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Description */}
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                        {challenge.description}
                                    </p>
                                </div>

                                {/* Examples */}
                                {challenge.examples && challenge.examples.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Examples</h3>
                                        <div className="space-y-3">
                                            {(challenge.examples as Example[]).map((ex, i) => (
                                                <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1 font-medium">Example {i + 1}</div>
                                                    <div className="font-mono text-xs">
                                                        <div className="text-gray-400"><span className="text-gray-500">Input:</span> {ex.input}</div>
                                                        <div className="text-gray-400"><span className="text-gray-500">Output:</span> {ex.output}</div>
                                                        {ex.explanation && (
                                                            <div className="text-gray-500 mt-1 italic">{ex.explanation}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Constraints */}
                                {challenge.constraints && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Constraints</h3>
                                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                                            <p className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{challenge.constraints}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Visible test cases */}
                                {challenge.testCases.filter((tc) => !tc.isHidden).length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Test Cases</h3>
                                        <div className="space-y-2">
                                            {challenge.testCases.filter((tc) => !tc.isHidden).map((tc, i) => (
                                                <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-3 font-mono text-xs">
                                                    <div className="text-gray-400"><span className="text-gray-500">Input:</span> {tc.input}</div>
                                                    <div className="text-gray-400"><span className="text-gray-500">Expected:</span> {tc.expectedOutput}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── RESULTS TAB ── */}
                        {activeTab === 'results' && (
                            <div className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Submission status banner */}
                                {submission && (
                                    <div>
                                        {(() => {
                                            const cfg = STATUS_CONFIG[submission.status] ?? {
                                                label: submission.status,
                                                color: 'text-gray-400 bg-gray-800 border-gray-700',
                                                icon: null,
                                            };
                                            return (
                                                <div className={`flex items-center gap-2 p-3 rounded-lg border ${cfg.color}`}>
                                                    {cfg.icon}
                                                    <span className="font-semibold text-sm">{cfg.label}</span>
                                                    <span className="ml-auto text-xs opacity-70">
                                                        {submission.testsPassed}/{submission.totalTests} passed · {submission.executionTimeMs}ms
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* Hidden test summary */}
                                        {submission.hiddenSummary.total > 0 && (
                                            <div className="mt-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-400 flex items-center gap-2">
                                                <span>Hidden tests:</span>
                                                <span className={submission.hiddenSummary.passed === submission.hiddenSummary.total ? 'text-emerald-400' : 'text-red-400'}>
                                                    {submission.hiddenSummary.passed}/{submission.hiddenSummary.total} passed
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Per-case results */}
                                {(runResults || submission?.visibleResults) && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                            {submission ? 'Visible Test Results' : 'Run Results'}
                                        </h3>
                                        {(runResults || submission!.visibleResults).map((r, i) => (
                                            <div
                                                key={i}
                                                className={`p-3 rounded-lg border ${r.passed
                                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                                    : 'bg-red-500/5 border-red-500/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    {r.passed
                                                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                        : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                                    <span className="text-xs font-medium text-gray-300">Case {i + 1}</span>
                                                </div>
                                                <div className="font-mono text-xs space-y-0.5">
                                                    <div className="text-gray-500">Input: <span className="text-gray-300">{r.input}</span></div>
                                                    <div className="text-gray-500">Expected: <span className="text-gray-300">{r.expectedOutput}</span></div>
                                                    <div className="text-gray-500">Got: <span className={r.passed ? 'text-emerald-400' : 'text-red-400'}>{r.actualOutput}</span></div>
                                                    {r.error && <div className="text-orange-400 mt-1">{r.error}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!runResults && !submission && !error && (
                                    <div className="text-center py-12 text-gray-600">
                                        <TestTube2 className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-sm">Run your code to see results here.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── ANALYSIS TAB ── */}
                        {activeTab === 'analysis' && (
                            <div className="space-y-5">
                                {!submission?.aiAnalysis && (
                                    <div className="text-center py-12 text-gray-600">
                                        <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-sm">Submit your solution to get AI analysis.</p>
                                    </div>
                                )}

                                {submission?.aiAnalysis && (() => {
                                    const ai = submission.aiAnalysis!;
                                    return (
                                        <>
                                            {/* Score circle */}
                                            <div className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                                                <div className="relative">
                                                    <CircleScore value={ai.score} size={64} />
                                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                                        {ai.score}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">Overall Score</div>
                                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{ai.feedback}</p>
                                                </div>
                                            </div>

                                            {/* Complexity */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Time Complexity</div>
                                                    <div className="font-mono text-sm font-bold text-violet-400">{ai.timeComplexity}</div>
                                                </div>
                                                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Space Complexity</div>
                                                    <div className="font-mono text-sm font-bold text-violet-400">{ai.spaceComplexity}</div>
                                                </div>
                                            </div>

                                            {/* Code quality bars */}
                                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Code Quality</h3>
                                                {([
                                                    ['Readability', ai.codeQuality.readability],
                                                    ['Efficiency', ai.codeQuality.efficiency],
                                                    ['Correctness', ai.codeQuality.correctness],
                                                ] as [string, number][]).map(([label, val]) => (
                                                    <div key={label} className="mb-2">
                                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                            <span>{label}</span><span>{val}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-700"
                                                                style={{
                                                                    width: `${val}%`,
                                                                    background: val >= 80 ? '#34d399' : val >= 50 ? '#fbbf24' : '#f87171',
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Improvements */}
                                            {ai.improvements.length > 0 && (
                                                <div>
                                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                                        <Lightbulb className="w-3 h-3 inline mr-1 text-amber-400" />
                                                        Suggestions
                                                    </h3>
                                                    <ul className="space-y-1.5">
                                                        {ai.improvements.map((imp, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                                                <span className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 flex-shrink-0 flex items-center justify-center text-[10px] mt-0.5">
                                                                    {i + 1}
                                                                </span>
                                                                {imp}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Alternative approach */}
                                            {ai.alternativeApproach && (
                                                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                                                    <div className="text-xs font-semibold text-violet-400 mb-1">Better Approach</div>
                                                    <p className="text-xs text-gray-300">{ai.alternativeApproach}</p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Editor ── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <MonacoEditor
                        height="100%"
                        language={MONACO_LANGUAGE[language] || language}
                        value={code}
                        onChange={(val) => setCode(val || '')}
                        onMount={(editor) => { editorRef.current = editor; }}
                        theme="vs-dark"
                        options={{
                            fontSize: 13,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            lineNumbers: 'on',
                            roundedSelection: true,
                            wordWrap: 'on',
                            automaticLayout: true,
                            padding: { top: 12, bottom: 12 },
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontLigatures: true,
                            tabSize: language === 'python' ? 4 : 2,
                        }}
                    />
                </div>
            </div>

            {/* ── Credits modal ── */}
            {showCreditsModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <CreditCard className="w-5 h-5 text-amber-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Out of Credits</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-5">
                            Submitting a solution costs 1 Skill Test credit. You can still use{' '}
                            <strong className="text-white">Run</strong> for free to test visible cases.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreditsModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <a
                                href="/dashboard/billing"
                                className="flex-1 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium text-center transition-colors"
                            >
                                Get Credits
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
