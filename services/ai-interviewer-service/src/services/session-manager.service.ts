import { io as SocketIOClient, Socket } from 'socket.io-client';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { AIParticipantService } from './ai-participant.service';
import { QuestionOrchestratorService, TranscriptSegment } from './question-orchestrator.service';

export interface AIInterviewConfig {
    meetingId: string;
    jobRole: string;
    jobDescription: string;
    candidateName?: string;
}

export interface AIInterviewSession {
    sessionId: string;
    meetingId: string;
    config: AIInterviewConfig;
    status: 'starting' | 'active' | 'ended';
    producerId: string | null;
    startedAt: Date;
}

const SESSION_TTL_SECONDS = 60 * 60 * 6; // 6 hours

/**
 * SessionManagerService — singleton that manages all active AI interview sessions.
 *
 * Each session holds:
 *  - AIParticipantService: manages the MediaSoup PlainTransport + FFmpeg RTP pipe
 *  - QuestionOrchestratorService: drives the interview conversation via Groq
 *  - A Socket.io client: subscribes to transcript events from media-service
 *
 * Session metadata is persisted to Redis so the HTTP layer can query status
 * without holding in-memory references across restarts.
 */
class SessionManagerService {
    private sessions: Map<string, {
        session: AIInterviewSession;
        participant: AIParticipantService;
        orchestrator: QuestionOrchestratorService;
        socket: Socket;
    }> = new Map();

    private redis: Redis;

    constructor() {
        this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            lazyConnect: true,
        });
        this.redis.connect().catch((e) => logger.warn('Redis connection failed (session-manager):', e));
    }

    /** Start a new AI interview session for the given meeting. */
    async startSession(config: AIInterviewConfig): Promise<AIInterviewSession> {
        if (this.sessions.has(config.meetingId)) {
            throw new Error(`Session already active for meeting ${config.meetingId}`);
        }

        const sessionId = uuidv4();
        const session: AIInterviewSession = {
            sessionId,
            meetingId: config.meetingId,
            config,
            status: 'starting',
            producerId: null,
            startedAt: new Date(),
        };

        logger.info(`Starting AI interview session ${sessionId} for meeting ${config.meetingId}`);

        // 1. Connect AI participant to media-service (PlainTransport + Producer)
        const participant = new AIParticipantService(config.meetingId);
        const transportParams = await participant.connect();
        session.producerId = transportParams.producerId;

        // 2. Subscribe to transcript events via Socket.io on media-service
        const socket = this._createTranscriptSocket(config.meetingId, sessionId);

        // 3. Create orchestrator — on each generated question, speak it
        const orchestrator = new QuestionOrchestratorService(
            config.jobRole,
            config.jobDescription,
            async (text) => {
                logger.info(`[Session ${sessionId}] AI speaking: "${text.substring(0, 80)}..."`);
                await participant.speak(text);
            }
        );

        this.sessions.set(config.meetingId, { session, participant, orchestrator, socket });

        // Persist to Redis
        session.status = 'active';
        await this._persistSession(session);

        // 4. Kick off the interview
        await orchestrator.start();

        logger.info(`AI session ${sessionId} active — producerId: ${session.producerId}`);
        return session;
    }

    /** Stop and clean up a session. */
    async stopSession(meetingId: string): Promise<void> {
        const entry = this.sessions.get(meetingId);
        if (!entry) {
            logger.warn(`No active session for meeting ${meetingId}`);
            return;
        }

        const { session, participant, orchestrator, socket } = entry;
        orchestrator.stop();
        socket.disconnect();
        await participant.disconnect();

        session.status = 'ended';
        await this._persistSession(session);
        this.sessions.delete(meetingId);

        logger.info(`AI session ${session.sessionId} ended for meeting ${meetingId}`);
    }

    /** Retrieve active session metadata (in-memory or Redis fallback). */
    async getSession(meetingId: string): Promise<AIInterviewSession | null> {
        const entry = this.sessions.get(meetingId);
        if (entry) return entry.session;

        // Fallback to Redis (e.g. after a restart)
        try {
            const raw = await this.redis.get(`ai-session:${meetingId}`);
            if (raw) return JSON.parse(raw) as AIInterviewSession;
        } catch { /* ignore */ }

        return null;
    }

    listActiveSessions(): AIInterviewSession[] {
        return Array.from(this.sessions.values()).map((e) => e.session);
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    /**
     * Creates a Socket.io client that listens on media-service /meeting namespace
     * for `transcript-segment` events, feeding them to the orchestrator.
     */
    private _createTranscriptSocket(meetingId: string, sessionId: string): Socket {
        const mediaUrl = process.env.MEDIA_SERVICE_URL || 'http://localhost:3014';
        const socket = SocketIOClient(`${mediaUrl}/meeting`, {
            transports: ['websocket'],
            auth: { meetingId, userId: `AI_BOT_${sessionId}`, role: 'AI_INTERVIEWER' },
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            logger.info(`[Session ${sessionId}] Transcript socket connected`);
            socket.emit('join-room', { meetingId, userId: `AI_BOT_${sessionId}`, role: 'AI_INTERVIEWER' });
        });

        socket.on('transcript-segment', async (data: TranscriptSegment) => {
            const entry = this.sessions.get(meetingId);
            if (!entry) return;
            // Only process candidate speech (not the AI's own echoed transcripts)
            if (data.speakerId.startsWith('AI_BOT_')) return;
            await entry.orchestrator.onTranscriptSegment(data).catch((e) =>
                logger.error(`[Session ${sessionId}] orchestrator error:`, e)
            );
        });

        socket.on('meeting:ended', async () => {
            logger.info(`[Session ${sessionId}] Meeting ended — stopping AI session`);
            await this.stopSession(meetingId).catch(() => { /* already cleaned up */ });
        });

        socket.on('disconnect', (reason) => {
            logger.warn(`[Session ${sessionId}] Transcript socket disconnected: ${reason}`);
        });

        return socket;
    }

    private async _persistSession(session: AIInterviewSession): Promise<void> {
        try {
            await this.redis.setex(
                `ai-session:${session.meetingId}`,
                SESSION_TTL_SECONDS,
                JSON.stringify(session)
            );
        } catch (e) {
            logger.warn('Failed to persist session to Redis:', e);
        }
    }
}

export const sessionManager = new SessionManagerService();
