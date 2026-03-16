import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// ============================================
// DEFAULT PERMISSIONS (seeded on first use)
// ============================================

const DEFAULT_PERMISSIONS = [
    // Jobs
    { name: 'create_job', description: 'Create new job postings', category: 'jobs' },
    { name: 'approve_job', description: 'Approve pending job postings', category: 'jobs' },
    { name: 'edit_job', description: 'Edit existing job postings', category: 'jobs' },
    { name: 'delete_job', description: 'Delete job postings', category: 'jobs' },
    { name: 'view_jobs', description: 'View all job listings', category: 'jobs' },

    // Students
    { name: 'view_students', description: 'View student profiles', category: 'students' },
    { name: 'edit_student', description: 'Edit student profiles', category: 'students' },
    { name: 'manage_department_students', description: 'Manage students in own department only', category: 'students' },
    { name: 'import_students', description: 'Bulk import students via CSV', category: 'students' },

    // Placement Drives
    { name: 'schedule_drive', description: 'Schedule and manage placement drives', category: 'drives' },
    { name: 'manage_drive_logistics', description: 'Manage drive logistics and attendance', category: 'drives' },
    { name: 'view_drives', description: 'View placement drives', category: 'drives' },

    // Analytics
    { name: 'view_analytics', description: 'View placement analytics and reports', category: 'analytics' },
    { name: 'export_reports', description: 'Export placement reports', category: 'analytics' },
    { name: 'view_ai_intelligence', description: 'Access AI placement intelligence', category: 'analytics' },

    // Communication
    { name: 'send_notifications', description: 'Send broadcast notifications', category: 'communication' },
    { name: 'manage_broadcast', description: 'Manage broadcast messages', category: 'communication' },

    // Settings & Admin
    { name: 'manage_roles', description: 'Create and edit roles / assign permissions', category: 'settings' },
    { name: 'manage_departments', description: 'Create and manage departments', category: 'settings' },
    { name: 'manage_settings', description: 'Access and modify institution settings', category: 'settings' },
    { name: 'manage_policy', description: 'Manage placement policies', category: 'settings' },
    { name: 'manage_partnerships', description: 'Manage corporate partnerships / CRM', category: 'settings' },
    { name: 'view_audit_logs', description: 'View system audit logs', category: 'settings' },

    // Operations
    { name: 'manage_attendance', description: 'QR-based attendance scanning', category: 'operations' },
    { name: 'manage_interview_panels', description: 'Create and assign interview panels', category: 'operations' },
    { name: 'coordinate_candidates', description: 'Coordinate candidates during drives', category: 'operations' },
];

// Default role → permissions mapping
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    'Placement Director': [
        'create_job', 'approve_job', 'edit_job', 'delete_job', 'view_jobs',
        'view_students', 'edit_student', 'import_students',
        'schedule_drive', 'manage_drive_logistics', 'view_drives',
        'view_analytics', 'export_reports', 'view_ai_intelligence',
        'send_notifications', 'manage_broadcast',
        'manage_roles', 'manage_departments', 'manage_settings', 'manage_policy', 'manage_partnerships', 'view_audit_logs',
        'manage_attendance', 'manage_interview_panels', 'coordinate_candidates',
    ],
    'TPO': [
        'create_job', 'approve_job', 'edit_job', 'view_jobs',
        'view_students', 'edit_student', 'import_students',
        'schedule_drive', 'manage_drive_logistics', 'view_drives',
        'view_analytics', 'export_reports', 'view_ai_intelligence',
        'send_notifications', 'manage_broadcast',
        'manage_policy', 'manage_partnerships', 'view_audit_logs',
        'manage_attendance', 'manage_interview_panels',
    ],
    'Deputy TPO': [
        'view_jobs', 'edit_job',
        'view_students', 'edit_student',
        'schedule_drive', 'manage_drive_logistics', 'view_drives',
        'view_analytics', 'export_reports',
        'send_notifications',
        'manage_attendance', 'manage_interview_panels',
    ],
    'Department Coordinator': [
        'view_jobs',
        'view_students', 'manage_department_students',
        'view_drives',
        'view_analytics',
        'send_notifications',
        'coordinate_candidates',
    ],
    'Placement Staff': [
        'view_jobs',
        'view_students',
        'view_drives', 'manage_drive_logistics',
        'manage_attendance', 'coordinate_candidates',
    ],
    'Faculty Coordinator': [
        'view_jobs',
        'view_students', 'manage_department_students',
        'view_drives',
        'view_analytics',
    ],
    'Student Volunteer': [
        'view_drives',
        'manage_attendance',
        'coordinate_candidates',
    ],
};

