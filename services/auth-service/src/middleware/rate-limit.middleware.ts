import { Request, Response, NextFunction } from 'express';
import redis from '../utils/redis';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface RateLimitOptions {
    windowMs: number; // Window size in milliseconds
    max: number; // Max requests per window
    message?: string;
    keyPrefix?: string;
}

export const rateLimitMiddleware = (options: RateLimitOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const key = `${options.keyPrefix || 'rate-limit'}:${ip}`;

            const current = await redis.incr(key);

            if (current === 1) {
                await redis.expire(key, Math.ceil(options.windowMs / 1000));
            }

            if (current > options.max) {
                logger.warn(`Rate limit exceeded for IP: ${ip}`);
                throw new AppError(options.message || 'Too many requests, please try again later.', 429);
            }

            next();
        } catch (error) {
            // If redis fails, we might want to fail open or closed. 
            // For now, let's log and pass through if it's not our AppError
            if (error instanceof AppError) {
                next(error);
            } else {
                logger.error('Rate limit middleware error', error);
                // Fail open so we don't block legitimate traffic if redis is down
                next();
            }
        }
    };
};
