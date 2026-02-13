import { Request, Response, NextFunction } from 'express';
import { userContext } from '../utils/context';

/**
 * Middleware to populate the userContext with the current user ID.
 * The ID is extracted from the 'x-user-id' header set by the API Gateway.
 */
export const contextMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    // Extract user ID from header (Gateway) or directly from req.user (if authMiddleware ran)
    const userId = (req.headers['x-user-id'] || (req as any).user?.id) as string;

    if (userId) {
        // Run the rest of the request within the user context
        userContext.run(userId, () => next());
    } else {
        next();
    }
};
