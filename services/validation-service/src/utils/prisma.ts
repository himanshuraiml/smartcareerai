import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Reuse prisma client in development to prevent too many connections
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Log connection status
prisma.$connect()
    .then(() => console.log('✅ Validation service connected to database'))
    .catch((err) => console.error('❌ Validation service database connection failed:', err.message));
