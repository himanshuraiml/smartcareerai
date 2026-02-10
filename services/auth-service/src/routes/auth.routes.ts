import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { RegisterSchema, LoginSchema, RefreshTokenSchema, GoogleLoginSchema } from '../schemas/auth.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { leaderboardController } from '../controllers/leaderboard.controller';

import { motivationController } from '../controllers/motivation.controller';

const router = Router();
const authController = new AuthController();

// Public routes
router.get('/leaderboard', leaderboardController.getLeaderboard);
router.get('/motivation', motivationController.getDailyQuote);
router.post('/register', validateRequest(RegisterSchema), authController.register);
router.post('/login', validateRequest(LoginSchema), authController.login);
router.post('/google', validateRequest(GoogleLoginSchema), authController.googleLogin);
router.post('/refresh-token', validateRequest(RefreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/institutions', authController.getInstitutions);

// Admin invite routes
router.get('/verify-invite', authController.verifyInvite);
router.post('/accept-invite', authController.acceptInvite);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/me/target-role', authMiddleware, authController.getTargetRole);
router.put('/me/target-role', authMiddleware, authController.updateTargetRole);
router.post('/logout', authMiddleware, authController.logout);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);
router.delete('/me', authMiddleware, authController.deleteAccount);

export { router as authRouter };
