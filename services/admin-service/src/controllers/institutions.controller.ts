import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { emailService } from '../utils/email';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

/**
 * Generate a secure random password
 */
function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Generate a secure invite token
 */
function generateInviteToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export class InstitutionsController {
    async createInstitution(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, domain, adminEmail } = req.body;
            const adminUserId = req.headers['x-user-id'] as string;

            // Check if domain exists
            if (domain) {
                const existing = await prisma.institution.findUnique({ where: { domain } });
                if (existing) throw new AppError('Institution with this domain already exists', 400);
            }

            // Create Institution
            const institution = await prisma.institution.create({
                data: { name, domain }
            });

            let inviteSent = false;

            // Handle Admin User
            if (adminEmail) {
                let user = await prisma.user.findUnique({ where: { email: adminEmail } });

                if (!user) {
                    // Generate temp password and invite token
                    const tempPassword = generateTempPassword();
                    const inviteToken = generateInviteToken();
                    const passwordHash = await bcrypt.hash(tempPassword, 12);

                    // Token expires in 7 days
                    const tokenExpires = new Date();
                    tokenExpires.setDate(tokenExpires.getDate() + 7);

                    // Create new user
                    user = await prisma.user.create({
                        data: {
                            email: adminEmail,
                            passwordHash,
                            role: 'INSTITUTION_ADMIN',
                            adminForInstitutionId: institution.id,
                            isVerified: false,
                            verifyToken: inviteToken,
                            resetExpires: tokenExpires // Reuse for invite expiry
                        }
                    });

                    // Send invite email
                    inviteSent = await emailService.sendAdminInvite(
                        adminEmail,
                        name,
                        inviteToken,
                        tempPassword,
                        adminUserId
                    );

                    if (!inviteSent) {
                        logger.warn(`Failed to send invite email to ${adminEmail}, but user was created`);
                    }
                } else {
                    // Update existing user to be institution admin
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            role: 'INSTITUTION_ADMIN',
                            adminForInstitutionId: institution.id
                        }
                    });

                    // User already exists, no invite needed
                    inviteSent = true;
                }
            }

            res.status(201).json({
                success: true,
                data: institution,
                inviteSent,
                message: adminEmail
                    ? (inviteSent ? 'Institution created and admin invite sent' : 'Institution created but invite email failed')
                    : 'Institution created'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Resend invitation to institution admin
     */
    async resendInvite(req: Request, res: Response, next: NextFunction) {
        try {
            const { institutionId } = req.params;
            const adminUserId = req.headers['x-user-id'] as string;

            const institution = await prisma.institution.findUnique({
                where: { id: institutionId },
                include: { admins: true }
            });

            if (!institution) {
                throw new AppError('Institution not found', 404);
            }

            const admin = institution.admins[0];
            if (!admin) {
                throw new AppError('No admin assigned to this institution', 400);
            }

            // Generate new temp password and invite token
            const tempPassword = generateTempPassword();
            const inviteToken = generateInviteToken();
            const passwordHash = await bcrypt.hash(tempPassword, 12);

            const tokenExpires = new Date();
            tokenExpires.setDate(tokenExpires.getDate() + 7);

            // Update user with new credentials
            await prisma.user.update({
                where: { id: admin.id },
                data: {
                    passwordHash,
                    verifyToken: inviteToken,
                    resetExpires: tokenExpires,
                    isVerified: false
                }
            });

            // Send invite email
            const inviteSent = await emailService.sendAdminInvite(
                admin.email,
                institution.name,
                inviteToken,
                tempPassword,
                adminUserId
            );

            if (!inviteSent) {
                throw new AppError('Failed to send invite email', 500);
            }

            res.json({
                success: true,
                message: `Invitation resent to ${admin.email}`
            });
        } catch (error) {
            next(error);
        }
    }

    async getInstitutions(req: Request, res: Response, next: NextFunction) {
        try {
            const institutions = await prisma.institution.findMany({
                include: {
                    _count: { select: { students: true } },
                    admins: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            isVerified: true
                        }
                    }
                }
            });
            res.json({ success: true, data: institutions });
        } catch (error) {
            next(error);
        }
    }
}

export const institutionsController = new InstitutionsController();
