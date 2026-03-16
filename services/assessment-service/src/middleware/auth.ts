import { Request, Response, NextFunction } from 'express';

/**
 * The API Gateway validates JWT and forwards the user id via x-user-id header.
 * We trust that header here (gateway is the trust boundary).
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string | undefined;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    (req as any).user = { id: userId };
    next();
};
