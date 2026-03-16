import { Router } from 'express';
import { publicController } from '../controllers/public.controller';
import { schedulingController } from '../controllers/scheduling.controller';
import { npsSurveyController } from '../controllers/nps-survey.controller';

const router = Router();

// ATS integrations will hit these with Bearer <API_KEY>
router.get('/jobs', publicController.getJobs.bind(publicController));
router.get('/jobs/:jobId/candidates', publicController.getCandidates.bind(publicController));

// F3: Self-serve candidate scheduling (no auth required)
router.get('/schedule/:token', schedulingController.getAvailability.bind(schedulingController));
router.post('/schedule/:token/book', schedulingController.bookSlot.bind(schedulingController));

// F10: NPS Survey (no auth required)
router.get('/surveys/:token', npsSurveyController.validateToken.bind(npsSurveyController));
router.post('/surveys/:token', npsSurveyController.submitSurvey.bind(npsSurveyController));

export { router as publicRouter };
