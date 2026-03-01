import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { futureLabController } from '../controllers/futurelab.controller';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// ── Tracks ──────────────────────────────────────────────────────────────────
router.get('/tracks', futureLabController.getTracks);
router.get('/tracks/:slug', futureLabController.getTrack);
router.get('/labs/:id', futureLabController.getLabDetails);

// ── Lab Progress ──────────────────────────────────────────────────────────── 
router.post('/labs/:labId/start', futureLabController.startLab);
router.post('/labs/:labId/complete', futureLabController.completeLab);

// ── Weekly Challenges ────────────────────────────────────────────────────────
router.get('/challenges/active', futureLabController.getActiveChallenge);
router.get('/challenges', futureLabController.getAllChallenges);
router.post('/challenges/:challengeId/submit', futureLabController.submitChallenge);
router.get('/challenges/:challengeId/leaderboard', futureLabController.getLeaderboard);

// ── User Stats ───────────────────────────────────────────────────────────────
router.get('/stats', futureLabController.getUserStats);

export { router as futureLabRouter };
