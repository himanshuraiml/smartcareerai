
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for non-standard skills...');

    const badSkills = ['developer', 'software', 'dev', 'engineer'];

    const skills = await prisma.skill.findMany({
        where: {
            name: { in: badSkills, mode: 'insensitive' }
        }
    });

    if (skills.length > 0) {
        console.log('⚠️ Found bad skills in DB:');
        skills.forEach(s => console.log(`- ${s.name} (ID: ${s.id})`));
    } else {
        console.log('✅ No bad skills found in DB.');
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
