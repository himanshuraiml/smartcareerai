import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const applicationController = new ApplicationController();

// All routes require authentication
router.use(authMiddleware);

router.get('/applications', applicationController.getApplications);
router.get('/applications/:id', applicationController.getApplicationById);
router.post('/applications', applicationController.createApplication);
router.put('/applications/:id', applicationController.updateApplication);
router.patch('/applications/:id/status', applicationController.updateStatus);
router.delete('/applications/:id', applicationController.deleteApplication);

router.get('/stats', applicationController.getStats);
router.get('/timeline/:id', applicationController.getTimeline);

export { router as applicationRouter };
