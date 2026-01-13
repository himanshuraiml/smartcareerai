import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

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
