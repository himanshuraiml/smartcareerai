import { Router } from 'express';
import { communityController } from '../controllers/community.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All community routes are authenticated
router.use(authMiddleware);

router.post('/questions', communityController.submitQuestion);
router.get('/questions/mine', communityController.getUserSubmissions);
router.get('/questions/review', communityController.getQuestionsForReview);
router.post('/questions/:questionId/vote', communityController.submitVote);

export { router as communityRouter };
