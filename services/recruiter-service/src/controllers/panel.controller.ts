import { Request, Response, NextFunction } from 'express';
import { panelService } from '../services/panel.service';

export class PanelController {
    // POST /recruiter/applications/:id/panel
    async createPanel(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const userId = req.user!.id;
            const { id: applicationId } = req.params;
            const { interviewerIds, scheduledAt, durationMins, meetLink, notes } = req.body;

            if (!Array.isArray(interviewerIds) || interviewerIds.length === 0) {
                return res.status(400).json({ success: false, message: 'interviewerIds array is required' });
            }

            const panel = await panelService.createPanel(
                applicationId,
                interviewerIds,
                scheduledAt,
                durationMins,
                meetLink,
                notes,
                userId,
                recruiterId,
            );
            res.status(201).json({ success: true, data: panel });
        } catch (error) {
            next(error);
        }
    }

    // GET /recruiter/applications/:id/panel
    async getPanel(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id: applicationId } = req.params;
            const panels = await panelService.getPanel(applicationId, recruiterId);
            res.json({ success: true, data: panels });
        } catch (error) {
            next(error);
        }
    }

    // PATCH /recruiter/panels/:panelId
    async updatePanel(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { panelId } = req.params;
            const updates = req.body;
            const panel = await panelService.updatePanel(panelId, recruiterId, updates);
            res.json({ success: true, data: panel });
        } catch (error) {
            next(error);
        }
    }

    // DELETE /recruiter/panels/:panelId
    async deletePanel(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { panelId } = req.params;
            const result = await panelService.deletePanel(panelId, recruiterId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const panelController = new PanelController();
