require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const apps = await prisma.recruiterJobApplicant.findMany({
        where: { jobId: '485326e0-24f8-4a49-9193-323e758f90b0' },
        include: { candidate: { include: { interviews: true } } }
    });
    console.log(JSON.stringify(apps, null, 2));
}
main();
