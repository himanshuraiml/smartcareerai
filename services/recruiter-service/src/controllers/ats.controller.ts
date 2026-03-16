import { Request, Response, NextFunction } from 'express';
import { atsService, AtsApplicationStatus } from '../services/ats.service';
import { pipelineTriggerService } from '../services/pipeline-trigger.service';
import { createError } from '../middleware/error.middleware';

export class AtsController {
    /**
     * GET /recruiter/jobs/:id/applicants
     * Returns all applicants for the job in a Kanban-friendly shape.
     */
    async getJobApplicants(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.recruiter) {
                // If it's an admin, they might not have a recruiter profile but still want to see applicants
                if (req.user?.role === 'ADMIN') {
                     // For now, let's just use the jobId and skip recruiterId check in service if needed
                     // But the service currently enforces recruiterId
                     throw createError('Admin access to recruiter jobs not fully implemented in controller yet', 501, 'NOT_IMPLEMENTED');
                }
                throw createError('Recruiter profile not found', 404, 'RECRUITER_NOT_FOUND');
            }

            const recruiterId = req.recruiter.id;
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
            if (!req.recruiter) {
                throw createError('Recruiter profile not found', 404, 'RECRUITER_NOT_FOUND');
            }
            const recruiterId = req.recruiter.id;
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
            if (!req.recruiter) {
                throw createError('Recruiter profile not found', 404, 'RECRUITER_NOT_FOUND');
            }
            const recruiterId = req.recruiter.id;
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

    /**
     * POST /internal/pipeline/advance/:applicationId
     * Internal webhook called by scoring-service or interview-service when a candidate passes an automated stage.
     */
    async advancePipelineInternal(req: Request, res: Response, next: NextFunction) {
        try {
            const { applicationId } = req.params;
            const passed = req.body.passed !== false; // default to true if not explicitly false

            await pipelineTriggerService.advanceCandidateStage(applicationId, passed);

            res.json({ success: true, message: `Pipeline triggered for application ${applicationId}` });
        } catch (error) {
            next(error);
        }
    }
}

export const atsController = new AtsController();
