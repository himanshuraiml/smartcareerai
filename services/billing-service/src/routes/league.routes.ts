import { Router } from 'express';
import { leagueController } from '../controllers/league.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// User league routes (authenticated)
router.get('/current', authMiddleware, leagueController.getUserLeague);
router.get('/leaderboard/:leagueId', authMiddleware, leagueController.getLeagueLeaderboard);
router.get('/history', authMiddleware, leagueController.getLeagueHistory);
router.get('/result', authMiddleware, leagueController.getLastWeekResult);

// Admin-only manual weekly reset trigger
router.post('/weekly-reset', leagueController.processWeeklyReset);

export { router as leagueRouter };
