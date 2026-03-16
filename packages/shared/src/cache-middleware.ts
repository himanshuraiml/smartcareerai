import { Request, Response, NextFunction, RequestHandler } from 'express';
import { cacheGet, cacheSet } from './cache.js';

/**
 * Generic Express Caching Middleware
 * @param ttlSeconds Time to live in seconds
 * @param keyPrefix Prefix for the redis key (e.g. "reports:")
 */
export function cacheMiddleware(ttlSeconds: number, keyPrefix: string = 'cache:'): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate key based on path and query params
        const key = `${keyPrefix}${req.originalUrl || req.url}`;

        try {
            const cachedData = await cacheGet(key);
            if (cachedData) {
                // If it's an object, send as JSON. If not, send as is.
                return res.json(cachedData);
            }

            // Patch res.json to capture the response and cache it
            const originalJson = res.json.bind(res);
            res.json = (body: any) => {
                // Cache the response before sending it
                // We only cache successful responses (implied if logic reaches here)
                cacheSet(key, body, ttlSeconds).catch(err => {
                    console.error(`[CacheMiddleware] Failed to set cache for ${key}`, err);
                });
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error(`[CacheMiddleware] Error checking cache for ${key}`, error);
            next();
        }
    };
}
