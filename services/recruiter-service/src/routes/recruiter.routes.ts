import { Router } from 'express';
import { recruiterController } from '../controllers/recruiter.controller';
import { atsController } from '../controllers/ats.controller';
import { aiInterviewController } from '../controllers/ai-interview.controller';
import { aiAssistantController } from '../controllers/ai-assistant.controller';
import { SourcingController } from '../controllers/sourcing.controller';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.middleware';

const sourcingController = new SourcingController();

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
router.get('/candidates/:candidateId', authMiddleware, recruiterMiddleware, recruiterController.getCandidateById.bind(recruiterController));
router.get('/candidates/:candidateId/applications', authMiddleware, recruiterMiddleware, recruiterController.getCandidateApplications.bind(recruiterController));
router.delete('/candidates/:candidateId', authMiddleware, recruiterMiddleware, recruiterController.removeSavedCandidate);
router.put('/candidates/:candidateId/status', authMiddleware, recruiterMiddleware, recruiterController.updateCandidateStatus);

// Public / Candidate routes (any authenticated user can access)
router.get('/public/jobs/:id', authMiddleware, recruiterController.getPublicJobById);
router.get('/public/jobs/:id/my-application', authMiddleware, recruiterController.checkMyApplication);
router.post('/public/jobs/:id/apply', authMiddleware, recruiterController.applyToJob);

// Interview invite: recruiter invites an applicant to complete an AI interview
router.post('/jobs/:id/invite/:applicationId', authMiddleware, recruiterMiddleware, recruiterController.inviteToInterview);

// Job routes
router.get('/institutions', authMiddleware, recruiterMiddleware, recruiterController.getInstitutions);
router.post('/jobs', authMiddleware, recruiterMiddleware, recruiterController.createJob);
router.get('/jobs', authMiddleware, recruiterMiddleware, recruiterController.getJobs);
router.get('/jobs/:id', authMiddleware, recruiterMiddleware, recruiterController.getJobById);
router.put('/jobs/:id', authMiddleware, recruiterMiddleware, recruiterController.updateJob);
router.put('/jobs/:id/toggle', authMiddleware, recruiterMiddleware, recruiterController.toggleJobStatus);
router.delete('/jobs/:id', authMiddleware, recruiterMiddleware, recruiterController.deleteJob);

// B2B: ATS Pipeline (Kanban board) routes
router.get('/jobs/:id/applicants', authMiddleware, recruiterMiddleware, atsController.getJobApplicants.bind(atsController));
router.patch('/applications/:applicationId/status', authMiddleware, recruiterMiddleware, atsController.updateApplicationStatus.bind(atsController));
router.post('/jobs/:id/bulk-invite', authMiddleware, recruiterMiddleware, atsController.bulkAddApplicants.bind(atsController));

// AI Interview Workflow
router.post('/jobs/:id/ai-interview/config', authMiddleware, recruiterMiddleware, aiInterviewController.generateConfig.bind(aiInterviewController));
router.get('/jobs/:id/ai-interview/config', authMiddleware, recruiterMiddleware, aiInterviewController.getConfig.bind(aiInterviewController));
router.post('/jobs/:id/ai-interview/evaluate/:applicationId', authMiddleware, recruiterMiddleware, aiInterviewController.evaluate.bind(aiInterviewController));
router.get('/jobs/:id/ai-interview/analytics', authMiddleware, recruiterMiddleware, aiInterviewController.getAnalytics.bind(aiInterviewController));

// AI Hiring Assistant
router.post('/ai-assistant/generate-jd', authMiddleware, recruiterMiddleware, aiAssistantController.generateJobDescription.bind(aiAssistantController));
router.post('/ai-assistant/salary-band', authMiddleware, recruiterMiddleware, aiAssistantController.suggestSalaryBand.bind(aiAssistantController));
router.get('/jobs/:id/ai-assistant/suggest-questions', authMiddleware, recruiterMiddleware, aiAssistantController.suggestInterviewQuestions.bind(aiAssistantController));
router.post('/applications/:id/ai-assistant/summary', authMiddleware, recruiterMiddleware, aiAssistantController.generateCandidateSummary.bind(aiAssistantController));
router.post('/applications/:id/ai-assistant/shortlist-justification', authMiddleware, recruiterMiddleware, aiAssistantController.generateShortlistJustification.bind(aiAssistantController));

// Phase 2: AI Sourcing / Rediscovery
router.get('/jobs/:id/rediscover', authMiddleware, recruiterMiddleware, sourcingController.rediscoverCandidates.bind(sourcingController));

export { router as recruiterRouter };

