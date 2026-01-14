import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface TokenPayload {
    id: string;
    email: string;
}

export class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
    private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'; // 24 hours for development
    private readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'; // 30 days

    async register(email: string, password: string, name?: string, targetJobRoleId?: string) {
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
            },
            include: {
                targetJobRole: true,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens({ id: user.id, email: user.email });

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
        const tokens = await this.generateTokens({ id: user.id, email: user.email });

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
}
