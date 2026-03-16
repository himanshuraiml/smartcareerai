import { Router } from 'express';
import { panelController } from '../controllers/panel.controller';
import { authMiddleware, recruiterMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Create a panel interview for an applicant
router.post('/applications/:id/panel', authMiddleware, recruiterMiddleware, panelController.createPanel.bind(panelController));

// Get panel interviews for an applicant
router.get('/applications/:id/panel', authMiddleware, recruiterMiddleware, panelController.getPanel.bind(panelController));

// Update a panel (reschedule, change status)
router.patch('/panels/:panelId', authMiddleware, recruiterMiddleware, panelController.updatePanel.bind(panelController));

// Delete a panel
router.delete('/panels/:panelId', authMiddleware, recruiterMiddleware, panelController.deletePanel.bind(panelController));

export { router as panelRouter };
