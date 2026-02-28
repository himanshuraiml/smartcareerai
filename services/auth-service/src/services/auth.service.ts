import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/email';
import { cacheGet, cacheSet } from '@smartcareer/shared';

interface TokenPayload {
    id: string;
    email: string;
    role: string;
    adminForInstitutionId?: string | null;
}

export class AuthService {
    private get JWT_SECRET(): string {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return process.env.JWT_SECRET;
    }
    private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // 15 minutes
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

        // Send verification email
        try {
            await sendVerificationEmail(email, verifyToken);
            logger.info(`Verification email sent to ${email}`);
        } catch (error: any) {
            logger.error(`Failed to send verification email to ${email}: ${error.message}`);
            // Don't fail registration, user can request resend later
        }

        if (process.env.NODE_ENV !== 'production') {
            logger.info(`Verification token for ${email}: ${verifyToken}`);
        }

        // Log registration activity
        try {
            await prisma.activityLog.create({
                data: {
                    type: 'USER_REGISTER',
                    message: `User ${email} registered`,
                    userId: user.id,
                    userEmail: user.email,
                    status: 'SUCCESS'
                }
            });
        } catch (error) {
            logger.error('Failed to log registration activity', error);
        }

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    async login(email: string, password: string) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { targetJobRole: true, institution: true },
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

        // Log login activity
        try {
            await prisma.activityLog.create({
                data: {
                    type: 'USER_LOGIN',
                    message: `User ${email} logged in`,
                    userId: user.id,
                    userEmail: user.email,
                    status: 'SUCCESS'
                }
            });
        } catch (error) {
            logger.error('Failed to log login activity', error);
        }

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    async googleLogin(idToken: string) {
        if (!idToken) {
            throw new AppError('Google ID token is required', 400);
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            throw new AppError('Google login is not configured', 503);
        }

        // Verify Google Token
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (err: any) {
            logger.warn(`Google token verification failed: ${err.message}`);
            throw new AppError('Invalid or expired Google token', 401);
        }

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new AppError('Invalid Google token payload', 401);
        }

