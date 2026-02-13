import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3011';
const SERVICE_NAME = 'validation-service';

function reportError(severity: string, message: string, req: Request, stack?: string): void {
    if (process.env.NODE_ENV === 'test') return;
    fetch(`${ADMIN_SERVICE_URL}/errors/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: SERVICE_NAME, severity, message, path: req.path, method: req.method, stack, userId: (req as any).user?.id }),
    }).catch(() => {});
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: err.errors,
        });
    }

    const statusCode = err.status || 500;

    if (statusCode >= 500) reportError('ERROR', err.message, req, err.stack);

    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal server error',
    });
}
