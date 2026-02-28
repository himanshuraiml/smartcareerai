import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';

/**
 * B2B Institution Jobs Controller
 * Handles the institution-side job approval workflow:
 *  - GET  /admin/institution/jobs             → listJobs
 *  - PATCH /admin/institution/jobs/:jobId/approval → updateApproval
 *  - POST /admin/institution/students/bulk-import → bulkImportStudents
 */
export class InstitutionJobsController {
    /** Helper: resolve the institutionId for the calling admin */
    private async getInstitutionId(userId: string): Promise<string> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { adminForInstitutionId: true },
        });
        if (!user?.adminForInstitutionId) {
            throw new AppError('Institution not found for this admin', 404);
        }
        return user.adminForInstitutionId;
    }

    // ────────────────────────────────────────────
    // POST /admin/institution/students/bulk-import
    // ────────────────────────────────────────────
    async bulkImportStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { students } = req.body as { students: { name: string; email: string }[] };

            if (!Array.isArray(students) || students.length === 0) {
                throw new AppError('No student records provided', 400);
            }

            const institutionId = await this.getInstitutionId(userId);
            const results: { name: string; email: string; status: 'success' | 'error'; message: string }[] = [];

            for (const row of students) {
                const { name = '', email } = row;
                if (!email) {
                    results.push({ name, email, status: 'error', message: 'Email is required' });
                    continue;
                }
                try {
                    const existing = await prisma.user.findUnique({ where: { email } });
                    if (existing) {
                        if (existing.institutionId === institutionId) {
                            results.push({ name, email, status: 'error', message: 'Already in your institution' });
                        } else if (existing.institutionId) {
                            results.push({ name, email, status: 'error', message: 'Enrolled in another institution' });
                        } else {
                            await prisma.user.update({
                                where: { email },
                                data: { institutionId, ...(name && !existing.name ? { name } : {}) },
                            });
                            results.push({ name: existing.name || name, email, status: 'success', message: 'Linked to institution' });
                        }
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const crypto = require('crypto');
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const bcrypt = require('bcryptjs');
                        const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
                        const verifyToken = crypto.randomBytes(32).toString('hex');

                        await prisma.user.create({
                            data: {
                                email,
                                name: name || null,
                                passwordHash,
                                institutionId,
                                verifyToken,
                                isVerified: false,
                                role: 'USER',
                            },
                        });
                        results.push({ name, email, status: 'success', message: 'Account created — invite pending' });
                    }
                } catch (rowErr: any) {
                    results.push({ name, email, status: 'error', message: rowErr?.message || 'Unknown error' });
                }
            }

            res.json({
                success: true,
                results,
                summary: {
                    total: students.length,
                    imported: results.filter(r => r.status === 'success').length,
                    failed: results.filter(r => r.status === 'error').length,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // ────────────────────────────────────────────
    // GET /admin/institution/jobs
    // ────────────────────────────────────────────
    async listJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { status = 'PENDING', page = '1', limit = '20' } = req.query;

            // Validate admin institution
            await this.getInstitutionId(userId);

            const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
            const approvalStatus = validStatuses.includes(status as string) ? status as string : 'PENDING';
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

            const [jobs, total] = await Promise.all([
                (prisma as any).recruiterJob.findMany({
                    where: { approvalStatus },
                    include: {
                        recruiter: {
                            select: {
                                companyName: true,
                                companyLogo: true,
                                industry: true,
                                isVerified: true,
                            },
                        },
                        _count: { select: { applicants: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit as string),
                }),
                (prisma as any).recruiterJob.count({ where: { approvalStatus } }),
            ]);

            res.json({
                success: true,
                data: jobs.map((j: any) => ({
                    id: j.id,
                    title: j.title,
                    location: j.location,
                    locationType: j.locationType,
                    requiredSkills: j.requiredSkills,
                    description: j.description,
                    approvalStatus: j.approvalStatus,
                    createdAt: j.createdAt,
                    recruiter: j.recruiter,
                    applicantCount: j._count.applicants,
                })),
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    totalPages: Math.ceil(total / parseInt(limit as string)),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // ────────────────────────────────────────────
    // PATCH /admin/institution/jobs/:jobId/approval
    // ────────────────────────────────────────────
    async updateApproval(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { jobId } = req.params;
            const { status } = req.body as { status: 'APPROVED' | 'REJECTED' };

            if (!['APPROVED', 'REJECTED'].includes(status)) {
                throw new AppError('Status must be APPROVED or REJECTED', 400);
            }

            // Verify calling user is an institution admin
            await this.getInstitutionId(userId);

            const job = await (prisma as any).recruiterJob.findUnique({ where: { id: jobId } });
            if (!job) throw new AppError('Job not found', 404);

            const updated = await (prisma as any).recruiterJob.update({
                where: { id: jobId },
                data: { approvalStatus: status },
            });

            res.json({
                success: true,
                data: { id: updated.id, approvalStatus: updated.approvalStatus },
                message: `Job ${status === 'APPROVED' ? 'approved for campus' : 'rejected'}`,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const institutionJobsController = new InstitutionJobsController();
