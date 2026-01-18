import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';
import { JobAggregatorService } from '../services/job-aggregator.service';
import { logger } from '../utils/logger';

const jobService = new JobService();
const aggregatorService = new JobAggregatorService();

export class JobController {
    async getJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit, location, locationType, experienceMin, experienceMax } = req.query;

            const jobs = await jobService.getJobs({
                page: parseInt(page as string) || 1,
                limit: parseInt(limit as string) || 20,
                location: location as string,
                locationType: locationType as string,
                experienceMin: experienceMin ? parseInt(experienceMin as string) : undefined,
                experienceMax: experienceMax ? parseInt(experienceMax as string) : undefined,
            });

            res.json({ success: true, data: jobs });
        } catch (error) {
            next(error);
        }
    }

    async getJobById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const job = await jobService.getJobById(id);
            res.json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    async createJob(req: Request, res: Response, next: NextFunction) {
        try {
            const job = await jobService.createJob(req.body);
            logger.info(`Job created: ${job.id}`);
            res.status(201).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    async updateJob(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const job = await jobService.updateJob(id, req.body);
            res.json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    async deleteJob(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await jobService.deleteJob(id);
            res.json({ success: true, message: 'Job deleted' });
        } catch (error) {
            next(error);
        }
    }

    async searchJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const { q, location, skills, remote, page, limit } = req.query;

            const jobs = await jobService.searchJobs({
                query: q as string,
                location: location as string,
                skills: skills ? (skills as string).split(',') : undefined,
                remote: remote === 'true',
                page: parseInt(page as string) || 1,
                limit: parseInt(limit as string) || 20,
            });

            res.json({ success: true, data: jobs });
        } catch (error) {
            next(error);
        }
    }

    async getMatchingJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { limit } = req.query;

            const jobs = await jobService.getMatchingJobs(
                userId,
                parseInt(limit as string) || 10
            );

            res.json({ success: true, data: jobs });
        } catch (error) {
            next(error);
        }
    }

    async saveJob(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const application = await jobService.saveJob(userId, id);
            res.status(201).json({ success: true, data: application });
        } catch (error) {
            next(error);
        }
    }

    async unsaveJob(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await jobService.unsaveJob(userId, id);
            res.json({ success: true, message: 'Job removed from saved' });
        } catch (error) {
            next(error);
        }
    }

    async getSavedJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const jobs = await jobService.getSavedJobs(userId);
            res.json({ success: true, data: jobs });
        } catch (error) {
            next(error);
        }
    }

    // Aggregate jobs from external APIs
    async aggregateJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const { q, location, remote, limit } = req.query;

            const jobs = await aggregatorService.aggregateJobs({
                query: (q as string) || 'software developer',
                location: location as string,
                remote: remote === 'true',
                limit: parseInt(limit as string) || 20,
            });

            res.json({ success: true, data: jobs, count: jobs.length });
        } catch (error) {
            next(error);
        }
    }

    // Get personalized jobs for user based on their target role
    async getJobsForUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { limit } = req.query;

            const jobs = await jobService.getJobsForUser(
                userId,
                parseInt(limit as string) || 20
            );

            res.json({ success: true, data: jobs });
        } catch (error) {
            next(error);
        }
    }

    // Aggregate jobs for user based on their target role
    async aggregateJobsForUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { limit } = req.query;

            const jobs = await aggregatorService.aggregateJobsForUser(
                userId,
                parseInt(limit as string) || 20
            );

            res.json({ success: true, data: jobs, count: jobs.length });
        } catch (error) {
            next(error);
        }
    }

    // Sync all jobs from external sources
    async syncJobs(_req: Request, res: Response, next: NextFunction) {
        try {
            const result = await aggregatorService.syncAllJobs();
            logger.info(`Job sync completed: ${result.synced} jobs`);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // One-Click Apply - create application and redirect to job source
    async applyToJob(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const { resumeId, coverLetter } = req.body;

            // Get the job
            const job = await jobService.getJobById(id);

            // Create or update application
            const application = await jobService.applyToJob(userId, id, resumeId, coverLetter);

            logger.info(`User ${userId} applied to job ${id}`);

            res.json({
                success: true,
                data: {
                    application,
                    redirectUrl: job.sourceUrl, // Redirect to external job page
                },
                message: 'Application created. Redirecting to apply page...',
            });
        } catch (error) {
            next(error);
        }
    }
}

