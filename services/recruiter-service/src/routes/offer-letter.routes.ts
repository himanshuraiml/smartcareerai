import { Router } from 'express';
import { offerLetterController } from '../controllers/offer-letter.controller';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/applications/:id/offer-letter', authMiddleware, recruiterMiddleware, offerLetterController.generate.bind(offerLetterController));
router.get('/applications/:id/offer-letter', authMiddleware, recruiterMiddleware, offerLetterController.download.bind(offerLetterController));

export { router as offerLetterRouter };
