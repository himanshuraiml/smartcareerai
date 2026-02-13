import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3011';
const SERVICE_NAME = 'recruiter-service';

function reportError(severity: string, message: string, req: Request, stack?: string): void {
    if (process.env.NODE_ENV === 'test') return;
    fetch(`${ADMIN_SERVICE_URL}/errors/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: SERVICE_NAME, severity, message, path: req.path, method: req.method, stack, userId: (req as any).user?.id }),
    }).catch(() => {});
}

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error({
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
    });

    if (statusCode >= 500) reportError('ERROR', message, req, err.stack);

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code: err.code,
        },
    });
};

export const createError = (message: string, statusCode: number, code?: string): AppError => {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
};
