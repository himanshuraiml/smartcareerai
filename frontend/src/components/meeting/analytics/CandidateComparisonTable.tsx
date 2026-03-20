'use client';

import { useState } from 'react';
import { ArrowUpDown, ExternalLink, TrendingUp } from 'lucide-react';

interface CandidateRow {
    meetingId: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    date: string;
    hiringRecommendation: string;
    scores: { technical: number; communication: number; confidence: number; overall: number };
    recordingUrl: string | null;
    analysisStatus: string;
}

interface CandidateComparisonTableProps {
    rows: CandidateRow[];
}

type SortKey = 'candidateName' | 'date' | 'overall' | 'technical' | 'communication' | 'confidence';

const REC_STYLE: Record<string, string> = {
    STRONG_YES: 'bg-emerald-500/20 text-emerald-300',
    YES: 'bg-green-500/20 text-green-300',
    MAYBE: 'bg-amber-500/20 text-amber-300',
    NO: 'bg-red-500/20 text-red-300',
    PENDING: 'bg-zinc-700 text-zinc-400',
};

const REC_LABEL: Record<string, string> = {
    STRONG_YES: 'Strong Yes',
    YES: 'Yes',
    MAYBE: 'Maybe',
    NO: 'No',
    PENDING: 'Pending',
};

function ScoreCell({ value }: { value: number }) {
    const color = value >= 75 ? 'text-emerald-400' : value >= 50 ? 'text-amber-400' : value > 0 ? 'text-red-400' : 'text-zinc-600';
    return <span className={`font-semibold tabular-nums ${color}`}>{value > 0 ? value : '—'}</span>;
}

function SortHeader({ label, k, onSort }: { label: string; k: SortKey; onSort: (k: SortKey) => void }) {
    return (
        <th
            className="px-3 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-200 transition-colors select-none"
            onClick={() => onSort(k)}
        >
            <div className="flex items-center gap-1">
                {label}
                <ArrowUpDown className="h-3 w-3 opacity-50" />
            </div>
        </th>
    );
}

export function CandidateComparisonTable({ rows }: CandidateComparisonTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('overall');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    }

    const sorted = [...rows].sort((a, b) => {
        let va: string | number, vb: string | number;
        if (sortKey === 'candidateName') { va = a.candidateName; vb = b.candidateName; }
        else if (sortKey === 'date') { va = a.date; vb = b.date; }
        else { va = a.scores[sortKey]; vb = b.scores[sortKey]; }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                <TrendingUp className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No completed interviews yet.</p>
                <p className="text-xs mt-1 text-zinc-600">
                    Candidates will appear here after interviews are recorded and analyzed.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-zinc-800/50">
                    <tr>
                        <SortHeader label="Candidate" k="candidateName" onSort={handleSort} />
                        <SortHeader label="Date" k="date" onSort={handleSort} />
                        <th className="px-3 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Recommendation
                        </th>
                        <SortHeader label="Overall" k="overall" onSort={handleSort} />
                        <SortHeader label="Technical" k="technical" onSort={handleSort} />
                        <SortHeader label="Communication" k="communication" onSort={handleSort} />
                        <SortHeader label="Confidence" k="confidence" onSort={handleSort} />
                        <th className="px-3 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Links</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {sorted.map((row) => (
                        <tr key={row.meetingId} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="px-3 py-3">
                                <div>
                                    <p className="text-zinc-200 font-medium">{row.candidateName}</p>
                                    <p className="text-zinc-500 text-xs">{row.candidateEmail}</p>
                                </div>
                            </td>
                            <td className="px-3 py-3 text-zinc-400 text-xs whitespace-nowrap">
                                {new Date(row.date).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REC_STYLE[row.hiringRecommendation] ?? REC_STYLE.PENDING}`}>
                                    {REC_LABEL[row.hiringRecommendation] ?? row.hiringRecommendation}
                                </span>
                            </td>
                            <td className="px-3 py-3"><ScoreCell value={row.scores.overall} /></td>
                            <td className="px-3 py-3"><ScoreCell value={row.scores.technical} /></td>
                            <td className="px-3 py-3"><ScoreCell value={row.scores.communication} /></td>
                            <td className="px-3 py-3"><ScoreCell value={row.scores.confidence} /></td>
                            <td className="px-3 py-3">
                                <div className="flex gap-2">
                                    <a
                                        href={`/dashboard/meetings/${row.meetingId}/analysis`}
                                        className="text-violet-400 hover:text-violet-300 transition-colors"
                                        title="View analysis"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
