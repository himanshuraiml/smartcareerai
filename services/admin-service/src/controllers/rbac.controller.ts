import { Request, Response, NextFunction } from 'express';
import { rbacService } from '../services/rbac.service';

class RBACController {
    // ==========================================
    // PERMISSIONS
    // ==========================================

    async getAllPermissions(req: Request, res: Response, next: NextFunction) {
        try {
            const permissions = await rbacService.getAllPermissions();
            res.json({ success: true, data: permissions });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // ROLES
    // ==========================================

    async getRoles(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const roles = await rbacService.getRoles(institutionId);
            res.json({ success: true, data: roles });
        } catch (error) {
            next(error);
        }
    }

    async getRoleById(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const role = await rbacService.getRoleById(institutionId, req.params.roleId);
            if (!role) {
                return res.status(404).json({ success: false, error: 'Role not found' });
            }
            res.json({ success: true, data: role });
        } catch (error) {
            next(error);
        }
    }

    async createRole(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const { name, description, permissionIds } = req.body;
            if (!name) {
                return res.status(400).json({ success: false, error: 'Role name is required' });
            }

            const role = await rbacService.createRole(institutionId, { name, description, permissionIds: permissionIds || [] });

            // Audit log
            await rbacService.createAuditLog({
                institutionId,
                userId: req.user!.id,
                userName: req.user?.email,
                action: 'ROLE_CREATED',
                entityType: 'ROLE',
                entityId: role?.id,
                details: { roleName: name, permissionCount: (permissionIds || []).length },
            });

            res.status(201).json({ success: true, data: role });
        } catch (error) {
            next(error);
        }
    }

    async updateRole(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const { name, description, permissionIds } = req.body;
            const role = await rbacService.updateRole(institutionId, req.params.roleId, { name, description, permissionIds });

            await rbacService.createAuditLog({
                institutionId,
                userId: req.user!.id,
                userName: req.user?.email,
                action: 'ROLE_UPDATED',
                entityType: 'ROLE',
                entityId: req.params.roleId,
                details: { roleName: name },
            });

            res.json({ success: true, data: role });
        } catch (error) {
            next(error);
        }
    }

    async deleteRole(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            await rbacService.deleteRole(institutionId, req.params.roleId);

            await rbacService.createAuditLog({
                institutionId,
                userId: req.user!.id,
                userName: req.user?.email,
                action: 'ROLE_DELETED',
                entityType: 'ROLE',
                entityId: req.params.roleId,
            });

            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // STAFF ASSIGNMENTS
    // ==========================================

    async getStaffMembers(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const staff = await rbacService.getStaffMembers(institutionId);
            res.json({ success: true, data: staff });
        } catch (error) {
            next(error);
        }
    }

    async assignRole(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const { userEmail, roleId, departmentId } = req.body;
            if (!userEmail || !roleId) {
                return res.status(400).json({ success: false, error: 'userEmail and roleId are required' });
            }

            const assignment = await rbacService.assignRole(institutionId, {
                userEmail,
                roleId,
                departmentId,
                assignedBy: req.user!.id,
            });

            await rbacService.createAuditLog({
                institutionId,
                userId: req.user!.id,
                userName: req.user?.email,
                action: 'ROLE_ASSIGNED',
                entityType: 'USER',
                entityId: (assignment as any)?.user?.id,
                details: { userEmail, roleName: (assignment as any)?.role?.name, departmentId },
            });

            res.status(201).json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    }

    async revokeRole(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            await rbacService.revokeRole(institutionId, req.params.assignmentId);

            await rbacService.createAuditLog({
                institutionId,
                userId: req.user!.id,
                userName: req.user?.email,
                action: 'ROLE_REVOKED',
                entityType: 'USER_ROLE',
                entityId: req.params.assignmentId,
            });

            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    async getUserPermissions(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const userId = req.params.userId || req.user!.id;
            const permissions = await rbacService.getUserPermissions(userId, institutionId);
            res.json({ success: true, data: permissions });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // DEPARTMENTS
    // ==========================================

    async getDepartments(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const departments = await rbacService.getDepartments(institutionId);
            res.json({ success: true, data: departments });
        } catch (error) {
            next(error);
        }
    }

    async createDepartment(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const { name, code, hodName, hodEmail } = req.body;
            if (!name || !code) {
                return res.status(400).json({ success: false, error: 'name and code are required' });
            }

            const dept = await rbacService.createDepartment(institutionId, { name, code, hodName, hodEmail });

            await rbacService.createAuditLog({
                institutionId,
                userId: req.user!.id,
                userName: req.user?.email,
                action: 'DEPARTMENT_CREATED',
                entityType: 'DEPARTMENT',
                entityId: dept.id,
                details: { name, code },
            });

            res.status(201).json({ success: true, data: dept });
        } catch (error) {
            next(error);
        }
    }

    async updateDepartment(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const dept = await rbacService.updateDepartment(institutionId, req.params.departmentId, req.body);
            res.json({ success: true, data: dept });
        } catch (error) {
            next(error);
        }
    }

    async deleteDepartment(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            await rbacService.deleteDepartment(institutionId, req.params.departmentId);

            await rbacService.createAuditLog({
                institutionId,
                userId: req.user!.id,
                userName: req.user?.email,
                action: 'DEPARTMENT_DELETED',
                entityType: 'DEPARTMENT',
                entityId: req.params.departmentId,
            });

            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // AUDIT LOGS
    // ==========================================

    async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const result = await rbacService.getAuditLogs(institutionId, page, limit);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // SEED DEFAULTS
    // ==========================================

    async seedDefaults(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            await rbacService.seedDefaultRoles(institutionId);

            await rbacService.createAuditLog({
                institutionId,
                userId: req.user!.id,
                userName: req.user?.email,
                action: 'RBAC_DEFAULTS_SEEDED',
                entityType: 'SYSTEM',
                details: { message: 'Default roles and permissions seeded' },
            });

            res.json({ success: true, message: 'Default roles and permissions seeded successfully' });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // APPROVAL WORKFLOWS
    // ==========================================

    async getApprovalWorkflows(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const { entityType, status } = req.query;
            const workflows = await rbacService.getApprovalWorkflows(institutionId, {
                entityType: entityType as string,
                status: status as string,
            });
            res.json({ success: true, data: workflows });
        } catch (error) {
            next(error);
        }
    }

    async processApproval(req: Request, res: Response, next: NextFunction) {
        try {
            const institutionId = req.user?.adminForInstitutionId;
            if (!institutionId) throw new Error('Unauthorized');

            const { action, comment } = req.body;
            if (!['APPROVED', 'REJECTED'].includes(action)) {
                return res.status(400).json({ success: false, error: 'action must be APPROVED or REJECTED' });
            }

            const workflow = await rbacService.processApproval(req.params.workflowId, req.user!.id, action, comment);

            await rbacService.createAuditLog({
                institutionId,
                userId: req.user!.id,
                userName: req.user?.email,
                action: `WORKFLOW_${action}`,
                entityType: 'APPROVAL_WORKFLOW',
                entityId: req.params.workflowId,
                details: { action, comment },
            });

            res.json({ success: true, data: workflow });
        } catch (error) {
            next(error);
        }
    }
}

export const rbacController = new RBACController();
