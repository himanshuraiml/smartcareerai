/**
 * Standalone script: seeds only Skill, SkillTest, and TestQuestion rows.
 * Does NOT touch Users, Subscriptions, JobRoles, or any other table.
 * Safe to run against production at any time — all operations are upserts.
 *
 * Usage:
 *   DATABASE_URL="<url>" npx ts-node prisma/seed-skill-questions.ts
 */
import { PrismaClient, Difficulty } from '@prisma/client';
import { skillQuestionBank } from './seed-questions';

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    log: [],
});

async function main() {
    console.log('🌱 Seeding skill tests and questions (no user data touched)...\n');

    // ── 1. Upsert skills ───────────────────────────────────────────────────────
    const skills = [
        { name: 'JavaScript', category: 'Programming', demandScore: 95 },
        { name: 'Python', category: 'Programming', demandScore: 95 },
        { name: 'React', category: 'Framework', demandScore: 90 },
        { name: 'Node.js', category: 'Runtime', demandScore: 88 },
        { name: 'TypeScript', category: 'Programming', demandScore: 85 },
        { name: 'SQL', category: 'Database', demandScore: 90 },
        { name: 'Git', category: 'Tool', demandScore: 88 },
        { name: 'AWS', category: 'Cloud', demandScore: 85 },
        { name: 'Docker', category: 'DevOps', demandScore: 82 },
        { name: 'Kubernetes', category: 'DevOps', demandScore: 78 },
        { name: 'Java', category: 'Programming', demandScore: 85 },
        { name: 'HTML', category: 'Web', demandScore: 85 },
        { name: 'CSS', category: 'Web', demandScore: 85 },
        { name: 'REST APIs', category: 'Architecture', demandScore: 88 },
        { name: 'MongoDB', category: 'Database', demandScore: 75 },
        { name: 'PostgreSQL', category: 'Database', demandScore: 80 },
        { name: 'Linux', category: 'OS', demandScore: 80 },
        { name: 'Machine Learning', category: 'AI', demandScore: 82 },
        { name: 'TensorFlow', category: 'AI', demandScore: 75 },
        { name: 'PyTorch', category: 'AI', demandScore: 75 },
        { name: 'Agile', category: 'Methodology', demandScore: 80 },
        { name: 'Scrum', category: 'Methodology', demandScore: 78 },
        { name: 'Figma', category: 'Design', demandScore: 75 },
        { name: 'Next.js', category: 'Framework', demandScore: 78 },
        { name: 'GraphQL', category: 'API', demandScore: 72 },
        { name: 'Excel', category: 'Tool', demandScore: 90 },
        { name: 'Statistics', category: 'Data', demandScore: 85 },
        { name: 'Tableau', category: 'Tool', demandScore: 88 },
        { name: 'Power BI', category: 'Tool', demandScore: 87 },
        { name: 'R', category: 'Programming', demandScore: 80 },
        { name: 'Pandas', category: 'Data', demandScore: 92 },
        { name: 'Data Visualization', category: 'Data', demandScore: 88 },
        { name: 'Data Modeling', category: 'Data', demandScore: 85 },
        { name: 'Artificial Intelligence', category: 'AI', demandScore: 90 },
        { name: 'C', category: 'Programming', demandScore: 75 },
        { name: 'C++', category: 'Programming', demandScore: 78 },
        { name: 'Go', category: 'Programming', demandScore: 80 },
        { name: 'Rust', category: 'Programming', demandScore: 72 },
        { name: 'Feature Engineering', category: 'Data', demandScore: 82 },
        { name: 'NumPy', category: 'Data', demandScore: 85 },
        { name: 'Scikit-learn', category: 'AI', demandScore: 80 },
        { name: 'Deep Learning', category: 'AI', demandScore: 85 },
        { name: 'Natural Language Processing', category: 'AI', demandScore: 78 },
        { name: 'Computer Vision', category: 'AI', demandScore: 75 },
        { name: 'Generative AI', category: 'AI', demandScore: 92 },
        // Batch 7 — Cloud, Backend & Tools
        { name: 'Azure', category: 'Cloud', demandScore: 83 },
        { name: 'MySQL', category: 'Database', demandScore: 82 },
        { name: 'Spring MVC', category: 'Framework', demandScore: 78 },
        { name: 'Hibernate', category: 'Framework', demandScore: 75 },
        { name: 'Grafana', category: 'Tool', demandScore: 76 },
        { name: 'Streamlit', category: 'Tool', demandScore: 72 },
        { name: 'MS Office', category: 'Tool', demandScore: 85 },
        { name: 'ABAP', category: 'Programming', demandScore: 70 },
        // Batch 8 — AI/ML Extended
        { name: 'LLM', category: 'AI', demandScore: 88 },
        { name: 'Transformer Models', category: 'AI', demandScore: 82 },
        { name: 'Reinforcement Learning', category: 'AI', demandScore: 78 },
        { name: 'CUDA Programming', category: 'Programming', demandScore: 72 },
        { name: 'YOLO', category: 'AI', demandScore: 75 },
        { name: 'Vercel', category: 'Tool', demandScore: 76 },
        { name: 'OpenSearch', category: 'Tool', demandScore: 74 },
    ];

    for (const skill of skills) {
        await prisma.skill.upsert({
            where: { name: skill.name },
            update: { category: skill.category, demandScore: skill.demandScore },
            create: skill,
        });
    }
    console.log(`✅ Upserted ${skills.length} skills`);

    // ── 2. Upsert skill tests ──────────────────────────────────────────────────
    const allSkills = await prisma.skill.findMany();
    let testCount = 0;

    for (const skill of allSkills) {
        const tests = [
            {
                id: `test-${skill.id}-EASY`,
                skillId: skill.id,
                title: `${skill.name} Basics`,
                description: `Core concepts and fundamentals of ${skill.name}`,
                difficulty: Difficulty.EASY,
                durationMinutes: 15,
                passingScore: 75,
                questionsCount: 7,
            },
            {
                id: `test-${skill.id}-MEDIUM`,
                skillId: skill.id,
                title: `${skill.name} Intermediate`,
                description: `Applied ${skill.name} — code comprehension and practical usage`,
                difficulty: Difficulty.MEDIUM,
                durationMinutes: 20,
                passingScore: 70,
                questionsCount: 5,
            },
            {
                id: `test-${skill.id}-HARD`,
                skillId: skill.id,
                title: `${skill.name} Advanced`,
                description: `Advanced ${skill.name} — architecture, debugging, and real-world scenarios`,
                difficulty: Difficulty.HARD,
                durationMinutes: 20,
                passingScore: 70,
                questionsCount: 3,
            },
        ];

        for (const t of tests) {
            await prisma.skillTest.upsert({
                where: { id: t.id },
                update: {
                    title: t.title,
                    description: t.description,
                    difficulty: t.difficulty,
                    durationMinutes: t.durationMinutes,
                    passingScore: t.passingScore,
                    questionsCount: t.questionsCount,
                },
                create: t,
            });
            testCount++;
        }
    }
    console.log(`✅ Upserted ${testCount} skill tests`);

    // ── 3. Seed questions (createMany + skipDuplicates = single round-trip per test) ──
    const seedQuestionsForTest = async (testId: string, questions: any[]) => {
        const data = questions.map((q) => ({
            id: `q-${testId}-${q.orderIndex}`,
            testId,
            questionText: q.questionText,
            questionType: q.questionType ?? 'mcq',
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? null,
            points: q.points ?? 1,
            orderIndex: q.orderIndex,
        }));
        await prisma.testQuestion.createMany({ data, skipDuplicates: true });
    };

    let seededSkills = 0;
    let skippedSkills = 0;

    for (const skill of allSkills) {
        const bank = skillQuestionBank[skill.name];
        if (!bank) {
            skippedSkills++;
            continue;
        }
        await seedQuestionsForTest(`test-${skill.id}-EASY`, bank.easy);
        await seedQuestionsForTest(`test-${skill.id}-MEDIUM`, bank.medium);
        await seedQuestionsForTest(`test-${skill.id}-HARD`, bank.hard);
        seededSkills++;
        console.log(`  ✓ ${skill.name} (${bank.easy.length}e / ${bank.medium.length}m / ${bank.hard.length}h)`);
    }

    console.log(`\n✅ Done — ${seededSkills} skills seeded, ${skippedSkills} skipped (no questions in bank)`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
