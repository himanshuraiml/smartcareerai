import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { institutionsController } from '../controllers/institutions.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/verify', adminController.toggleUserVerification);
router.post('/users/:id/reset', adminController.resetUserData);
router.delete('/users/:id', adminController.deleteUser);

// Analytics
router.get('/analytics/overview', adminController.getOverview);
router.get('/analytics/user-growth', adminController.getUserGrowth);
router.get('/analytics/subscriptions', adminController.getSubscriptionDistribution);
router.get('/analytics/feature-usage', adminController.getFeatureUsage);
router.get('/analytics/job-roles', adminController.getTopJobRoles);

// Institutions
router.post('/institutions', institutionsController.createInstitution);
router.get('/institutions', institutionsController.getInstitutions);
router.post('/institutions/:institutionId/resend-invite', institutionsController.resendInvite);

export { router as adminRouter };
