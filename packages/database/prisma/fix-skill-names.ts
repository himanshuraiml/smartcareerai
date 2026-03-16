/**
 * One-time script to normalize existing Skill names in the database.
 * Run with: npx ts-node --project tsconfig.json prisma/fix-skill-names.ts
 * (from packages/database directory)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Canonical overrides for known bad names already in the DB
const FIXES: Record<string, string> = {
    // 'infrastructure' is blocklisted (too generic) — delete, don't rename
    'cloud': 'Cloud Computing',
    'devops': 'DevOps',
    'linux': 'Linux',
    'unix': 'Unix',
    'bash': 'Bash Scripting',
    'shell': 'Shell Scripting',
    'shell scripting': 'Shell Scripting',
    'ci/cd': 'CI/CD',
    'cicd': 'CI/CD',
    'excel': 'Excel',
    'git': 'Git',
    'go': 'Go',
    'rust': 'Rust',
    'java': 'Java',
    'python': 'Python',
    'sql': 'SQL',
    'html': 'HTML',
    'css': 'CSS',
    'figma': 'Figma',
    'tableau': 'Tableau',
    'docker': 'Docker',
    'react': 'React',
    'angular': 'Angular',
    'vue': 'Vue.js',
    'flask': 'Flask',
    'django': 'Django',
    'agile': 'Agile',
    'scrum': 'Scrum',
    'statistics': 'Statistics',
    'pandas': 'Pandas',
    'spark': 'Apache Spark',
    'hadoop': 'Hadoop',
    'kafka': 'Apache Kafka',
    'redis': 'Redis',
    'terraform': 'Terraform',
    'ansible': 'Ansible',
    'jenkins': 'Jenkins',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'flutter': 'Flutter',
    'unity': 'Unity',
    'elasticsearch': 'Elasticsearch',
    'graphql': 'GraphQL',
};

function applyTitleCase(str: string): string {
    return str
        .trim()
        .split(/\s+/)
        .map(word => {
            if (/[A-Z]/.test(word.slice(1))) return word; // mixed case → leave
            if (word === word.toUpperCase() && word.length > 1) return word; // acronym → leave
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

async function main() {
    const skills = await prisma.skill.findMany({ select: { id: true, name: true } });
    let fixed = 0;

    for (const skill of skills) {
        const lower = skill.name.toLowerCase().trim();
        let newName: string | null = null;

        // Check explicit fix map first
        if (FIXES[lower]) {
            newName = FIXES[lower];
        } else if (skill.name !== applyTitleCase(skill.name)) {
            // Apply Title Case to any skill that's not already properly cased
            newName = applyTitleCase(skill.name);
        }

        if (newName && newName !== skill.name) {
            // Check if canonical name already exists (to avoid unique constraint violation)
            const existing = await prisma.skill.findFirst({
                where: { name: { equals: newName, mode: 'insensitive' }, id: { not: skill.id } },
            });

            if (existing) {
                // Merge: re-point all UserSkills to the existing canonical record, then delete duplicate
                console.log(`  Merging "${skill.name}" → "${existing.name}" (id: ${existing.id})`);
                await prisma.userSkill.updateMany({
                    where: { skillId: skill.id },
                    data: { skillId: existing.id },
                });
                await prisma.skill.delete({ where: { id: skill.id } });
            } else {
                console.log(`  Renaming "${skill.name}" → "${newName}"`);
                await prisma.skill.update({ where: { id: skill.id }, data: { name: newName } });
            }
            fixed++;
        }
    }

    console.log(`\nDone. Fixed ${fixed} / ${skills.length} skills.`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
