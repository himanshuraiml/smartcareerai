'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Device } from 'mediasoup-client';
import type { Transport, Producer, Consumer } from 'mediasoup-client/types';
import { authFetch } from '@/lib/auth-fetch';

interface UseMediaSoupOptions {
    meetingId: string;
}

interface RemoteStream {
    peerId: string;
    consumerId: string;
    kind: 'audio' | 'video';
    stream: MediaStream;
    consumer: Consumer;
}

export function useMediaSoup({ meetingId }: UseMediaSoupOptions) {
    const deviceRef = useRef<Device | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const producersRef = useRef<Map<string, Producer>>(new Map());
    const consumersRef = useRef<Map<string, Consumer>>(new Map());

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
    const [audioMuted, setAudioMuted] = useState(false);
    const [videoMuted, setVideoMuted] = useState(false);
    const [deviceLoaded, setDeviceLoaded] = useState(false);

    const apiBase = `/meetings/${meetingId}`;

    const loadDevice = useCallback(async (routerRtpCapabilities: any) => {
        const device = new Device();
        await device.load({ routerRtpCapabilities });
        deviceRef.current = device;
        setDeviceLoaded(true);
        return device;
    }, []);

    const createSendTransport = useCallback(async () => {
        const res = await authFetch(`${apiBase}/transport/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ direction: 'send' }),
        });
        const { data } = await res.json();
        const device = deviceRef.current!;

        const transport = device.createSendTransport({
            id: data.id,
            iceParameters: data.iceParameters,
            iceCandidates: data.iceCandidates,
            dtlsParameters: data.dtlsParameters,
        });

        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await authFetch(`${apiBase}/transport/connect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transportId: transport.id, dtlsParameters }),
                });
                callback();
            } catch (err: any) {
                errback(err);
            }
        });

        transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
            try {
                const res = await authFetch(`${apiBase}/produce`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kind, rtpParameters, appData }),
                });
                const { data } = await res.json();
                callback({ id: data.producerId });
            } catch (err: any) {
                errback(err);
            }
        });

        sendTransportRef.current = transport;
        return transport;
    }, [apiBase]);

    const createRecvTransport = useCallback(async () => {
        const res = await authFetch(`${apiBase}/transport/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ direction: 'recv' }),
        });
        const { data } = await res.json();
        const device = deviceRef.current!;

        const transport = device.createRecvTransport({
            id: data.id,
            iceParameters: data.iceParameters,
            iceCandidates: data.iceCandidates,
            dtlsParameters: data.dtlsParameters,
        });

        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await authFetch(`${apiBase}/transport/connect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transportId: transport.id, dtlsParameters }),
                });
                callback();
            } catch (err: any) {
                errback(err);
            }
        });

        recvTransportRef.current = transport;
        return transport;
    }, [apiBase]);

    const publishMedia = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
            },
        });

        setLocalStream(stream);

        const transport = sendTransportRef.current!;

        // Produce audio
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            const audioProducer = await transport.produce({ track: audioTrack });
            producersRef.current.set(audioProducer.id, audioProducer);
        }

        // Produce video
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            const videoProducer = await transport.produce({
                track: videoTrack,
                encodings: [
                    { maxBitrate: 100000, scaleResolutionDownBy: 4 },
                    { maxBitrate: 300000, scaleResolutionDownBy: 2 },
                    { maxBitrate: 900000 },
                ],
                codecOptions: {
                    videoGoogleStartBitrate: 1000,
                },
            });
            producersRef.current.set(videoProducer.id, videoProducer);
        }

        return stream;
    }, []);

    const consumeProducer = useCallback(async (producerId: string, peerId: string) => {
        const device = deviceRef.current;
        if (!device) return null;

        const res = await authFetch(`${apiBase}/consume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                producerId,
                rtpCapabilities: device.rtpCapabilities,
            }),
        });

        const json = await res.json();
        if (!json.success || !json.data) return null;

        const { id, kind, rtpParameters } = json.data;
        const transport = recvTransportRef.current!;

        const consumer = await transport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
        });

        consumersRef.current.set(consumer.id, consumer);

        // Resume consumer on server
        await authFetch(`${apiBase}/consumer/resume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consumerId: consumer.id }),
        });

        const stream = new MediaStream([consumer.track]);

        setRemoteStreams((prev) => [
            ...prev.filter((s) => !(s.peerId === peerId && s.kind === kind)),
            { peerId, consumerId: consumer.id, kind, stream, consumer },
        ]);

        return { consumer, stream };
    }, [apiBase]);

    const toggleAudio = useCallback(async () => {
        for (const [, producer] of producersRef.current) {
            if (producer.kind === 'audio') {
                if (audioMuted) {
                    await producer.resume();
                    await authFetch(`${apiBase}/producer/resume`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ producerId: producer.id }),
                    });
                } else {
                    await producer.pause();
                    await authFetch(`${apiBase}/producer/pause`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ producerId: producer.id }),
                    });
                }
            }
        }
        setAudioMuted(!audioMuted);
    }, [audioMuted, apiBase]);

    const toggleVideo = useCallback(async () => {
        for (const [, producer] of producersRef.current) {
            if (producer.kind === 'video') {
                if (videoMuted) {
                    await producer.resume();
                    await authFetch(`${apiBase}/producer/resume`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ producerId: producer.id }),
                    });
                } else {
                    await producer.pause();
                    await authFetch(`${apiBase}/producer/pause`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ producerId: producer.id }),
                    });
                }
            }
        }
        setVideoMuted(!videoMuted);
    }, [videoMuted, apiBase]);

    /** Publish an arbitrary track (e.g. screen share) on the send transport */
    const publishTrack = useCallback(async (
        track: MediaStreamTrack,
        appData: Record<string, unknown> = {},
    ) => {
        const transport = sendTransportRef.current;
        if (!transport) throw new Error('Send transport not ready');
        const producer = await transport.produce({ track, appData });
        producersRef.current.set(producer.id, producer);
        return producer;
    }, []);

    /** Close and remove a producer by id */
    const closeProducer = useCallback((producerId: string) => {
        const producer = producersRef.current.get(producerId);
        if (producer) {
            producer.close();
            producersRef.current.delete(producerId);
        }
    }, []);

    /** Get stats from the send transport for network quality calculation */
    const getSendTransportStats = useCallback(async (): Promise<RTCStatsReport | null> => {
        const transport = sendTransportRef.current;
        if (!transport) return null;
        try {
            return await transport.getStats();
        } catch {
            return null;
        }
    }, []);

    const removeRemoteStream = useCallback((peerId: string) => {
        setRemoteStreams((prev) => {
            const removed = prev.filter((s) => s.peerId === peerId);
            for (const rs of removed) {
                rs.consumer.close();
                consumersRef.current.delete(rs.consumerId);
            }
            return prev.filter((s) => s.peerId !== peerId);
        });
    }, []);

    const cleanup = useCallback(() => {
        for (const [, producer] of producersRef.current) {
            producer.close();
        }
        producersRef.current.clear();

        for (const [, consumer] of consumersRef.current) {
            consumer.close();
        }
        consumersRef.current.clear();

        sendTransportRef.current?.close();
        recvTransportRef.current?.close();

        if (localStream) {
            localStream.getTracks().forEach((t) => t.stop());
            setLocalStream(null);
        }

        setRemoteStreams([]);
    }, [localStream]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        deviceLoaded,
        localStream,
        remoteStreams,
        audioMuted,
        videoMuted,
        loadDevice,
        createSendTransport,
        createRecvTransport,
        publishMedia,
        publishTrack,
        closeProducer,
        getSendTransportStats,
        consumeProducer,
        toggleAudio,
        toggleVideo,
        removeRemoteStream,
        cleanup,
    };
}
