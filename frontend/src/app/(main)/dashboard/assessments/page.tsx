'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    CheckCircle2, Clock, AlertCircle, PlayCircle,
    Building2, Briefcase, CalendarDays, ClipboardList, XCircle, Trophy
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type AppStatus =
    | 'SAVED' | 'APPLIED' | 'SCREENING' | 'INTERVIEWING'
    | 'OFFER' | 'PLACED' | 'REJECTED' | 'WITHDRAWN';

interface Application {
    id: string;
    job: { id: string; title: string; company: string; location?: string };
    status: AppStatus;
    appliedAt?: string;
    interviewDate?: string;
    updatedAt: string;
    isPlatformJob?: boolean;
}

interface AssessmentAttempt {
    id: string;
    status: 'IN_PROGRESS' | 'EVALUATING' | 'COMPLETED' | 'FLAGGED';
    startedAt: string;
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
    assessmentDeadline?: string | null;
    isExpired?: boolean;
    job: { id: string; title: string };
}

// ─── Pipeline config ──────────────────────────────────────────────────────────
const PIPELINE = [
    { id: 'APPLIED', label: 'Applied' },
    { id: 'SCREENING', label: 'Screening' },
    { id: 'INTERVIEWING', label: 'Interview' },
    { id: 'OFFER', label: 'Offer' },
    { id: 'PLACED', label: 'Placed' },
] as const;

const STAGE_IDX: Record<string, number> = {
    SAVED: 0, APPLIED: 1, SCREENING: 2, INTERVIEWING: 3, OFFER: 4, PLACED: 5,
};

