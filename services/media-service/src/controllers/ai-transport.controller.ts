import { Request, Response } from 'express';
import { roomManager } from '../services/room-manager.service';
import { emitToRoom } from '../socket/signaling.socket';
import { logger } from '../utils/logger';
import * as mediasoup from 'mediasoup';

/** Map of meetingId → { transport, producer } for the AI participant */
const aiTransports = new Map<string, {
    transport: mediasoup.types.PlainTransport;
    producer: mediasoup.types.Producer;
}>();

const AI_PARTICIPANT_ID_PREFIX = 'AI_BOT';

/**
 * POST /meetings/:id/ai-transport/create
 * Called by ai-interviewer-service to create a PlainTransport + Producer in the room.
 * Returns transport details (port) so the AI service can direct FFmpeg there.
 */
export async function createAITransport(req: Request, res: Response): Promise<void> {
    try {
        const { id: meetingId } = req.params;

        // Ensure meeting room exists (create if not yet opened)
        let room = roomManager.getRoom(meetingId);
        if (!room) {
            room = await roomManager.createRoom(meetingId);
        }

        const participantId = `${AI_PARTICIPANT_ID_PREFIX}_${meetingId}`;

        // Idempotent — if already exists, return cached transport params
        if (aiTransports.has(meetingId)) {
            const existing = aiTransports.get(meetingId)!;
            res.json({
                transportId: existing.transport.id,
                ip: existing.transport.tuple.localIp,
                port: existing.transport.tuple.localPort,
                producerId: existing.producer.id,
            });
            return;
        }

        // Create PlainTransport in the room's Router
        const { transport, ip, port } = await room.createAIPlainTransport();

        // Create audio Producer on the PlainTransport
        const producer = await room.produceFromAIPlainTransport(participantId, transport);

        aiTransports.set(meetingId, { transport, producer });

        // Broadcast new-producer to all WebRTC participants so they can consume AI audio
        emitToRoom(meetingId, 'new-producer', {
            producerId: producer.id,
            participantId,
            userId: participantId,
            kind: 'audio',
            appData: { type: 'ai-interviewer' },
        });

        logger.info(`AI transport created for meeting ${meetingId} — port ${port}, producer ${producer.id}`);

        res.status(201).json({
            transportId: transport.id,
            ip,
            port,
            producerId: producer.id,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('createAITransport error:', err);
        res.status(500).json({ error: message });
    }
}

/**
 * POST /meetings/:id/ai-transport/close
 * Called by ai-interviewer-service when the AI session ends.
 */
export async function closeAITransport(req: Request, res: Response): Promise<void> {
    try {
        const { id: meetingId } = req.params;
        const entry = aiTransports.get(meetingId);

        if (entry) {
            entry.producer.close();
            entry.transport.close();
            aiTransports.delete(meetingId);

            // Notify room that the AI producer is gone
            const participantId = `${AI_PARTICIPANT_ID_PREFIX}_${meetingId}`;
            emitToRoom(meetingId, 'producer-closed', {
                producerId: entry.producer.id,
                participantId,
            });

            logger.info(`AI transport closed for meeting ${meetingId}`);
        }

        res.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('closeAITransport error:', err);
        res.status(500).json({ error: message });
    }
}
