import { prisma } from '../utils/prisma';

interface StartLabInput {
    userId: string;
    trackId: string;
    labId: string;
}

interface SubmitChallengeInput {
    userId: string;
    challengeId: string;
    githubUrl?: string;
    writeup?: string;
}

export class FutureLabService {

    // ─── Tracks ──────────────────────────────────────────────────────────────

    /**
     * Get all active tracks with user progress merged in
     */
    async getTracks(userId: string) {
        const tracks = await prisma.labTrack.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
                labs: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                    select: { id: true, title: true, duration: true, isFree: true, order: true },
                },
            },
        });

        // Fetch user progress for all tracks in one query
        const userProgress = await prisma.userLabProgress.findMany({
            where: { userId },
            select: { labId: true, trackId: true, status: true },
        });

        const progressByLab = new Map(userProgress.map(p => [p.labId, p.status]));
        const completedByTrack = new Map<string, number>();
        userProgress.forEach(p => {
            if (p.status === 'COMPLETED') {
                completedByTrack.set(p.trackId, (completedByTrack.get(p.trackId) || 0) + 1);
            }
        });

        return tracks.map(track => ({
            ...track,
            completedLabs: completedByTrack.get(track.id) || 0,
            totalLabs: track.labs.length,
            labs: track.labs.map(lab => ({
                ...lab,
                userStatus: progressByLab.get(lab.id) || 'NOT_STARTED',
            })),
        }));
    }

    /**
     * Get a single track with all lab details and user progress
     */
    async getTrack(slug: string, userId: string) {
        const track = await prisma.labTrack.findUnique({
            where: { slug },
            include: {
                labs: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!track) return null;

        const userProgress = await prisma.userLabProgress.findMany({
            where: { userId, trackId: track.id },
        });
        const progressByLab = new Map(userProgress.map(p => [p.labId, p]));

        return {
            ...track,
            labs: track.labs.map(lab => ({
                ...lab,
                userProgress: progressByLab.get(lab.id) || null,
            })),
            completedLabs: userProgress.filter(p => p.status === 'COMPLETED').length,
        };
    }

    /**
     * Get full lab details including content
     */
    async getLabDetails(labId: string, userId: string) {
        const lab = await prisma.lab.findUnique({
            where: { id: labId, isActive: true },
            include: {
                track: {
                    select: { id: true, title: true, gradient: true }
                }
            }
        });

        if (!lab) return null;

        const progress = await prisma.userLabProgress.findUnique({
            where: { userId_labId: { userId, labId } }
        });

        return {
            ...lab,
            userStatus: progress?.status || 'NOT_STARTED'
        };
    }

    // ─── Lab Progress ─────────────────────────────────────────────────────────

    /**
     * Mark a lab as started / in-progress
     */
    async startLab({ userId, trackId, labId }: StartLabInput) {
        // Verify lab exists and belongs to track
        const lab = await prisma.lab.findFirst({
            where: { id: labId, trackId, isActive: true },
        });
        if (!lab) throw new Error('Lab not found');

        return prisma.userLabProgress.upsert({
            where: { userId_labId: { userId, labId } },
            update: { status: 'IN_PROGRESS' },
            create: {
                userId,
                trackId,
                labId,
                status: 'IN_PROGRESS',
            },
        });
    }

    /**
     * Mark a lab as completed, award XP
     */
    async completeLab({ userId, trackId, labId }: StartLabInput) {
        const lab = await prisma.lab.findFirst({
            where: { id: labId, trackId, isActive: true },
        });
        if (!lab) throw new Error('Lab not found');

        const progress = await prisma.userLabProgress.upsert({
            where: { userId_labId: { userId, labId } },
            update: { status: 'COMPLETED', completedAt: new Date() },
            create: {
                userId,
                trackId,
                labId,
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });

        // Award XP: 30 XP per completed lab
        await prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: 30 } },
        });

        // Check if whole track is now completed → award bonus XP
        const [totalLabs, completedCount] = await Promise.all([
            prisma.lab.count({ where: { trackId, isActive: true } }),
            prisma.userLabProgress.count({ where: { userId, trackId, status: 'COMPLETED' } }),
        ]);

        let trackCompleted = false;
        if (completedCount >= totalLabs) {
            await prisma.user.update({
                where: { id: userId },
                data: { xp: { increment: 100 } }, // bonus for finishing a track
            });
            trackCompleted = true;
        }

        return { progress, trackCompleted, xpAwarded: trackCompleted ? 130 : 30 };
    }

    // ─── Weekly Challenges ────────────────────────────────────────────────────

    /**
     * Get the currently active weekly challenge with user's submission if any
     */
    async getActiveChallenge(userId: string) {
        const now = new Date();

        const challenge = await prisma.weeklyChallenge.findFirst({
            where: { isActive: true, deadline: { gt: now } },
            orderBy: { deadline: 'asc' },
            include: {
                _count: { select: { submissions: true } },
            },
        });

        if (!challenge) return null;

        const userSubmission = await prisma.challengeSubmission.findUnique({
            where: { challengeId_userId: { challengeId: challenge.id, userId } },
        });

        return { ...challenge, submissionCount: challenge._count.submissions, userSubmission };
    }

    /**
     * Get all challenges (past + current) with user's submissions
     */
    async getAllChallenges(userId: string) {
        const challenges = await prisma.weeklyChallenge.findMany({
            orderBy: { deadline: 'desc' },
            include: { _count: { select: { submissions: true } } },
        });

        const userSubs = await prisma.challengeSubmission.findMany({
            where: { userId, challengeId: { in: challenges.map(c => c.id) } },
        });
        const subByChallenge = new Map(userSubs.map(s => [s.challengeId, s]));

        return challenges.map(c => ({
            ...c,
            submissionCount: c._count.submissions,
            userSubmission: subByChallenge.get(c.id) || null,
        }));
    }

    /**
     * Submit a solution to a weekly challenge
     */
    async submitChallenge({ userId, challengeId, githubUrl, writeup }: SubmitChallengeInput) {
        const challenge = await prisma.weeklyChallenge.findFirst({
            where: { id: challengeId, isActive: true },
        });
        if (!challenge) throw new Error('Challenge not found or no longer active');
        if (new Date() > challenge.deadline) throw new Error('Challenge deadline has passed');

        const existing = await prisma.challengeSubmission.findUnique({
            where: { challengeId_userId: { challengeId, userId } },
        });
        if (existing && existing.status !== 'REJECTED') {
            throw new Error('You have already submitted for this challenge');
        }

        const submission = await prisma.challengeSubmission.upsert({
            where: { challengeId_userId: { challengeId, userId } },
            update: { githubUrl, writeup, status: 'PENDING', submittedAt: new Date(), score: null, aiFeedback: null },
            create: { challengeId, userId, githubUrl, writeup, status: 'PENDING' },
        });

        // Award XP for submitting
        await prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: 25 } },
        });

        return { submission, xpAwarded: 25 };
    }

    /**
     * Get leaderboard for the current active challenge
     */
    async getChallengeLeaderboard(challengeId: string) {
        const submissions = await prisma.challengeSubmission.findMany({
            where: { challengeId, status: 'EVALUATED', score: { not: null } },
            orderBy: { score: 'desc' },
            take: 10,
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
            },
        });
        return submissions;
    }

    // ─── User Stats ───────────────────────────────────────────────────────────

    /**
     * Get a user's overall Future-Lab stats
     */
    async getUserLabStats(userId: string) {
        const [labsCompleted, tracksStarted, submissionsCount] = await Promise.all([
            prisma.userLabProgress.count({ where: { userId, status: 'COMPLETED' } }),
            prisma.userLabProgress.groupBy({ by: ['trackId'], where: { userId } }).then(r => r.length),
            prisma.challengeSubmission.count({ where: { userId } }),
        ]);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, streakCount: true },
        });

        return {
            labsCompleted,
            tracksStarted,
            submissionsCount,
            xp: user?.xp || 0,
            streakCount: user?.streakCount || 0,
        };
    }
}

export const futureLabService = new FutureLabService();
