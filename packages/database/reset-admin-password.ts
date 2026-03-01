
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Resetting Admin and Recruiter passwords...');

    const salt = await bcrypt.genSalt(12);

    // Admin Password
    const adminPassword = 'Admin123!';
    const adminHash = await bcrypt.hash(adminPassword, salt);

    const admin = await prisma.user.update({
        where: { email: 'admin@placenxt.com' },
        data: { passwordHash: adminHash }
    });
    console.log(`✅ Admin password reset to '${adminPassword}'`);

    // Recruiter Password
    const recruiterPassword = 'Recruiter123!';
    const recruiterHash = await bcrypt.hash(recruiterPassword, salt);

    const recruiter = await prisma.user.update({
        where: { email: 'recruiter@techhunters.io' },
        data: { passwordHash: recruiterHash }
    });
    console.log(`✅ Recruiter password reset to '${recruiterPassword}'`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
