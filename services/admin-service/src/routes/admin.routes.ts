import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { institutionsController } from '../controllers/institutions.controller';
import { emailController } from '../controllers/email.controller';
import { billingController } from '../controllers/billing.controller';
import { errorMonitoringController } from '../controllers/error-monitoring.controller';
import { activityController } from '../controllers/activity.controller';
import { settingsController } from '../controllers/settings.controller';
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

// Email Management
router.get('/emails/logs', emailController.getEmailLogs);
router.get('/emails/stats', emailController.getEmailStats);
router.get('/emails/invites', emailController.getPendingInvites);
router.get('/emails/templates', emailController.getTemplates);
router.post('/emails/templates', emailController.createTemplate);
router.put('/emails/templates/:id', emailController.updateTemplate);
router.delete('/emails/templates/:id', emailController.deleteTemplate);
router.post('/emails/send-bulk', emailController.sendBulkEmail);
router.post('/emails/send-test', emailController.sendTestEmail);

// Billing Management
router.get('/billing/settings', billingController.getBillingSettings);
router.put('/billing/settings', billingController.updateBillingSettings);
router.get('/billing/plans', billingController.getSubscriptionPlans);
router.post('/billing/plans', billingController.createSubscriptionPlan);
router.put('/billing/plans/:id', billingController.updateSubscriptionPlan);
router.delete('/billing/plans/:id', billingController.deleteSubscriptionPlan);
router.get('/billing/credit-pricing', billingController.getCreditPricing);
router.put('/billing/credit-pricing', billingController.updateCreditPricing);
router.get('/billing/stats', billingController.getBillingStats);

// Error Monitoring
router.get('/errors/logs', errorMonitoringController.getErrorLogs);
router.get('/errors/stats', errorMonitoringController.getErrorStats);
router.post('/errors/log', errorMonitoringController.logError);
router.put('/errors/:id/resolve', errorMonitoringController.resolveError);
router.post('/errors/resolve-multiple', errorMonitoringController.resolveMultiple);
router.delete('/errors/clear-resolved', errorMonitoringController.clearResolved);
router.get('/errors/circuit-breakers', errorMonitoringController.getCircuitBreakers);
router.post('/errors/circuit-breaker', errorMonitoringController.updateCircuitBreaker);

// Activity Logs
router.get('/activity', activityController.getActivityLogs);
router.get('/activity/stats', activityController.getActivityStats);

// Settings
router.get('/settings', settingsController.getSettings);
router.post('/settings', settingsController.updateSettings);

export { router as adminRouter };
