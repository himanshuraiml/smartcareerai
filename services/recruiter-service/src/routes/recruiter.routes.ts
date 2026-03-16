import { Router } from 'express';
import { recruiterController } from '../controllers/recruiter.controller';
import { atsController } from '../controllers/ats.controller';
import { aiInterviewController } from '../controllers/ai-interview.controller';
import { aiAssistantController } from '../controllers/ai-assistant.controller';
import { SourcingController } from '../controllers/sourcing.controller';
import { scorecardRouter } from './scorecard.routes';
import { sequenceRouter } from './sequence.routes';
import { offerLetterRouter } from './offer-letter.routes';
import { npsSurveyController } from '../controllers/nps-survey.controller';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.middleware';
import { diversityController } from '../controllers/diversity.controller';
import { marketIntelController } from '../controllers/market-intel.controller';
import { hireQualityController } from '../controllers/hire-quality.controller';
import { pushNotificationController } from '../controllers/push-notification.controller';
import { atsIntegrationController } from '../controllers/ats-integration.controller';

const sourcingController = new SourcingController();

const router = Router();

// F1: Scorecard routes
router.use('/', scorecardRouter);

// F2: Drip sequence routes
router.use('/', sequenceRouter);

// F7: Offer letter routes
router.use('/', offerLetterRouter);

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

// Internal Webhook for automated pipeline progression (unprotected from role middleware, could use secure secret IRL)
router.post('/internal/pipeline/advance/:applicationId', atsController.advancePipelineInternal.bind(atsController));

// AI Interview Workflow
router.post('/jobs/:id/ai-interview/config', authMiddleware, recruiterMiddleware, aiInterviewController.generateConfig.bind(aiInterviewController));
router.get('/jobs/:id/ai-interview/config', authMiddleware, recruiterMiddleware, aiInterviewController.getConfig.bind(aiInterviewController));
router.post('/jobs/:id/ai-interview/evaluate/:applicationId', authMiddleware, recruiterMiddleware, aiInterviewController.evaluate.bind(aiInterviewController));
router.get('/jobs/:id/ai-interview/analytics', authMiddleware, recruiterMiddleware, aiInterviewController.getAnalytics.bind(aiInterviewController));

// AI Hiring Assistant
router.post('/ai-assistant/generate-jd', authMiddleware, recruiterMiddleware, aiAssistantController.generateJobDescription.bind(aiAssistantController));
router.post('/ai-assistant/salary-band', authMiddleware, recruiterMiddleware, aiAssistantController.suggestSalaryBand.bind(aiAssistantController));
router.post('/ai-assistant/analyze-jd', authMiddleware, recruiterMiddleware, aiAssistantController.analyzeJobDescription.bind(aiAssistantController)); // F4
router.get('/jobs/:id/ai-assistant/suggest-questions', authMiddleware, recruiterMiddleware, aiAssistantController.suggestInterviewQuestions.bind(aiAssistantController));
router.post('/applications/:id/ai-assistant/summary', authMiddleware, recruiterMiddleware, aiAssistantController.generateCandidateSummary.bind(aiAssistantController));
router.post('/applications/:id/ai-assistant/shortlist-justification', authMiddleware, recruiterMiddleware, aiAssistantController.generateShortlistJustification.bind(aiAssistantController));

// Phase 2: AI Sourcing / Rediscovery
router.get('/jobs/:id/rediscover', authMiddleware, recruiterMiddleware, sourcingController.rediscoverCandidates.bind(sourcingController));

// F10: NPS Survey
router.post('/applications/:id/survey', authMiddleware, recruiterMiddleware, npsSurveyController.sendSurvey.bind(npsSurveyController));
router.get('/jobs/:id/surveys', authMiddleware, recruiterMiddleware, npsSurveyController.getJobNPS.bind(npsSurveyController));

// F11: D&I Analytics
router.get('/analytics/diversity', authMiddleware, recruiterMiddleware, diversityController.getDiversityStats.bind(diversityController));
router.get('/analytics/diversity/export', authMiddleware, recruiterMiddleware, diversityController.exportEeoCSV.bind(diversityController));
router.put('/jobs/:id/blind-mode', authMiddleware, recruiterMiddleware, diversityController.toggleBlindMode.bind(diversityController));

// F20: Market Intelligence
router.get('/analytics/market-intelligence', authMiddleware, recruiterMiddleware, marketIntelController.getMarketIntelligence.bind(marketIntelController));
router.post('/analytics/market-intelligence/refresh', authMiddleware, recruiterMiddleware, marketIntelController.refreshCache.bind(marketIntelController));

// F13: Hire Quality / Predictive Model
router.post('/applications/:id/checkin', authMiddleware, recruiterMiddleware, hireQualityController.submitCheckIn.bind(hireQualityController));
router.get('/applications/:id/checkins', authMiddleware, recruiterMiddleware, hireQualityController.getCheckIns.bind(hireQualityController));
router.get('/analytics/hire-quality', authMiddleware, recruiterMiddleware, hireQualityController.getHireQualityDashboard.bind(hireQualityController));

// F16: Proctoring report + aggregate stats
router.get('/applications/:id/proctoring-report', authMiddleware, recruiterMiddleware, hireQualityController.getProctoringReport.bind(hireQualityController));
router.get('/jobs/:id/proctoring-stats', authMiddleware, recruiterMiddleware, hireQualityController.getJobProctoringStats.bind(hireQualityController));

// F14: Campus drives for recruiter
router.get('/drives', authMiddleware, recruiterMiddleware, recruiterController.getCampusDrives.bind(recruiterController));
router.get('/drives/:driveId/jobs', authMiddleware, recruiterMiddleware, recruiterController.getDriveJobs.bind(recruiterController));
router.post('/drives/:driveId/jobs', authMiddleware, recruiterMiddleware, recruiterController.postJobForDrive.bind(recruiterController));

// F15: ATS inbound webhook (public — no auth required)
router.post('/webhooks/ats/:provider', atsIntegrationController.inboundWebhook.bind(atsIntegrationController));

// F19: Push Notifications (PWA)
router.post('/push-subscription', authMiddleware, pushNotificationController.subscribe.bind(pushNotificationController));
router.delete('/push-subscription', authMiddleware, pushNotificationController.unsubscribe.bind(pushNotificationController));

export { router as recruiterRouter };

