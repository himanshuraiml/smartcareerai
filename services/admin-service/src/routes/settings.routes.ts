import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', settingsController.getSettings);
router.post('/', settingsController.updateSettings);

export { router as settingsRouter };