class RBACService {
    // ==========================================
    // SEED / INITIALIZATION
    // ==========================================

    /**
     * Ensure all default permissions exist in the system
     */
    async seedPermissions() {
        for (const perm of DEFAULT_PERMISSIONS) {
            await prisma.permission.upsert({
                where: { name: perm.name },
                create: perm,
                update: { description: perm.description, category: perm.category },
            });
        }
    }

    /**
     * Seed default roles and their permissions for an institution
     */
    async seedDefaultRoles(institutionId: string) {
        await this.seedPermissions();

        for (const [roleName, permNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            // Create role if it doesn't exist
            const role = await prisma.placementRole.upsert({
                where: { institutionId_name: { institutionId, name: roleName } },
                create: {
                    institutionId,
                    name: roleName,
                    description: `Default ${roleName} role`,
                    isSystem: true,
                },
                update: {},
            });

            // Assign permissions
            for (const permName of permNames) {
                const permission = await prisma.permission.findUnique({ where: { name: permName } });
                if (permission) {
                    await prisma.rolePermission.upsert({
                        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
                        create: { roleId: role.id, permissionId: permission.id },
                        update: {},
                    });
                }
            }
        }
    }

    // ==========================================
    // PERMISSIONS
    // ==========================================

    async getAllPermissions() {
        return prisma.permission.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    }

    // ==========================================
    // ROLES
    // ==========================================

    async getRoles(institutionId: string) {
        return prisma.placementRole.findMany({
            where: { institutionId },
            include: {
                rolePermissions: {
                    include: { permission: true },
                },
                _count: { select: { userRoles: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getRoleById(institutionId: string, roleId: string) {
        return prisma.placementRole.findFirst({
            where: { id: roleId, institutionId },
            include: {
                rolePermissions: { include: { permission: true } },
                userRoles: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                        department: { select: { id: true, name: true, code: true } },
                    },
                    where: { isActive: true },
                },
            },
        });
    }

    async createRole(institutionId: string, data: { name: string; description?: string; permissionIds: string[] }) {
        const role = await prisma.placementRole.create({
            data: {
                institutionId,
                name: data.name,
                description: data.description,
            },
        });

        // Assign permissions
        if (data.permissionIds?.length) {
            await prisma.rolePermission.createMany({
                data: data.permissionIds.map(permissionId => ({
                    roleId: role.id,
                    permissionId,
                })),
                skipDuplicates: true,
            });
        }

        return this.getRoleById(institutionId, role.id);
    }

    async updateRole(institutionId: string, roleId: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
        const role = await prisma.placementRole.findFirst({
            where: { id: roleId, institutionId },
        });
        if (!role) throw new Error('Role not found');

        await prisma.placementRole.update({
            where: { id: roleId },
            data: {
                name: data.name,
                description: data.description,
            },
        });

        // Update permissions if provided
        if (data.permissionIds !== undefined) {
            // Remove all existing permissions
            await prisma.rolePermission.deleteMany({ where: { roleId } });
            // Add new permissions
            if (data.permissionIds.length) {
                await prisma.rolePermission.createMany({
                    data: data.permissionIds.map(permissionId => ({
                        roleId,
                        permissionId,
                    })),
                    skipDuplicates: true,
                });
            }
        }

        return this.getRoleById(institutionId, roleId);
    }

    async deleteRole(institutionId: string, roleId: string) {
        const role = await prisma.placementRole.findFirst({ where: { id: roleId, institutionId } });
        if (!role) throw new Error('Role not found');
        if (role.isSystem) throw new Error('Cannot delete system roles');

        await prisma.placementRole.delete({ where: { id: roleId } });
        return { success: true };
    }

    // ==========================================
    // USER ROLE ASSIGNMENTS
    // ==========================================

    async getStaffMembers(institutionId: string) {
        return prisma.placementUserRole.findMany({
            where: { institutionId, isActive: true },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
                role: {
                    select: { id: true, name: true, rolePermissions: { include: { permission: true } } },
                },
                department: { select: { id: true, name: true, code: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async assignRole(institutionId: string, data: {
        userEmail: string;
        roleId: string;
        departmentId?: string;
        assignedBy: string;
    }) {
        // Find user by email
        const user = await prisma.user.findUnique({ where: { email: data.userEmail } });
        if (!user) throw createError('User not found with that email. Please ensure the user is registered first.', 404, 'USER_NOT_FOUND');

        // Verify role belongs to institution
        const role = await prisma.placementRole.findFirst({
            where: { id: data.roleId, institutionId },
        });
        if (!role) throw createError('Role not found for this institution.', 404, 'ROLE_NOT_FOUND');

        // Verify department belongs to institution (if provided)
        if (data.departmentId) {
            const dept = await prisma.department.findFirst({
                where: { id: data.departmentId, institutionId },
            });
            if (!dept) throw new Error('Department not found');
        }

        // Create user role assignment
        const assignment = await prisma.placementUserRole.upsert({
            where: {
                userId_roleId_institutionId: {
                    userId: user.id,
                    roleId: data.roleId,
                    institutionId,
                },
            },
            create: {
                userId: user.id,
                roleId: data.roleId,
                institutionId,
                departmentId: data.departmentId,
                assignedBy: data.assignedBy,
                isActive: true,
            },
            update: {
                departmentId: data.departmentId,
                isActive: true,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                role: { select: { id: true, name: true } },
                department: { select: { id: true, name: true, code: true } },
            },
        });

        // Also update user's institution relation if not already set
        if (!user.institutionId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { institutionId },
            });
        }

        return assignment;
    }

    async revokeRole(institutionId: string, assignmentId: string) {
        const assignment = await prisma.placementUserRole.findFirst({
            where: { id: assignmentId, institutionId },
        });
        if (!assignment) throw new Error('Assignment not found');

        await prisma.placementUserRole.update({
            where: { id: assignmentId },
            data: { isActive: false },
        });

        return { success: true };
    }

    // ==========================================
    // PERMISSION CHECKS
    // ==========================================

    /**
     * Check if a user has a specific permission in the given institution.
     * Permission-based, NOT role-based — follows the architecture principle.
     */
    async userHasPermission(userId: string, institutionId: string, permissionName: string): Promise<boolean> {
        const count = await prisma.rolePermission.count({
            where: {
                role: {
                    userRoles: {
                        some: {
                            userId,
                            institutionId,
                            isActive: true,
                        },
                    },
                },
                permission: { name: permissionName },
            },
        });
        return count > 0;
    }

    /**
     * Get all permissions a user has in an institution
     */
    async getUserPermissions(userId: string, institutionId: string): Promise<string[]> {
        const rolePermissions = await prisma.rolePermission.findMany({
            where: {
                role: {
                    userRoles: {
                        some: {
                            userId,
                            institutionId,
                            isActive: true,
                        },
                    },
                },
            },
            include: { permission: { select: { name: true } } },
        });

        return [...new Set(rolePermissions.map(rp => rp.permission.name))];
    }

    /**
     * Get user's department scope (if they have department-scoped roles)
     */
    async getUserDepartmentScope(userId: string, institutionId: string): Promise<string | null> {
        const assignment = await prisma.placementUserRole.findFirst({
            where: { userId, institutionId, isActive: true, departmentId: { not: null } },
            select: { departmentId: true },
        });
        return assignment?.departmentId || null;
    }

    // ==========================================
    // DEPARTMENTS
    // ==========================================

    async getDepartments(institutionId: string) {
        return prisma.department.findMany({
            where: { institutionId },
            include: { _count: { select: { userRoles: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async createDepartment(institutionId: string, data: { name: string; code: string; hodName?: string; hodEmail?: string }) {
        return prisma.department.create({
            data: { institutionId, ...data },
        });
    }

    async updateDepartment(institutionId: string, departmentId: string, data: { name?: string; code?: string; hodName?: string; hodEmail?: string; isActive?: boolean }) {
        const dept = await prisma.department.findFirst({ where: { id: departmentId, institutionId } });
        if (!dept) throw new Error('Department not found');

        return prisma.department.update({
            where: { id: departmentId },
            data,
        });
    }

    async deleteDepartment(institutionId: string, departmentId: string) {
        const dept = await prisma.department.findFirst({ where: { id: departmentId, institutionId } });
        if (!dept) throw new Error('Department not found');

        return prisma.department.delete({ where: { id: departmentId } });
    }

    // ==========================================
    // AUDIT LOGS
    // ==========================================

    async createAuditLog(data: {
        institutionId: string;
        userId: string;
        userName?: string;
        userRole?: string;
        action: string;
        entityType?: string;
        entityId?: string;
        details?: any;
        ipAddress?: string;
    }) {
        return prisma.auditLog.create({ data });
    }

    async getAuditLogs(institutionId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: { institutionId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.auditLog.count({ where: { institutionId } }),
        ]);

        return {
            logs,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ==========================================
    // APPROVAL WORKFLOWS
    // ==========================================

    async createApprovalWorkflow(data: {
        institutionId: string;
        entityType: string;
        entityId: string;
        requestedBy: string;
        approvalChain: any[];
    }) {
        return prisma.approvalWorkflow.create({
            data: {
                institutionId: data.institutionId,
                entityType: data.entityType,
                entityId: data.entityId,
                requestedBy: data.requestedBy,
                totalSteps: data.approvalChain.length,
                approvalChain: data.approvalChain,
            },
        });
    }

    async processApproval(workflowId: string, approverId: string, action: 'APPROVED' | 'REJECTED', comment?: string) {
        const workflow = await prisma.approvalWorkflow.findUnique({ where: { id: workflowId } });
        if (!workflow) throw new Error('Workflow not found');
        if (workflow.status !== 'PENDING') throw new Error('Workflow already processed');

        const chain = workflow.approvalChain as any[];
        const currentStepData = chain[workflow.currentStep - 1];

        if (currentStepData?.approverId !== approverId) {
            throw new Error('You are not the approver for this step');
        }

        currentStepData.status = action;
        currentStepData.approvedAt = new Date().toISOString();
        currentStepData.comment = comment;

        const isLastStep = workflow.currentStep >= workflow.totalSteps;
        const newStatus = action === 'REJECTED' ? 'REJECTED' : (isLastStep ? 'APPROVED' : 'PENDING');

        return prisma.approvalWorkflow.update({
            where: { id: workflowId },
            data: {
                currentStep: isLastStep ? workflow.currentStep : workflow.currentStep + 1,
                status: newStatus,
                approvalChain: chain,
            },
        });
    }

    async getApprovalWorkflows(institutionId: string, filters?: { entityType?: string; status?: string }) {
        const where: any = { institutionId };
        if (filters?.entityType) where.entityType = filters.entityType;
        if (filters?.status) where.status = filters.status;

        return prisma.approvalWorkflow.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const rbacService = new RBACService();
