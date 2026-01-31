import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, name, targetJobRoleId, institutionId } = req.body;
            const result = await authService.register(email, password, name, targetJobRoleId, institutionId);

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

    async getInstitutions(req: Request, res: Response, next: NextFunction) {
        try {
            const institutions = await authService.getInstitutions();
            res.json({
                success: true,
                data: institutions,
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyInvite(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const { token } = req.query;
            if (!token || typeof token !== 'string') {
                res.status(400).json({
                    success: false,
                    valid: false,
                    message: 'Token is required',
                });
                return;
            }

            const result = await authService.verifyInviteToken(token);
            res.json({
                success: true,
                valid: true,
                email: result.email,
                institutionName: result.institutionName,
            });
        } catch (error: any) {
            res.json({
                success: false,
                valid: false,
                message: error.message || 'Invalid or expired token',
            });
        }
    }

    async acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Token and password are required',
                });
                return;
            }

            await authService.acceptInvite(token, password);

            logger.info('Admin invite accepted');
            res.json({
                success: true,
                message: 'Account activated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    error: 'Current password and new password are required',
                });
                return;
            }

            if (newPassword.length < 8) {
                res.status(400).json({
                    success: false,
                    error: 'New password must be at least 8 characters',
                });
                return;
            }

            await authService.changePassword(userId, currentPassword, newPassword);

            logger.info(`Password changed for user: ${userId}`);
            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { password } = req.body;

            if (!password) {
                res.status(400).json({
                    success: false,
                    error: 'Password is required to delete account',
                });
                return;
            }

            await authService.deleteAccount(userId, password);

            logger.info(`Account deleted for user: ${userId}`);
            res.json({
                success: true,
                message: 'Account deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}
