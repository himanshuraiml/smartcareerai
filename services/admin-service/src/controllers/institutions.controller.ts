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
     * Send invitation to institution admin (create if not exists)
     */
    async sendInvite(req: Request, res: Response, next: NextFunction) {
        try {
            const { institutionId } = req.params;
            const { email } = req.body;
            const adminUserId = req.headers['x-user-id'] as string;

            if (!email) {
                throw new AppError('Email is required', 400);
            }

            const institution = await prisma.institution.findUnique({
                where: { id: institutionId },
                include: { admins: true }
            });

            if (!institution) {
                throw new AppError('Institution not found', 404);
            }

            // Generate temp info
            const tempPassword = generateTempPassword();
            const inviteToken = generateInviteToken();
            const passwordHash = await bcrypt.hash(tempPassword, 12);
            const tokenExpires = new Date();
            tokenExpires.setDate(tokenExpires.getDate() + 7);

            let admin = institution.admins[0];

            if (admin && admin.email === email) {
                // Same admin, just refresh invite credentials
                admin = await prisma.user.update({
                    where: { id: admin.id },
                    data: {
                        passwordHash,
                        verifyToken: inviteToken,
                        resetExpires: tokenExpires,
                        isVerified: false
                    }
                });
            } else if (admin && admin.email !== email) {
                // Different email — remove old admin role, then assign new one
                await prisma.user.update({
                    where: { id: admin.id },
                    data: { role: 'USER', adminForInstitutionId: null }
                });

                const existingUser = await prisma.user.findUnique({ where: { email } });
                if (existingUser) {
                    admin = await prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            role: 'INSTITUTION_ADMIN',
                            adminForInstitutionId: institution.id,
                            passwordHash,
                            verifyToken: inviteToken,
                            resetExpires: tokenExpires,
                            isVerified: false
                        }
                    });
                } else {
                    admin = await prisma.user.create({
                        data: {
                            email,
                            passwordHash,
                            role: 'INSTITUTION_ADMIN',
                            adminForInstitutionId: institution.id,
                            isVerified: false,
                            verifyToken: inviteToken,
                            resetExpires: tokenExpires
                        }
                    });
                }
            } else {
                // Check if user with this email already exists
                const existingUser = await prisma.user.findUnique({ where: { email } });

                if (existingUser) {
                    // Promote existing user to admin
                    admin = await prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            role: 'INSTITUTION_ADMIN',
                            adminForInstitutionId: institution.id,
                            // Don't reset password/verification if they are already a user, unless we want to force re-verification
                            // For now, let's treat them as a new admin who needs to set up
                            passwordHash,
                            verifyToken: inviteToken,
                            resetExpires: tokenExpires,
                            isVerified: false
                        }
                    });
                } else {
                    // Create new user
                    admin = await prisma.user.create({
                        data: {
                            email,
                            passwordHash,
                            role: 'INSTITUTION_ADMIN',
                            adminForInstitutionId: institution.id,
                            isVerified: false,
                            verifyToken: inviteToken,
                            resetExpires: tokenExpires
                        }
                    });
                }
            }

            // Send invite email
            const inviteSent = await emailService.sendAdminInvite(
                admin.email,
                institution.name,
                inviteToken,
                tempPassword,
                adminUserId,
                true // throwOnError: true
            );

            if (!inviteSent) {
                // This shouldn't be reached if throwOnError is true, but just in case
                throw new AppError('Failed to send invite email', 500);
            }

            res.json({
                success: true,
                message: `Invitation sent to ${admin.email}`
            });
        } catch (error: any) {
            // If it's already an AppError, pass it through
            if (error instanceof AppError) {
                return next(error);
            }

            // Otherwise, wrap it or pass it
            next(new AppError(`Failed to send invite: ${error.message}`, 500));
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

    /**
     * Set credentials directly for institution admin (when email fails)
     * This allows super admin to create/reset credentials without sending email
     */
    async setAdminCredentials(req: Request, res: Response, next: NextFunction) {
        try {
            const { institutionId } = req.params;
            const { email, password } = req.body;

            if (!email || !password) {
                throw new AppError('Email and password are required', 400);
            }

            if (password.length < 8) {
                throw new AppError('Password must be at least 8 characters', 400);
            }

            const institution = await prisma.institution.findUnique({
                where: { id: institutionId },
                include: { admins: true }
            });

            if (!institution) {
                throw new AppError('Institution not found', 404);
            }

            const passwordHash = await bcrypt.hash(password, 12);

            let admin = institution.admins[0];

            if (admin) {
                // Update existing admin
                admin = await prisma.user.update({
                    where: { id: admin.id },
                    data: {
                        email,
                        passwordHash,
                        isVerified: true, // Mark as verified since credentials are set directly
                        verifyToken: null,
                        resetExpires: null
                    }
                });
            } else {
                // Create new admin
                admin = await prisma.user.create({
                    data: {
                        email,
                        passwordHash,
                        role: 'INSTITUTION_ADMIN',
                        adminForInstitutionId: institution.id,
                        isVerified: true
                    }
                });
            }

            logger.info(`Credentials set directly for institution admin: ${email}`);

            res.json({
                success: true,
                message: `Credentials set for ${email}. They can now login directly.`,
                data: {
                    email: admin.email,
                    isVerified: admin.isVerified
                }
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
