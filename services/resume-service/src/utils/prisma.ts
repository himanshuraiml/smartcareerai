import { PrismaClient } from '@prisma/client';

const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || '2';
const databaseUrl = `${process.env.DATABASE_URL}${process.env.DATABASE_URL?.includes('?') ? '&' : '?'}connection_limit=${connectionLimit}`;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        datasources: { db: { url: databaseUrl } },
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
