import { PrismaClient } from '../index';

describe('Database Package', () => {
    it('should export PrismaClient', () => {
        expect(PrismaClient).toBeDefined();
    });

    it('should be able to instantiate PrismaClient', () => {
        const prisma = new PrismaClient();
        expect(prisma).toBeInstanceOf(PrismaClient);
    });
});
