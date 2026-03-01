'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

export interface PeerInfo {
    peerId: string;
    socketId: string;
    role: string;
}

export interface ProducerInfo {
    producerId: string;
    participantId: string;
    userId: string;
    kind: 'audio' | 'video';
}

export interface ChatMessage {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
}

export interface WaitingParticipant {
    userId: string;
    name?: string;
    socketId: string;
}

export interface NetworkQualityUpdate {
    peerId: string;
    quality: number; // 1-5
}

interface NewProducerEvent {
    producerId: string;
    peerId: string;
    kind: 'audio' | 'video';
    appData: Record<string, unknown>;
}

interface UseMeetingSocketOptions {
    meetingId: string;
    role: string;
    onRoomJoined?: (data: {
        routerRtpCapabilities: unknown;
        existingProducers: ProducerInfo[];
        participantCount: number;
    }) => void;
    onNewPeer?: (peer: PeerInfo) => void;
    onPeerLeft?: (data: { peerId: string }) => void;
    onNewProducer?: (data: NewProducerEvent) => void;
    onProducerClosed?: (data: { producerId: string; peerId: string }) => void;
    onHandRaised?: (data: { peerId: string; raised: boolean }) => void;
    onChatMessage?: (message: ChatMessage) => void;
    // Phase 2: waiting room
    onWaitingRoom?: () => void;
    onParticipantWaiting?: (participant: WaitingParticipant) => void;
    onKicked?: () => void;
    // Phase 2: network quality
    onNetworkQuality?: (update: NetworkQualityUpdate) => void;
}

export function useMeetingSocket(options: UseMeetingSocketOptions) {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        const mediaServiceUrl = process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || 'http://localhost:3014';

        const socket = io(`${mediaServiceUrl}/meeting`, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-room', {
                meetingId: options.meetingId,
                userId: user?.id,
                role: options.role,
            });
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('room-joined', (data) => options.onRoomJoined?.(data));
        socket.on('new-peer', (peer: PeerInfo) => options.onNewPeer?.(peer));
        socket.on('peer-left', (data: { peerId: string }) => options.onPeerLeft?.(data));
        socket.on('new-producer', (data: NewProducerEvent) => options.onNewProducer?.(data));
        socket.on('producer-closed', (data) => options.onProducerClosed?.(data));
        socket.on('hand-raised', (data) => options.onHandRaised?.(data));
        socket.on('chat-message', (message: ChatMessage) => options.onChatMessage?.(message));

        // Phase 2: waiting room events
        socket.on('waiting-room', () => options.onWaitingRoom?.());
        socket.on('participant-waiting', (p: WaitingParticipant) => options.onParticipantWaiting?.(p));
        socket.on('kicked', () => options.onKicked?.());

        // Phase 2: network quality
        socket.on('network-quality', (update: NetworkQualityUpdate) => options.onNetworkQuality?.(update));

        return () => {
            socket.emit('leave-room');
            socket.disconnect();
            socketRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.meetingId, user?.id]);

    const notifyNewProducer = useCallback((
        producerId: string,
        kind: 'audio' | 'video',
        appData: Record<string, unknown> = {},
    ) => {
        socketRef.current?.emit('new-producer', {
            meetingId: options.meetingId,
            producerId,
            kind,
            appData,
        });
    }, [options.meetingId]);

    const notifyProducerClosed = useCallback((producerId: string) => {
        socketRef.current?.emit('producer-closed', {
            meetingId: options.meetingId,
            producerId,
        });
    }, [options.meetingId]);

    const raiseHand = useCallback((raised: boolean) => {
        socketRef.current?.emit('raise-hand', {
            meetingId: options.meetingId,
            raised,
        });
    }, [options.meetingId]);

    const sendChatMessage = useCallback((content: string) => {
        socketRef.current?.emit('chat-message', {
            meetingId: options.meetingId,
            content,
        });
    }, [options.meetingId]);

    return {
        connected,
        notifyNewProducer,
        notifyProducerClosed,
        raiseHand,
        sendChatMessage,
        socket: socketRef,
    };
}
