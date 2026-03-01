import { Server, Socket, Namespace } from 'socket.io';
import { roomManager } from '../services/room-manager.service';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface JoinRoomPayload {
    meetingId: string;
    userId: string;
    role: string;
}

interface ChatMessagePayload {
    meetingId: string;
    content: string;
}

interface RaiseHandPayload {
    meetingId: string;
    raised: boolean;
}

interface NewProducerPayload {
    meetingId: string;
    producerId: string;
    kind: 'audio' | 'video';
    appData?: Record<string, unknown>;
}

interface ProducerClosedPayload {
    meetingId: string;
    producerId: string;
}

interface SocketUserInfo {
    userId: string;
    meetingId: string;
    role: string;
    waiting: boolean;
}

// socket.id → user info
const socketUserMap = new Map<string, SocketUserInfo>();

let meetingNs: Namespace;

/** Emit an event to all sockets belonging to a userId */
export function emitToUser(userId: string, event: string, data: unknown): void {
    for (const [socketId, info] of socketUserMap) {
        if (info.userId === userId) {
            meetingNs.to(socketId).emit(event, data);
        }
    }
}

/**
 * Admit a waiting user into the room by:
 * 1. Adding them to the MediaSoup room
 * 2. Joining the Socket.io room
 * 3. Sending room-joined so they can start mediasoup
 * Returns true if the user was waiting and is now admitted.
 */
export function admitWaitingUser(userId: string, meetingId: string): boolean {
    let targetSocketId: string | undefined;
    for (const [socketId, info] of socketUserMap) {
        if (info.userId === userId && info.meetingId === meetingId && info.waiting) {
            targetSocketId = socketId;
            break;
        }
    }

    if (!targetSocketId) return false;

    const room = roomManager.getRoom(meetingId);
    if (!room) return false;

    const candidateSocket = meetingNs.sockets.get(targetSocketId);
    if (!candidateSocket) return false;

    room.addParticipant(userId, userId, 'CANDIDATE');
    candidateSocket.join(meetingId);

    const info = socketUserMap.get(targetSocketId)!;
    socketUserMap.set(targetSocketId, { ...info, waiting: false });

    candidateSocket.emit('room-joined', {
        routerRtpCapabilities: room.getRouterRtpCapabilities(),
        existingProducers: room.getExistingProducers(userId),
        participantCount: room.getParticipantCount(),
    });

    // Notify everyone already in the room about the new peer
    meetingNs.to(meetingId).except(targetSocketId).emit('new-peer', {
        peerId: userId,
        socketId: targetSocketId,
        role: 'CANDIDATE',
    });

    logger.info(`User ${userId} admitted into room ${meetingId}`);
    return true;
}

/** Kick a user — emits 'kicked' to their socket; they must disconnect themselves */
export function kickUser(userId: string, meetingId: string): void {
    for (const [socketId, info] of socketUserMap) {
        if (info.userId === userId && info.meetingId === meetingId) {
            meetingNs.to(socketId).emit('kicked', { meetingId });
            break;
        }
    }
}

