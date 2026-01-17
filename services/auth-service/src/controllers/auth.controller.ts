import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, name, targetJobRoleId } = req.body;
            const result = await authService.register(email, password, name, targetJobRoleId);

            logger.info(`User registered: ${email}`);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Registration successful. Please check your email to verify your account.',
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            logger.info(`User logged in: ${email}`);
            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const refreshToken = req.body.refreshToken;

            await authService.logout(userId, refreshToken);

            logger.info(`User logged out: ${userId}`);
            res.json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getCurrentUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const user = await authService.getUserById(userId);

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTargetRole(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const user = await authService.getUserById(userId);

            res.json({
                success: true,
                data: user.targetJobRole,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTargetRole(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { targetJobRoleId } = req.body;

            const user = await authService.updateTargetRole(userId, targetJobRoleId);

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { name, avatarUrl } = req.body;

            const user = await authService.updateProfile(userId, { name, avatarUrl });

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;
            await authService.forgotPassword(email);

            res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent.',
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, password } = req.body;
            await authService.resetPassword(token, password);

            res.json({
                success: true,
                message: 'Password reset successfully.',
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.params;
            await authService.verifyEmail(token);

            res.json({
                success: true,
                message: 'Email verified successfully.',
            });
        } catch (error) {
            next(error);
        }
    }
}
