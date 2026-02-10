import { PrismaClient } from '@prisma/client';
import { softwareDeveloperQuestions } from './interview-questions/software-developer';
import { frontendDeveloperQuestions } from './interview-questions/frontend-developer';
import { backendDeveloperQuestions } from './interview-questions/backend-developer';
import { fullStackDeveloperQuestions } from './interview-questions/full-stack-developer';
import { dataScientistQuestions } from './interview-questions/data-scientist';
import { dataAnalystQuestions } from './interview-questions/data-analyst';
import { devopsEngineerQuestions } from './interview-questions/devops-engineer';
import { cloudEngineerQuestions } from './interview-questions/cloud-engineer';
import { productManagerQuestions } from './interview-questions/product-manager';
import { projectManagerQuestions } from './interview-questions/project-manager';
import { uiUxDesignerQuestions } from './interview-questions/ui-ux-designer';
import { mlEngineerQuestions } from './interview-questions/ml-engineer';
import { mobileDeveloperQuestions } from './interview-questions/mobile-developer';
import { qaEngineerQuestions } from './interview-questions/qa-engineer';
import { cybersecurityAnalystQuestions } from './interview-questions/cybersecurity-analyst';
import { hrSharedQuestions } from './interview-questions/hr-shared';

const prisma = new PrismaClient();

const ROLE_QUESTIONS_MAP: Record<string, any[]> = {
  'Software Developer': softwareDeveloperQuestions,
  'Frontend Developer': frontendDeveloperQuestions,
  'Backend Developer': backendDeveloperQuestions,
  'Full Stack Developer': fullStackDeveloperQuestions,
  'Data Scientist': dataScientistQuestions,
  'Data Analyst': dataAnalystQuestions,
  'DevOps Engineer': devopsEngineerQuestions,
  'Cloud Engineer': cloudEngineerQuestions,
  'Product Manager': productManagerQuestions,
  'Project Manager': projectManagerQuestions,
  'UI/UX Designer': uiUxDesignerQuestions,
  'Machine Learning Engineer': mlEngineerQuestions,
  'Mobile Developer': mobileDeveloperQuestions,
  'QA Engineer': qaEngineerQuestions,
  'Cybersecurity Analyst': cybersecurityAnalystQuestions,
};

async function seedInterviewQuestions() {
  console.log('Starting interview question bank seeding...\n');

  // Check if questions already exist
  const existingCount = await prisma.interviewBankQuestion.count();
  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing bank questions. Clearing before re-seeding...`);
    await prisma.interviewBankQuestion.deleteMany();
  }

  const jobRoles = await prisma.jobRole.findMany();
  const roleMap = new Map(jobRoles.map(r => [r.title, r.id]));

  let totalSeeded = 0;

  // Seed role-specific technical questions
  for (const [roleTitle, questions] of Object.entries(ROLE_QUESTIONS_MAP)) {
    const jobRoleId = roleMap.get(roleTitle);
    if (!jobRoleId) {
      console.warn(`  WARNING: Role not found in DB: "${roleTitle}" — skipping ${questions.length} questions`);
      continue;
    }

    const data = questions.map((q: any) => ({
      questionText: q.questionText,
      idealAnswer: q.idealAnswer,
      category: q.category,
      difficulty: q.difficulty,
      questionType: 'TECHNICAL' as const,
      jobRoleId,
      tags: q.tags,
      isActive: true,
    }));

    const result = await prisma.interviewBankQuestion.createMany({ data });
    totalSeeded += result.count;
    console.log(`  Seeded ${result.count} questions for ${roleTitle}`);
  }

  // Seed shared HR/Behavioral questions (jobRoleId = null)
  const hrData = hrSharedQuestions.map((q: any) => ({
    questionText: q.questionText,
    idealAnswer: q.idealAnswer,
    category: q.category,
    difficulty: q.difficulty,
    questionType: q.questionType === 'BEHAVIORAL' ? 'BEHAVIORAL' as const : 'HR' as const,
    jobRoleId: null,
    tags: q.tags,
    isActive: true,
  }));

  const hrResult = await prisma.interviewBankQuestion.createMany({ data: hrData });
  totalSeeded += hrResult.count;
  console.log(`  Seeded ${hrResult.count} shared HR/Behavioral questions`);

  console.log(`\nDone! Total questions seeded: ${totalSeeded}`);

  // Summary by role
  console.log('\n--- Summary ---');
  const summary = await prisma.interviewBankQuestion.groupBy({
    by: ['questionType'],
    _count: { id: true },
  });
  for (const row of summary) {
    console.log(`  ${row.questionType}: ${row._count.id} questions`);
  }
}

seedInterviewQuestions()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
