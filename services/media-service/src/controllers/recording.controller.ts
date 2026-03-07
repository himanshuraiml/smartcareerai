import { Request, Response, NextFunction } from 'express';
import { roomManager } from '../services/room-manager.service';
import { recordingService } from '../services/recording.service';
import { getPresignedUrl } from '../utils/minio-client';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export async function startRecording(req: Request, res: Response, next: NextFunction) {
    try {
        const { id: meetingId } = req.params;
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Only host can start recording
        const meeting = await prisma.meetingRoom.findUnique({ where: { id: meetingId } });
        if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
        if (meeting.hostId !== userId) return res.status(403).json({ success: false, error: 'Only host can start recording' });

        if (recordingService.isRecording(meetingId)) {
            return res.status(400).json({ success: false, error: 'Recording already in progress' });
        }

        const room = roomManager.getRoom(meetingId);
        if (!room) return res.status(400).json({ success: false, error: 'Room not active' });

        const audioProducers = room.getAllAudioProducers();
        if (audioProducers.length === 0) {
            return res.status(400).json({ success: false, error: 'No active audio producers found' });
        }

        // Start recording in background (non-blocking)
        recordingService.startRecording(meetingId, room.getRouter(), audioProducers)
            .catch(err => logger.error(`Recording start failed for ${meetingId}:`, err.message));

        logger.info(`Recording requested for meeting ${meetingId} by user ${userId}`);
        res.json({ success: true, data: { meetingId, status: 'recording' } });
    } catch (err) {
        next(err);
    }
}

export async function stopRecording(req: Request, res: Response, next: NextFunction) {
    try {
        const { id: meetingId } = req.params;
        const userId = req.headers['x-user-id'] as string;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const meeting = await prisma.meetingRoom.findUnique({ where: { id: meetingId } });
        if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
        if (meeting.hostId !== userId) return res.status(403).json({ success: false, error: 'Only host can stop recording' });

        if (!recordingService.isRecording(meetingId)) {
            return res.status(400).json({ success: false, error: 'No active recording' });
        }

        // Stop & upload (may take a few seconds)
        const recordingUrl = await recordingService.stopRecording(meetingId);

        res.json({
            success: true,
            data: { meetingId, status: 'stopped', recordingUrl },
        });
    } catch (err) {
        next(err);
    }
}

export async function getRecording(req: Request, res: Response, next: NextFunction) {
    try {
        const { id: meetingId } = req.params;

        const meeting = await prisma.meetingRoom.findUnique({
            where: { id: meetingId },
            select: { recordingUrl: true, status: true },
        });

        if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
        if (!meeting.recordingUrl) {
            return res.status(404).json({ success: false, error: 'No recording available' });
        }

        // Re-generate a fresh presigned URL (7-day) from the stored object key
        // recordingUrl may already be a full presigned URL; return as-is
        res.json({ success: true, data: { recordingUrl: meeting.recordingUrl } });
    } catch (err) {
        next(err);
    }
}
