import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

const authService = new AuthService();

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Cookie options
    const cookieOptions = {
        httpOnly: true, // Prevent JS access
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? 'strict' as const : 'lax' as const, // CSRF protection
        path: '/',
    };

    // 15 minutes for access token
    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
    });

    // 7 days for refresh token
    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, name, targetJobRoleId, institutionId } = req.body;
            const result = await authService.register(email, password, name, targetJobRoleId, institutionId);

            setAuthCookies(res, result.accessToken, result.refreshToken);

            logger.info(`User registered: ${email}`);

            // Remove tokens from response body
            const { accessToken, refreshToken, ...userData } = result;

            res.status(201).json({
                success: true,
                data: userData,
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

            setAuthCookies(res, result.accessToken, result.refreshToken);

            logger.info(`User logged in: ${email}`);

            // Remove tokens from response body
            const { accessToken, refreshToken, ...userData } = result;

            res.json({
                success: true,
                data: userData,
            });
        } catch (error) {
            next(error);
        }
    }

    async googleLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const { idToken } = req.body;
            const result = await authService.googleLogin(idToken);

            setAuthCookies(res, result.accessToken, result.refreshToken);

            logger.info(`User Google logged in: ${result.user.email}`);

            // Remove tokens from response body
            const { accessToken, refreshToken, ...userData } = result;

            res.json({
                success: true,
                data: userData,
            });
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            // Get refresh token from cookie if not in body
            const token = req.cookies.refreshToken || req.body.refreshToken;

            if (!token) {
                res.status(401).json({
                    success: false,
                    message: 'Refresh token required',
                });
                return;
            }

            const result = await authService.refreshToken(token);

            setAuthCookies(res, result.accessToken, result.refreshToken);

            // Return minimal data, tokens are in cookies
            res.json({
                success: true,
                message: 'Token refreshed',
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            // userId might be undefined if session is expired, but we still want to clear cookies
            const userId = (req as any).user?.id;
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

            if (userId || refreshToken) {
                // If we have either, we can try to clean up DB
                // authService.logout handles optional refreshToken
                await authService.logout(userId || 'unknown', refreshToken);
            }

            // Clear cookies on client regardless of auth status
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            logger.info(`User logout requested: ${userId || 'unknown session'}`);
            res.json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            // Even on error, try to clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
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
            const { name, avatarUrl, institutionId } = req.body;
            const user = await authService.updateProfile(userId, { name, avatarUrl, institutionId });

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
            const { password, confirmPhrase } = req.body;

            if (!password && !confirmPhrase) {
                res.status(400).json({
                    success: false,
                    error: 'Password or confirmation phrase is required to delete account',
                });
                return;
            }

            await authService.deleteAccount(userId, password, confirmPhrase);

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
