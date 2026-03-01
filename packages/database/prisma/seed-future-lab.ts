import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Future-Ready Lab content...');

    // 1. Seed Lab Tracks
    const tracks = [
        {
            slug: 'ai-prompt-engineering',
            title: 'AI & Prompt Engineering',
            description: 'Master large language models, prompt design, and AI-driven development. Learn to integrate AI into your daily workflows.',
            icon: 'Cpu',
            gradient: 'from-purple-500 to-indigo-600',
            cardBg: 'bg-purple-50 dark:bg-purple-900/10',
            border: 'border-purple-200 dark:border-purple-800',
            tag: '🔥 Hottest Skill',
            tagColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            totalMinutes: 180,
            order: 1,
            isActive: true,
            labs: [
                {
                    title: 'Intro to LLMs & Transformers',
                    content: '# Intro to LLMs\\n\\nLarge Language Models (LLMs) are foundational machine learning models that use deep learning algorithms to process and understand language. They are trained on massive amounts of text data to learn patterns and relationships between words.',
                    duration: '45 min',
                    durationMin: 45,
                    isFree: true,
                    order: 1,
                },
                {
                    title: 'Advanced Prompting Techniques',
                    content: '# Advanced Prompting Techniques\\n\\nLearn how to use techniques like Few-Shot Prompting, Chain-of-Thought, and React to get better results from LLMs.',
                    duration: '60 min',
                    durationMin: 60,
                    isFree: false,
                    order: 2,
                },
                {
                    title: 'Building AI Agents',
                    content: '# Building AI Agents\\n\\nLearn how to build AI agents that can interact with the environment, use tools, and solve complex problems autonomously.',
                    duration: '75 min',
                    durationMin: 75,
                    isFree: false,
                    order: 3,
                }
            ]
        },
        {
            slug: 'full-stack-web3',
            title: 'Full-Stack Web3',
            description: 'Learn to build decentralized applications (dApps), smart contracts, and integrate them with modern front-end frameworks.',
            icon: 'Globe',
            gradient: 'from-blue-500 to-cyan-600',
            cardBg: 'bg-blue-50 dark:bg-blue-900/10',
            border: 'border-blue-200 dark:border-blue-800',
            tag: 'Trending',
            tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            totalMinutes: 240,
            order: 2,
            isActive: true,
            labs: [
                {
                    title: 'Solidity Crash Course',
                    content: '# Solidity Crash Course\\n\\nLearn the basics of Solidity, the most popular programming language for writing smart contracts on the Ethereum blockchain.',
                    duration: '90 min',
                    durationMin: 90,
                    isFree: true,
                    order: 1,
                },
                {
                    title: 'Building a NFT Marketplace',
                    content: '# Building a NFT Marketplace\\n\\nBuild a complete NFT marketplace from scratch using Next.js, Tailwind CSS, and Solidity.',
                    duration: '150 min',
                    durationMin: 150,
                    isFree: false,
                    order: 2,
                }
            ]
        },
        {
            slug: 'cloud-native-dev',
            title: 'Cloud Native DevOps',
            description: 'Master containerization, orchestration, and continuous integration/continuous deployment (CI/CD) pipelines for modern scalable applications.',
            icon: 'Cloud',
            gradient: 'from-green-500 to-emerald-600',
            cardBg: 'bg-green-50 dark:bg-green-900/10',
            border: 'border-green-200 dark:border-green-800',
            tag: 'Essential',
            tagColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            totalMinutes: 210,
            order: 3,
            isActive: true,
            labs: [
                {
                    title: 'Docker Essentials',
                    content: '# Docker Essentials\\n\\nLearn how to containerize your applications using Docker, making them portable and easy to deploy.',
                    duration: '60 min',
                    durationMin: 60,
                    isFree: true,
                    order: 1,
                },
                {
                    title: 'Kubernetes for Beginners',
                    content: '# Kubernetes for Beginners\\n\\nAn introduction to Kubernetes, the industry standard for container orchestration.',
                    duration: '90 min',
                    durationMin: 90,
                    isFree: false,
                    order: 2,
                },
                {
                    title: 'CI/CD with GitHub Actions',
                    content: '# CI/CD with GitHub Actions\\n\\nAutomate your development workflow with GitHub Actions, from testing to deployment.',
                    duration: '60 min',
                    durationMin: 60,
                    isFree: false,
                    order: 3,
                }
            ]
        },
    ];

    for (const trackData of tracks) {
        const { labs, ...trackDetails } = trackData;

        // Upsert Track
        const track = await prisma.labTrack.upsert({
            where: { slug: trackDetails.slug },
            update: trackDetails,
            create: trackDetails,
        });
        console.log(\`  🟢 Upserted Track: \${track.title}\`);

        // Upsert Labs for Track
        for (const labData of labs) {
            // Find existing lab by title and trackId to upsert, as we don't have a unique slug for labs
            const existingLab = await prisma.lab.findFirst({
                where: { trackId: track.id, title: labData.title }
            });

            if (existingLab) {
                await prisma.lab.update({
                    where: { id: existingLab.id },
                    data: { ...labData }
                });
            } else {
                await prisma.lab.create({
                    data: {
                        ...labData,
                        trackId: track.id
                    }
                });
            }
        }
    }

    // 2. Seed Weekly Challenges
    const currentYear = new Date().getFullYear();
    const currentWeek = 9; // Let's create challenges for around week 9

    const weeklyChallenges = [
        {
            title: 'Build a Next.js AI Chatbot',
            description: 'Create a responsive chatbot interface using Next.js, Tailwind CSS, and integrate it with an open-source LLM API like Hugging Face or Groq.',
            difficulty: 'Intermediate',
            reward: '+200 XP + AI Builder Badge',
            xpReward: 200,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
            weekNumber: currentWeek,
            year: currentYear,
            isActive: true,
        },
        {
            title: 'Optimize React Render Performance',
            description: 'Take a provided poorly-performing React application and optimize it using useMemo, useCallback, and code splitting to achieve a 95+ Lighthouse score.',
            difficulty: 'Advanced',
            reward: '+300 XP + Performance Guru Badge',
            xpReward: 300,
            deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Passed deadline
            weekNumber: currentWeek - 1,
            year: currentYear,
            isActive: false, // Expired
        },
        {
            title: 'Create a Responsive Landing Page',
            description: 'Design and code a fully responsive landing page for a fictional SaaS product using plain HTML and CSS Grid/Flexbox.',
            difficulty: 'Beginner',
            reward: '+100 XP + CSS Novice Badge',
            xpReward: 100,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
            weekNumber: currentWeek + 1,
            year: currentYear,
            isActive: true,
        }
    ];

    for (const challengeData of weeklyChallenges) {
        await prisma.weeklyChallenge.upsert({
            where: {
                weekNumber_year: {
                    weekNumber: challengeData.weekNumber,
                    year: challengeData.year,
                }
            },
            update: challengeData,
            create: challengeData,
        });
        console.log(\`  🟢 Upserted Weekly Challenge: \${challengeData.title} (Week \${challengeData.weekNumber}, \${challengeData.year})\`);
    }

    console.log('✅ Future-Ready Lab content seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
