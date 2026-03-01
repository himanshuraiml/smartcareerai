'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseNetworkQualityOptions {
    /** Fetch RTCStatsReport from the mediasoup send transport */
    getSendTransportStats: () => Promise<RTCStatsReport | null>;
    /** How often to poll in ms (default 5000) */
    pollInterval?: number;
    enabled?: boolean;
}

function deriveQuality(stats: RTCStatsReport): number {
    let packetsLost = 0;
    let packetsSent = 0;
    let availableBitrate = 0;

    stats.forEach((stat: RTCStats & Record<string, unknown>) => {
        if (stat.type === 'outbound-rtp') {
            packetsSent += (stat.packetsSent as number) ?? 0;
        }
        if (stat.type === 'remote-inbound-rtp') {
            packetsLost += (stat.packetsLost as number) ?? 0;
        }
        if (
            stat.type === 'candidate-pair' &&
            (stat as Record<string, unknown>).state === 'succeeded' &&
            (stat as Record<string, unknown>).availableOutgoingBitrate
        ) {
            availableBitrate = (stat as Record<string, unknown>).availableOutgoingBitrate as number;
        }
    });

    const lossRate = packetsSent > 0 ? packetsLost / packetsSent : 0;

    if (lossRate > 0.1 || (availableBitrate > 0 && availableBitrate < 100_000)) return 1;
    if (lossRate > 0.05 || (availableBitrate > 0 && availableBitrate < 250_000)) return 2;
    if (availableBitrate > 0 && availableBitrate < 500_000) return 3;
    if (availableBitrate > 0 && availableBitrate < 1_000_000) return 4;
    return 5;
}

export function useNetworkQuality({
    getSendTransportStats,
    pollInterval = 5_000,
    enabled = true,
}: UseNetworkQualityOptions) {
    const [quality, setQuality] = useState<number>(5);

    const poll = useCallback(async () => {
        const stats = await getSendTransportStats();
        if (!stats) return;
        setQuality(deriveQuality(stats));
    }, [getSendTransportStats]);

    useEffect(() => {
        if (!enabled) return;
        const id = setInterval(poll, pollInterval);
        return () => clearInterval(id);
    }, [poll, pollInterval, enabled]);

    return { quality };
}
