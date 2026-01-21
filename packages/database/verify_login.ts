const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyLogin() {
    console.log('🔍 Verifying Stanford Admin Login...');
    const email = 'admin@stanford.edu';
    const password = 'InstAdmin123!';

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error('❌ User not found!');
            return;
        }

        console.log(`✅ User found: ${user.email} (Role: ${user.role})`);

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (isValid) {
            console.log('✅ Password matches!');
        } else {
            console.error('❌ Password does NOT match!');
            // Hash new password and update to be sure
            console.log('🔄 Updating password to be sure...');
            const newHash = await bcrypt.hash(password, 12);
            await prisma.user.update({
                where: { email },
                data: { passwordHash: newHash }
            });
            console.log('✅ Password updated manually.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyLogin();
