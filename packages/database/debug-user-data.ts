
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking user data...');

    // Find user by email (trying common variations or listing all)
    const users = await prisma.user.findMany({
        include: {
            _count: {
                select: {
                    testAttempts: true,
                    interviews: true,
                    resumes: true
                }
            }
        }
    });

    console.log(`Found ${users.length} users:`);
    for (const user of users) {
        console.log(`- User: ${user.email} (${user.name})`);
        console.log(`  - Resumes: ${user._count.resumes}`);
        console.log(`  - Test Attempts: ${user._count.testAttempts}`);
        console.log(`  - Interview Sessions: ${user._count.interviews}`);
        console.log('---');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
