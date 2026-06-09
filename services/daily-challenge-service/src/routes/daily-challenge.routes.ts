import { Router } from 'express';
import { dailyChallengeController } from '../controllers/daily-challenge.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All daily challenge routes are authenticated
router.use(authMiddleware);

router.get('/', dailyChallengeController.getDailyChallenge);
router.post('/submit-quiz', dailyChallengeController.submitDailyQuiz);
router.post('/read-insight', dailyChallengeController.readDailyInsight);
router.post('/complete-sprint', dailyChallengeController.completeDailySprint);
router.get('/sprint-cards', dailyChallengeController.getSprintCards);
router.post('/sprint-review', dailyChallengeController.submitSprintReview);

export { router as dailyChallengeRouter };