const ACTIVE_STATUSES: AppStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER'];
const CLOSED_STATUSES: AppStatus[] = ['PLACED', 'REJECTED', 'WITHDRAWN', 'SAVED'];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string | null | undefined) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d: string) {
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

// ─── Pipeline stepper ─────────────────────────────────────────────────────────
function PipelineStepper({ status }: { status: AppStatus }) {
    const curIdx = STAGE_IDX[status] ?? 0;
    const failed = status === 'REJECTED' || status === 'WITHDRAWN';

    return (
        <div className="flex items-start mt-4 mb-1 px-1">
            {PIPELINE.map((stage, i) => {
                const cleared = curIdx > i && !failed;
                const current = curIdx === i && !failed;
                const bad = failed && i < curIdx;

                return (
                    <div key={stage.id} className="flex items-start flex-1 min-w-0">
                        {/* Node + label */}
                        <div className="flex flex-col items-center shrink-0">
                            <div className={`
                                w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all
                                ${cleared ? 'bg-emerald-500 border-emerald-500' : ''}
                                ${current ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100 dark:ring-blue-500/20' : ''}
                                ${bad ? 'bg-rose-400 border-rose-400' : ''}
                                ${!cleared && !current && !bad ? 'bg-transparent border-gray-200 dark:border-gray-700' : ''}
                            `}>
                                {cleared && <CheckCircle2 className="w-4 h-4 text-white" />}
                                {current && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                {bad && <XCircle className="w-4 h-4 text-white" />}
                                {!cleared && !current && !bad && (
                                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                                )}
                            </div>
                            <span className={`
                                text-[10px] mt-1.5 font-semibold whitespace-nowrap text-center
                                ${cleared ? 'text-emerald-600 dark:text-emerald-400' : ''}
                                ${current ? 'text-blue-700 dark:text-blue-400' : ''}
                                ${bad ? 'text-rose-500' : ''}
                                ${!cleared && !current && !bad ? 'text-gray-400 dark:text-gray-500' : ''}
                            `}>
                                {stage.label}
                            </span>
                        </div>
                        {/* Connector line */}
                        {i < PIPELINE.length - 1 && (
                            <div className={`
                                flex-1 h-0.5 mt-3.5 mx-1
                                ${cleared ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}
                            `} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Assessment inline chip ───────────────────────────────────────────────────
function AssessmentChip({
    available, attempt, onStart, starting,
}: {
    available?: AvailableAssessment;
    attempt?: AssessmentAttempt;
    onStart: (id: string) => void;
    starting: string | null;
}) {
    if (available) {
        const dl = available.assessmentDeadline;
        const days = dl ? daysUntil(dl) : null;
        const urgent = days !== null && days >= 0 && days <= 3;

        return (
            <div className={`
                mt-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5
                ${available.isExpired
                    ? 'bg-rose-50 dark:bg-rose-900/25 border-rose-200 dark:border-rose-500/30'
                    : urgent
                    ? 'bg-amber-50 dark:bg-amber-900/35 border-amber-200 dark:border-amber-500/40'
                    : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-500/30'}
            `}>
                <div className="flex items-start gap-2 min-w-0">
                    <ClipboardList className={`w-4 h-4 mt-0.5 shrink-0
                        ${available.isExpired ? 'text-rose-400' : urgent ? 'text-amber-500' : 'text-blue-500'}`}
                    />
                    <div>
                        <p className={`text-xs font-semibold
                            ${available.isExpired ? 'text-rose-600 dark:text-rose-400'
                              : urgent ? 'text-amber-700 dark:text-amber-400'
                              : 'text-blue-700 dark:text-blue-400'}`}>
                            {available.isExpired ? 'Assessment Expired' : 'Assessment Required'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {available.totalQuestions} questions · {available.durationMinutes} min
                            {dl && !available.isExpired && (
                                <span className={`ml-1 font-medium ${urgent ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                    · Due {fmtDate(dl)}
                                    {days === 0 ? ' (today!)' : days === 1 ? ' (tomorrow)' : days !== null && days <= 7 ? ` (${days}d left)` : ''}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant={available.isExpired ? 'outline' : 'default'}
                    disabled={!!available.isExpired || starting === available.templateId}
                    className="shrink-0 text-xs h-7"
                    onClick={() => onStart(available.templateId)}
                >
                    {starting === available.templateId ? 'Starting…' : available.isExpired ? 'Expired' : 'Start'}
                </Button>
            </div>
        );
    }

    if (attempt) {
        const scoreColor = attempt.overallScore != null
            ? attempt.overallScore >= 70 ? 'text-emerald-600 dark:text-emerald-400'
            : attempt.overallScore >= 50 ? 'text-amber-600 dark:text-amber-400'
            : 'text-rose-500 dark:text-rose-400'
            : '';

        const statusMap = {
            COMPLETED: { label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" />, cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' },
            EVALUATING: { label: 'Under Review', icon: <Clock className="w-3 h-3" />, cls: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' },
            IN_PROGRESS: { label: 'In Progress', icon: <PlayCircle className="w-3 h-3" />, cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' },
            FLAGGED: { label: 'Flagged', icon: <AlertCircle className="w-3 h-3" />, cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' },
        };
        const s = statusMap[attempt.status];

        return (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2.5 bg-gray-50 dark:bg-white/5">
                <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 shrink-0 text-gray-400" />
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Assessment</p>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${s.cls}`}>
                                {s.icon} {s.label}
                            </span>
                        </div>
                        {attempt.overallScore != null && (
                            <p className={`text-[11px] font-bold mt-0.5 ${scoreColor}`}>
                                Score: {attempt.overallScore}%
                            </p>
                        )}
                    </div>
                </div>
                {attempt.status === 'IN_PROGRESS' && (
                    <Link href={`/dashboard/assessments/${attempt.id}`}>
                        <Button size="sm" className="text-xs h-7">Continue</Button>
                    </Link>
                )}
            </div>
        );
    }

    return null;
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AppStatus }) {
    const map: Record<AppStatus, { label: string; cls: string }> = {
        SAVED:       { label: 'Saved',       cls: 'bg-gray-100 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/25' },
        APPLIED:     { label: 'Applied',     cls: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/25' },
        SCREENING:   { label: 'Screening',   cls: 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/25' },
        INTERVIEWING:{ label: 'Interview',   cls: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25' },
        OFFER:       { label: 'Offer 🎉',    cls: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25' },
        PLACED:      { label: 'Placed ✅',   cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/35' },
        REJECTED:    { label: 'Rejected',    cls: 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/25' },
        WITHDRAWN:   { label: 'Withdrawn',   cls: 'bg-gray-50 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-500/20' },
    };
    const cfg = map[status] ?? map.APPLIED;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function PipelineAndAssessmentsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
    const [available, setAvailable] = useState<AvailableAssessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [starting, setStarting] = useState<string | null>(null);
    const [filter, setFilter] = useState<'active' | 'closed'>('active');

    useEffect(() => {
        Promise.all([
            authFetch('/applications/applications').then(r => r.json()),
            authFetch('/assessments/attempts/my').then(r => r.json()),
            authFetch('/assessments/available').then(r => r.json()),
        ])
            .then(([appRes, attemptsRes, availableRes]) => {
                setApplications(appRes.data ?? []);
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
            router.push(`/dashboard/assessments/${data.id}`);
        } catch {
            setStarting(null);
        }
    }

    // Cross-reference by job id
    const getAvailableForJob = (jobId: string) => available.find(a => a.job?.id === jobId);
    const getAttemptForJob = (jobId: string) => attempts.find(a => a.template?.job?.id === jobId);

    const filtered = applications.filter(a =>
        filter === 'active' ? ACTIVE_STATUSES.includes(a.status) : CLOSED_STATUSES.includes(a.status)
    );

    const activeCount = applications.filter(a => ACTIVE_STATUSES.includes(a.status)).length;
    const closedCount = applications.filter(a => CLOSED_STATUSES.includes(a.status)).length;
    const pendingCount = available.filter(a => !a.isExpired).length;

    // Orphaned assessments (no matching application in list)
    const orphanAvailable = available.filter(a => !applications.some(app => app.job?.id === a.job?.id));
    const orphanAttempts = attempts.filter(a => !applications.some(app => app.job?.id === a.template?.job?.id));

    if (loading) return <div className="p-12 text-center text-muted-foreground">Loading pipeline…</div>;
    if (error) return <div className="p-12 text-center text-destructive">Failed to load: {error}</div>;

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Pipeline & Assessments</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Track your application stages, deadlines, and assigned assessments in one place.
                </p>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-900/30 px-4 py-3">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{activeCount}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">Active Applications</p>
                </div>
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">Pending Assessments</p>
                </div>
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3">
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        {applications.filter(a => a.status === 'PLACED').length}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Placed</p>
                </div>
            </div>

            {/* Tab filter */}
            <div className="flex gap-2 border-b border-gray-100 dark:border-white/5 pb-0">
                {([
                    { key: 'active', label: 'Active', count: activeCount },
                    { key: 'closed', label: 'Closed / Saved', count: closedCount },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`
                            px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px
                            ${filter === tab.key
                                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                                : 'border-transparent text-muted-foreground hover:text-foreground'}
                        `}
                    >
                        {tab.label}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                            ${filter === tab.key
                                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                : 'bg-gray-100 dark:bg-white/8 text-gray-500'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Application cards */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                        <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">No {filter} applications found.</p>
                        {filter === 'active' && (
                            <Link href="/dashboard/jobs">
                                <Button variant="outline" size="sm" className="mt-4">Browse Jobs</Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map(app => {
                        const availAssessment = getAvailableForJob(app.job?.id);
                        // Only show attempt chip if no "available" for the same job (already started/done)
                        const attemptForJob = availAssessment ? undefined : getAttemptForJob(app.job?.id);
                        const urgent = availAssessment && !availAssessment.isExpired
                            && availAssessment.assessmentDeadline
                            && daysUntil(availAssessment.assessmentDeadline) <= 3;

                        return (
                            <Card
                                key={app.id}
                                className={`transition-shadow hover:shadow-md
                                    ${urgent ? 'border-amber-300 dark:border-amber-500/40' : ''}
                                    ${app.status === 'PLACED' ? 'border-emerald-300 dark:border-emerald-500/30' : ''}
                                `}
                            >
                                <CardContent className="pt-4 pb-4 px-5">
                                    {/* Top row: job info + status badge */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-[15px] truncate leading-snug">
                                                {app.job?.title ?? 'Unknown Role'}
                                            </p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Building2 className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{app.job?.company ?? 'Unknown Company'}</span>
                                                {app.job?.location && (
                                                    <span className="text-gray-400 dark:text-gray-500 text-xs shrink-0">
                                                        · {app.job.location}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-1">
                                            <StatusBadge status={app.status} />
                                            {app.appliedAt && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    Applied {fmtDate(app.appliedAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pipeline stepper — not shown for rejected/withdrawn */}
                                    {!['REJECTED', 'WITHDRAWN', 'SAVED'].includes(app.status) && (
                                        <PipelineStepper status={app.status} />
                                    )}

                                    {app.status === 'REJECTED' && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-rose-500 dark:text-rose-400">
                                            <XCircle className="w-4 h-4 shrink-0" />
                                            Application was not shortlisted.
                                        </div>
                                    )}
                                    {app.status === 'PLACED' && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                            <Trophy className="w-4 h-4 shrink-0" />
                                            Congratulations — you were placed!
                                        </div>
                                    )}
                                    {app.status === 'WITHDRAWN' && (
                                        <div className="mt-3 text-sm text-muted-foreground">Application withdrawn.</div>
                                    )}

                                    {/* Interview date highlight */}
                                    {app.interviewDate && app.status === 'INTERVIEWING' && (
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-500/40 text-xs text-amber-700 dark:text-amber-300 font-medium">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            Interview scheduled: {fmtDate(app.interviewDate)}
                                            {(() => {
                                                const d = daysUntil(app.interviewDate!);
                                                if (d === 0) return <span className="ml-1 font-bold text-rose-500">Today!</span>;
                                                if (d === 1) return <span className="ml-1 text-amber-600 font-bold">Tomorrow</span>;
                                                if (d > 0 && d <= 7) return <span className="ml-1">· {d} days away</span>;
                                                return null;
                                            })()}
                                        </div>
                                    )}

                                    {/* Assessment chip */}
                                    <AssessmentChip
                                        available={availAssessment}
                                        attempt={attemptForJob}
                                        onStart={startAssessment}
                                        starting={starting}
                                    />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Orphaned assessments — assigned but no matching tracked application */}
            {(orphanAvailable.length > 0 || orphanAttempts.length > 0) && (
                <div className="space-y-3 pt-2">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Other Assessments
                    </h2>
                    {orphanAvailable.map(a => (
                        <Card key={a.templateId} className={a.isExpired ? 'opacity-60' : 'border-blue-200 dark:border-blue-500/25'}>
                            <CardContent className="flex items-center justify-between gap-4 py-4 px-5">
                                <div>
                                    <p className="font-semibold text-sm">{a.job?.title ?? 'Assessment'}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {a.totalQuestions} questions · {a.durationMinutes} min
                                        {a.assessmentDeadline && !a.isExpired && (
                                            <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                                                · Due {fmtDate(a.assessmentDeadline)}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={a.isExpired ? 'outline' : 'default'}
                                    disabled={!!a.isExpired || starting === a.templateId}
                                    onClick={() => startAssessment(a.templateId)}
                                >
                                    {starting === a.templateId ? 'Starting…' : a.isExpired ? 'Expired' : 'Start'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {orphanAttempts.map(a => (
                        <Card key={a.id}>
                            <CardContent className="flex items-center justify-between gap-4 py-4 px-5">
                                <div>
                                    <p className="font-semibold text-sm">{a.template?.job?.title ?? 'Assessment'}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">
                                            {a.template?.totalQuestions ?? '—'} q · {a.template?.durationMinutes ?? '—'} min
                                        </span>
                                        {a.overallScore != null && (
                                            <span className={`text-xs font-bold
                                                ${a.overallScore >= 70 ? 'text-emerald-600 dark:text-emerald-400'
                                                  : a.overallScore >= 50 ? 'text-amber-600 dark:text-amber-400'
                                                  : 'text-rose-500'}`}>
                                                Score: {a.overallScore}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {a.status === 'IN_PROGRESS' && (
                                    <Link href={`/dashboard/assessments/${a.id}`}>
                                        <Button size="sm">Continue</Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
