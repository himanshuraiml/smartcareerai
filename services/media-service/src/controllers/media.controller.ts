import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { roomManager } from '../services/room-manager.service';
import { logger } from '../utils/logger';

const CreateTransportSchema = z.object({
    direction: z.enum(['send', 'recv']),
});

const ConnectTransportSchema = z.object({
    transportId: z.string(),
    dtlsParameters: z.any(),
});

const ProduceSchema = z.object({
    kind: z.enum(['audio', 'video']),
    rtpParameters: z.any(),
    appData: z.record(z.unknown()).optional(),
});

const ConsumeSchema = z.object({
    producerId: z.string(),
    rtpCapabilities: z.any(),
});

export async function getRtpCapabilities(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const room = roomManager.getRoom(id);

        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found. Join meeting first.' });
        }

        res.json({
            success: true,
            data: room.getRouterRtpCapabilities(),
        });
    } catch (err) {
        next(err);
    }
}

export async function createTransport(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const body = CreateTransportSchema.parse(req.body);

        const room = roomManager.getRoom(id);
        if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

        const participantId = userId;
        if (!room.hasParticipant(participantId)) {
            return res.status(400).json({ success: false, error: 'Not a participant in this room' });
        }

        const transportData = await room.createWebRtcTransport(participantId, body.direction);

        res.json({
            success: true,
            data: transportData,
        });
    } catch (err) {
        next(err);
    }
}

export async function connectTransport(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const body = ConnectTransportSchema.parse(req.body);

        const room = roomManager.getRoom(id);
        if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

        await room.connectTransport(userId, body.transportId, body.dtlsParameters);

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

export async function produce(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const body = ProduceSchema.parse(req.body);

        const room = roomManager.getRoom(id);
        if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

        const producerId = await room.produce(userId, body.kind, body.rtpParameters, body.appData);

        logger.info(`User ${userId} producing ${body.kind} in room ${id}, producer: ${producerId}`);

        res.json({
            success: true,
            data: { producerId },
        });
    } catch (err) {
        next(err);
    }
}

export async function consume(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const body = ConsumeSchema.parse(req.body);

        const room = roomManager.getRoom(id);
        if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

        const consumerData = await room.consume(userId, body.producerId, body.rtpCapabilities);

        if (!consumerData) {
            return res.status(400).json({ success: false, error: 'Cannot consume this producer' });
        }

        res.json({
            success: true,
            data: consumerData,
        });
    } catch (err) {
        next(err);
    }
}

export async function resumeConsumer(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const { consumerId } = req.body;

        const room = roomManager.getRoom(id);
        if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

        await room.resumeConsumer(userId, consumerId);

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

export async function pauseProducer(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const { producerId } = req.body;

        const room = roomManager.getRoom(id);
        if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

        await room.pauseProducer(userId, producerId);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

export async function resumeProducer(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const { producerId } = req.body;

        const room = roomManager.getRoom(id);
        if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

        await room.resumeProducer(userId, producerId);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}
