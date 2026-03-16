import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { authenticate } from '../middleware/auth'; // Assuming a shared auth middleware

const router = Router();
const controller = new AssessmentController();

// Question Bank (Recruiter Only)
router.post('/questions', controller.createQuestion);
router.get('/questions', controller.getQuestions);
router.put('/questions/:id', controller.updateQuestion);
router.delete('/questions/:id', controller.deleteQuestion);

// Job Mapping
router.post('/templates/:jobId', controller.createTemplate);
router.delete('/templates/:id', controller.deleteTemplate);

// Recruiter: get all attempts for a job
router.get('/attempts/job/:jobId', controller.getAttemptsByJob.bind(controller));

// Student Assessment Flow
router.get('/attempts/my', authenticate, controller.getMyAttempts.bind(controller));
router.get('/available', authenticate, controller.getAvailableAssessments.bind(controller));
router.get('/attempts/:id', authenticate, controller.getAttemptById.bind(controller));
router.post('/attempts/start', authenticate, controller.startAttempt);
router.post('/attempts/:id/events', authenticate, controller.logEvent);
router.post('/attempts/:id/snapshots', authenticate, controller.addSnapshot.bind(controller));
router.patch('/attempts/:id/flag', controller.flagAttempt.bind(controller));
router.post('/attempts/:id/submit', authenticate, controller.submitAttempt);

export default router;
