import { PrismaClient } from '@prisma/client';
import { userContext } from './context';

const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || '2';
const databaseUrl = `${process.env.DATABASE_URL}${process.env.DATABASE_URL?.includes('?') ? '&' : '?'}connection_limit=${connectionLimit}`;

const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: databaseUrl } },
});

export const prisma = baseClient.$extends({
    query: {
        $allModels: {
            async $allOperations({ args, query }) {
                const userId = userContext.getStore();
                if (userId) {
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
