
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

async function main() {
    console.log('🔑 Logging in as Admin...');

    const user = await prisma.user.findUnique({
        where: { email: 'admin@placenxt.com' }
    });

    if (!user) {
        console.error('❌ Admin user not found');
        return;
    }

    // Verify password just to be sure
    const isValid = await bcrypt.compare('Admin123!', user.passwordHash);
    if (!isValid) {
        console.error('❌ Invalid password hash match!');
        return;
    }

    console.log('✅ Password verified.');

    // Generate Token (Simulating Auth Service)
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role }, // Ensure ROLE is in payload
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    console.log('\n🎟️ Generated Token:');
    console.log(token);

    console.log('\n📋 Payload that SHOULD be in token:');
    console.log({ id: user.id, email: user.email, role: user.role });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
