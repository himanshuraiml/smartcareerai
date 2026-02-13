const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const roles = await prisma.jobRole.findMany({ select: { id: true, title: true } });
    const institutions = await prisma.institution.findMany({ select: { id: true, name: true } });
    console.log('Roles:', roles);
    console.log('Institutions:', institutions);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
