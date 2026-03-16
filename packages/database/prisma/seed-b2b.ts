import { PrismaClient, UserRole, ApplicationStatus, ApprovalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting B2B Seeding...');

    // 1. Create Institutions
    const srmist = await prisma.institution.upsert({
        where: { domain: 'srmisttrichy.edu' },
        update: {},
        create: {
            name: 'SRM Institute of Science and Technology (SRMIST)',
            domain: 'srmisttrichy.edu',
            address: 'SRM Nagar, Tiruchirappalli, Tamil Nadu 621105',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/SRM_Institute_of_Science_and_Technology_logo.png/220px-SRM_Institute_of_Science_and_Technology_logo.png',
        },
    });

    const mit = await prisma.institution.upsert({
        where: { domain: 'mit.edu' },
        update: {},
        create: {
            name: 'Massachusetts Institute of Technology',
            domain: 'mit.edu',
            address: '77 Massachusetts Ave, Cambridge, MA 02139',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg',
        },
    });

    console.log(`✅ Created Institutions: ${srmist.name}, ${mit.name}`);

    // 2. Create Institution Admin for SRMIST
    const passwordHash = await bcrypt.hash('Password123!', 12);
    const srmistAdmin = await prisma.user.upsert({
        where: { email: 'admin@srmisttrichy.edu' },
        update: {
            role: UserRole.INSTITUTION_ADMIN,
            adminForInstitutionId: srmist.id,
        },
        create: {
            email: 'admin@srmisttrichy.edu',
            passwordHash,
            name: 'SRMIST Admin',
            role: UserRole.INSTITUTION_ADMIN,
            adminForInstitutionId: srmist.id,
            isVerified: true,
        },
    });

    console.log(`✅ Created SRMIST Admin: ${srmistAdmin.email}`);

    // 3. Create a Recruiter
    const recruiterUser = await prisma.user.upsert({
        where: { email: 'recruiter@google.com' },
        update: { role: UserRole.RECRUITER },
        create: {
            email: 'recruiter@google.com',
            passwordHash,
            name: 'Google Recruiter',
            role: UserRole.RECRUITER,
            isVerified: true,
        },
    });

    const recruiter = await prisma.recruiter.upsert({
        where: { userId: recruiterUser.id },
        update: {},
        create: {
            userId: recruiterUser.id,
            companyName: 'Google',
            industry: 'Technology',
            location: 'Mountain View, CA',
        },
    });

    console.log(`✅ Created Recruiter: ${recruiterUser.email}`);

    // 4. Create Students for SRMIST
    const studentNames = ['Alice Chen', 'Bob Smith', 'Charlie Davis', 'Diana Prince'];
    const students = [];

    for (let i = 0; i < studentNames.length; i++) {
        const email = `student${i + 1}@srmisttrichy.edu`;
        const student = await prisma.user.upsert({
            where: { email },
            update: { institutionId: srmist.id },
            create: {
                email,
                passwordHash,
                name: studentNames[i],
                role: UserRole.USER,
                institutionId: srmist.id,
                isVerified: true,
            },
        });
        students.push(student);
    }

    console.log(`✅ Created ${students.length} SRMIST Students`);

    // 5. Create some Skills for the students (to test profile completion)
    const skills = await prisma.skill.findMany({ take: 3 });
    if (skills.length > 0) {
        for (const student of students) {
            await prisma.userSkill.upsert({
                where: { userId_skillId: { userId: student.id, skillId: skills[0].id } },
                update: {},
                create: {
                    userId: student.id,
                    skillId: skills[0].id,
                    proficiencyLevel: 'INTERMEDIATE',
                    source: 'self-assessed',
                },
            });
        }
    }

    // 6. Mark one student as PLACED
    await prisma.recruiterJobApplicant.create({
        data: {
            job: {
                create: {
                    recruiterId: recruiter.id,
                    title: 'Software Engineer Intern (SRMIST Only)',
                    description: 'A special B2B targeted job for SRMIST students.',
                    location: 'Remote',
                    requirements: ['React', 'Node.js'],
                    requiredSkills: ['React', 'TypeScript'],
                    targetInstitutionId: srmist.id,
                    approvalStatus: ApprovalStatus.APPROVED,
                },
            },
            candidate: { connect: { id: students[0].id } },
            status: ApplicationStatus.PLACED,
            notes: 'Excellent candidate, hired for Summer 2026',
        },
    });

    console.log(`✅ Seeded a PLACED student and a targeted job`);

    console.log('🚀 B2B Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
