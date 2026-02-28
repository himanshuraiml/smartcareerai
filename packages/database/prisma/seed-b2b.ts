import { PrismaClient, UserRole, ApplicationStatus, ApprovalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting B2B Seeding...');

    // 1. Create Institutions
    const stanford = await prisma.institution.upsert({
        where: { domain: 'stanford.edu' },
        update: {},
        create: {
            name: 'Stanford University',
            domain: 'stanford.edu',
            address: '450 Serra Mall, Stanford, CA 94305',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Stanford_University_seal_2003.svg',
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

    console.log(`✅ Created Institutions: ${stanford.name}, ${mit.name}`);

    // 2. Create Institution Admin for Stanford
    const passwordHash = await bcrypt.hash('Password123!', 12);
    const stanfordAdmin = await prisma.user.upsert({
        where: { email: 'admin@stanford.edu' },
        update: {
            role: UserRole.INSTITUTION_ADMIN,
            adminForInstitutionId: stanford.id,
        },
        create: {
            email: 'admin@stanford.edu',
            passwordHash,
            name: 'Stanford Admin',
            role: UserRole.INSTITUTION_ADMIN,
            adminForInstitutionId: stanford.id,
            isVerified: true,
        },
    });

    console.log(`✅ Created Stanford Admin: ${stanfordAdmin.email}`);

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

    // 4. Create Students for Stanford
    const studentNames = ['Alice Chen', 'Bob Smith', 'Charlie Davis', 'Diana Prince'];
    const students = [];

    for (let i = 0; i < studentNames.length; i++) {
        const email = `student${i + 1}@stanford.edu`;
        const student = await prisma.user.upsert({
            where: { email },
            update: { institutionId: stanford.id },
            create: {
                email,
                passwordHash,
                name: studentNames[i],
                role: UserRole.USER,
                institutionId: stanford.id,
                isVerified: true,
            },
        });
        students.push(student);
    }

    console.log(`✅ Created ${students.length} Stanford Students`);

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
                    title: 'Software Engineer Intern (Stanford Only)',
                    description: 'A special B2B targeted job for Stanford students.',
                    location: 'Remote',
                    requirements: ['React', 'Node.js'],
                    requiredSkills: ['React', 'TypeScript'],
                    targetInstitutionId: stanford.id,
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
