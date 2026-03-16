import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { institutionService } from '../services/institution.service';
import { eligibilityService } from '../services/eligibility.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { parse } from 'papaparse';
import { StudentProfile } from '@prisma/client';

/**
 * B2B Institution Jobs Controller
 * Handles the institution-side job approval workflow:
 *  - GET  /admin/institution/jobs             → listJobs
 *  - PATCH /admin/institution/jobs/:jobId/approval → updateApproval
 *  - POST /admin/institution/students/bulk-import → bulkImportStudents
 */
export class InstitutionJobsController {
    private async getInstitutionId(userId: string): Promise<string | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { adminForInstitutionId: true, role: true },
        });

        if (user?.role === 'ADMIN') return null; // Super admin doesn't have a fixed institutionId

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
            const { students } = req.body as {
                students: {
                    name: string;
                    email: string;
                    branch?: string;
                    department?: string;
                    cgpa?: number;
                    graduationYear?: number;
                    backlogs?: number;
                    skills?: string[];
                }[]
            };

            if (!Array.isArray(students) || students.length === 0) {
                throw new AppError('No student records provided', 400);
            }

            const institutionId = (await this.getInstitutionId(userId)) || undefined;
            if (!institutionId) {
                // Bulk import requires an institution context
                throw new AppError('Institution context required for bulk import', 400);
            }

            // Pre-fetch departments to resolve department code/name → consistent branch name
            const departments = await prisma.department.findMany({
                where: { institutionId, isActive: true },
                select: { code: true, name: true },
            });
            const deptByCode = new Map(departments.map(d => [d.code.toUpperCase(), d.name]));
            const deptByName = new Map(departments.map(d => [d.name.toUpperCase(), d.name]));

            const results: { name: string; email: string; status: 'success' | 'error'; message: string }[] = [];

            for (const row of students) {
                const { name = '', email } = row;
                if (!email) {
                    results.push({ name, email, status: 'error', message: 'Email is required' });
                    continue;
                }
                try {
                    const existing = await prisma.user.findUnique({
                        where: { email },
                        include: { studentProfile: true }
                    });

                    let targetUserId: string;

                    if (existing) {
                        targetUserId = existing.id;
                        if (existing.institutionId === institutionId) {
                            // Already in institution, just update profile
                        } else if (existing.institutionId) {
                            results.push({ name, email, status: 'error', message: 'Enrolled in another institution' });
                            continue;
                        } else {
                            await prisma.user.update({
                                where: { email },
                                data: { institutionId, ...(name && !existing.name ? { name } : {}) },
                            });
                        }
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const crypto = require('crypto');
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const bcrypt = require('bcryptjs');
                        const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
                        const verifyToken = crypto.randomBytes(32).toString('hex');

                        const newUser = await prisma.user.create({
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
                        targetUserId = newUser.id;
                    }

                    // Resolve branch: use explicit branch → department code/name lookup → fallback 'Unknown'
                    let branch = (row.branch || '').trim();
                    if (!branch && row.department) {
                        const deptKey = row.department.trim().toUpperCase();
                        branch = deptByCode.get(deptKey) || deptByName.get(deptKey) || row.department.trim();
                    }
                    if (!branch) branch = 'Unknown';

                    // Create or Update StudentProfile
                    await prisma.studentProfile.upsert({
                        where: { userId: targetUserId },
                        update: {
                            branch,
                            cgpa: row.cgpa || 0,
                            graduationYear: row.graduationYear || new Date().getFullYear(),
                            backlogs: row.backlogs || 0,
                            skills: row.skills || [],
                            institutionId: institutionId!
                        },
                        create: {
                            userId: targetUserId,
                            institutionId: institutionId!,
                            branch,
                            cgpa: row.cgpa || 0,
                            graduationYear: row.graduationYear || new Date().getFullYear(),
                            backlogs: row.backlogs || 0,
                            skills: row.skills || [],
                        }
                    });

                    results.push({
                        name,
                        email,
                        status: 'success',
                        message: existing ? 'Profile updated' : 'Account created & profile added'
                    });
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

            const institutionId = await this.getInstitutionId(userId);
            const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
            const approvalStatus = validStatuses.includes(req.query.status as string) ? req.query.status as string : 'PENDING';
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

            const where: any = { approvalStatus };
            if (institutionId) {
                where.targetInstitutionId = institutionId;
            }

            const [jobs, total] = await Promise.all([
                (prisma as any).recruiterJob.findMany({
                    where,
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
                (prisma as any).recruiterJob.count({ where }),
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
            const { status, driveId } = req.body as { status: 'APPROVED' | 'REJECTED'; driveId?: string };

            if (!['APPROVED', 'REJECTED'].includes(status)) {
                throw new AppError('Status must be APPROVED or REJECTED', 400);
            }

            // Verify calling user is an institution admin
            const institutionId = await this.getInstitutionId(userId);

            const job = await (prisma as any).recruiterJob.findFirst({
                where: { id: jobId, ...(institutionId ? { targetInstitutionId: institutionId } : {}) }
            });
            if (!job) throw new AppError('Job not found or does not belong to your institution', 404);

            const data: any = { approvalStatus: status };
            if (status === 'APPROVED' && driveId) {
                // Verify drive belongs to institution
                const drive = await (prisma as any).placementDrive.findFirst({
                    where: { id: driveId, ...(institutionId ? { institutionId } : {}) }
                });
                if (!drive) throw new AppError('Placement drive not found', 404);
                data.driveId = driveId;
            }

            const updated = await (prisma as any).recruiterJob.update({
                where: { id: jobId },
                data,
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

    // ────────────────────────────────────────────
    // GET /admin/institution/jobs/:jobId/pre-screen
    // ────────────────────────────────────────────
    async preScreen(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { jobId } = req.params;

            const institutionId = await this.getInstitutionId(userId);
            if (!institutionId) {
                // If it's a super admin, they might need to specify which institution's students to pre-screen
                // For now, if no ID, we error or find one from the job
                const job = await (prisma as any).recruiterJob.findUnique({ where: { id: jobId } });
                const actualInstitutionId = job?.targetInstitutionId;
                if (!actualInstitutionId) throw new AppError('Could not determine institution for pre-screening', 400);
                const results = await eligibilityService.preScreenStudents(jobId, actualInstitutionId);
                return res.json({ success: true, data: results });
            }
            const results = await eligibilityService.preScreenStudents(jobId, institutionId);

            res.json({ success: true, data: results });
        } catch (error) {
            next(error);
        }
    }
}

export const institutionJobsController = new InstitutionJobsController();
