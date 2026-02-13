import { PrismaClient } from '@prisma/client';
import { userContext } from './context';

/**
 * Enhanced Prisma client with Row Level Security (RLS) support.
 * 
 * For every query, it checks if a user ID is present in the userContext.
 * If found, it sets the PostgreSQL session variable 'app.current_user_id'.
 * This variable is then used by DB-level RLS policies to restrict data access.
 */
const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || '2';
const databaseUrl = `${process.env.DATABASE_URL}${process.env.DATABASE_URL?.includes('?') ? '&' : '?'}connection_limit=${connectionLimit}`;

const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: databaseUrl } },
});

const extendedClient = baseClient.$extends({
    query: {
        $allModels: {
            async $allOperations({ args, query }) {
                const userId = userContext.getStore();

                if (userId) {
                    // We use a transaction to ensure the SET LOCAL only affects the current request
                    // and doesn't leak to other connections in the pool.
                    return baseClient.$transaction(async (tx) => {
                        await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}'`);
                        return query(args);
                    });
                }

                return query(args);
            },
        },
    },
});

export const prisma = extendedClient;

declare global {
    var prisma: typeof extendedClient | undefined;
}

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
