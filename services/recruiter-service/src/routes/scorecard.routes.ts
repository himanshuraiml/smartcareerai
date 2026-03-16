import { Router } from 'express';
import { scorecardController } from '../controllers/scorecard.controller';
import { authMiddleware, recruiterMiddleware, recruiterRoleMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Recruiter assigns interviewers to an applicant
router.post('/applications/:id/interviewers', authMiddleware, recruiterMiddleware, scorecardController.assignInterviewers.bind(scorecardController));

// Recruiter views all scorecards for an applicant
router.get('/applications/:id/scorecards', authMiddleware, recruiterMiddleware, scorecardController.getScorecards.bind(scorecardController));

// Any org member with recruiter role submits their scorecard
router.post('/applications/:id/scorecards', authMiddleware, recruiterRoleMiddleware, scorecardController.submitScorecard.bind(scorecardController));

// Interviewer views their pending scorecard queue
router.get('/scorecards/pending', authMiddleware, recruiterRoleMiddleware, scorecardController.getPending.bind(scorecardController));

export { router as scorecardRouter };
