
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Recruiter User...');
    const recruiter = await prisma.user.findUnique({
        where: { email: 'recruiter@techhunters.io' }
    });

    if (!recruiter) {
        console.error('❌ Recruiter user NOT found in database!');
        return;
    }

    console.log(`✅ Recruiter User Found: ${recruiter.id}`);
    console.log(`   Role: ${recruiter.role}`);
    console.log(`   Stored Hash: ${recruiter.passwordHash}`);

    const isValid = await bcrypt.compare('Recruiter123!', recruiter.passwordHash);
    console.log(`   Password 'Recruiter123!' Match: ${isValid ? '✅ YES' : '❌ NO'}`);

    if (!isValid) {
        console.log('⚠️  Hash mismatch. Updating to a known valid hash...');
        const newHash = await bcrypt.hash('Recruiter123!', 12);
        await prisma.user.update({
            where: { id: recruiter.id },
            data: { passwordHash: newHash }
        });
        console.log('✅ Password updated to new hash.');

        // Verify again
        const recheck = await bcrypt.compare('Recruiter123!', newHash);
        console.log(`   Recheck Match: ${recheck ? '✅ YES' : '❌ NO'}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
