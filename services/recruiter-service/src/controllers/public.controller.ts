import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class PublicController {
    /**
     * Authenticate ATS API key
     */
    private async authenticateApiKey(req: Request) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Unauthorized');
        }

        const apiKey = authHeader.split(' ')[1];
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const integration = await prisma.atsIntegration.findFirst({
            where: {
                apiKeyHash,
                isActive: true
            },
            include: {
                organization: true
            }
        });

        if (!integration) {
            throw new Error('Unauthorized');
        }

        return integration;
    }

    /**
     * GET /api/v1/public/jobs
     * Fetch jobs for the authenticated integration's organization
     */
    async getJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const integration = await this.authenticateApiKey(req);

            const jobs = await prisma.recruiterJob.findMany({
                where: {
                    organizationId: integration.organizationId,
                    isActive: true
                },
                select: {
                    id: true,
                    title: true,
                    location: true,
                    locationType: true,
                    createdAt: true
                }
            });

            res.json({ success: true, data: jobs });
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            next(error);
        }
    }

    /**
     * GET /api/v1/public/jobs/:jobId/candidates
     * Fetch candidates and their status for a given job
     */
    async getCandidates(req: Request, res: Response, next: NextFunction) {
        try {
            const integration = await this.authenticateApiKey(req);
            const { jobId } = req.params;

            // Ensure job belongs to the org
            const job = await prisma.recruiterJob.findFirst({
                where: { id: jobId, organizationId: integration.organizationId }
            });

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            const applicants = await prisma.recruiterJobApplicant.findMany({
                where: { jobId },
                include: {
                    candidate: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

            const formatted = applicants.map(app => ({
                id: app.id,
                candidateId: app.candidate.id,
                name: app.candidate.name,
                email: app.candidate.email,
                status: app.status,
                appliedAt: app.appliedAt,
                fitScore: app.fitScore
            }));

            res.json({ success: true, data: formatted });
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            next(error);
        }
    }
}

export const publicController = new PublicController();
