import { Router } from 'express';
import { CodingController } from '../controllers/coding.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new CodingController();

// Apply auth to all coding routes
router.use(authMiddleware);

// Challenge catalogue
router.get('/challenges', controller.listChallenges);
router.get('/challenges/:id', controller.getChallenge);

// Code execution (no credit cost — used for the "Run" button)
router.post('/challenges/:id/run', controller.runCode);

// Final submission (costs 1 SKILL_TEST credit — runs all tests + AI analysis)
router.post('/challenges/:id/submit', controller.submitCode);

// Submission history
router.get('/submissions', controller.getUserSubmissions);
router.get('/submissions/:id', controller.getSubmission);

export { router as codingRouter };
