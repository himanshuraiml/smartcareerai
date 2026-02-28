import { Router } from 'express';
import { institutionController } from '../controllers/institution.controller';
import { institutionJobsController } from '../controllers/institution-jobs.controller';
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
// B2B: Bulk import students via CSV
router.post('/students/bulk-import', institutionJobsController.bulkImportStudents.bind(institutionJobsController));

// B2B: Job approval workflow
router.get('/jobs', institutionJobsController.listJobs.bind(institutionJobsController));
router.patch('/jobs/:jobId/approval', institutionJobsController.updateApproval.bind(institutionJobsController));

// Placements & Analytics
router.get('/placements', institutionController.getPlacements.bind(institutionController));
router.get('/analytics/skill-gap', institutionController.getSkillGapHeatmap.bind(institutionController));

// Recruiter Marketplace
router.get('/recruiter-marketplace', institutionController.getRecruiterMarketplace.bind(institutionController));

// Settings
router.get('/settings', institutionController.getSettings);
router.put('/settings', institutionController.updateSettings);

export { router as institutionRouter };

