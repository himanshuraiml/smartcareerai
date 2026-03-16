'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';

interface Attempt {
    id: string;
    status: 'IN_PROGRESS' | 'EVALUATING' | 'COMPLETED' | 'FLAGGED';
    startedAt: string;
    completedAt?: string;
    overallScore?: number;
    template: {
        durationMinutes: number;
        totalQuestions: number;
        job: { id: string; title: string };
    };
}

interface AvailableAssessment {
    templateId: string;
    durationMinutes: number;
    totalQuestions: number;
    job: { id: string; title: string };
}

const statusConfig: Record<Attempt['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    IN_PROGRESS: { label: 'In Progress', variant: 'default', icon: <Clock className="w-3 h-3" /> },
    EVALUATING: { label: 'Under Review', variant: 'secondary', icon: <ClipboardList className="w-3 h-3" /> },
    COMPLETED: { label: 'Completed', variant: 'outline', icon: <CheckCircle className="w-3 h-3" /> },
    FLAGGED: { label: 'Flagged', variant: 'destructive', icon: <AlertCircle className="w-3 h-3" /> },
};

export default function CandidateAssessmentsPage() {
    const router = useRouter();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [available, setAvailable] = useState<AvailableAssessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [starting, setStarting] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            authFetch('/assessments/attempts/my').then(r => r.json()),
            authFetch('/assessments/available').then(r => r.json()),
        ])
            .then(([attemptsRes, availableRes]) => {
                setAttempts(attemptsRes.data ?? []);
                setAvailable(availableRes.data ?? []);
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    async function startAssessment(templateId: string) {
        setStarting(templateId);
        try {
            const res = await authFetch('/assessments/attempts/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId }),
            });
            const { data } = await res.json();
            router.push(`/candidate/assessments/${data.id}`);
        } catch (e: any) {
            setError(e.message);
            setStarting(null);
        }
    }

    if (loading) return <div className="p-12 text-center text-muted-foreground">Loading assessments…</div>;
    if (error) return <div className="p-12 text-center text-destructive">Failed to load: {error}</div>;

    const hasAny = available.length > 0 || attempts.length > 0;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-2xl font-bold">My Assessments</h1>
                <p className="text-muted-foreground text-sm mt-1">Assessments assigned by recruiters as part of your applications.</p>
            </div>

            {!hasAny && (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No assessments yet. They will appear here when a recruiter moves your application to the screening stage.</p>
                    </CardContent>
                </Card>
            )}

            {/* Pending / Available assessments to start */}
            {available.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending — Action Required</h2>
                    {available.map(a => (
                        <Card key={a.templateId} className="border-primary/40 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-4">
                                    <CardTitle className="text-base font-semibold">
                                        {a.job?.title ?? 'Assessment'}
                                    </CardTitle>
                                    <Badge variant="default" className="flex items-center gap-1 shrink-0">
                                        <PlayCircle className="w-3 h-3" /> Not Started
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between gap-4">
                                <p className="text-sm text-muted-foreground">
                                    {a.totalQuestions} questions · {a.durationMinutes} minutes
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => startAssessment(a.templateId)}
                                    disabled={starting === a.templateId}
                                >
                                    {starting === a.templateId ? 'Starting…' : 'Start Assessment'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Existing attempts */}
            {attempts.length > 0 && (
                <div className="space-y-3">
                    {available.length > 0 && (
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Previous Attempts</h2>
                    )}
                    {attempts.map(a => {
                        const cfg = statusConfig[a.status];
                        const isPending = a.status === 'IN_PROGRESS';
                        return (
                            <Card key={a.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <CardTitle className="text-base font-semibold">
                                            {a.template?.job?.title ?? 'Assessment'}
                                        </CardTitle>
                                        <Badge variant={cfg.variant} className="flex items-center gap-1 shrink-0">
                                            {cfg.icon} {cfg.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between gap-4">
                                    <div className="text-sm text-muted-foreground space-y-0.5">
                                        <p>{a.template?.totalQuestions ?? '—'} questions · {a.template?.durationMinutes ?? '—'} minutes</p>
                                        <p>Started: {new Date(a.startedAt).toLocaleDateString()}</p>
                                        {a.overallScore != null && (
                                            <p className="font-medium text-foreground">Score: {a.overallScore}%</p>
                                        )}
                                    </div>
                                    {isPending && (
                                        <Link href={`/candidate/assessments/${a.id}`}>
                                            <Button size="sm">Continue Assessment</Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
