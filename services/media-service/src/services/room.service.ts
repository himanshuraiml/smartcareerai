import * as mediasoup from 'mediasoup';
import { mediasoupConfig } from '../config/mediasoup.config';
import { logger } from '../utils/logger';

export interface ParticipantMedia {
    userId: string;
    role: string;
    sendTransport: mediasoup.types.WebRtcTransport | null;
    recvTransport: mediasoup.types.WebRtcTransport | null;
    producers: Map<string, mediasoup.types.Producer>;
    consumers: Map<string, mediasoup.types.Consumer>;
}

export interface ProducerInfo {
    producerId: string;
    participantId: string;
    userId: string;
    kind: mediasoup.types.MediaKind;
}

export class Room {
    readonly id: string;
    private router: mediasoup.types.Router;
    private participants: Map<string, ParticipantMedia> = new Map();

    constructor(id: string, router: mediasoup.types.Router) {
        this.id = id;
        this.router = router;
    }

    getRouterRtpCapabilities(): mediasoup.types.RtpCapabilities {
        return this.router.rtpCapabilities;
    }

    hasParticipant(participantId: string): boolean {
        return this.participants.has(participantId);
    }

    getParticipantCount(): number {
        return this.participants.size;
    }

    addParticipant(participantId: string, userId: string, role: string): void {
        if (this.participants.has(participantId)) return;
        this.participants.set(participantId, {
            userId,
            role,
            sendTransport: null,
            recvTransport: null,
            producers: new Map(),
            consumers: new Map(),
        });
    }

    async createWebRtcTransport(participantId: string, direction: 'send' | 'recv'): Promise<{
        id: string;
        iceParameters: mediasoup.types.IceParameters;
        iceCandidates: mediasoup.types.IceCandidate[];
        dtlsParameters: mediasoup.types.DtlsParameters;
    }> {
        const participant = this.participants.get(participantId);
        if (!participant) throw new Error(`Participant ${participantId} not found`);

        const transport = await this.router.createWebRtcTransport({
            listenInfos: mediasoupConfig.webRtcTransport.listenInfos,
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate: mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
        });

        transport.on('dtlsstatechange', (dtlsState) => {
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                logger.warn(`Transport ${transport.id} DTLS state: ${dtlsState}`);
                transport.close();
            }
        });

        if (direction === 'send') {
            participant.sendTransport = transport;
        } else {
            participant.recvTransport = transport;
        }

