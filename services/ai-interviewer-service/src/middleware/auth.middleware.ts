import { Request, Response, NextFunction } from 'express';

/**
 * Extracts x-user-id injected by the API Gateway.
 * For internal service-to-service calls, also validates INTERNAL_SERVICE_SECRET.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const userId = req.headers['x-user-id'] as string | undefined;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized — missing x-user-id header' });
        return;
    }
    (req as any).userId = userId;
    next();
}

export function internalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    const expected = process.env.INTERNAL_SERVICE_SECRET;
    const provided = req.headers['x-internal-secret'];
    if (!expected || !provided || provided !== expected) {
        res.status(401).json({ error: 'Unauthorized — missing or invalid internal secret' });
        return;
    }
    next();
}
