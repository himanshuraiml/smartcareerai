import { Request, Response, NextFunction } from 'express';
import { userContext } from '../utils/context';

export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.headers['x-user-id'] || (req as any).user?.id) as string;
    const userRole = req.headers['x-user-role'] as string; // Gateway might pass this too

    if (userId) {
        userContext.run({ id: userId, role: userRole }, () => next());
    } else {
        next();
    }
};
