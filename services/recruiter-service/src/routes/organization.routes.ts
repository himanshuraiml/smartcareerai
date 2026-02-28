import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { integrationController } from '../controllers/integration.controller';
import { authMiddleware, recruiterMiddleware, recruiterRoleMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Create new organization
router.post('/', authMiddleware, recruiterRoleMiddleware, organizationController.createOrganization);

// Get my organization (both / and /my are valid entry points)
router.get('/', authMiddleware, recruiterRoleMiddleware, organizationController.getMyOrganization);
router.get('/my', authMiddleware, recruiterRoleMiddleware, organizationController.getMyOrganization);

// Invite a member
router.post('/invite', authMiddleware, recruiterRoleMiddleware, organizationController.inviteMember);

// Initiate domain verification
router.post('/domain/initiate', authMiddleware, recruiterRoleMiddleware, organizationController.initiateDomainVerification);

// Verify domain
router.post('/domain/verify', authMiddleware, recruiterRoleMiddleware, organizationController.verifyDomain);

// ATS Integrations
router.post('/:orgId/integrations', authMiddleware, recruiterMiddleware, integrationController.setupIntegration);
router.get('/:orgId/integrations', authMiddleware, recruiterMiddleware, integrationController.getIntegrations);
router.delete('/:orgId/integrations/:integrationId', authMiddleware, recruiterMiddleware, integrationController.disableIntegration);

// Calendar status (unified for both platforms)
router.get('/:orgId/integrations/calendar/status', authMiddleware, recruiterMiddleware, integrationController.getCalendarStatus);

// Google Calendar OAuth
router.get('/:orgId/integrations/google-calendar/auth', authMiddleware, recruiterMiddleware, integrationController.getGoogleCalendarAuthUrl);
router.post('/:orgId/integrations/google-calendar/callback', authMiddleware, recruiterMiddleware, integrationController.googleCalendarCallback);

// Google Calendar scheduling
router.post('/:orgId/integrations/google-calendar/schedule', authMiddleware, recruiterMiddleware, integrationController.scheduleInterviewGoogle);
router.post('/:orgId/integrations/google-calendar/availability', authMiddleware, recruiterMiddleware, integrationController.getAvailabilityGoogle);

// Microsoft 365 / Outlook OAuth
router.get('/:orgId/integrations/outlook/auth', authMiddleware, recruiterMiddleware, integrationController.getOutlookAuthUrl);
router.post('/:orgId/integrations/outlook/callback', authMiddleware, recruiterMiddleware, integrationController.outlookCallback);

// Microsoft 365 scheduling
router.post('/:orgId/integrations/outlook/schedule', authMiddleware, recruiterMiddleware, integrationController.scheduleInterviewOutlook);
router.post('/:orgId/integrations/outlook/availability', authMiddleware, recruiterMiddleware, integrationController.getAvailabilityOutlook);

// Branding
router.put('/branding', authMiddleware, recruiterRoleMiddleware, organizationController.updateBranding);

// Scoring Templates
router.post('/scoring-templates', authMiddleware, recruiterRoleMiddleware, organizationController.createScoringTemplate);
router.get('/scoring-templates', authMiddleware, recruiterRoleMiddleware, organizationController.getScoringTemplates);
router.put('/scoring-templates/:templateId', authMiddleware, recruiterRoleMiddleware, organizationController.updateScoringTemplate);
router.delete('/scoring-templates/:templateId', authMiddleware, recruiterRoleMiddleware, organizationController.deleteScoringTemplate);

export { router as organizationRouter };
