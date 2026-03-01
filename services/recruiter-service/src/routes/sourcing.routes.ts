import { Router } from 'express';
import { SourcingController } from '../controllers/sourcing.controller';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.middleware';

const router = Router();
const sourcingController = new SourcingController();

// AI Sourcing / Rediscovery
router.get('/jobs/:id/rediscover', authMiddleware, recruiterMiddleware, sourcingController.rediscoverCandidates.bind(sourcingController));

export { router as sourcingRouter };
