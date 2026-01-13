import { Request, Response, NextFunction } from 'express';
import { SkillService } from '../services/skill.service';
import { logger } from '../utils/logger';

const skillService = new SkillService();

export class SkillController {
    async getJobRoles(_req: Request, res: Response, next: NextFunction) {
        try {
            const jobRoles = await skillService.getJobRoles();
            res.json({ success: true, data: jobRoles });
        } catch (error) {
            next(error);
        }
    }

    async getAllSkills(req: Request, res: Response, next: NextFunction) {
        try {
            const { category, search } = req.query;
            const skills = await skillService.getAllSkills(
                category as string,
                search as string
            );
            res.json({ success: true, data: skills });
        } catch (error) {
            next(error);
        }
    }

    async getSkillById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const skill = await skillService.getSkillById(id);
            res.json({ success: true, data: skill });
        } catch (error) {
            next(error);
        }
    }

    async analyzeSkills(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { resumeId } = req.body;

            const result = await skillService.analyzeResumeSkills(userId, resumeId);

            logger.info(`Skills analyzed for user ${userId}`);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getUserSkills(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const skills = await skillService.getUserSkills(userId);
            res.json({ success: true, data: skills });
        } catch (error) {
            next(error);
        }
    }

    async addUserSkill(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { skillId, proficiencyLevel, source } = req.body;

            const userSkill = await skillService.addUserSkill(
                userId, skillId, proficiencyLevel, source || 'self-assessed'
            );

            res.status(201).json({ success: true, data: userSkill });
        } catch (error) {
            next(error);
        }
    }

    async removeUserSkill(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { skillId } = req.params;

            await skillService.removeUserSkill(userId, skillId);
            res.json({ success: true, message: 'Skill removed' });
        } catch (error) {
            next(error);
        }
    }

    async getGapAnalysis(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { targetRole } = req.query;

            const analysis = await skillService.getGapAnalysis(
                userId,
                targetRole as string
            );

            res.json({ success: true, data: analysis });
        } catch (error) {
            next(error);
        }
    }

    async getRoadmap(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { targetRole, timeframe } = req.query;

            const roadmap = await skillService.generateRoadmap(
                userId,
                targetRole as string,
                parseInt(timeframe as string) || 12 // default 12 weeks
            );

            res.json({ success: true, data: roadmap });
        } catch (error) {
            next(error);
        }
    }

    async getCourseRecommendations(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { skillId, limit } = req.query;

            const courses = await skillService.getCourseRecommendations(
                userId,
                skillId as string,
                parseInt(limit as string) || 5
            );

            res.json({ success: true, data: courses });
        } catch (error) {
            next(error);
        }
    }
}
