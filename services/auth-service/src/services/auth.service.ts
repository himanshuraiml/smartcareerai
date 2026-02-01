import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface TokenPayload {
    id: string;
    email: string;
    role: string;
    adminForInstitutionId?: string | null;
}

export class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
    private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'; // 24 hours for development
    private readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'; // 30 days

    async register(email: string, password: string, name?: string, targetJobRoleId?: string, institutionId?: string) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new AppError('Email already registered', 400);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate verification token
        const verifyToken = crypto.randomBytes(32).toString('hex');

        // Create user with optional target job role
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                verifyToken,
                targetJobRoleId,
                institutionId,
            },
            include: {
                targetJobRole: true,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
            adminForInstitutionId: user.adminForInstitutionId
        });

        // Auto-create free subscription and credits for new users (directly via Prisma)
        try {
            await this.createFreeSubscriptionAndCredits(user.id);
            logger.info(`Successfully created free subscription and credits for user ${user.id}`);
        } catch (error: any) {
            logger.error(`Failed to create free subscription for user ${user.id}: ${error.message}`, {
                error: error.message,
                stack: error.stack,
            });
            // Don't fail registration if subscription creation fails
        }

        // TODO: Send verification email
        logger.info(`Verification token for ${email}: ${verifyToken}`);

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    async login(email: string, password: string) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { targetJobRole: true },
        });
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate tokens
        const tokens = await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
            adminForInstitutionId: user.adminForInstitutionId
        });

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    async refreshToken(refreshToken: string) {
        // Find token in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Check if expired
        if (storedToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({ where: { id: storedToken.id } });
            throw new AppError('Refresh token expired', 401);
        }

        // Delete old token
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });

        // Generate new tokens
        const tokens = await this.generateTokens({
            id: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
            adminForInstitutionId: storedToken.user.adminForInstitutionId
        });

        return tokens;
    }

    async logout(userId: string, refreshToken?: string) {
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken, userId },
            });
        } else {
            // Logout from all devices
            await prisma.refreshToken.deleteMany({ where: { userId } });
        }
    }

    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { targetJobRole: true },
        });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return this.sanitizeUser(user);
    }

    async updateTargetRole(userId: string, targetJobRoleId: string) {
        // Validate that role exists (optional, but good practice)
        // For now, we trust the ID or rely on foreign key constraints if they existed, 
        // but explicit check is better if we had access to JobRole model here easily.
        // Since JobRole is in the same DB, we could check, but let's just update.

        const user = await prisma.user.update({
            where: { id: userId },
            data: { targetJobRoleId },
            include: { targetJobRole: true },
        });

        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            include: { targetJobRole: true },
        });
        return this.sanitizeUser(user);
    }

    async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if email exists
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetExpires },
        });

        // TODO: Send reset email
        logger.info(`Reset token for ${email}: ${resetToken}`);
    }

    async resetPassword(token: string, password: string) {
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetExpires: { gt: new Date() },
            },
        });

        if (!user) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetExpires: null,
            },
        });

        // Invalidate all refresh tokens
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    }

    async verifyEmail(token: string) {
        const user = await prisma.user.findFirst({
            where: { verifyToken: token },
        });

        if (!user) {
            throw new AppError('Invalid verification token', 400);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verifyToken: null,
            },
        });
    }

    private async generateTokens(payload: TokenPayload) {
        // Generate access token
        const accessToken = jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN as string,
        } as jwt.SignOptions);

        // Generate refresh token
        const refreshToken = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                userId: payload.id,
                token: refreshToken,
                expiresAt,
            },
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 86400, // 24 hours in seconds
        };
    }

    private sanitizeUser(user: any) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            isVerified: user.isVerified,
            role: user.role,
            targetJobRoleId: user.targetJobRoleId,
            targetJobRole: user.targetJobRole || null,
            createdAt: user.createdAt.toISOString(),
        };
    }

    async getInstitutions() {
        return prisma.institution.findMany({
            select: { id: true, name: true, domain: true },
            orderBy: { name: 'asc' }
        });
    }

    /**
     * Verify an admin invite token is valid
     */
    async verifyInviteToken(token: string) {
        const user = await prisma.user.findFirst({
            where: {
                verifyToken: token,
                role: 'INSTITUTION_ADMIN',
                isVerified: false,
            },
            include: {
                adminForInstitution: {
                    select: { name: true }
                }
            }
        });

        if (!user) {
            throw new AppError('Invalid or expired invitation token', 400);
        }

        // Check if token has expired (using resetExpires as invite expiry)
        if (user.resetExpires && new Date() > user.resetExpires) {
            throw new AppError('Invitation has expired', 400);
        }

        return {
            email: user.email,
            institutionName: user.adminForInstitution?.name || 'Unknown Institution',
        };
    }

    /**
     * Accept an admin invite and set the password
     */
    async acceptInvite(token: string, password: string) {
        const user = await prisma.user.findFirst({
            where: {
                verifyToken: token,
                role: 'INSTITUTION_ADMIN',
                isVerified: false,
            },
        });

        if (!user) {
            throw new AppError('Invalid or expired invitation token', 400);
        }

        // Check if token has expired
        if (user.resetExpires && new Date() > user.resetExpires) {
            throw new AppError('Invitation has expired', 400);
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(password, 12);

        // Update user: set password, verify, clear tokens
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                isVerified: true,
                verifyToken: null,
                resetExpires: null,
            },
        });

        // Invalidate any existing refresh tokens
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    }

    /**
     * Change user password (requires current password verification)
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new AppError('Current password is incorrect', 401);
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        // Invalidate all refresh tokens (logout from all devices)
        await prisma.refreshToken.deleteMany({ where: { userId } });

        logger.info(`Password changed for user ${userId}`);
    }

    /**
     * Delete user account and all associated data
     */
    async deleteAccount(userId: string, password: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Verify password before deletion
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new AppError('Password is incorrect', 401);
        }

        // Delete user (cascading deletes will handle related records)
        await prisma.user.delete({ where: { id: userId } });

        logger.info(`Account deleted for user ${userId}`);
    }

    /**
     * Create free subscription and initialize credits for a new user
     * This is called during registration to give users their free tier credits
     */
    private async createFreeSubscriptionAndCredits(userId: string) {
        // Find the free plan
        const freePlan = await prisma.subscriptionPlan.findUnique({
            where: { name: 'free' },
        });

        if (!freePlan) {
            throw new AppError('Free plan not found in database', 500);
        }

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30); // 30 days subscription period

        // Get features from the free plan
        const features = freePlan.features as {
            resumeReviews?: number;
            interviews?: number;
            skillTests?: number;
        };

        // Use a transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Create subscription
            await tx.userSubscription.create({
                data: {
                    userId,
                    planId: freePlan.id,
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                },
            });

            // Define credit types and amounts from plan features
            const creditTypes = [
                { type: 'RESUME_REVIEW' as const, amount: features.resumeReviews || 3 },
                { type: 'AI_INTERVIEW' as const, amount: features.interviews || 1 },
                { type: 'SKILL_TEST' as const, amount: features.skillTests || 3 },
            ];

            // Create credits and transactions for each type
            for (const credit of creditTypes) {
                // Create user credit
                await tx.userCredit.create({
                    data: {
                        userId,
                        creditType: credit.type,
                        balance: credit.amount,
                    },
                });

                // Log the credit grant transaction
                await tx.creditTransaction.create({
                    data: {
                        userId,
                        creditType: credit.type,
                        amount: credit.amount,
                        transactionType: 'GRANT',
                        description: 'Free tier subscription credits',
                    },
                });
            }
        });
    }
}