        let { email, sub: googleId, name, picture: avatarUrl } = payload;

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: { targetJobRole: true, institution: true }
        });

        if (!user) {
            // Create user
            // Generate a random password hash as it is required
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, 12);

            user = await prisma.user.create({
                data: {
                    email,
                    googleId,
                    name,
                    avatarUrl,
                    passwordHash,
                    isVerified: true, // Google emails are verified
                    verifyToken: null,
                },
                include: {
                    targetJobRole: true,
                    institution: true,
                },
            });

            // Auto-create free subscription and credits for new users
            try {
                await this.createFreeSubscriptionAndCredits(user.id);
                logger.info(`Successfully created free subscription for google user ${user.id}`);
            } catch (error: any) {
                logger.error(`Failed to create free subscription for google user ${user.id}: ${error.message}`, {
                    error: error.message,
                    stack: error.stack,
                });
            }
        } else {
            // Update googleId if not set
            if (!user.googleId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId,
                        avatarUrl: user.avatarUrl || avatarUrl,
                        isVerified: true
                    },
                    include: {
                        targetJobRole: true,
                        institution: true,
                    },
                });
            }
        }

        // Generate tokens
        const tokens = await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
            adminForInstitutionId: user.adminForInstitutionId
        });

        // Log login activity
        try {
            await prisma.activityLog.create({
                data: {
                    type: 'USER_LOGIN',
                    message: `User ${email} logged in with Google`,
                    userId: user.id,
                    userEmail: user.email,
                    status: 'SUCCESS'
                }
            });
        } catch (error) {
            logger.error('Failed to log google login activity', error);
        }

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
        let finalUserId = userId;

        if (refreshToken) {
            // Try to find the user from the refresh token if userId is unknown
            if (finalUserId === 'unknown' || !finalUserId) {
                const storedToken = await prisma.refreshToken.findUnique({
                    where: { token: refreshToken },
                    select: { userId: true }
                });
                if (storedToken) {
                    finalUserId = storedToken.userId;
                }
            }

            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken },
            });
        } else if (finalUserId && finalUserId !== 'unknown') {
            // Logout from all devices
            await prisma.refreshToken.deleteMany({ where: { userId: finalUserId } });
        }

        // Log logout activity (fire and forget)
        if (finalUserId && finalUserId !== 'unknown') {
            prisma.activityLog.create({
                data: {
                    type: 'USER_LOGOUT',
                    message: `User ${finalUserId} logged out`,
                    userId: finalUserId,
                    status: 'SUCCESS'
                }
            }).catch(err => logger.error('Failed to log logout activity', err));
        } else {
            logger.info('Anonymous logout or session expired');
        }
    }

    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { targetJobRole: true, institution: true },
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

    async updateProfile(userId: string, data: { name?: string; avatarUrl?: string; institutionId?: string | null }) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            include: { targetJobRole: true, institution: true },
        });
        return this.sanitizeUser(user);
    }

    async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if email exists
            return;
        }

        // Google-only users don't have a usable password — silently skip
        if (user.googleId) {
            logger.info(`Forgot password skipped for Google user ${email}`);
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetExpires },
        });

        try {
            await sendPasswordResetEmail(email, resetToken);
        } catch (error: any) {
            logger.error(`Failed to send reset email to ${email}: ${error.message}`);
        }
    }

    private validatePasswordStrength(password: string): void {
        if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400);
        if (!/[A-Z]/.test(password)) throw new AppError('Password must contain at least one uppercase letter', 400);
        if (!/[a-z]/.test(password)) throw new AppError('Password must contain at least one lowercase letter', 400);
        if (!/[0-9]/.test(password)) throw new AppError('Password must contain at least one number', 400);
    }

    async resetPassword(token: string, password: string) {
        this.validatePasswordStrength(password);

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

        // Grant free credits upon successful verification
        try {
            await this.createFreeSubscriptionAndCredits(user.id);
            logger.info(`Successfully created free subscription and credits for verified user ${user.id}`);
        } catch (error: any) {
            logger.error(`Failed to create free subscription for verified user ${user.id}: ${error.message}`);
            // Don't fail verification flow, but log error
        }
    }

    async resendVerificationEmail(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Silently fail to prevent email enumeration
            return;
        }

        if (user.isVerified) {
            throw new AppError('Email is already verified', 400);
        }

        // Check if there's an existing valid token to prevent spamming
        // For simplicity, we'll just generate a new one or re-send existing if recent?
        // Let's generate a new one to be safe and extend expiry if we had one.

        const verifyToken = crypto.randomBytes(32).toString('hex');

        await prisma.user.update({
            where: { id: user.id },
            data: { verifyToken }
        });

        try {
            await sendVerificationEmail(email, verifyToken);
            logger.info(`Verification email resent to ${email}`);
        } catch (error: any) {
            logger.error(`Failed to resend verification email to ${email}: ${error.message}`);
            throw new AppError('Failed to send verification email', 500);
        }
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
            expiresIn: 900, // 15 minutes in seconds
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
            hasGoogleAuth: !!user.googleId,
            targetJobRoleId: user.targetJobRoleId,
            targetJobRole: user.targetJobRole || null,
            institutionId: user.institutionId,
            institution: user.institution || null,
            createdAt: user.createdAt.toISOString(),
        };
    }

    async getInstitutions() {
        const cacheKey = 'auth:institutions';
        const cached = await cacheGet<any[]>(cacheKey);
        if (cached) return cached;

        const institutions = await prisma.institution.findMany({
            select: { id: true, name: true, domain: true },
            orderBy: { name: 'asc' }
        });

        await cacheSet(cacheKey, institutions, 3600); // 1 hour
        return institutions;
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
        this.validatePasswordStrength(password);

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
        this.validatePasswordStrength(newPassword);

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
    async deleteAccount(userId: string, password?: string, confirmPhrase?: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (user.googleId) {
            // Google users confirm deletion with a typed phrase
            if (confirmPhrase !== 'DELETE') {
                throw new AppError('Please type DELETE to confirm account deletion', 400);
            }
        } else {
            // Email users confirm with their password
            if (!password) {
                throw new AppError('Password is required', 400);
            }
            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            if (!isValidPassword) {
                throw new AppError('Password is incorrect', 401);
            }
        }

        // Log GDPR Delete activity before deletion
        await prisma.activityLog.create({
            data: {
                type: 'GDPR_DELETE',
                message: `User ${user.email} requested GDPR permanent deletion.`,
                userEmail: user.email,
                status: 'SUCCESS'
            }
        });

        // Delete user (cascading deletes will handle related records)
        await prisma.user.delete({ where: { id: userId } });

        logger.info(`Account deleted for user ${userId}`);
    }

    /**
     * Export all user data for GDPR compliance
     */
    async exportData(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                targetJobRole: true,
                institution: true,
                resumes: true,
                atsScores: true,
                userSkills: { include: { skill: true } },
                applications: { include: { job: true } },
                interviews: { include: { questions: true } },
                testAttempts: { include: { test: true } },
                skillBadges: { include: { skill: true } },
                subscription: true,
                credits: true,
                creditTransactions: true,
                recruiterProfile: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Log GDPR Export activity
        await prisma.activityLog.create({
            data: {
                type: 'GDPR_EXPORT',
                message: `User ${user.email} requested GDPR data export.`,
                userId: user.id,
                userEmail: user.email,
                status: 'SUCCESS'
            }
        });

        const { passwordHash: _, ...safeData } = user;
        return safeData;
    }

    /**
     * Create free subscription and initialize credits for a new user
     * This is called during registration to give users their free tier credits
     */
    private async createFreeSubscriptionAndCredits(userId: string) {
        // Find the free plan (cached — called every registration)
        const cacheKey = 'plan:free';
        let freePlan = await cacheGet<any>(cacheKey);
        if (!freePlan) {
            freePlan = await prisma.subscriptionPlan.findUnique({
                where: { name: 'free' },
            });
            if (freePlan) {
                await cacheSet(cacheKey, freePlan, 86400); // 24 hours
            }
        }

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
