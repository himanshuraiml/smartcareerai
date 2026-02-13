import { Router } from 'express';
import { ValidationController } from '../controllers/validation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new ValidationController();

router.use(authMiddleware);

// Tests
router.get('/tests', controller.getTests);
router.get('/tests/:id', controller.getTest);
router.post('/tests/:id/start', controller.startTest);
router.post('/tests/:id/submit', controller.submitTest);

// Attempts
router.get('/attempts', controller.getUserAttempts);
router.get('/attempts/:id', controller.getAttempt);

// Badges
router.get('/badges', controller.getUserBadges);

export { router as validationRouter };
