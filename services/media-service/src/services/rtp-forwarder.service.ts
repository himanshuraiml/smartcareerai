import * as mediasoup from 'mediasoup';
import * as fs from 'fs';
import * as path from 'path';
import { allocatePortPair, freePorts } from '../utils/port-allocator';
import { logger } from '../utils/logger';

export interface ForwarderInfo {
    transport: mediasoup.types.PlainTransport;
    consumer: mediasoup.types.Consumer;
    rtpPort: number;
    rtcpPort: number;
    producerId: string;
    participantId: string;
    userId: string;
}

export interface SdpInfo {
    sdpPath: string;
    rtpPort: number;
    rtcpPort: number;
    participantId: string;
    userId: string;
    producerId: string;
}

/**
 * Manages PlainTransport + Consumer pairs used to tap audio producers for
 * server-side recording and transcription.
 *
 * For each audio producer:
 *   router → PlainTransport → Consumer → FFmpeg (via UDP RTP)
 */
export class RtpForwarderService {
    private forwarders = new Map<string, ForwarderInfo>(); // producerId → info
    private tempDir: string;

    constructor() {
        this.tempDir = path.join(process.cwd(), 'temp', 'sdp');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Create a PlainTransport + Consumer for a single audio producer.
     * Returns SDP file path and port info for FFmpeg.
     */
    async startForwarding(
        router: mediasoup.types.Router,
        producer: mediasoup.types.Producer,
        participantId: string,
        userId: string,
    ): Promise<SdpInfo> {
        if (producer.kind !== 'audio') {
            throw new Error('RTP forwarder only supports audio producers');
        }

        const [rtpPort, rtcpPort] = allocatePortPair();

        const transport = await router.createPlainTransport({
            listenIp: { ip: '127.0.0.1', announcedIp: undefined },
            rtcpMux: false,
            comedia: false,
        });

        // Tell mediasoup to send RTP to the port where FFmpeg will listen
        await transport.connect({
            ip: '127.0.0.1',
            port: rtpPort,
            rtcpPort,
        });

        const consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities: router.rtpCapabilities,
            paused: false,
        });

        this.forwarders.set(producer.id, {
            transport,
            consumer,
            rtpPort,
            rtcpPort,
            producerId: producer.id,
            participantId,
            userId,
        });

        // Build SDP so FFmpeg knows the codec/payload type
        const sdpPath = this.writeSdp(producer.id, rtpPort, rtcpPort, consumer.rtpParameters);

        logger.info(`RTP forwarder started: producer=${producer.id} userId=${userId} rtp=${rtpPort} rtcp=${rtcpPort}`);

        return { sdpPath, rtpPort, rtcpPort, participantId, userId, producerId: producer.id };
    }

    stopForwarding(producerId: string): void {
        const info = this.forwarders.get(producerId);
        if (!info) return;

        try { info.consumer.close(); } catch { /* already closed */ }
        try { info.transport.close(); } catch { /* already closed */ }
        freePorts(info.rtpPort, info.rtcpPort);

        // Remove SDP file
        const sdpPath = this.getSdpPath(producerId);
        if (fs.existsSync(sdpPath)) fs.unlinkSync(sdpPath);

        this.forwarders.delete(producerId);
        logger.info(`RTP forwarder stopped: producer=${producerId}`);
    }

    stopAll(): void {
        for (const producerId of [...this.forwarders.keys()]) {
            this.stopForwarding(producerId);
        }
    }

    getForwarders(): ForwarderInfo[] {
        return [...this.forwarders.values()];
    }

    getSdpPath(producerId: string): string {
        return path.join(this.tempDir, `${producerId}.sdp`);
    }

    private writeSdp(
        producerId: string,
        rtpPort: number,
        rtcpPort: number,
        rtpParameters: mediasoup.types.RtpParameters,
    ): string {
        const codec = rtpParameters.codecs[0];
        if (!codec) throw new Error('No codec in rtpParameters');

        const payloadType = codec.payloadType;
        const mimeType = codec.mimeType.split('/')[1]; // 'opus', 'PCMU', etc.
        const clockRate = codec.clockRate;
        const channels = codec.channels ?? 1;

        // Build fmtp line from codec parameters
        const fmtpParams = codec.parameters
            ? Object.entries(codec.parameters)
                .map(([k, v]) => `${k}=${v}`)
                .join(';')
            : '';

        const sdp = [
            'v=0',
            'o=- 0 0 IN IP4 127.0.0.1',
            's=mediasoup-recording',
            'c=IN IP4 127.0.0.1',
            't=0 0',
            `m=audio ${rtpPort} RTP/AVP ${payloadType}`,
            `a=rtpmap:${payloadType} ${mimeType}/${clockRate}${channels > 1 ? `/${channels}` : ''}`,
            ...(fmtpParams ? [`a=fmtp:${payloadType} ${fmtpParams}`] : []),
            'a=recvonly',
        ].join('\r\n');

        const sdpPath = this.getSdpPath(producerId);
        fs.writeFileSync(sdpPath, sdp);
        return sdpPath;
    }
}

export const rtpForwarderService = new RtpForwarderService();
