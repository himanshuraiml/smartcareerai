import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }

    // Handle multer errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'FILE_UPLOAD_ERROR',
                message: err.message,
            },
        });
    }

    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        },
    });
};