export function setupSignaling(io: Server): void {
    meetingNs = io.of('/meeting');

    meetingNs.on('connection', (socket: Socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        socket.on('join-room', async (payload: JoinRoomPayload) => {
            try {
                const { meetingId, userId, role } = payload;

                // Register in the user map immediately (even if waiting)
                socketUserMap.set(socket.id, { userId, meetingId, role, waiting: false });

                const room = await roomManager.createRoom(meetingId);

                // --- Waiting room logic ---
                // If a non-host joins and a HOST is already in the room, put them in the waiting room
                const hostAlreadyPresent = [...socketUserMap.values()].some(
                    (info) =>
                        info.meetingId === meetingId &&
                        info.role === 'HOST' &&
                        !info.waiting &&
                        info.userId !== userId,
                );

                if (role !== 'HOST' && hostAlreadyPresent) {
                    socketUserMap.set(socket.id, { userId, meetingId, role, waiting: true });
                    socket.emit('waiting-room', { meetingId });

                    // Notify host
                    let userName: string | undefined;
                    try {
                        const user = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { name: true },
                        });
                        userName = user?.name ?? undefined;
                    } catch { /* ignore */ }

                    for (const [hSocketId, hInfo] of socketUserMap) {
                        if (hInfo.meetingId === meetingId && hInfo.role === 'HOST' && !hInfo.waiting) {
                            meetingNs.to(hSocketId).emit('participant-waiting', {
                                userId,
                                name: userName,
                                socketId: socket.id,
                            });
                        }
                    }

                    logger.info(`User ${userId} is waiting for admission in room ${meetingId}`);
                    return;
                }

                // Normal join
                room.addParticipant(userId, userId, role);
                socket.join(meetingId);

                socket.emit('room-joined', {
                    routerRtpCapabilities: room.getRouterRtpCapabilities(),
                    existingProducers: room.getExistingProducers(userId),
                    participantCount: room.getParticipantCount(),
                });

                socket.to(meetingId).emit('new-peer', {
                    peerId: userId,
                    socketId: socket.id,
                    role,
                });

                // If host just joined, auto-admit all waiting participants
                if (role === 'HOST') {
                    for (const [wSocketId, wInfo] of socketUserMap) {
                        if (wInfo.meetingId === meetingId && wInfo.waiting) {
                            const wSocket = meetingNs.sockets.get(wSocketId);
                            if (wSocket) {
                                room.addParticipant(wInfo.userId, wInfo.userId, wInfo.role);
                                wSocket.join(meetingId);
                                socketUserMap.set(wSocketId, { ...wInfo, waiting: false });

                                wSocket.emit('room-joined', {
                                    routerRtpCapabilities: room.getRouterRtpCapabilities(),
                                    existingProducers: room.getExistingProducers(wInfo.userId),
                                    participantCount: room.getParticipantCount(),
                                });

                                meetingNs.to(meetingId).except(wSocketId).emit('new-peer', {
                                    peerId: wInfo.userId,
                                    socketId: wSocketId,
                                    role: wInfo.role,
                                });
                            }
                        }
                    }
                }

                logger.info(`User ${userId} joined room ${meetingId} as ${role}`);
            } catch (err: any) {
                logger.error(`Error joining room: ${err.message}`);
                socket.emit('error', { message: err.message });
            }
        });

        socket.on('new-producer', (payload: NewProducerPayload) => {
            const userInfo = socketUserMap.get(socket.id);
            if (!userInfo || userInfo.waiting) return;

            socket.to(payload.meetingId).emit('new-producer', {
                producerId: payload.producerId,
                peerId: userInfo.userId,
                kind: payload.kind,
                appData: payload.appData ?? {},
            });
        });

        socket.on('producer-closed', (payload: ProducerClosedPayload) => {
            const userInfo = socketUserMap.get(socket.id);
            if (!userInfo) return;

            socket.to(payload.meetingId).emit('producer-closed', {
                producerId: payload.producerId,
                peerId: userInfo.userId,
            });
        });

        socket.on('raise-hand', (payload: RaiseHandPayload) => {
            const userInfo = socketUserMap.get(socket.id);
            if (!userInfo || userInfo.waiting) return;

            socket.to(payload.meetingId).emit('hand-raised', {
                peerId: userInfo.userId,
                raised: payload.raised,
            });
        });

        socket.on('chat-message', async (payload: ChatMessagePayload) => {
            const userInfo = socketUserMap.get(socket.id);
            if (!userInfo || userInfo.waiting) return;

            try {
                const message = await prisma.meetingChatMessage.create({
                    data: {
                        meetingId: payload.meetingId,
                        userId: userInfo.userId,
                        content: payload.content,
                    },
                });

                meetingNs.to(payload.meetingId).emit('chat-message', {
                    id: message.id,
                    userId: userInfo.userId,
                    content: payload.content,
                    createdAt: message.createdAt.toISOString(),
                });
            } catch (err: any) {
                logger.error(`Error saving chat message: ${err.message}`);
            }
        });

        socket.on('leave-room', () => {
            handleDisconnect(socket);
        });

        socket.on('disconnect', () => {
            handleDisconnect(socket);
        });
    });
}

function handleDisconnect(socket: Socket): void {
    const userInfo = socketUserMap.get(socket.id);
    if (!userInfo) return;

    const { userId, meetingId, waiting } = userInfo;

    if (!waiting) {
        const room = roomManager.getRoom(meetingId);
        if (room) {
            room.removeParticipant(userId);
            socket.to(meetingId).emit('peer-left', { peerId: userId });

            if (room.isEmpty()) {
                roomManager.removeRoom(meetingId);
            }
        }
        socket.leave(meetingId);
    }

    socketUserMap.delete(socket.id);
    logger.info(`User ${userId} disconnected from room ${meetingId} (was waiting: ${waiting})`);
}
