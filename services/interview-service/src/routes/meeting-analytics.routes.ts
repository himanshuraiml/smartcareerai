import { Router } from 'express';
import {
    getRecruiterDashboard,
    getCandidateComparison,
    getInstitutionDashboard,
} from '../controllers/meeting-analytics.controller';

const router = Router();

// Recruiter analytics (authenticated via x-user-id from gateway)
router.get('/recruiter/dashboard', getRecruiterDashboard);
router.get('/recruiter/candidates/compare', getCandidateComparison);

// Institution admin analytics
router.get('/institution/dashboard', getInstitutionDashboard);

export { router as meetingAnalyticsRouter };
