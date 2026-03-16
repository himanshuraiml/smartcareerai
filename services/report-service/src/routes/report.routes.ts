import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { cacheMiddleware } from '@placenxt/shared';

const router = Router();

// Cache for 1 hour (3600 seconds)
const reportCache = cacheMiddleware(3600, 'reports:');

// Accreditation Reports (NAAC, NIRF, NBA)
router.get('/:institutionId/nirf', reportCache, reportController.getNirfData);
router.get('/:institutionId/export', reportController.exportAccreditationReport);

// Yearly Placement Statistics
router.get('/:institutionId/yearly-stats', reportCache, reportController.getYearlyStats);

export default router;
