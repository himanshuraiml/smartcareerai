import { Router } from 'express';
import { SourcingController } from '../controllers/sourcing.controller';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.middleware';

const router = Router();
const sourcingController = new SourcingController();

// AI Sourcing / Rediscovery
router.get('/jobs/:id/rediscover', authMiddleware, recruiterMiddleware, sourcingController.rediscoverCandidates.bind(sourcingController));
router.post('/jobs/:id/rediscover/:candidateId/evaluate', authMiddleware, recruiterMiddleware, sourcingController.evaluateCandidate.bind(sourcingController));
router.post('/jobs/:id/compare', authMiddleware, recruiterMiddleware, sourcingController.compareCandidates.bind(sourcingController));

export { router as sourcingRouter };
