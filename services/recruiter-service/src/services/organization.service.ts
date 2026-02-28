import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface CreateOrganizationInput {
    name: string;
    domain?: string;
    website?: string;
    industry?: string;
    companySize?: string;
}

export class OrganizationService {
    /**
     * Create a new organization and assign the creator as OWNER
     */
    async createOrganization(userId: string, input: CreateOrganizationInput) {
        if (!input.name?.trim()) {
            throw createError('Organization name is required', 400, 'MISSING_NAME');
        }

        let recruiter = await prisma.recruiter.findUnique({ where: { userId } });

        // Auto-create recruiter profile if user has the RECRUITER role but hasn't registered yet
        if (!recruiter) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || (user.role !== 'RECRUITER' && user.role !== 'ADMIN')) {
                throw createError('You must be a registered recruiter to create an organization', 400, 'NOT_RECRUITER');
            }
            recruiter = await prisma.recruiter.create({
                data: { userId, companyName: input.name.trim() }
            });
            if (user.role !== 'RECRUITER') {
                await prisma.user.update({ where: { id: userId }, data: { role: 'RECRUITER' } });
            }
            logger.info(`Auto-created recruiter profile for user ${userId}`);
        }

        if (recruiter.organizationId) {
            throw createError('You already belong to an organization', 400, 'ALREADY_IN_ORG');
        }

        return prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: input.name.trim(),
                    domain: input.domain || undefined,
                    website: input.website || undefined,
                    industry: input.industry || undefined,
                    companySize: input.companySize || undefined,
                    isVerified: false
                }
            });

            // Associate the recruiter with the new organization as an OWNER
            await tx.recruiter.update({
                where: { id: recruiter!.id },
                data: {
                    organizationId: org.id,
                    orgRole: 'OWNER',
                    companyName: input.name.trim(),
                }
            });

            logger.info(`Organization ${org.id} created by user ${userId}`);
            return org;
        });
    }

    /**
     * Get organization details for the current user
     */
    async getMyOrganization(userId: string) {
        const recruiter = await prisma.recruiter.findUnique({ where: { userId } });

        if (!recruiter || !recruiter.organizationId) {
            throw createError('Organization not found', 404, 'ORG_NOT_FOUND');
        }

        const org = await prisma.organization.findUnique({
            where: { id: recruiter.organizationId },
            include: {
                recruiters: {
                    select: {
                        id: true,
                        orgRole: true,
                        user: { select: { name: true, email: true, avatarUrl: true } }
                    }
                },
                _count: {
                    select: { jobs: true }
                }
            }
        });

        return org;
    }

    /**
     * Add a member to the organization
     */
    async inviteMember(ownerUserId: string, inviteeEmail: string, role: 'ADMIN' | 'RECRUITER' | 'HR' | 'HIRING_MANAGER' | 'INTERVIEWER') {
        const owner = await prisma.recruiter.findUnique({ where: { userId: ownerUserId } });

        if (!owner || !owner.organizationId || !['OWNER', 'ADMIN'].includes(owner.orgRole)) {
            throw createError('Not authorized to invite members to this organization', 403, 'FORBIDDEN');
        }

        // Find invitee user
        const invitee = await prisma.user.findUnique({ where: { email: inviteeEmail } });
        if (!invitee) {
            throw createError('Invitee user not found. They must sign up first.', 404, 'USER_NOT_FOUND');
        }

        let inviteeRecruiter = await prisma.recruiter.findUnique({ where: { userId: invitee.id } });

        if (inviteeRecruiter && inviteeRecruiter.organizationId) {
            throw createError('Invitee already belongs to an organization', 400, 'ALREADY_IN_ORG');
        }

        // If they don't have a recruiter profile, create one automatically
        if (!inviteeRecruiter) {
            inviteeRecruiter = await prisma.recruiter.create({
                data: {
                    userId: invitee.id,
                    companyName: 'Pending Organization',
                }
            });
            await prisma.user.update({
                where: { id: invitee.id },
                data: { role: 'RECRUITER' }
            });
        }

        // Assign to organization
        const updatedRecruiter = await prisma.recruiter.update({
            where: { id: inviteeRecruiter.id },
            data: {
                organizationId: owner.organizationId,
                orgRole: role
            }
        });

        logger.info(`User ${invitee.id} added to organization ${owner.organizationId} by ${ownerUserId}`);
        return updatedRecruiter;
    }

    /**
     * Initiate domain verification by generating a token
     */
    async initiateDomainVerification(userId: string) {
        const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
        if (!recruiter || !recruiter.organizationId || !['OWNER', 'ADMIN'].includes(recruiter.orgRole)) {
            throw createError('Not authorized to manage domain settings', 403, 'FORBIDDEN');
        }

        const org = await prisma.organization.findUnique({ where: { id: recruiter.organizationId } });
        if (!org || !org.domain) {
            throw createError('Organization has no domain configured', 400, 'NO_DOMAIN');
        }

        if (org.isVerified) {
            throw createError('Domain is already verified', 400, 'ALREADY_VERIFIED');
        }

        // Generate a random 6-digit OTP
        const token = Math.floor(100000 + Math.random() * 900000).toString();

        await prisma.organization.update({
            where: { id: org.id },
            data: { domainVerificationToken: token }
        });

        logger.info(`Verification token generated for organization ${org.id}`);

        // In a real app, send email with OTP to an admin at the domain.
        // For now, returning it so the frontend can display it in dev mode.
        return { token, domain: org.domain };
    }

    /**
     * Verify the domain using the token
     */
    async verifyDomain(userId: string, token: string) {
        if (!token) {
            throw createError('Verification token is required', 400, 'NO_TOKEN');
        }

        const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
        if (!recruiter || !recruiter.organizationId || !['OWNER', 'ADMIN'].includes(recruiter.orgRole)) {
            throw createError('Not authorized to manage domain settings', 403, 'FORBIDDEN');
        }

        const org = await prisma.organization.findUnique({ where: { id: recruiter.organizationId } });
        if (!org) {
            throw createError('Organization not found', 404, 'ORG_NOT_FOUND');
        }

        if (org.isVerified) {
            return org;
        }

        if (org.domainVerificationToken !== token) {
            throw createError('Invalid verification token', 400, 'INVALID_TOKEN');
        }

        const updatedOrg = await prisma.organization.update({
            where: { id: org.id },
            data: {
                isVerified: true,
                domainVerificationToken: null
            }
        });

        logger.info(`Organization ${org.id} domain verified successfully`);
        return updatedOrg;
    }

    /**
     * Update White-Label Settings (Branding)
     */
    async updateBranding(userId: string, data: { customDomain?: string; isWhiteLabel?: boolean; theme?: any; logoUrl?: string }) {
        const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
        if (!recruiter || !recruiter.organizationId || !['OWNER', 'ADMIN'].includes(recruiter.orgRole)) {
            throw createError('Not authorized to manage branding', 403, 'FORBIDDEN');
        }

        const updated = await prisma.organization.update({
            where: { id: recruiter.organizationId },
            data: {
                customDomain: data.customDomain,
                isWhiteLabel: data.isWhiteLabel,
                theme: data.theme,
                logoUrl: data.logoUrl
            }
        });

        logger.info(`Organization ${recruiter.organizationId} branding updated by ${userId}`);
        return updated;
    }

    /**
     * Create a Scoring Template
     */
    async createScoringTemplate(userId: string, data: { name: string; description?: string; weights: any; isDefault?: boolean }) {
        const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
        if (!recruiter || !recruiter.organizationId || !['OWNER', 'ADMIN', 'HR'].includes(recruiter.orgRole)) {
            throw createError('Not authorized to create scoring templates', 403, 'FORBIDDEN');
        }

        if (data.isDefault) {
            // Unset current defaults
            await prisma.scoringTemplate.updateMany({
                where: { organizationId: recruiter.organizationId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const template = await prisma.scoringTemplate.create({
            data: {
                organizationId: recruiter.organizationId,
                name: data.name,
                description: data.description,
                weights: data.weights,
                isDefault: data.isDefault || false
            }
        });

        logger.info(`Scoring template ${template.id} created by ${userId}`);
        return template;
    }

    /**
     * Get all Scoring Templates
     */
    async getScoringTemplates(userId: string) {
        const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
        if (!recruiter || !recruiter.organizationId) {
            throw createError('Organization not found', 404, 'ORG_NOT_FOUND');
        }

        return prisma.scoringTemplate.findMany({
            where: { organizationId: recruiter.organizationId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Update a Scoring Template
     */
    async updateScoringTemplate(userId: string, templateId: string, data: { name?: string; description?: string; weights?: any; isDefault?: boolean }) {
        const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
        if (!recruiter || !recruiter.organizationId || !['OWNER', 'ADMIN', 'HR'].includes(recruiter.orgRole)) {
            throw createError('Not authorized to edit scoring templates', 403, 'FORBIDDEN');
        }

        if (data.isDefault) {
            await prisma.scoringTemplate.updateMany({
                where: { organizationId: recruiter.organizationId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const updated = await prisma.scoringTemplate.update({
            where: { id: templateId, organizationId: recruiter.organizationId },
            data: {
                name: data.name,
                description: data.description,
                weights: data.weights,
                isDefault: data.isDefault
            }
        });

        logger.info(`Scoring template ${templateId} updated by ${userId}`);
        return updated;
    }

    /**
     * Delete a Scoring Template
     */
    async deleteScoringTemplate(userId: string, templateId: string) {
        const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
        if (!recruiter || !recruiter.organizationId || !['OWNER', 'ADMIN', 'HR'].includes(recruiter.orgRole)) {
            throw createError('Not authorized to delete scoring templates', 403, 'FORBIDDEN');
        }

        await prisma.scoringTemplate.delete({
            where: { id: templateId, organizationId: recruiter.organizationId }
        });

        logger.info(`Scoring template ${templateId} deleted by ${userId}`);
        return { success: true };
    }
}

export const organizationService = new OrganizationService();
