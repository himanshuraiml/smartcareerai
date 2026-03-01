import { Request, Response, NextFunction } from 'express';
import { userContext } from '../utils/context';

export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.headers['x-user-id'] || (req as any).user?.id) as string;
    if (userId) {
        userContext.run(userId, () => next());
    } else {
        next();
    }
};
