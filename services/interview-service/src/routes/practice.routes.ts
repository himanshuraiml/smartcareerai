import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { PracticeInterviewController } from '../controllers/practice-interview.controller';

const router = Router();

// All practice routes require authentication (but no billing)
router.use(authMiddleware);

// Practice session management
router.post('/sessions', PracticeInterviewController.createSession);
router.get('/sessions', PracticeInterviewController.getSessions);
router.get('/sessions/:id', PracticeInterviewController.getSession);

// Practice answer submission (text only — no audio/video)
router.post('/sessions/:id/answer', PracticeInterviewController.submitAnswer);

// Complete practice session
router.post('/sessions/:id/complete', PracticeInterviewController.completeSession);

export { router as practiceRouter };
