'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    FlaskConical, Zap, Star, ChevronRight, Lock,
    ArrowRight, Cpu, Globe, Shield, Bot, Code2, TrendingUp,
    Activity, Award, Play, CheckCircle2, Clock, Loader2
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

// ─── API Types ───────────────────────────────────────────────────────────────

interface ApiLab {
    id: string;
    title: string;
    duration: string;
    isFree: boolean;
    order: number;
    userStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

interface ApiTrack {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string;
    gradient: string;
    cardBg: string;
    border: string;
    tag: string;
    tagColor: string;
    totalMinutes: number;
    totalLabs: number;
    completedLabs: number;
    labs: ApiLab[];
}

interface ApiChallenge {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    reward: string;
    xpReward: number;
    deadline: string;
    submissionCount: number;
    userSubmission: { status: string; score?: number; aiFeedback?: string } | null;
}

// ─── Static Tech Radar (market data, not per-user) ───────────────────────────

const TECH_RADAR = [
    { name: 'AI Agents', trend: 'hot', demandChange: '+87%', color: 'from-orange-500 to-red-500', icon: Bot, category: 'AI/ML' },
    { name: 'LangChain / RAG', trend: 'hot', demandChange: '+72%', color: 'from-purple-500 to-pink-500', icon: Bot, category: 'AI/ML' },
    { name: 'Rust', trend: 'rising', demandChange: '+45%', color: 'from-orange-600 to-amber-500', icon: Code2, category: 'Systems' },
    { name: 'Vector DBs', trend: 'rising', demandChange: '+63%', color: 'from-cyan-500 to-blue-500', icon: Cpu, category: 'Infra' },
    { name: 'WebAssembly', trend: 'rising', demandChange: '+38%', color: 'from-blue-500 to-indigo-500', icon: Globe, category: 'Web' },
    { name: 'Web3 / Solidity', trend: 'stable', demandChange: '+12%', color: 'from-emerald-500 to-teal-500', icon: Shield, category: 'Blockchain' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: string }) {
    const config = {
        hot: { label: '🔥 Hot', cls: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30' },
        rising: { label: '⬆️ Rising', cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' },
        stable: { label: '⟷ Stable', cls: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30' },
    };
    const c = config[trend as keyof typeof config] || config.stable;
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${c.cls}`}>{c.label}</span>;
}

function LabCard({ track, onExpand }: { track: ApiTrack; onExpand: () => void }) {
    const progress = track.totalLabs > 0 ? (track.completedLabs / track.totalLabs) * 100 : 0;
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800/60 dark:backdrop-blur-sm p-5 flex flex-col gap-3 cursor-pointer group shadow-sm hover:shadow-md dark:hover:shadow-none dark:hover:border-white/20 transition-all"
            onClick={onExpand}
        >
            <div className="flex items-start justify-between gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${track.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <FlaskConical className="w-5 h-5 text-white" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${track.tagColor} flex-shrink-0`}>
                    {track.tag}
                </span>
            </div>

            <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1">{track.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{track.description}</p>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" />{track.totalLabs} micro-labs</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{track.totalMinutes} min</span>
            </div>

            {/* Progress */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-400">Progress</span>
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{track.completedLabs}/{track.totalLabs}</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${track.gradient} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <button className="flex items-center justify-center gap-2 text-sm font-semibold text-white rounded-xl py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-white/10 dark:to-white/5 hover:opacity-90 transition-opacity mt-1 group-hover:gap-3">
                {track.completedLabs === 0 ? 'Start Track' : 'Continue'} <ChevronRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

function ExpandedTrack({
    track,
    onClose,
    onStartLab,
}: {
    track: ApiTrack;
    onClose: () => void;
    onStartLab: (trackId: string, labId: string) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800/60 p-5"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${track.gradient} flex items-center justify-center`}>
                        <FlaskConical className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{track.title}</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-medium">✕ Close</button>
            </div>

            <div className="space-y-2">
                {track.labs.map((lab, i) => (
                    <div key={lab.id} className={`flex items-center gap-3 p-3 rounded-xl border ${lab.isFree ? 'bg-white/60 dark:bg-white/5 border-white/40 dark:border-white/10' : 'bg-gray-50/60 dark:bg-black/20 border-gray-200/50 dark:border-white/5'}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${lab.isFree ? `bg-gradient-to-br ${track.gradient} text-white shadow-sm` : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                            {lab.userStatus === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : lab.isFree ? i + 1 : <Lock className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${lab.isFree ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{lab.title}</p>
                            <p className="text-xs text-gray-400">{lab.duration} · {lab.userStatus === 'COMPLETED' ? '✓ Done' : lab.userStatus === 'IN_PROGRESS' ? 'In Progress' : 'Not started'}</p>
                        </div>
                        {lab.isFree ? (
                            <button
                                onClick={() => onStartLab(track.id, lab.id)}
                                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r ${track.gradient} text-white shadow-sm hover:opacity-90 flex-shrink-0`}
                            >
                                <Play className="w-3 h-3" /> {lab.userStatus === 'NOT_STARTED' ? 'Start' : 'Continue'}
                            </button>
                        ) : (
                            <span className="text-[11px] text-gray-400 flex-shrink-0 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> 1 credit
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Markdown Renderer ───────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
    // Handle bold+italic, bold, italic, inline code
    const parts = text.split(/(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-pink-600 dark:text-pink-400 text-[0.85em] font-mono">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('***') && part.endsWith('***')) {
            return <strong key={i}><em>{part.slice(3, -3)}</em></strong>;
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        return part;
    });
}

function MarkdownRenderer({ content }: { content: string }) {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // ── Code block ──────────────────────────────────────────────────────
        if (line.startsWith('```')) {
            const lang = line.slice(3).trim() || 'code';
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <div key={i} className="my-5 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-black/40">
                        <span className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest">{lang}</span>
                        <span className="text-xs text-gray-500">{codeLines.length} lines</span>
                    </div>
                    <pre className="overflow-x-auto bg-gray-900 dark:bg-black/60 p-4 text-sm">
                        <code className="text-green-300 dark:text-green-400 font-mono leading-relaxed whitespace-pre">
                            {codeLines.join('\n')}
                        </code>
                    </pre>
                </div>
            );
            i++; // skip closing ```
            continue;
        }

        // ── Horizontal rule ──────────────────────────────────────────────────
        if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
            elements.push(<hr key={i} className="my-8 border-gray-200 dark:border-white/10" />);
            i++; continue;
        }

        // ── Headings ─────────────────────────────────────────────────────────
        if (line.startsWith('#### ')) {
            elements.push(<h4 key={i} className="text-sm font-bold mt-6 mb-2 text-gray-800 dark:text-gray-200">{renderInline(line.slice(5))}</h4>);
            i++; continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-base font-bold mt-7 mb-3 text-gray-800 dark:text-gray-200">{renderInline(line.slice(4))}</h3>);
            i++; continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-xl font-bold mt-10 mb-4 pb-2 border-b border-gray-100 dark:border-white/5 text-gray-900 dark:text-white">{renderInline(line.slice(3))}</h2>);
            i++; continue;
        }
        if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className="text-3xl font-black mb-6 text-gray-900 dark:text-white">{renderInline(line.slice(2))}</h1>);
            i++; continue;
        }

        // ── Blockquote ────────────────────────────────────────────────────────
        if (line.startsWith('> ')) {
            const bqLines: string[] = [];
            while (i < lines.length && lines[i].startsWith('> ')) {
                bqLines.push(lines[i].slice(2));
                i++;
            }
            elements.push(
                <blockquote key={i} className="my-4 pl-4 border-l-4 border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-r-lg py-3 pr-4 text-sm italic text-gray-700 dark:text-gray-300 space-y-1">
                    {bqLines.map((bl, bi) => <p key={bi}>{renderInline(bl)}</p>)}
                </blockquote>
            );
            continue;
        }

        // ── Table ─────────────────────────────────────────────────────────────
        if (line.includes('|') && lines[i + 1]?.includes('---')) {
            const headers = line.split('|').map(h => h.trim()).filter(Boolean);
            i += 2; // skip header + separator
            const rows: string[][] = [];
            while (i < lines.length && lines[i].includes('|')) {
                rows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean));
                i++;
            }
            elements.push(
                <div key={i} className="my-5 overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr>{headers.map((h, hi) => <th key={hi} className="px-4 py-2.5 text-left font-bold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">{renderInline(h)}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {rows.map((row, ri) => (
                                <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    {row.map((cell, ci) => <td key={ci} className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{renderInline(cell)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }

        // ── Bullet list ───────────────────────────────────────────────────────
        if (line.startsWith('- ') || line.startsWith('* ')) {
            const listItems: string[] = [];
            while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
                listItems.push(lines[i].slice(2));
                i++;
            }
            elements.push(
                <ul key={i} className="my-3 space-y-1.5 ml-4">
                    {listItems.map((item, li) => (
                        <li key={li} className="flex items-start gap-2 text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 flex-shrink-0" />
                            <span>{renderInline(item)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // ── Numbered list ─────────────────────────────────────────────────────
        if (/^\d+\.\s/.test(line)) {
            const listItems: string[] = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                listItems.push(lines[i].replace(/^\d+\.\s/, ''));
                i++;
            }
            elements.push(
                <ol key={i} className="my-3 space-y-1.5 ml-4">
                    {listItems.map((item, li) => (
                        <li key={li} className="flex items-start gap-2.5 text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                            <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{li + 1}</span>
                            <span>{renderInline(item)}</span>
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // ── Empty line ────────────────────────────────────────────────────────
        if (line.trim() === '') {
            i++; continue;
        }

        // ── Paragraph ─────────────────────────────────────────────────────────
        elements.push(
            <p key={i} className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3 text-sm">
                {renderInline(line)}
            </p>
        );
        i++;
    }

    return <>{elements}</>;
}

// ─── Lab Simulator ───────────────────────────────────────────────────────────

interface LabDetails extends ApiLab {
    content: string;
    track: {
        id: string;
        title: string;
        gradient: string;
    };
}

function LabSimulator({
    labId,
    onClose,
    onComplete
}: {
    labId: string;
    onClose: () => void;
    onComplete: (trackId: string, labId: string) => void;
}) {
    const [lab, setLab] = useState<LabDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLab() {
            try {
                const res = await authFetch(`/future-lab/labs/${labId}`);
                const json = await res.json();
                if (json.success) setLab(json.data);
            } catch (err) {
                console.error('Failed to fetch lab details:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchLab();
    }, [labId]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!lab) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-white dark:bg-gray-950 flex flex-col"
        >
            {/* Nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{lab.track.title}</p>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{lab.title}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onComplete(lab.track.id, lab.id)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${lab.userStatus === 'COMPLETED' ? 'bg-emerald-500' : `bg-gradient-to-r ${lab.track.gradient}`}`}
                    >
                        {lab.userStatus === 'COMPLETED' ? (
                            <><CheckCircle2 className="w-4 h-4" /> Lab Completed</>
                        ) : (
                            <><Zap className="w-4 h-4" /> Complete Lab & Earn XP</>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={lab.content} />
                    </div>

                    <div className="mt-12 p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Hands-On Checklist</h4>
                        <div className="space-y-3">
                            {[
                                'Read the conceptual breakdown above',
                                'Explore the provided tool-use code examples',
                                'Complete the interactive exercise below',
                                'Verify your understanding by clicking Complete'
                            ].map((task, i) => (
                                <div key={i} className="flex items-start gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="w-5 h-5 rounded-md border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3 h-3 opacity-0" />
                                    </div>
                                    <span>{task}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FutureReadyLabPage() {
    const [activeTab, setActiveTab] = useState<'tracks' | 'radar' | 'challenge'>('tracks');
    const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
    const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

    // API state
    const [tracks, setTracks] = useState<ApiTrack[]>([]);
    const [challenge, setChallenge] = useState<ApiChallenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [githubUrl, setGithubUrl] = useState('');
    const [writeup, setWriteup] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [tracksRes, challengeRes] = await Promise.all([
                authFetch('/future-lab/tracks'),
                authFetch('/future-lab/challenges/active'),
            ]);
            const tracksJson = await tracksRes.json();
            const challengeJson = await challengeRes.json();
            if (tracksJson.success) setTracks(tracksJson.data);
            if (challengeJson.success) setChallenge(challengeJson.data);
        } catch (err) {
            console.error('Failed to load Future-Ready Lab data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleStartLab = async (trackId: string, labId: string) => {
        try {
            await authFetch(`/future-lab/labs/${labId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId }),
            });
            setTracks(prev => prev.map(t => t.id === trackId ? {
                ...t,
                labs: t.labs.map(l => l.id === labId ? { ...l, userStatus: l.userStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS' as const } : l)
            } : t));
            setSelectedLabId(labId);
        } catch (err) {
            console.error('Failed to start lab:', err);
        }
    };

    const handleCompleteLab = async (trackId: string, labId: string) => {
        try {
            const res = await authFetch(`/future-lab/labs/${labId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId }),
            });
            const data = await res.json();
            if (data.success) {
                setTracks(prev => prev.map(t => t.id === trackId ? {
                    ...t,
                    completedLabs: t.labs.find(l => l.id === labId && l.userStatus !== 'COMPLETED') ? t.completedLabs + 1 : t.completedLabs,
                    labs: t.labs.map(l => l.id === labId ? { ...l, userStatus: 'COMPLETED' as const } : l)
                } : t));
                setSelectedLabId(null);
            }
        } catch (err) {
            console.error('Failed to complete lab:', err);
        }
    };

    const handleSubmitChallenge = async () => {
        if (!challenge || (!githubUrl && !writeup)) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await authFetch(`/future-lab/challenges/${challenge.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ githubUrl: githubUrl || undefined, writeup: writeup || undefined }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setSubmitSuccess(true);
            fetchData();
        } catch (err: any) {
            setSubmitError(err.message || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const currentTrack = tracks.find(t => t.id === expandedTrackId);
    const deadlineLabel = challenge
        ? `Ends ${new Date(challenge.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
        : '';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Lab Simulator Overlay */}
            <AnimatePresence>
                {selectedLabId && (
                    <LabSimulator
                        labId={selectedLabId}
                        onClose={() => setSelectedLabId(null)}
                        onComplete={handleCompleteLab}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-xl">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4 blur-2xl" />
                </div>
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <FlaskConical style={{ width: '18px', height: '18px' }} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-200">Future-Ready Lab</span>
                    </div>
                    <h1 className="text-3xl font-black mb-1">Train for Tomorrow's Jobs</h1>
                    <p className="text-purple-200 text-sm max-w-lg">
                        Practice hands-on micro-labs in AI Agents, Rust, RAG pipelines and more —
                        the skills that will define the next 5 years of hiring.
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-purple-100">
                            <FlaskConical className="w-4 h-4" /> {tracks.reduce((s, t) => s + t.totalLabs, 0)} Micro-Labs
                        </span>
                        <span className="flex items-center gap-1.5 text-purple-100">
                            <Zap className="w-4 h-4" /> Earn XP &amp; Badges
                        </span>
                        <span className="flex items-center gap-1.5 text-purple-100">
                            <Star className="w-4 h-4" /> 2 free labs per track
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                {([
                    { id: 'tracks', label: 'Emerging Tech Tracks', icon: FlaskConical },
                    { id: 'radar', label: 'Tech Radar', icon: TrendingUp },
                    { id: 'challenge', label: 'Weekly Challenge', icon: Award },
                ] as const).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ── TRACKS TAB ── */}
                {activeTab === 'tracks' && (
                    <motion.div key="tracks" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                            {expandedTrackId && currentTrack ? (
                                <motion.div key="expanded">
                                    <ExpandedTrack track={currentTrack} onClose={() => setExpandedTrackId(null)} onStartLab={handleStartLab} />
                                </motion.div>
                            ) : (
                                <motion.div key="grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {tracks.map((track) => (
                                        <LabCard
                                            key={track.id}
                                            track={track}
                                            onExpand={() => setExpandedTrackId(track.id)}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-4 p-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-white">Looking for more validated skill paths?</p>
                                <p className="text-xs text-gray-400 mt-0.5">Your Skills page has a full Learning Roadmap tailored to your target role.</p>
                            </div>
                            <Link href="/dashboard/skills" className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                                Skills Hub <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* ── TECH RADAR TAB ── */}
                {activeTab === 'radar' && (
                    <motion.div key="radar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tech Radar Q1 2026</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Based on 50,000+ job postings this quarter</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                    Updated weekly
                                </span>
                            </div>

                            <div className="space-y-3">
                                {TECH_RADAR.map((tech, i) => {
                                    const Icon = tech.icon;
                                    return (
                                        <motion.div
                                            key={tech.name}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:bg-white dark:hover:bg-white/5 transition-all"
                                        >
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tech.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                <Icon style={{ width: '18px', height: '18px' }} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{tech.name}</p>
                                                    <TrendBadge trend={tech.trend} />
                                                    <span className="text-xs text-gray-400">{tech.category}</span>
                                                </div>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{tech.demandChange} demand this quarter</p>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('tracks')}
                                                className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r ${tech.color} text-white shadow-sm hover:opacity-90 transition-opacity`}
                                            >
                                                <Play className="w-3 h-3" /> Practice
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── WEEKLY CHALLENGE TAB ── */}
                {activeTab === 'challenge' && (
                    <motion.div key="challenge" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        {challenge ? (
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-200 dark:border-indigo-500/20 p-6">
                                {deadlineLabel && (
                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold">
                                        <Clock className="w-3 h-3" /> {deadlineLabel}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                                        <Award className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Week's Challenge</p>
                                        <h2 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{challenge.title}</h2>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 max-w-lg">{challenge.description}</p>

                                <div className="flex flex-wrap items-center gap-3 mb-5">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-sm">
                                        <Zap className="w-4 h-4 text-indigo-500" />
                                        <span className="font-semibold text-gray-700 dark:text-white">{challenge.reward}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-sm">
                                        <Globe className="w-4 h-4 text-emerald-500" />
                                        <span className="font-semibold text-gray-700 dark:text-white">{challenge.submissionCount} submissions</span>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                                        {challenge.difficulty}
                                    </span>
                                </div>

                                {/* Submission UI */}
                                {challenge.userSubmission ? (
                                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm mb-1">
                                            <CheckCircle2 className="w-4 h-4" /> Submission received — {challenge.userSubmission.status}
                                        </div>
                                        {challenge.userSubmission.score !== undefined && (
                                            <p className="text-xs text-green-600 dark:text-green-300">Score: {challenge.userSubmission.score}/100</p>
                                        )}
                                    </div>
                                ) : submitSuccess ? (
                                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 font-semibold text-sm flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Submitted! +25 XP awarded.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            type="url"
                                            placeholder="GitHub repo URL (optional)"
                                            value={githubUrl}
                                            onChange={e => setGithubUrl(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                        />
                                        <textarea
                                            placeholder="Write a brief explanation of your approach... (optional if GitHub URL provided)"
                                            value={writeup}
                                            onChange={e => setWriteup(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                                        />
                                        {submitError && <p className="text-xs text-red-500">{submitError}</p>}
                                        <button
                                            onClick={handleSubmitChallenge}
                                            disabled={submitting || (!githubUrl && !writeup)}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                            Submit Your Solution
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 text-center rounded-2xl border border-gray-100 dark:border-white/5 text-gray-400">
                                No active challenge this week. Check back Monday!
                            </div>
                        )}

                        {/* How It Works */}
                        <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">How Weekly Challenges Work</h3>
                            <div className="space-y-3">
                                {[
                                    { step: '1', title: 'A new challenge drops every Monday', desc: 'Themed around trending tech — AI, Cloud, Systems, etc.' },
                                    { step: '2', title: 'Build & document your solution', desc: 'Submit a GitHub link or write a short technical breakdown.' },
                                    { step: '3', title: 'AI evaluates your submission', desc: "You'll get a quality score, feedback, and XP rewards." },
                                    { step: '4', title: 'Top 3 featured in leaderboard', desc: 'First place earns 1 free AI Interview credit.' },
                                ].map((item) => (
                                    <div key={item.step} className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
                                            {item.step}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
