
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up non-standard skills...');

    // Explicitly listing the IDs found earlier or finding by name
    const badSkills = ['developer', 'software', 'dev', 'engineer', 'technologies', 'tools', 'frameworks'];

    // 1. Find them
    const skillsToDelete = await prisma.skill.findMany({
        where: {
            name: { in: badSkills, mode: 'insensitive' }
        }
    });

    if (skillsToDelete.length === 0) {
        console.log('✅ No bad skills found to delete.');
        return;
    }

    console.log(`Found ${skillsToDelete.length} skills to delete:`);
    const ids = skillsToDelete.map(s => s.id);
    skillsToDelete.forEach(s => console.log(`- ${s.name} (${s.id})`));

    // 2. Delete related UserSkills first (cascade usually handles this but being safe)
    const deletedUserSkills = await prisma.userSkill.deleteMany({
        where: { skillId: { in: ids } }
    });
    console.log(`Deleted ${deletedUserSkills.count} user skill associations.`);

    // 3. Delete related SkillTests 
    const deletedTests = await prisma.skillTest.deleteMany({
        where: { skillId: { in: ids } }
    });
    console.log(`Deleted ${deletedTests.count} skill tests.`);

    // 4. Delete the Skills
    const deletedSkills = await prisma.skill.deleteMany({
        where: { id: { in: ids } }
    });
    console.log(`✅ deleted ${deletedSkills.count} skills.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
