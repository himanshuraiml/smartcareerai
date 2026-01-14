
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Admin User...');
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@smartcareer.ai' }
    });

    if (!admin) {
        console.error('❌ Admin user NOT found in database!');
        return;
    }

    console.log(`✅ Admin User Found: ${admin.id}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Stored Hash: ${admin.passwordHash}`);

    const isValid = await bcrypt.compare('Admin123!', admin.passwordHash);
    console.log(`   Password 'Admin123!' Match: ${isValid ? '✅ YES' : '❌ NO'}`);

    if (!isValid) {
        console.log('⚠️  Hash mismatch. Updating to a known valid hash...');
        const newHash = await bcrypt.hash('Admin123!', 12);
        await prisma.user.update({
            where: { id: admin.id },
            data: { passwordHash: newHash }
        });
        console.log('✅ Password updated to new hash.');

        // Verify again
        const recheck = await bcrypt.compare('Admin123!', newHash);
        console.log(`   Recheck Match: ${recheck ? '✅ YES' : '❌ NO'}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
