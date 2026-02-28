import { Request, Response, NextFunction } from 'express';
import { atsService, AtsApplicationStatus } from '../services/ats.service';

export class AtsController {
    /**
     * GET /recruiter/jobs/:id/applicants
     * Returns all applicants for the job in a Kanban-friendly shape.
     */
    async getJobApplicants(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id: jobId } = req.params;

            const applicants = await atsService.getJobApplicants(jobId, recruiterId);

            res.json({ success: true, data: applicants });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /recruiter/applications/:applicationId/status
     * Moves an applicant to a new Kanban column.
     *
     * Body: { status: 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' }
     */
    async updateApplicationStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { applicationId } = req.params;
            const { status } = req.body as { status: AtsApplicationStatus };

            const result = await atsService.updateApplicationStatus(applicationId, recruiterId, status);

            res.json({ success: true, data: result, message: `Moved to ${status}` });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /recruiter/jobs/:id/bulk-invite
     * Body: { candidates: { name: string, email: string }[] }
     */
    async bulkAddApplicants(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id: jobId } = req.params;
            const { candidates } = req.body;

            const results = await atsService.bulkInvite(jobId, recruiterId, candidates);

            res.status(201).json({
                success: true,
                data: results,
                message: `Successfully invited ${results.added} candidates (${results.skipped} skipped, ${results.failed} failed)`
            });
        } catch (error) {
            next(error);
        }
    }
}

export const atsController = new AtsController();
