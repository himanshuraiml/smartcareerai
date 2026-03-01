import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { mediasoupConfig } from '../config/mediasoup.config';
import { logger } from '../utils/logger';
import { admitWaitingUser, kickUser } from '../socket/signaling.socket';

const CreateMeetingSchema = z.object({
    interviewId: z.string().uuid().optional(),
    maxParticipants: z.number().int().min(2).max(50).default(10),
    scheduledAt: z.string().datetime().optional(),
});

const JoinMeetingSchema = z.object({
    consentGiven: z.boolean(),
});

export async function createMeeting(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const body = CreateMeetingSchema.parse(req.body);
        const meetingToken = uuidv4();

        const meeting = await prisma.meetingRoom.create({
            data: {
                hostId: userId,
                meetingToken,
                maxParticipants: body.maxParticipants,
                scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
                interviewId: body.interviewId || null,
            },
        });

        // Auto-add host as participant
        await prisma.meetingParticipant.create({
            data: {
                meetingId: meeting.id,
                userId,
                role: 'HOST',
                consentGiven: true,
            },
        });

        logger.info(`Meeting created: ${meeting.id} by user ${userId}`);

        res.status(201).json({
            success: true,
            data: {
                id: meeting.id,
                meetingToken: meeting.meetingToken,
                status: meeting.status,
                maxParticipants: meeting.maxParticipants,
                scheduledAt: meeting.scheduledAt,
            },
        });
    } catch (err) {
        next(err);
    }
}

export async function getMeeting(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;

        const meeting = await prisma.meetingRoom.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, role: true },
                        },
                    },
                },
            },
        });

        if (!meeting) {
            return res.status(404).json({ success: false, error: 'Meeting not found' });
        }

        res.json({
            success: true,
            data: {
                ...meeting,
                iceServers: mediasoupConfig.iceServers,
            },
        });
    } catch (err) {
        next(err);
    }
}

export async function joinMeeting(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const body = JoinMeetingSchema.parse(req.body);

        const meeting = await prisma.meetingRoom.findUnique({
            where: { id },
            include: { participants: true },
        });

        if (!meeting) {
            return res.status(404).json({ success: false, error: 'Meeting not found' });
        }

        if (meeting.status === 'ENDED' || meeting.status === 'CANCELLED') {
            return res.status(400).json({ success: false, error: 'Meeting has ended' });
        }

        if (meeting.participants.length >= meeting.maxParticipants) {
            return res.status(400).json({ success: false, error: 'Meeting is full' });
        }

        // Determine role
        const isHost = meeting.hostId === userId;
        const existingParticipant = meeting.participants.find(p => p.userId === userId);

        if (existingParticipant) {
            // Rejoin: update consent and timestamps
            await prisma.meetingParticipant.update({
                where: { id: existingParticipant.id },
                data: {
                    joinedAt: new Date(),
                    leftAt: null,
                    consentGiven: body.consentGiven,
                    consentAt: body.consentGiven ? new Date() : null,
                },
            });
        } else {
            await prisma.meetingParticipant.create({
                data: {
                    meetingId: id,
                    userId,
                    role: isHost ? 'HOST' : 'CANDIDATE',
                    joinedAt: new Date(),
                    consentGiven: body.consentGiven,
                    consentAt: body.consentGiven ? new Date() : null,
                },
            });
        }

        // Start meeting if host joins and it's still WAITING
        if (isHost && meeting.status === 'WAITING') {
            await prisma.meetingRoom.update({
                where: { id },
                data: { status: 'IN_PROGRESS', startedAt: new Date() },
            });
        }

        logger.info(`User ${userId} joined meeting ${id}`);

        res.json({
            success: true,
            data: { meetingId: id, role: isHost ? 'HOST' : existingParticipant?.role || 'CANDIDATE' },
        });
    } catch (err) {
        next(err);
    }
}

export async function leaveMeeting(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const participant = await prisma.meetingParticipant.findFirst({
            where: { meetingId: id, userId },
        });

        if (participant) {
            await prisma.meetingParticipant.update({
                where: { id: participant.id },
                data: { leftAt: new Date() },
            });
        }

        // Check if all participants have left
        const activeParticipants = await prisma.meetingParticipant.count({
            where: { meetingId: id, leftAt: null, joinedAt: { not: null } },
        });

        if (activeParticipants === 0) {
            await prisma.meetingRoom.update({
                where: { id },
                data: { status: 'ENDED', endedAt: new Date() },
            });
        }

        logger.info(`User ${userId} left meeting ${id}`);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

export async function getIceServers(_req: Request, res: Response) {
    res.json({
        success: true,
        data: mediasoupConfig.iceServers,
    });
}

export async function endMeeting(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const meeting = await prisma.meetingRoom.findUnique({ where: { id } });
        if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
        if (meeting.hostId !== userId) return res.status(403).json({ success: false, error: 'Only host can end meeting' });

        await prisma.meetingRoom.update({
            where: { id },
            data: { status: 'ENDED', endedAt: new Date() },
        });

        // Mark all participants as left
        await prisma.meetingParticipant.updateMany({
            where: { meetingId: id, leftAt: null },
            data: { leftAt: new Date() },
        });

        logger.info(`Meeting ${id} ended by host ${userId}`);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

export async function admitParticipant(req: Request, res: Response, next: NextFunction) {
    try {
        const { id, participantId } = req.params;
        const hostId = req.headers['x-user-id'] as string;

        const meeting = await prisma.meetingRoom.findUnique({ where: { id } });
        if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
        if (meeting.hostId !== hostId) return res.status(403).json({ success: false, error: 'Only host can admit participants' });

        const participant = await prisma.meetingParticipant.update({
            where: { id: participantId },
            data: { joinedAt: new Date() },
        });

        // Admit the user via socket (sends room-joined so they can start mediasoup)
        admitWaitingUser(participant.userId, id);

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

export async function kickParticipant(req: Request, res: Response, next: NextFunction) {
    try {
        const { id, participantId } = req.params;
        const hostId = req.headers['x-user-id'] as string;

        const meeting = await prisma.meetingRoom.findUnique({ where: { id } });
        if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
        if (meeting.hostId !== hostId) return res.status(403).json({ success: false, error: 'Only host can kick participants' });

        const participant = await prisma.meetingParticipant.update({
            where: { id: participantId },
            data: { leftAt: new Date() },
        });

        // Notify the kicked user via socket
        kickUser(participant.userId, id);

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

export async function getParticipants(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;

        const participants = await prisma.meetingParticipant.findMany({
            where: { meetingId: id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json({ success: true, data: participants });
    } catch (err) {
        next(err);
    }
}
