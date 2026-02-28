import { Router } from 'express';
import { publicController } from '../controllers/public.controller';

const router = Router();

// ATS integrations will hit these with Bearer <API_KEY>
router.get('/jobs', publicController.getJobs.bind(publicController));
router.get('/jobs/:jobId/candidates', publicController.getCandidates.bind(publicController));

export { router as publicRouter };
