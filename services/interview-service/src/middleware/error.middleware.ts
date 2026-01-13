import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

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

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
}
