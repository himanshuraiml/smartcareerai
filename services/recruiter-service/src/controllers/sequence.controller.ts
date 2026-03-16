import { Request, Response, NextFunction } from 'express';
import { sequenceService } from '../services/sequence.service';

export class SequenceController {
    async upsert(req: Request, res: Response, next: NextFunction) {
        try {
            const jobId = req.params.id;
            const recruiterId = req.recruiter!.id;
            const { stageTrigger, steps, isActive = true } = req.body;

            if (!stageTrigger) {
                return res.status(400).json({ success: false, error: { message: 'stageTrigger is required' } });
            }
            if (!Array.isArray(steps) || steps.length === 0) {
                return res.status(400).json({ success: false, error: { message: 'steps array is required' } });
            }

            const sequence = await sequenceService.upsertSequence(jobId, stageTrigger, steps, isActive, recruiterId);
            res.json({ success: true, data: sequence });
        } catch (err) {
            next(err);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const sequences = await sequenceService.getJobSequences(req.params.id, req.recruiter!.id);
            res.json({ success: true, data: sequences });
        } catch (err) {
            next(err);
        }
    }

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await sequenceService.deleteSequence(req.params.seqId, req.recruiter!.id);
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    async metrics(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await sequenceService.getSequenceMetrics(req.params.id, req.recruiter!.id);
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }
}

export const sequenceController = new SequenceController();
