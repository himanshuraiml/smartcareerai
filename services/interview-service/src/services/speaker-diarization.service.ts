import { prisma } from '../utils/prisma';

export interface SpeakerInfo {
    userId: string;
    speakerName: string;
}

/**
 * Resolves a userId → display name for transcript attribution.
 * Caches lookups within a meeting session to avoid repeated DB calls.
 */
export class SpeakerDiarizationService {
    private cache = new Map<string, string>(); // userId → name

    async getSpeakerInfo(userId: string): Promise<SpeakerInfo> {
        if (this.cache.has(userId)) {
            return { userId, speakerName: this.cache.get(userId)! };
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true },
            });
            const speakerName = user?.name || user?.email?.split('@')[0] || `User-${userId.slice(0, 6)}`;
            this.cache.set(userId, speakerName);
            return { userId, speakerName };
        } catch {
            const fallback = `User-${userId.slice(0, 6)}`;
            this.cache.set(userId, fallback);
            return { userId, speakerName: fallback };
        }
    }

    clearCache(): void {
        this.cache.clear();
    }
}

export const speakerDiarizationService = new SpeakerDiarizationService();
