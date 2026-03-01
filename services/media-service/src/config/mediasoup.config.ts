import os from 'os';
import { RtpCodecCapability, TransportListenInfo, WorkerLogLevel, WorkerLogTag } from 'mediasoup/node/lib/types';

export const mediasoupConfig = {
    numWorkers: Math.min(os.cpus().length, 4),
    worker: {
        rtcMinPort: parseInt(process.env.MEDIASOUP_RTC_MIN_PORT || '10000'),
        rtcMaxPort: parseInt(process.env.MEDIASOUP_RTC_MAX_PORT || '10999'),
        logLevel: 'warn' as WorkerLogLevel,
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'] as WorkerLogTag[],
    },
    router: {
        mediaCodecs: [
            {
                kind: 'audio' as const,
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
            },
            {
                kind: 'video' as const,
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 1000,
                },
            },
            {
                kind: 'video' as const,
                mimeType: 'video/H264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '4d0032',
                    'level-asymmetry-allowed': 1,
                },
            },
        ] as RtpCodecCapability[],
    },
    webRtcTransport: {
        listenInfos: [
            {
                protocol: 'udp' as const,
                ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
                announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
            },
            {
                protocol: 'tcp' as const,
                ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
                announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
            },
        ] as TransportListenInfo[],
        initialAvailableOutgoingBitrate: 1000000,
        minimumAvailableOutgoingBitrate: 600000,
        maxSctpMessageSize: 262144,
        maxIncomingBitrate: 1500000,
    },
    iceServers: [
        { urls: process.env.STUN_URL || 'stun:stun.l.google.com:19302' },
        ...(process.env.TURN_URL
            ? [{
                urls: process.env.TURN_URL,
                username: process.env.TURN_USERNAME || '',
                credential: process.env.TURN_CREDENTIAL || '',
            }]
            : []),
    ],
};
