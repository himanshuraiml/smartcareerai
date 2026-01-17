
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Admin User Role...');

    const admin = await prisma.user.findUnique({
        where: { email: 'admin@smartcareer.ai' }
    });

    if (admin) {
        console.log(`User: ${admin.email}`);
        console.log(`Role: ${admin.role}`);
        console.log(`ID: ${admin.id}`);
    } else {
        console.error('❌ Admin user not found!');
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
