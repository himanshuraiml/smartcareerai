import { Router } from 'express';
import { sequenceController } from '../controllers/sequence.controller';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/jobs/:id/sequences', authMiddleware, recruiterMiddleware, sequenceController.upsert.bind(sequenceController));
router.get('/jobs/:id/sequences', authMiddleware, recruiterMiddleware, sequenceController.list.bind(sequenceController));
router.get('/jobs/:id/sequences/metrics', authMiddleware, recruiterMiddleware, sequenceController.metrics.bind(sequenceController));
router.delete('/jobs/:id/sequences/:seqId', authMiddleware, recruiterMiddleware, sequenceController.remove.bind(sequenceController));

export { router as sequenceRouter };
