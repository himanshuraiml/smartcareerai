'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface AttemptResult {
    id: string;
    status: string;
    analyticalScore: number | null;
    behavioralScore: number | null;
    overallScore: number | null;
    proctoringScore: number | null;
    recruiterFlagged?: boolean;
    startedAt: string;
    completedAt: string | null;
    student: { id: string; name: string; email: string } | null;
}

export const AssessmentReportingDashboard = ({ jobId }: { jobId: string }) => {
    const [attempts, setAttempts] = useState<AttemptResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!jobId) return;
        setLoading(true);
        authFetch(`/assessments/attempts/job/${jobId}`)
            .then(r => r.json())
            .then(({ data }) => setAttempts(data ?? []))
            .catch(() => setAttempts([]))
            .finally(() => setLoading(false));
    }, [jobId]);

    const completed = attempts.filter(a => a.status === 'COMPLETED');
    const flagged = attempts.filter(a => a.status === 'FLAGGED' || a.recruiterFlagged);
    const avgScore = completed.length > 0
        ? Math.round(completed.reduce((s, a) => s + (a.overallScore ?? 0), 0) / completed.length)
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading assessment results…
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attempts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {avgScore != null ? `${avgScore}%` : '—'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Attempts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{flagged.length}</div>
                    </CardContent>
                </Card>
            </div>

            {attempts.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No assessment attempts yet for this job.
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Candidate Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Analytical</TableHead>
                                    <TableHead>Behavioral</TableHead>
                                    <TableHead>Overall</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attempts.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-medium">
                                            {a.student?.name ?? 'Unknown'}
                                            <div className="text-xs text-muted-foreground">{a.student?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            {a.analyticalScore != null ? `${a.analyticalScore}%` : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {a.behavioralScore != null ? `${a.behavioralScore}%` : '—'}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {a.overallScore != null ? `${a.overallScore}%` : (
                                                a.status === 'EVALUATING'
                                                    ? <span className="text-muted-foreground text-xs">Scoring…</span>
                                                    : '—'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                a.status === 'FLAGGED' ? 'destructive'
                                                    : a.status === 'COMPLETED' ? 'default'
                                                        : 'secondary'
                                            }>
                                                {a.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {a.completedAt
                                                ? new Date(a.completedAt).toLocaleDateString()
                                                : new Date(a.startedAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
