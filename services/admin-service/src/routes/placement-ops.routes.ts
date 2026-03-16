import { Router } from 'express';
import { placementOpsController } from '../controllers/placement-ops.controller';
import { adminMiddleware } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Assume mounted at /institution/:institutionId/ops

// 6.1 Placement War Room Dashboard
router.get('/dashboard', adminMiddleware, placementOpsController.getDashboardMetrics);

// 6.2 Interview Logistics
router.post('/drives/:driveId/panels', adminMiddleware, placementOpsController.createPanel);
router.post('/drives/:driveId/schedules', adminMiddleware, placementOpsController.createSchedule);
router.get('/drives/:driveId/timeline', adminMiddleware, placementOpsController.getTimeline);

// 6.3 Attendance Tracking
router.post('/drives/:driveId/attendance/generate', adminMiddleware, placementOpsController.generateAttendanceCode);
router.post('/drives/:driveId/attendance/scan', adminMiddleware, placementOpsController.scanAttendance);
router.get('/drives/:driveId/attendance', adminMiddleware, placementOpsController.getAttendance);

export const placementOpsRouter = router;
