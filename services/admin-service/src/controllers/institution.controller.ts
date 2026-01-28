import { Request, Response, NextFunction } from 'express';
import { institutionService, InstitutionStudentFilters } from '../services/institution.service';
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
}

export const institutionController = new InstitutionController();
