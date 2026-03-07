import { Router } from 'express';
import {
    startAIInterview,
    stopAIInterview,
    getAIInterviewStatus,
    listActiveSessions,
} from '../controllers/ai-interview.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const aiInterviewRouter = Router();

// All routes require gateway auth (x-user-id injected by api-gateway)
aiInterviewRouter.use(authMiddleware);

/** POST /ai-interviews — Start AI interviewer for a meeting */
aiInterviewRouter.post('/', startAIInterview);

/** GET /ai-interviews — List all active sessions */
aiInterviewRouter.get('/', listActiveSessions);

/** GET /ai-interviews/:meetingId — Session status */
aiInterviewRouter.get('/:meetingId', getAIInterviewStatus);

/** DELETE /ai-interviews/:meetingId — Stop the AI interviewer */
aiInterviewRouter.delete('/:meetingId', stopAIInterview);
