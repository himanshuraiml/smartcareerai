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
