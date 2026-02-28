import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from './utils/logger';

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

        // The meeting-bot-service sending transcript lines
        socket.on('copilot:transcript', (data: { interviewId: string, text: string, isFinal: boolean, timestamp: string }) => {
            // Broadcast to all recruiters in this interview's room
            io.to(`interview_${data.interviewId}`).emit('copilot:transcript', data);
        });

        // The meeting-bot-service sending AI suggestions
        socket.on('copilot:suggestions', (data: { interviewId: string, suggestions: string[], timestamp: string }) => {
            io.to(`interview_${data.interviewId}`).emit('copilot:suggestions', data);
        });

        socket.on('disconnect', () => {
            logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
        });
    });

    return io;
}
