import { Router } from 'express';
import { bgvController } from '../controllers/bgv.controller';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Initiate BGV for an applicant (OFFER stage)
router.post('/applications/:id/bgv/initiate', authMiddleware, recruiterMiddleware, bgvController.initiate.bind(bgvController));

// Get BGV status + log for an applicant
router.get('/applications/:id/bgv/status', authMiddleware, recruiterMiddleware, bgvController.getStatus.bind(bgvController));

// Inbound webhook from BGV provider (no auth — IP-restricted in prod)
router.post('/webhooks/bgv', bgvController.handleWebhook.bind(bgvController));

export { router as bgvRouter };
