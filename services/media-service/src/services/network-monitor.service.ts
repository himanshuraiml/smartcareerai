import { Server } from 'socket.io';
import { roomManager } from './room-manager.service';
import { logger } from '../utils/logger';

function computeQuality(fractionLost: number, bitrate: number): number {
    if (fractionLost > 0.1 || bitrate === 0) return 1;
    if (fractionLost > 0.05 || bitrate < 50_000) return 2;
    if (bitrate < 150_000) return 3;
    if (bitrate < 400_000) return 4;
    return 5;
}

export class NetworkMonitorService {
    private timer: NodeJS.Timeout | null = null;
    private readonly POLL_INTERVAL_MS = 5_000;

    constructor(private readonly io: Server) {}

    start(): void {
        this.timer = setInterval(() => this.poll(), this.POLL_INTERVAL_MS);
        logger.info('Network monitor started (5s interval)');
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private async poll(): Promise<void> {
        const ns = this.io.of('/meeting');
        const rooms = roomManager.getAllRooms();

        for (const [meetingId, room] of rooms) {
            try {
                const statsMap = await room.getProducerStats();
                for (const [participantId, stats] of statsMap) {
                    const quality = computeQuality(stats.fractionLost, stats.bitrate);
                    ns.to(meetingId).emit('network-quality', {
                        peerId: participantId,
                        quality,
                    });
                }
            } catch (err: any) {
                logger.debug(`Network monitor poll error for room ${meetingId}: ${err.message}`);
            }
        }
    }
}
