import { Router } from 'express';
import { SkillController } from '../controllers/skill.controller';
import { masteryController } from '../controllers/mastery.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const skillController = new SkillController();

// Public routes - Job Roles (for registration)
router.get('/job-roles', skillController.getJobRoles);

// Public routes - Skills
router.get('/skills', skillController.getAllSkills);
router.get('/skills/:id', skillController.getSkillById);

// Protected routes - Skills
router.post('/analyze', authMiddleware, skillController.analyzeSkills);
router.get('/user-skills', authMiddleware, skillController.getUserSkills);
router.post('/user-skills', authMiddleware, skillController.addUserSkill);
router.delete('/user-skills/:skillId', authMiddleware, skillController.removeUserSkill);

router.get('/gap-analysis', authMiddleware, skillController.getGapAnalysis);
router.get('/roadmap', authMiddleware, skillController.getRoadmap);
router.get('/recommendations', authMiddleware, skillController.getCourseRecommendations);
router.get('/certifications', skillController.getCertifications);

// Protected routes - Skill Mastery progression
router.get('/mastery', authMiddleware, masteryController.getUserMasteries);
router.post('/mastery/:skillId/level-up', authMiddleware, masteryController.levelUpSkill);

export { router as skillRouter };
