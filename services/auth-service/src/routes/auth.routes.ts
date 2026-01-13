import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../schemas/auth.schema';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', validateRequest(RegisterSchema), authController.register);
router.post('/login', validateRequest(LoginSchema), authController.login);
router.post('/refresh-token', validateRequest(RefreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);
router.put('/profile', authMiddleware, authController.updateProfile);

export { router as authRouter };
