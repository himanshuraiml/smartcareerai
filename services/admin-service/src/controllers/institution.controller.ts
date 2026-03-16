import { Request, Response, NextFunction } from 'express';
import { institutionService, InstitutionStudentFilters } from '../services/institution.service';
import { placementAIService } from '../services/placement-ai.service';
import { logger } from '../utils/logger';

export class InstitutionController {
    /**
     * GET /institution/dashboard
     */
    async getDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const dashboard = await institutionService.getDashboard(institutionId);

            res.json({
                success: true,
                data: dashboard,
            });
        } catch (error) {
            logger.error('Error fetching institution dashboard', error);
            next(error);
        }
    }

    /**
     * GET /institution/students
     */
    async getStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const filters: InstitutionStudentFilters = {
                search: req.query.search as string,
                targetJobRoleId: req.query.targetJobRoleId as string,
                minScore: req.query.minScore ? parseInt(req.query.minScore as string) : undefined,
                maxScore: req.query.maxScore ? parseInt(req.query.maxScore as string) : undefined,
                minAtsScore: req.query.minAtsScore ? parseInt(req.query.minAtsScore as string) : undefined,
                minSkillScore: req.query.minSkillScore ? parseInt(req.query.minSkillScore as string) : undefined,
                minInterviewScore: req.query.minInterviewScore ? parseInt(req.query.minInterviewScore as string) : undefined,
                atRiskLevel: req.query.atRiskLevel as any,
                scoreType: req.query.scoreType as 'all' | 'ats' | 'skill' | 'interview' | undefined,
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
                sortBy: (req.query.sortBy as 'name' | 'score' | 'atsScore' | 'skillScore' | 'interviewScore' | 'lastActive') || 'name',
                sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
            };

            const result = await institutionService.getStudents(institutionId, filters);

            res.json({
                success: true,
                data: result.students,
                pagination: result.pagination,
            });
        } catch (error) {
            logger.error('Error fetching institution students', error);
            next(error);
        }
    }

    /**
     * GET /institution/students/:id
     */
    async getStudentById(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const student = await institutionService.getStudentById(institutionId, req.params.id);

            res.json({
                success: true,
                data: student,
            });
        } catch (error) {
            logger.error('Error fetching student details', error);
            next(error);
        }
    }

    /**
     * GET /institution/settings
     */
    async getSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const institution = await institutionService.getInstitution(institutionId);

            res.json({
                success: true,
                data: institution,
            });
        } catch (error) {
            logger.error('Error fetching institution settings', error);
            next(error);
        }
    }

    /**
     * PUT /institution/settings
     */
    async updateSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const { name, logoUrl, address } = req.body;
            const institution = await institutionService.updateInstitution(institutionId, { name, logoUrl, address });

            res.json({
                success: true,
                data: institution,
                message: 'Institution settings updated successfully',
            });
        } catch (error) {
            logger.error('Error updating institution settings', error);
            next(error);
        }
    }

    /**
     * GET /institution/placements
     */
    async getPlacements(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await institutionService.getPlacements(institutionId, page, limit);

            res.json({
                success: true,
                data: result.placements,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error fetching institution placements', error);
            next(error);
        }
    }

    /**
     * GET /institution/analytics/skill-gap
     */
    async getSkillGapHeatmap(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const heatmap = await institutionService.getSkillGapHeatmap(institutionId);

            res.json({
                success: true,
                data: heatmap
            });
        } catch (error) {
            logger.error('Error fetching skill gap heatmap', error);
            next(error);
        }
    }

    /**
     * GET /institution/analytics/placement
     */
    async getPlacementAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const analytics = await institutionService.getPlacementAnalytics(institutionId);

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            logger.error('Error fetching placement analytics', error);
            next(error);
        }
    }

    /**
     * AI Intelligence (Phase 4)
     */
    async calculateReadiness(req: Request, res: Response, next: NextFunction) {
        try {
            const { studentId } = req.params;
            const result = await placementAIService.calculateReadinessScore(studentId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async calculateReadinessInternal(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const result = await placementAIService.calculateReadinessByUserId(userId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getRiskAssessments(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');
            const data = await placementAIService.getRiskAssessments(institutionId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async resolveAlert(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await placementAIService.resolveAlert(id);
            res.json({ success: true, message: 'Alert resolved' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /institution/analytics/department-readiness
     */
    async getDepartmentReadiness(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }
            const data = await institutionService.getDepartmentReadiness(institutionId);
            res.json({ success: true, data });
        } catch (error) {
            logger.error('Error fetching department readiness', error);
            next(error);
        }
    }

    /**
     * GET /institution/analytics/activity
     */
    async getActivityLog(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 30;
            const data = await institutionService.getActivityLog(institutionId, page, limit);
            res.json({ success: true, data });
        } catch (error) {
            logger.error('Error fetching activity log', error);
            next(error);
        }
    }

    /**
     * POST /institution/training-plan/generate
     */
    async generateTrainingPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }
            const { targetRole, skillGaps } = req.body;
            if (!targetRole || !skillGaps) {
                return res.status(400).json({ success: false, message: 'targetRole and skillGaps are required' });
            }
            const plan = await institutionService.generateTrainingPlan(targetRole, skillGaps);
            res.json({ success: true, data: plan });
        } catch (error) {
            logger.error('Error generating training plan', error);
            next(error);
        }
    }

    /**
     * POST /institution/training/assign
     */
    async assignTraining(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }
            const result = await institutionService.assignTraining(institutionId, req.body);
            res.json({ success: true, data: result, message: 'Training assigned successfully' });
        } catch (error) {
            logger.error('Error assigning training', error);
            next(error);
        }
    }

    /**
     * GET /institution/training/assignments
     */
    async getTrainingAssignments(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }
            const assignments = await institutionService.getTrainingAssignments(institutionId);
            res.json({ success: true, data: assignments });
        } catch (error) {
            logger.error('Error fetching training assignments', error);
            next(error);
        }
    }

    /**
     * GET /institution/analytics/linkedin-trends
     */
    async getLinkedInTrends(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }
            const trends = await institutionService.getLinkedInTrends(institutionId);
            res.json({ success: true, data: trends });
        } catch (error) {
            logger.error('Error fetching LinkedIn trends', error);
            next(error);
        }
    }

    /**
     * GET /institution/analytics/placement-simulation
     */
    async getPlacementSimulation(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }
            const simulation = await institutionService.getPlacementSimulation(institutionId);
            res.json({ success: true, data: simulation });
        } catch (error) {
            logger.error('Error running placement simulation', error);
            next(error);
        }
    }

    /**
     * Recruiters & Marketplace
     */
    async getRecruiterMarketplace(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const marketplace = await institutionService.getRecruiterMarketplace(institutionId);

            res.json({
                success: true,
                data: marketplace
            });
        } catch (error) {
            logger.error('Error fetching recruiter marketplace', error);
            next(error);
        }
    }

    async updateStudentProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                return res.status(403).json({ success: false, message: 'No institution assigned' });
            }

            const studentId = req.params.id;
            const profileData = req.body;

            const result = await institutionService.updateStudentProfile(institutionId, studentId, profileData);

            res.json({
                success: true,
                data: result,
                message: 'Student profile updated successfully'
            });
        } catch (error) {
            logger.error('Error updating student profile', error);
            next(error);
        }
    }

    /**
     * Placement Policy Engine (Phase 2)
     */
    async getPlacementPolicy(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');
            const policy = await institutionService.getPlacementPolicy(institutionId);
            res.json({ success: true, data: policy });
        } catch (error) {
            next(error);
        }
    }

    async updatePlacementPolicy(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');
            const policy = await institutionService.updatePlacementPolicy(institutionId, req.body);
            res.json({ success: true, data: policy });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Corporate Relations Management (Phase 2)
     */
    async getPartnerships(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');
            const partnerships = await institutionService.getPartnerships(institutionId);
            res.json({ success: true, data: partnerships });
        } catch (error) {
            next(error);
        }
    }

    async createPartnership(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');
            const partnership = await institutionService.createPartnership(institutionId, req.body);
            res.json({ success: true, data: partnership });
        } catch (error) {
            next(error);
        }
    }

    async updatePartnership(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const partnership = await institutionService.updatePartnership(id, req.body);
            res.json({ success: true, data: partnership });
        } catch (error) {
            next(error);
        }
    }

    async deletePartnership(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await institutionService.deletePartnership(id);
            res.json({ success: true, message: 'Partnership deleted' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Institutional Role Management (Phase 2)
     */
    async updateInstitutionalRole(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');
            const { userId, role } = req.body;
            const updated = await institutionService.updateInstitutionalRole(institutionId, userId, role);
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }
}

export const institutionController = new InstitutionController();
