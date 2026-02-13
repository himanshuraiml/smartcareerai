import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3011';
const SERVICE_NAME = 'application-service';

function reportError(severity: string, message: string, req: Request, stack?: string): void {
    if (process.env.NODE_ENV === 'test') return;
    fetch(`${ADMIN_SERVICE_URL}/errors/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: SERVICE_NAME, severity, message, path: req.path, method: req.method, stack, userId: (req as any).user?.id }),
    }).catch(() => {});
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Error: ${err.message}`);

    if (err instanceof AppError) {
        if (err.statusCode >= 500) reportError('ERROR', err.message, req, err.stack);
        return res.status(err.statusCode).json({
            success: false,
            error: { code: err.code, message: err.message },
        });
    }

    reportError('ERROR', err.message, req, err.stack);
    return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
};
