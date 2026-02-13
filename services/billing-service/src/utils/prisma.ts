import { PrismaClient } from '@prisma/client';
import { userContext } from './context';

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
                const context = userContext.getStore();

                if (context?.id) {
                    return baseClient.$transaction(async (tx) => {
                        await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${context.id}'`);
                        if (context.role) {
                            await tx.$executeRawUnsafe(`SET LOCAL app.current_user_role = '${context.role}'`);
                        }
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
