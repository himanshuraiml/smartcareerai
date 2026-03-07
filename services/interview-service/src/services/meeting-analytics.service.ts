import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// ── Shared response shapes ────────────────────────────────────────────────────

export interface CandidateScoreSummary {
    technical: number;
    communication: number;
    confidence: number;
    overall: number;
}

export interface CandidateMeetingRow {
    meetingId: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    date: string;
    hiringRecommendation: string;
    scores: CandidateScoreSummary;
    recordingUrl: string | null;
    analysisStatus: string;
}

export interface RecruiterDashboard {
    totalMeetings: number;
    completedAnalyses: number;
    avgScores: CandidateScoreSummary;
    hiringBreakdown: Record<string, number>;
    recentMeetings: CandidateMeetingRow[];
    meetingsByDate: Record<string, number>;
}

export interface InstitutionDashboard {
    institutionName: string;
    totalStudents: number;
    totalMeetings: number;
    completedAnalyses: number;
    avgScores: CandidateScoreSummary;
    hiringBreakdown: Record<string, number>;
    topCandidates: Array<{
        userId: string;
        name: string;
        email: string;
        overall: number;
        hiringRecommendation: string;
        meetingId: string;
    }>;
    meetingsByDate: Record<string, number>;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class MeetingAnalyticsService {
    /**
     * Recruiter dashboard: all meetings hosted + aggregate scores + recent activity.
     */
    async getRecruiterDashboard(hostId: string): Promise<RecruiterDashboard> {
        const meetings = await prisma.meetingRoom.findMany({
            where: { hostId },
            include: {
                aiAnalysis: true,
                participants: {
                    where: { role: 'CANDIDATE' },
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        const completedAnalyses = meetings.filter(m => m.aiAnalysis?.processingStatus === 'COMPLETED');

        const avgScores = averageScores(completedAnalyses.map(m => extractScores(m.aiAnalysis?.candidateScores)));
        const hiringBreakdown = countHiringRecs(completedAnalyses.map(m => m.aiAnalysis?.hiringRecommendation ?? ''));
        const meetingsByDate = groupByDate(meetings.map(m => m.createdAt));

        const recentMeetings: CandidateMeetingRow[] = meetings.slice(0, 20).map(m => {
            const candidate = m.participants[0];
            return {
                meetingId: m.id,
                candidateId: candidate?.user?.id ?? '',
                candidateName: candidate?.user?.name ?? 'Unknown',
                candidateEmail: candidate?.user?.email ?? '',
                date: m.createdAt.toISOString(),
                hiringRecommendation: m.aiAnalysis?.hiringRecommendation ?? 'PENDING',
                scores: extractScores(m.aiAnalysis?.candidateScores),
                recordingUrl: m.recordingUrl ?? null,
                analysisStatus: m.aiAnalysis?.processingStatus ?? 'NONE',
            };
        });

        return {
            totalMeetings: meetings.length,
            completedAnalyses: completedAnalyses.length,
            avgScores,
            hiringBreakdown,
            recentMeetings,
            meetingsByDate,
        };
    }

    /**
     * Side-by-side candidate comparison: all candidates the recruiter has interviewed.
     * Returns one row per (candidate × meeting) sorted by overall score desc.
     */
    async getCandidateComparison(hostId: string): Promise<CandidateMeetingRow[]> {
        const meetings = await prisma.meetingRoom.findMany({
            where: {
                hostId,
                aiAnalysis: { processingStatus: 'COMPLETED' },
            },
            include: {
                aiAnalysis: true,
                participants: {
                    where: { role: 'CANDIDATE' },
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const rows: CandidateMeetingRow[] = meetings.map(m => {
            const candidate = m.participants[0];
            return {
                meetingId: m.id,
                candidateId: candidate?.user?.id ?? '',
                candidateName: candidate?.user?.name ?? 'Unknown',
                candidateEmail: candidate?.user?.email ?? '',
                date: m.createdAt.toISOString(),
                hiringRecommendation: m.aiAnalysis?.hiringRecommendation ?? '',
                scores: extractScores(m.aiAnalysis?.candidateScores),
                recordingUrl: m.recordingUrl ?? null,
                analysisStatus: m.aiAnalysis?.processingStatus ?? 'NONE',
            };
        });

        return rows.sort((a, b) => b.scores.overall - a.scores.overall);
    }

    /**
     * Institution dashboard: aggregate analytics across all students in the institution.
     */
    async getInstitutionDashboard(adminUserId: string): Promise<InstitutionDashboard> {
        // Find admin's institution
        const admin = await prisma.user.findUnique({
            where: { id: adminUserId },
            include: { institution: true },
        });

        if (!admin?.institutionId) {
            return emptyInstitutionDashboard('Unknown Institution');
        }

        const institutionName = (admin.institution as { name?: string })?.name ?? 'Institution';

        // Find all students in this institution
        const students = await prisma.user.findMany({
            where: { institutionId: admin.institutionId, role: 'USER' },
            select: { id: true },
        });

        const studentIds = students.map(s => s.id);
        if (studentIds.length === 0) {
            return { ...emptyInstitutionDashboard(institutionName), totalStudents: 0 };
        }

        // Find meetings where these students were participants (CANDIDATE role)
        const participations = await prisma.meetingParticipant.findMany({
            where: { userId: { in: studentIds }, role: 'CANDIDATE' },
            include: {
                meeting: {
                    include: {
                        aiAnalysis: true,
                    },
                },
                user: { select: { id: true, name: true, email: true } },
            },
        });

        const completedRows = participations.filter(
            p => p.meeting.aiAnalysis?.processingStatus === 'COMPLETED',
        );

        const avgScores = averageScores(completedRows.map(p => extractScores(p.meeting.aiAnalysis?.candidateScores)));
        const hiringBreakdown = countHiringRecs(completedRows.map(p => p.meeting.aiAnalysis?.hiringRecommendation ?? ''));
        const meetingsByDate = groupByDate(participations.map(p => p.meeting.createdAt));

        const topCandidates = completedRows
            .map(p => ({
                userId: p.user.id,
                name: p.user.name ?? 'Unknown',
                email: p.user.email,
                overall: extractScores(p.meeting.aiAnalysis?.candidateScores).overall,
                hiringRecommendation: p.meeting.aiAnalysis?.hiringRecommendation ?? '',
                meetingId: p.meeting.id,
            }))
            .sort((a, b) => b.overall - a.overall)
            .slice(0, 10);

        return {
            institutionName,
            totalStudents: studentIds.length,
            totalMeetings: participations.length,
            completedAnalyses: completedRows.length,
            avgScores,
            hiringBreakdown,
            topCandidates,
            meetingsByDate,
        };
    }
}

export const meetingAnalyticsService = new MeetingAnalyticsService();

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractScores(raw: unknown): CandidateScoreSummary {
    if (!raw || typeof raw !== 'object') {
        return { technical: 0, communication: 0, confidence: 0, overall: 0 };
    }
    const s = raw as Record<string, unknown>;
    return {
        technical: Number(s.technical) || 0,
        communication: Number(s.communication) || 0,
        confidence: Number(s.confidence) || 0,
        overall: Number(s.overall) || 0,
    };
}

function averageScores(scores: CandidateScoreSummary[]): CandidateScoreSummary {
    if (scores.length === 0) return { technical: 0, communication: 0, confidence: 0, overall: 0 };
    const sum = scores.reduce(
        (acc, s) => ({
            technical: acc.technical + s.technical,
            communication: acc.communication + s.communication,
            confidence: acc.confidence + s.confidence,
            overall: acc.overall + s.overall,
        }),
        { technical: 0, communication: 0, confidence: 0, overall: 0 },
    );
    const n = scores.length;
    return {
        technical: Math.round(sum.technical / n),
        communication: Math.round(sum.communication / n),
        confidence: Math.round(sum.confidence / n),
        overall: Math.round(sum.overall / n),
    };
}

function countHiringRecs(recs: string[]): Record<string, number> {
    const counts: Record<string, number> = { STRONG_YES: 0, YES: 0, MAYBE: 0, NO: 0 };
    for (const rec of recs) {
        if (rec in counts) counts[rec]++;
    }
    return counts;
}

function groupByDate(dates: Date[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const d of dates) {
        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        result[key] = (result[key] || 0) + 1;
    }
    return result;
}

function emptyInstitutionDashboard(institutionName: string): InstitutionDashboard {
    return {
        institutionName,
        totalStudents: 0,
        totalMeetings: 0,
        completedAnalyses: 0,
        avgScores: { technical: 0, communication: 0, confidence: 0, overall: 0 },
        hiringBreakdown: { STRONG_YES: 0, YES: 0, MAYBE: 0, NO: 0 },
        topCandidates: [],
        meetingsByDate: {},
    };
}
