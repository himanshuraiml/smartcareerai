import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from './utils/logger';

const INTERVIEW_SERVICE_URL = process.env.INTERVIEW_SERVICE_URL || 'http://localhost:3007';

// Per-interview transcript buffer for batching before sending to AI
const transcriptBuffers: Record<string, { chunks: string[]; timer: NodeJS.Timeout | null }> = {};

const SUGGESTION_DELAY_MS = 8000; // Wait 8s of accumulated speech before generating suggestions

async function processCopilotBuffer(interviewId: string, io: Server) {
    const buf = transcriptBuffers[interviewId];
    if (!buf || buf.chunks.length === 0) return;

    const transcriptText = buf.chunks.join(' ');
    // Keep last 2 chunks for sliding context, clear the rest
    buf.chunks = buf.chunks.slice(-2);

    try {
        const res = await fetch(`${INTERVIEW_SERVICE_URL}/sessions/${interviewId}/copilot/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcriptText }),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.suggestions && data.suggestions.length > 0) {
                io.to(`interview_${interviewId}`).emit('copilot:suggestions', {
                    interviewId,
                    suggestions: data.suggestions,
                    timestamp: new Date().toISOString(),
                });
            }
        }
    } catch (err) {
        logger.error(`[Socket.io] Failed to get copilot suggestions for ${interviewId}:`, err);
    }

    // Also persist transcript chunks to interview-service
    try {
        await fetch(`${INTERVIEW_SERVICE_URL}/sessions/${interviewId}/copilot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcriptChunks: [transcriptText], suggestions: [] }),
        });
    } catch {
        // Silent — persistence is best-effort
    }
}

export function setupSocketIO(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
                : ['http://localhost:3100', 'http://localhost:3000', 'https://www.placenxt.com', 'https://placenxt.com'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        logger.info(`[Socket.io] Client connected: ${socket.id}`);

        // A client (recruiter frontend) joining an interview "room" to listen to events
        socket.on('join_interview', (interviewId: string) => {
            socket.join(`interview_${interviewId}`);
            logger.info(`[Socket.io] Client ${socket.id} joined interview_${interviewId}`);
        });

        // Transcript from browser SpeechRecognition (or meeting-bot-service)
        socket.on('copilot:transcript', (data: { interviewId: string, text: string, isFinal: boolean, timestamp: string }) => {
            // Broadcast to all clients in this interview's room
            io.to(`interview_${data.interviewId}`).emit('copilot:transcript', data);

            // Accumulate final transcript chunks for AI suggestion generation
            if (data.isFinal && data.text.trim().length > 0) {
                const id = data.interviewId;
                if (!transcriptBuffers[id]) {
                    transcriptBuffers[id] = { chunks: [], timer: null };
                }

                const buf = transcriptBuffers[id];
                buf.chunks.push(data.text);

                // Schedule AI processing with a rolling delay
                if (buf.timer) clearTimeout(buf.timer);
                buf.timer = setTimeout(() => {
                    buf.timer = null;
                    processCopilotBuffer(id, io);
                }, SUGGESTION_DELAY_MS);
            }
        });

        // Copilot suggestions from external source (meeting-bot-service legacy)
        socket.on('copilot:suggestions', (data: { interviewId: string, suggestions: string[], timestamp: string }) => {
            io.to(`interview_${data.interviewId}`).emit('copilot:suggestions', data);
        });

        // Stop copilot — flush remaining buffer and generate post-mortem
        socket.on('copilot:stop', async (data: { interviewId: string }) => {
            const buf = transcriptBuffers[data.interviewId];
            if (buf) {
                if (buf.timer) clearTimeout(buf.timer);
                // Flush remaining chunks
                if (buf.chunks.length > 0) {
                    await processCopilotBuffer(data.interviewId, io);
                }
                delete transcriptBuffers[data.interviewId];
            }
        });

        socket.on('disconnect', () => {
            logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
        });
    });

    return io;
}
