import { mediasoupConfig } from '../config/mediasoup.config';
import { workerManager } from './worker-manager.service';
import { Room } from './room.service';
import { logger } from '../utils/logger';

class RoomManager {
    private rooms: Map<string, Room> = new Map();

    async createRoom(meetingId: string): Promise<Room> {
        if (this.rooms.has(meetingId)) {
            return this.rooms.get(meetingId)!;
        }

        const worker = workerManager.getNextWorker();
        const router = await worker.createRouter({
            mediaCodecs: mediasoupConfig.router.mediaCodecs,
        });

        const room = new Room(meetingId, router);
        this.rooms.set(meetingId, room);
        logger.info(`Room created: ${meetingId}`);
        return room;
    }

    getRoom(meetingId: string): Room | undefined {
        return this.rooms.get(meetingId);
    }

    removeRoom(meetingId: string): void {
        const room = this.rooms.get(meetingId);
        if (room) {
            room.close();
            this.rooms.delete(meetingId);
            logger.info(`Room removed: ${meetingId}`);
        }
    }

    getRoomCount(): number {
        return this.rooms.size;
    }

    getAllRooms(): Map<string, Room> {
        return this.rooms;
    }

    cleanupEmptyRooms(): void {
        for (const [meetingId, room] of this.rooms) {
            if (room.isEmpty()) {
                room.close();
                this.rooms.delete(meetingId);
                logger.info(`Empty room cleaned up: ${meetingId}`);
            }
        }
    }
}

export const roomManager = new RoomManager();
