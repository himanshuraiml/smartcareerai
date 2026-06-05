import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for GDPR_DELETE logs...');
    const logs = await prisma.activityLog.findMany({
        where: { type: 'GDPR_DELETE' }
    });
    console.log(`Found ${logs.length} GDPR_DELETE logs:`);
    console.log(JSON.stringify(logs, null, 2));
}

main().finally(() => prisma.$disconnect());
