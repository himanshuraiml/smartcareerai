import { Request, Response, NextFunction } from 'express';
import { recruiterService, RecruiterProfileInput, CandidateSearchFilters } from '../services/recruiter.service';
import { jobService, CreateJobInput } from '../services/job.service';
import { logger } from '../utils/logger';

export class RecruiterController {
    // ============================================
    // Profile Management
    // ============================================

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const input: RecruiterProfileInput = req.body;

            const recruiter = await recruiterService.register(userId, input);

            res.status(201).json({
                success: true,
                data: recruiter,
                message: 'Recruiter profile created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const recruiter = await recruiterService.getProfile(userId);

            res.json({
                success: true,
                data: recruiter,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const recruiter = await recruiterService.updateProfile(userId, req.body);

            res.json({
                success: true,
                data: recruiter,
                message: 'Profile updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // Candidate Management
    // ============================================

    async searchCandidates(req: Request, res: Response, next: NextFunction) {
        try {
            const filters: CandidateSearchFilters = {
                skills: req.query.skills ? (req.query.skills as string).split(',') : undefined,
                location: req.query.location as string,
                experienceMin: req.query.experienceMin ? parseInt(req.query.experienceMin as string) : undefined,
                experienceMax: req.query.experienceMax ? parseInt(req.query.experienceMax as string) : undefined,
                hasResume: req.query.hasResume === 'true',
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };

            const result = await recruiterService.searchCandidates(filters);

            res.json({
                success: true,
                data: result.candidates,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async saveCandidate(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { candidateId, notes, tags } = req.body;

            const saved = await recruiterService.saveCandidate(recruiterId, candidateId, notes, tags);

            res.status(201).json({
                success: true,
                data: saved,
                message: 'Candidate saved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getSavedCandidates(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const status = req.query.status as string;

            const saved = await recruiterService.getSavedCandidates(recruiterId, status);

            res.json({
                success: true,
                data: saved,
            });
        } catch (error) {
            next(error);
        }
    }

    async removeSavedCandidate(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { candidateId } = req.params;

            await recruiterService.removeSavedCandidate(recruiterId, candidateId);

            res.json({
                success: true,
                message: 'Candidate removed from saved list',
            });
        } catch (error) {
            next(error);
        }
    }

    async updateCandidateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { candidateId } = req.params;
            const { status, notes } = req.body;

            const updated = await recruiterService.updateCandidateStatus(recruiterId, candidateId, status, notes);

            res.json({
                success: true,
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    }

    async getCandidateById(req: Request, res: Response, next: NextFunction) {
        try {
            const candidate = await recruiterService.getCandidateById(req.params.candidateId);
            res.json({ success: true, data: candidate });
        } catch (error) {
            next(error);
        }
    }

    async getCandidateApplications(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const applications = await recruiterService.getCandidateApplications(req.params.candidateId, recruiterId);
            res.json({ success: true, data: applications });
        } catch (error) {
            next(error);
        }
    }

    async getInstitutions(req: Request, res: Response, next: NextFunction) {
        try {
            const institutions = await jobService.getInstitutions();
            res.json({
                success: true,
                data: institutions,
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // Job Management
    // ============================================

    async createJob(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const input: CreateJobInput = req.body;

            const job = await jobService.createJob(recruiterId, input);

            res.status(201).json({
                success: true,
                data: job,
                message: 'Job posting created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const activeOnly = req.query.active === 'true';

            const jobs = await jobService.getJobs(recruiterId, activeOnly);

            res.json({
                success: true,
                data: jobs,
            });
        } catch (error) {
            next(error);
        }
    }

    async getJobById(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const job = await jobService.getJobById(req.params.id, recruiterId);

            res.json({
                success: true,
                data: job,
            });
        } catch (error) {
            next(error);
        }
    }

    async getPublicJobById(req: Request, res: Response, next: NextFunction) {
        try {
            const job = await jobService.getPublicJobById(req.params.id);

            res.json({
                success: true,
                data: job,
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // Candidate-facing: apply to a platform job
    // ============================================

    async applyToJob(req: Request, res: Response, next: NextFunction) {
        try {
            const candidateId = req.user!.id;
            const { id: jobId } = req.params;
            const { coverLetter, resumeId } = req.body;

            const result = await jobService.candidateApply(candidateId, jobId, coverLetter, resumeId);

            res.status(201).json({
                success: true,
                data: result,
                message: 'Application submitted successfully! The recruiter will review your profile.',
            });
        } catch (error) {
            next(error);
        }
    }

    async checkMyApplication(req: Request, res: Response, next: NextFunction) {
        try {
            const candidateId = req.user!.id;
            const { id: jobId } = req.params;

            const application = await jobService.getMyApplication(candidateId, jobId);

            res.json({
                success: true,
                data: application, // null if not applied
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // Invite applicant to AI interview
    // ============================================

    async inviteToInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const { id: jobId, applicationId } = req.params;
            const { customMessage, inviteType, scheduledAt, durationMinutes } = req.body;

            const result = await jobService.inviteApplicantToInterview(
                recruiterId,
                jobId,
                applicationId,
                inviteType || 'AI',
                customMessage,
                scheduledAt,
                durationMinutes ? Number(durationMinutes) : undefined,
            );

            res.status(201).json({
                success: true,
                data: result,
                message: `Interview invitation sent to ${result.candidateName}`,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateJob(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const job = await jobService.updateJob(req.params.id, recruiterId, req.body);

            res.json({
                success: true,
                data: job,
                message: 'Job posting updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async toggleJobStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            const job = await jobService.toggleJobStatus(req.params.id, recruiterId);

            res.json({
                success: true,
                data: job,
                message: `Job ${job.isActive ? 'activated' : 'deactivated'}`,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteJob(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = req.recruiter!.id;
            await jobService.deleteJob(req.params.id, recruiterId);

            res.json({
                success: true,
                message: 'Job posting deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const recruiterController = new RecruiterController();
