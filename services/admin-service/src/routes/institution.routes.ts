import { Router } from 'express';
import { institutionController } from '../controllers/institution.controller';
import { institutionJobsController } from '../controllers/institution-jobs.controller';
import { placementDriveController } from '../controllers/placement-drive.controller';
import { broadcastController } from '../controllers/broadcast.controller';
import { rbacController } from '../controllers/rbac.controller';
import { authMiddleware, institutionAdminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Internal/Service-to-Service routes (unprotected or eventually protected by internal secret)
router.post('/ai/internal/calculate-readiness/:userId', institutionController.calculateReadinessInternal.bind(institutionController));

// F14: Student-facing drive routes (auth only, no institution admin role needed)
router.get('/student/drives', authMiddleware, placementDriveController.listDrivesForStudent.bind(placementDriveController));
router.post('/drives/:id/register', authMiddleware, placementDriveController.registerForDrive.bind(placementDriveController));

// All other routes require institution admin authentication
router.use(authMiddleware);
router.use(institutionAdminMiddleware);

// Dashboard
router.get('/dashboard', institutionController.getDashboard);

// Students
router.get('/students', institutionController.getStudents);
router.get('/students/:id', institutionController.getStudentById);
router.put('/students/:id', institutionController.updateStudentProfile);
// B2B: Bulk import students via CSV
router.post('/students/bulk-import', institutionJobsController.bulkImportStudents.bind(institutionJobsController));

// B2B:// Job Approvals & Marketplace
router.get('/jobs', institutionJobsController.listJobs.bind(institutionJobsController));
router.patch('/jobs/:jobId/approval', institutionJobsController.updateApproval.bind(institutionJobsController));
router.get('/jobs/:jobId/pre-screen', institutionJobsController.preScreen.bind(institutionJobsController));

// Placement Drives
router.get('/drives', placementDriveController.listDrives.bind(placementDriveController));
router.post('/drives', placementDriveController.createDrive.bind(placementDriveController));
router.get('/drives/:id', placementDriveController.getDrive.bind(placementDriveController));
router.put('/drives/:id', placementDriveController.updateDrive.bind(placementDriveController));
// F14: Additional drive endpoints
router.get('/drives/:id/registrations', placementDriveController.getDriveRegistrations.bind(placementDriveController));
router.get('/drives/:id/analytics', placementDriveController.getDriveAnalytics.bind(placementDriveController));
router.put('/drives/:id/stages', placementDriveController.updateStages.bind(placementDriveController));
router.post('/drives/:id/advance', placementDriveController.advanceStudents.bind(placementDriveController));

// Drive Recruiter Invites
router.get('/drives/:id/invites', placementDriveController.getDriveInvites.bind(placementDriveController));
router.post('/drives/:id/invites', placementDriveController.inviteRecruiter.bind(placementDriveController));
router.delete('/drives/:id/invites/:inviteId', placementDriveController.removeInvite.bind(placementDriveController));

// Recruiter search (for invite UI)
router.get('/recruiters/search', placementDriveController.searchRecruiters.bind(placementDriveController));

// Placements & Analytics
router.get('/placements', institutionController.getPlacements.bind(institutionController));
router.get('/analytics/placement', institutionController.getPlacementAnalytics.bind(institutionController));
router.get('/analytics/skill-gap', institutionController.getSkillGapHeatmap.bind(institutionController));

// AI Intelligence (Phase 4)
router.post('/ai/calculate-readiness/:studentId', institutionController.calculateReadiness.bind(institutionController));
router.get('/ai/risk-assessments', institutionController.getRiskAssessments.bind(institutionController));
router.post('/ai/resolve-alert/:id', institutionController.resolveAlert.bind(institutionController));

// Placement Policy Engine (Phase 2)
router.get('/policy', institutionController.getPlacementPolicy.bind(institutionController));
router.put('/policy', institutionController.updatePlacementPolicy.bind(institutionController));

// Corporate Relations Management (Phase 2)
router.get('/partnerships', institutionController.getPartnerships.bind(institutionController));
router.post('/partnerships', institutionController.createPartnership.bind(institutionController));
router.put('/partnerships/:id', institutionController.updatePartnership.bind(institutionController));
router.delete('/partnerships/:id', institutionController.deletePartnership.bind(institutionController));

// Institutional Role Management (Legacy — kept for backward compatibility)
router.post('/roles/assign', institutionController.updateInstitutionalRole.bind(institutionController));

// ============================================
// RBAC: Role-Based Access Control (New)
// ============================================

// Permissions
router.get('/rbac/permissions', rbacController.getAllPermissions.bind(rbacController));

// Roles CRUD
router.get('/rbac/roles', rbacController.getRoles.bind(rbacController));
router.get('/rbac/roles/:roleId', rbacController.getRoleById.bind(rbacController));
router.post('/rbac/roles', rbacController.createRole.bind(rbacController));
router.put('/rbac/roles/:roleId', rbacController.updateRole.bind(rbacController));
router.delete('/rbac/roles/:roleId', rbacController.deleteRole.bind(rbacController));

// Staff Management
router.get('/rbac/staff', rbacController.getStaffMembers.bind(rbacController));
router.post('/rbac/staff/assign', rbacController.assignRole.bind(rbacController));
router.delete('/rbac/staff/:assignmentId', rbacController.revokeRole.bind(rbacController));
router.get('/rbac/staff/:userId/permissions', rbacController.getUserPermissions.bind(rbacController));

// Departments
router.get('/rbac/departments', rbacController.getDepartments.bind(rbacController));
router.post('/rbac/departments', rbacController.createDepartment.bind(rbacController));
router.put('/rbac/departments/:departmentId', rbacController.updateDepartment.bind(rbacController));
router.delete('/rbac/departments/:departmentId', rbacController.deleteDepartment.bind(rbacController));

// Audit Logs
router.get('/rbac/audit-logs', rbacController.getAuditLogs.bind(rbacController));

// Approval Workflows
router.get('/rbac/workflows', rbacController.getApprovalWorkflows.bind(rbacController));
router.post('/rbac/workflows/:workflowId/approve', rbacController.processApproval.bind(rbacController));

// Seed default roles & permissions
router.post('/rbac/seed-defaults', rbacController.seedDefaults.bind(rbacController));

// Training Plan & Assignment
router.post('/training-plan/generate', institutionController.generateTrainingPlan.bind(institutionController));
router.post('/training/assign', institutionController.assignTraining.bind(institutionController));
router.get('/training/assignments', institutionController.getTrainingAssignments.bind(institutionController));
router.get('/analytics/linkedin-trends', institutionController.getLinkedInTrends.bind(institutionController));
router.post('/analytics/placement-simulation', institutionController.getPlacementSimulation.bind(institutionController));
router.get('/analytics/department-readiness', institutionController.getDepartmentReadiness.bind(institutionController));
router.get('/analytics/activity', institutionController.getActivityLog.bind(institutionController));

// Recruiter Marketplace
router.get('/recruiter-marketplace', institutionController.getRecruiterMarketplace.bind(institutionController));

// Communication & Alerts (Phase 2)
router.post('/broadcast', broadcastController.broadcast.bind(broadcastController));
router.get('/broadcast/history', broadcastController.getHistory.bind(broadcastController));

// Settings
router.get('/settings', institutionController.getSettings);
router.put('/settings', institutionController.updateSettings);
router.get('/profile', institutionController.getSettings);
router.put('/profile', institutionController.updateSettings);

export { router as institutionRouter };

