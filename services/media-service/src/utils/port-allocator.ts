/**
 * Simple port pool for RTP/RTCP port pairs used by PlainTransport → FFmpeg pipelines.
 * Recording uses ports 15000–15999 (500 pairs, each needs 2 consecutive ports).
 */

const BASE_PORT = parseInt(process.env.RECORDING_PORT_START || '15000', 10);
const MAX_PORT = parseInt(process.env.RECORDING_PORT_END || '15999', 10);

const usedPorts = new Set<number>();

/**
 * Allocate an RTP/RTCP port pair. Returns [rtpPort, rtcpPort].
 * Ports are released with freePorts().
 */
export function allocatePortPair(): [number, number] {
    for (let port = BASE_PORT; port < MAX_PORT; port += 2) {
        if (!usedPorts.has(port) && !usedPorts.has(port + 1)) {
            usedPorts.add(port);
            usedPorts.add(port + 1);
            return [port, port + 1];
        }
    }
    throw new Error('No available RTP port pairs (pool exhausted)');
}

export function freePorts(rtpPort: number, rtcpPort: number): void {
    usedPorts.delete(rtpPort);
    usedPorts.delete(rtcpPort);
}
