import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const jobController = new JobController();

// Public routes
router.get('/jobs', jobController.getJobs);
router.get('/jobs/:id', jobController.getJobById);
router.get('/search', jobController.searchJobs);

// Protected routes
router.post('/jobs', authMiddleware, jobController.createJob);
router.put('/jobs/:id', authMiddleware, jobController.updateJob);
router.delete('/jobs/:id', authMiddleware, jobController.deleteJob);

router.get('/match', authMiddleware, jobController.getMatchingJobs);
router.post('/jobs/:id/save', authMiddleware, jobController.saveJob);
router.delete('/jobs/:id/save', authMiddleware, jobController.unsaveJob);
router.get('/saved', authMiddleware, jobController.getSavedJobs);

// Job aggregator routes
router.get('/aggregate', authMiddleware, jobController.aggregateJobs);
router.post('/sync', authMiddleware, jobController.syncJobs);

// Personalized job routes (based on user's target role)
router.get('/for-me', authMiddleware, jobController.getJobsForUser);
router.get('/aggregate-for-me', authMiddleware, jobController.aggregateJobsForUser);

// One-Click Apply
router.post('/jobs/:id/apply', authMiddleware, jobController.applyToJob);

// Notifications
router.get('/notifications', authMiddleware, jobController.getNotifications);
router.get('/notifications/unread-count', authMiddleware, jobController.getUnreadCount);
router.patch('/notifications/read', authMiddleware, jobController.markNotificationsRead);

export { router as jobRouter };

