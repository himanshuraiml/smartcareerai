import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../services/organization.service';

export class OrganizationController {

    // Create an organization (POST /organization)
    async createOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const org = await organizationService.createOrganization(userId, req.body);
            res.status(201).json({ success: true, data: org });
        } catch (error) {
            next(error);
        }
    }

    // Get my organization (GET /organization/my)
    async getMyOrganization(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const org = await organizationService.getMyOrganization(userId);
            res.status(200).json({ success: true, data: org });
        } catch (error) {
            next(error);
        }
    }

    // Invite members (POST /organization/invite)
    async inviteMember(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { email, role } = req.body;
            const updatedRecruiter = await organizationService.inviteMember(userId, email, role);
            res.status(200).json({ success: true, data: updatedRecruiter, message: "Member invited successfully" });
        } catch (error) {
            next(error);
        }
    }

    // Initiate domain verification (POST /organization/domain/initiate)
    async initiateDomainVerification(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const result = await organizationService.initiateDomainVerification(userId);
            res.status(200).json({ success: true, data: result, message: "Verification token generated" });
        } catch (error) {
            next(error);
        }
    }

    // Verify domain (POST /organization/domain/verify)
    async verifyDomain(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { token } = req.body;
            const org = await organizationService.verifyDomain(userId, token);
            res.status(200).json({ success: true, data: org, message: "Domain verified successfully" });
        } catch (error) {
            next(error);
        }
    }
    // Update branding (PUT /organization/branding)
    async updateBranding(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const updated = await organizationService.updateBranding(userId, req.body);
            res.status(200).json({ success: true, data: updated, message: "Branding updated successfully" });
        } catch (error) {
            next(error);
        }
    }

    // Scoring Templates
    async createScoringTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const template = await organizationService.createScoringTemplate(userId, req.body);
            res.status(201).json({ success: true, data: template });
        } catch (error) {
            next(error);
        }
    }

    async getScoringTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const templates = await organizationService.getScoringTemplates(userId);
            res.status(200).json({ success: true, data: templates });
        } catch (error) {
            next(error);
        }
    }

    async updateScoringTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const updated = await organizationService.updateScoringTemplate(userId, req.params.templateId, req.body);
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    async deleteScoringTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            await organizationService.deleteScoringTemplate(userId, req.params.templateId);
            res.status(200).json({ success: true, message: "Template deleted" });
        } catch (error) {
            next(error);
        }
    }
}

export const organizationController = new OrganizationController();
