import { Request, Response, NextFunction } from 'express';
import { placementDriveService } from '../services/placement-drive.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class PlacementDriveController {
    async createDrive(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) {
                throw new AppError('Institution ID not found', 403);
            }

            const drive = await placementDriveService.createDrive(institutionId, req.body);
            res.status(201).json({ success: true, data: drive });
        } catch (error) {
            logger.error('Error creating placement drive', error);
            next(error);
        }
    }

    async listDrives(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            logger.info('[PlacementDriveController] Listing drives', { 
                institutionId, 
                userRole: req.user?.role,
                query: req.query 
            });

            if (!institutionId) {
                logger.warn('[PlacementDriveController] Institution ID not found in user token');
                throw new AppError('Institution ID not found', 403);
            }

            const drives = await placementDriveService.listDrives(institutionId);
            res.json({ success: true, data: drives });
        } catch (error) {
            logger.error('[PlacementDriveController] Error listing placement drives', {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                institutionId: req.user?.adminForInstitutionId
            });
            next(error);
        }
    }

    async getDrive(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            const driveId = req.params.id;

            if (!institutionId) {
                throw new AppError('Institution ID not found', 403);
            }

            const drive = await placementDriveService.getDriveDetails(institutionId, driveId);
            if (!drive) {
                throw new AppError('Drive not found', 404);
            }

            res.json({ success: true, data: drive });
        } catch (error) {
            logger.error('Error getting drive details', error);
            next(error);
        }
    }

    async updateDrive(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            const driveId = req.params.id;

            if (!institutionId) {
                throw new AppError('Institution ID not found', 403);
            }

            const drive = await placementDriveService.updateDrive(institutionId, driveId, req.body);
            res.json({ success: true, data: drive });
        } catch (error) {
            logger.error('Error updating placement drive', error);
            next(error);
        }
    }

    // F14: Get registrations for a drive
    async getDriveRegistrations(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new AppError('Institution ID not found', 403);
            const registrations = await placementDriveService.getDriveRegistrations(institutionId, req.params.id);
            res.json({ success: true, data: registrations });
        } catch (error) {
            next(error);
        }
    }

    // F14: Student registers for drive
    async registerForDrive(req: Request, res: Response, next: NextFunction) {
        try {
            const studentId = req.user?.id;
            if (!studentId) throw new AppError('User not found', 401);
            const registration = await placementDriveService.registerForDrive(req.params.id, studentId);
            res.json({ success: true, data: registration });
        } catch (error) {
            next(error);
        }
    }

    // F14: List drives for student
    async listDrivesForStudent(req: Request, res: Response, next: NextFunction) {
        try {
            const studentId = req.user?.id;
            if (!studentId) throw new AppError('User not found', 401);
            const drives = await placementDriveService.listDrivesForStudent(studentId);
            res.json({ success: true, data: drives });
        } catch (error) {
            next(error);
        }
    }

    // F14: Update drive stages
    async updateStages(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new AppError('Institution ID not found', 403);
            const result = await placementDriveService.updateDriveStages(institutionId, req.params.id, req.body.stages);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // F14: Advance students to a stage
    async advanceStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new AppError('Institution ID not found', 403);
            const { studentIds, targetStage } = req.body;
            const result = await placementDriveService.advanceStudentsToStage(institutionId, req.params.id, studentIds, targetStage);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // F14: Drive analytics
    async getDriveAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new AppError('Institution ID not found', 403);
            const analytics = await placementDriveService.getDriveAnalytics(institutionId, req.params.id);
            res.json({ success: true, data: analytics });
        } catch (error) {
            next(error);
        }
    }

    async getDriveInvites(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new AppError('Institution ID not found', 403);
            const invites = await placementDriveService.getDriveInvites(req.params.id, institutionId);
            res.json({ success: true, data: invites });
        } catch (error) {
            next(error);
        }
    }

    async inviteRecruiter(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new AppError('Institution ID not found', 403);
            const { recruiterId } = req.body;
            if (!recruiterId) throw new AppError('recruiterId is required', 400);
            const invite = await placementDriveService.inviteRecruiter(req.params.id, institutionId, recruiterId);
            res.status(201).json({ success: true, data: invite });
        } catch (error) {
            next(error);
        }
    }

    async removeInvite(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new AppError('Institution ID not found', 403);
            await placementDriveService.removeInvite(req.params.id, req.params.inviteId, institutionId);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    async searchRecruiters(req: Request, res: Response, next: NextFunction) {
        try {
            const q = String(req.query.q || '');
            if (!q) return res.json({ success: true, data: [] });
            const results = await placementDriveService.searchRecruiters(q);
            res.json({ success: true, data: results });
        } catch (error) {
            next(error);
        }
    }
}

export const placementDriveController = new PlacementDriveController();
