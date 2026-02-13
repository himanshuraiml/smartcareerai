import Redis from 'ioredis';

let redis: Redis | null = null;
let connectionFailed = false;

/**
 * Get or create a singleton Redis client.
 * Returns null if REDIS_URL is not set or connection failed.
 */
export function getRedisClient(): Redis | null {
    if (!process.env.REDIS_URL) return null;
    if (connectionFailed) return null;

    if (!redis) {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 5) {
                    connectionFailed = true;
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 3000);
            },
            lazyConnect: true,
        });

        redis.on('error', (err) => {
            if (!connectionFailed) {
                console.error('[Redis] Connection error:', err.message);
            }
        });

        redis.on('connect', () => {
            connectionFailed = false;
        });

        redis.connect().catch(() => {
            connectionFailed = true;
        });
    }

    return redis;
}

/**
 * Get a cached value by key. Returns null on miss or error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

/**
 * Set a cached value with TTL in seconds.
 */
export async function cacheSet(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
        await client.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch {
        // Silent fail — app works without cache
    }
}

/**
 * Delete one or more cache keys.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
    const client = getRedisClient();
    if (!client || keys.length === 0) return;
    try {
        await client.del(...keys);
    } catch {
        // Silent fail
    }
}

/**
 * Delete all keys matching a glob pattern (e.g., "skills:*").
 * Use sparingly — KEYS command can be slow on large datasets.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    } catch {
        // Silent fail
    }
}

/**
 * Disconnect Redis client gracefully. Call on process shutdown.
 */
export async function disconnectRedis(): Promise<void> {
    if (redis) {
        try {
            await redis.quit();
        } catch {
            // Already disconnected
        }
        redis = null;
        connectionFailed = false;
    }
}