        return {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
        };
    }

    async connectTransport(
        participantId: string,
        transportId: string,
        dtlsParameters: mediasoup.types.DtlsParameters
    ): Promise<void> {
        const participant = this.participants.get(participantId);
        if (!participant) throw new Error(`Participant ${participantId} not found`);

        const transport =
            participant.sendTransport?.id === transportId
                ? participant.sendTransport
                : participant.recvTransport?.id === transportId
                    ? participant.recvTransport
                    : null;

        if (!transport) throw new Error(`Transport ${transportId} not found`);
        await transport.connect({ dtlsParameters });
    }

    async produce(
        participantId: string,
        kind: mediasoup.types.MediaKind,
        rtpParameters: mediasoup.types.RtpParameters,
        appData?: Record<string, unknown>
    ): Promise<string> {
        const participant = this.participants.get(participantId);
        if (!participant) throw new Error(`Participant ${participantId} not found`);
        if (!participant.sendTransport) throw new Error('Send transport not created');

        const producer = await participant.sendTransport.produce({
            kind,
            rtpParameters,
            appData: { ...appData, participantId, userId: participant.userId },
        });

        producer.on('transportclose', () => {
            producer.close();
            participant.producers.delete(producer.id);
        });

        participant.producers.set(producer.id, producer);
        return producer.id;
    }

    async consume(
        consumerParticipantId: string,
        producerId: string,
        rtpCapabilities: mediasoup.types.RtpCapabilities
    ): Promise<{
        id: string;
        producerId: string;
        kind: mediasoup.types.MediaKind;
        rtpParameters: mediasoup.types.RtpParameters;
    } | null> {
        if (!this.router.canConsume({ producerId, rtpCapabilities })) {
            logger.warn(`Cannot consume producer ${producerId}`);
            return null;
        }

        const consumer = this.participants.get(consumerParticipantId);
        if (!consumer) throw new Error(`Consumer participant ${consumerParticipantId} not found`);
        if (!consumer.recvTransport) throw new Error('Recv transport not created');

        const newConsumer = await consumer.recvTransport.consume({
            producerId,
            rtpCapabilities,
            paused: true,
        });

        newConsumer.on('transportclose', () => {
            newConsumer.close();
            consumer.consumers.delete(newConsumer.id);
        });

        newConsumer.on('producerclose', () => {
            newConsumer.close();
            consumer.consumers.delete(newConsumer.id);
        });

        consumer.consumers.set(newConsumer.id, newConsumer);

        return {
            id: newConsumer.id,
            producerId: newConsumer.producerId,
            kind: newConsumer.kind,
            rtpParameters: newConsumer.rtpParameters,
        };
    }

    async resumeConsumer(participantId: string, consumerId: string): Promise<void> {
        const participant = this.participants.get(participantId);
        if (!participant) throw new Error(`Participant ${participantId} not found`);
        const consumer = participant.consumers.get(consumerId);
        if (!consumer) throw new Error(`Consumer ${consumerId} not found`);
        await consumer.resume();
    }

    async pauseProducer(participantId: string, producerId: string): Promise<void> {
        const participant = this.participants.get(participantId);
        if (!participant) return;
        const producer = participant.producers.get(producerId);
        if (producer) await producer.pause();
    }

    async resumeProducer(participantId: string, producerId: string): Promise<void> {
        const participant = this.participants.get(participantId);
        if (!participant) return;
        const producer = participant.producers.get(producerId);
        if (producer) await producer.resume();
    }

    getExistingProducers(excludeParticipantId?: string): ProducerInfo[] {
        const producers: ProducerInfo[] = [];
        for (const [participantId, participant] of this.participants) {
            if (participantId === excludeParticipantId) continue;
            for (const [producerId, producer] of participant.producers) {
                if (!producer.closed) {
                    producers.push({
                        producerId,
                        participantId,
                        userId: participant.userId,
                        kind: producer.kind,
                    });
                }
            }
        }
        return producers;
    }

    removeParticipant(participantId: string): void {
        const participant = this.participants.get(participantId);
        if (!participant) return;

        for (const consumer of participant.consumers.values()) {
            consumer.close();
        }
        for (const producer of participant.producers.values()) {
            producer.close();
        }
        if (participant.sendTransport) participant.sendTransport.close();
        if (participant.recvTransport) participant.recvTransport.close();

        this.participants.delete(participantId);
        logger.info(`Participant ${participantId} removed from room ${this.id}`);
    }

    close(): void {
        for (const participantId of this.participants.keys()) {
            this.removeParticipant(participantId);
        }
        this.router.close();
        logger.info(`Room ${this.id} closed`);
    }

    isEmpty(): boolean {
        return this.participants.size === 0;
    }

    async getProducerStats(): Promise<Map<string, { bitrate: number; fractionLost: number; packetsReceived: number }>> {
        const result = new Map<string, { bitrate: number; fractionLost: number; packetsReceived: number }>();
        for (const [participantId, media] of this.participants) {
            for (const [, producer] of media.producers) {
                if (producer.closed) continue;
                try {
                    const statsList = await producer.getStats();
                    for (const stat of statsList) {
                        if (stat.type === 'inbound-rtp') {
                            result.set(participantId, {
                                bitrate: (stat as any).bitrate ?? 0,
                                fractionLost: (stat as any).fractionLost ?? 0,
                                packetsReceived: (stat as any).packetsReceived ?? 0,
                            });
                            break;
                        }
                    }
                } catch { /* skip closed producers */ }
                break; // one producer per participant is enough
            }
        }
        return result;
    }
}
