import { Router } from 'express';
import { ScoringController } from '../controllers/scoring.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { ScoreRequestSchema } from '../schemas/scoring.schema';

const router = Router();
const scoringController = new ScoringController();

// Routes
router.post('/analyze', authMiddleware, validateRequest(ScoreRequestSchema), scoringController.analyzeResume);
router.get('/history', authMiddleware, scoringController.getScoreHistory);
router.get('/:id', authMiddleware, scoringController.getScoreById);
router.get('/roles', scoringController.getJobRoles);

export { router as scoringRouter };
