import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Find admin user
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@smartcareer.ai' }
    });

    if (!admin) {
        console.log('Admin user not found!');
        return;
    }

    console.log('Admin user found:', {
        email: admin.email,
        role: admin.role,
        passwordHash: admin.passwordHash.substring(0, 20) + '...'
    });

    // Test password comparison
    const testPassword = 'Admin123!';
    const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
    console.log(`Password 'Admin123!' valid: ${isValid}`);

    // Try with the hash we used in seed
    const seedHash = '$2a$12$P2NRBlMlP1LdUwn7fSMlZuByDd8YVmHCwuLiqsZjnVpV4OLO53bQ9m';
    console.log('Stored hash matches seed hash:', admin.passwordHash === seedHash);
}

main()
    .finally(() => prisma.$disconnect());
