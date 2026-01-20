import { Router } from 'express';
import { institutionController } from '../controllers/institution.controller';
import { authMiddleware, institutionAdminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require institution admin authentication
router.use(authMiddleware);
router.use(institutionAdminMiddleware);

// Dashboard
router.get('/dashboard', institutionController.getDashboard);

// Students
router.get('/students', institutionController.getStudents);
router.get('/students/:id', institutionController.getStudentById);

// Settings
router.get('/settings', institutionController.getSettings);
router.put('/settings', institutionController.updateSettings);

export { router as institutionRouter };
