import { Router } from 'express';
import { recruiterController } from '../controllers/recruiter.controller';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public registration (requires auth but not recruiter role)
router.post('/register', authMiddleware, recruiterController.register);

// Protected routes (require recruiter role)
router.get('/profile', authMiddleware, recruiterMiddleware, recruiterController.getProfile);
router.put('/profile', authMiddleware, recruiterMiddleware, recruiterController.updateProfile);

// Candidate routes
router.get('/candidates/search', authMiddleware, recruiterMiddleware, recruiterController.searchCandidates);
router.get('/candidates/saved', authMiddleware, recruiterMiddleware, recruiterController.getSavedCandidates);
router.post('/candidates/save', authMiddleware, recruiterMiddleware, recruiterController.saveCandidate);
router.delete('/candidates/:candidateId', authMiddleware, recruiterMiddleware, recruiterController.removeSavedCandidate);
router.put('/candidates/:candidateId/status', authMiddleware, recruiterMiddleware, recruiterController.updateCandidateStatus);

// Job routes
router.post('/jobs', authMiddleware, recruiterMiddleware, recruiterController.createJob);
router.get('/jobs', authMiddleware, recruiterMiddleware, recruiterController.getJobs);
router.get('/jobs/:id', authMiddleware, recruiterMiddleware, recruiterController.getJobById);
router.put('/jobs/:id', authMiddleware, recruiterMiddleware, recruiterController.updateJob);
router.put('/jobs/:id/toggle', authMiddleware, recruiterMiddleware, recruiterController.toggleJobStatus);
router.delete('/jobs/:id', authMiddleware, recruiterMiddleware, recruiterController.deleteJob);

export { router as recruiterRouter };
