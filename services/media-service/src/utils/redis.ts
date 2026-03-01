import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            lazyConnect: true,
        });

        redis.on('error', (err) => {
            logger.error('Redis connection error:', err.message);
        });

        redis.on('connect', () => {
            logger.info('Redis connected');
        });

        redis.connect().catch((err) => {
            logger.warn('Redis connection failed, running without cache:', err.message);
        });
    }
    return redis;
}
