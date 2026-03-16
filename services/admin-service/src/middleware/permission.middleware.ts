import { Request, Response, NextFunction } from 'express';
import { rbacService } from '../services/rbac.service';
import { createError } from './error.middleware';

/**
 * Permission-based middleware.
 * Follows the architecture principle: check permissions, NOT roles.
 *
 * Usage:
 *   router.get('/students', requirePermission('view_students'), controller.getStudents);
 *
 * For the institution admin (INSTITUTION_ADMIN role), all permissions are granted automatically.
 */
export const requirePermission = (...permissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            const institutionId = req.user?.adminForInstitutionId;

            if (!userId || !institutionId) {
                return next(createError('Authentication required', 401, 'UNAUTHORIZED'));
            }

            // Institution admin has all permissions
            if (req.user?.role === 'INSTITUTION_ADMIN') {
                return next();
            }

            // Check each required permission
            for (const permission of permissions) {
                const hasPermission = await rbacService.userHasPermission(userId, institutionId, permission);
                if (!hasPermission) {
                    return next(createError(
                        `Missing required permission: ${permission}`,
                        403,
                        'FORBIDDEN'
                    ));
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Department-scoped middleware.
 * If a user has a department-scoped role, this attaches the departmentId
 * to req so controllers can filter data accordingly.
 */
export const attachDepartmentScope = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const institutionId = req.user?.adminForInstitutionId;

        if (!userId || !institutionId) return next();

        // Institution admins see everything
        if (req.user?.role === 'INSTITUTION_ADMIN') return next();

        const departmentId = await rbacService.getUserDepartmentScope(userId, institutionId);
        if (departmentId) {
            (req as any).departmentScope = departmentId;
        }

        next();
    } catch (error) {
        next(error);
    }
};
