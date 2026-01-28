import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { analyzeWithGemini } from '../utils/gemini';

// Roadmap week structure for learning paths
interface RoadmapWeek {
    week: number;
    focus: string;
    skills: string[];
    tasks: string[];
    resources: any[];
    estimatedHours: number;
}

export class SkillService {
    // Knowledge Base for Dynamic Roadmap Generation
    private static SKILL_METADATA: Record<string, { concepts: string[]; project: string; focus: string }> = {
        'python': {
            concepts: ['Variables & Data Types', 'Control Flow (If/Else, Loops)', 'Functions & Modules', 'OOP Fundamentals', 'File Handling & Exceptions'],
            project: 'Build a Data Scraper or Automation Script',
            focus: 'Master Python Syntax and Core Programming Concepts'
        },
        'javascript': {
            concepts: ['ES6+ Syntax', 'DOM Manipulation', 'Async/Await & Promises', 'Event Handling', 'Closures & Scope'],
            project: 'Build an Interactive To-Do List or Weather App',
            focus: 'Understand Modern JavaScript and Web Interactivity'
        },
        'react': {
            concepts: ['Components & Props', 'State & Hooks (useState, useEffect)', 'Context API', 'React Router', 'Form Handling'],
            project: 'Build a Personal Portfolio or E-commerce Frontend',
            focus: 'Learn Component-Based UI Development'
        },
        'node.js': {
            concepts: ['Event Loop & Async I/O', 'Express.js Framework', 'REST API Design', 'Middleware', 'File System Operations'],
            project: 'Build a RESTful API for a Blog or Task Manager',
            focus: 'Master Server-Side JavaScript and API Development'
        },
        'sql': {
            concepts: ['SELECT & Filtering', 'Joins (Inner, Left, Right)', 'Aggregations (GROUP BY)', 'Subqueries', 'Database Design (Normalization)'],
            project: 'Design and Query a Database for a Store Inventory',
            focus: 'Master Relational Database Management and Querying'
        },
        'aws': {
            concepts: ['EC2 & S3', 'IAM & Security', 'Lambda & Serverless', 'RDS & DynamoDB', 'VPC & Networking'],
            project: 'Deploy a Web Application on EC2 with S3 Storage',
            focus: 'Understand Core Cloud Services and Architecture'
        },
        'docker': {
            concepts: ['Images & Containers', 'Dockerfile Best Practices', 'Docker Compose', 'Volumes & Networking', 'Container Orchestration Basics'],
            project: 'Containerize a Full-Stack Application',
            focus: 'Master Application Containerization and Deployment'
        },
        'kubernetes': {
            concepts: ['Pods & Services', 'Deployments & ReplicaSets', 'ConfigMaps & Secrets', 'Ingress & Networking', 'Helm Charts'],
            project: 'Deploy a Microservices App to a K8s Cluster',
            focus: 'Learn Container Orchestration and Management'
        },
        'git': {
            concepts: ['Commit & Push', 'Branching & Merging', 'Pull Requests', 'Resolving Conflicts', 'Git Workflows (Gitflow)'],
            project: 'Collaborate on a Mock Open Source Project',
            focus: 'Master Version Control and Team Collaboration'
        },
        'machine learning': {
            concepts: ['Supervised vs Unsupervised', 'Regression & Classification', 'Model Evaluation', 'Feature Engineering', 'Neural Networks Basics'],
            project: 'Build a Price Prediction or Image Classifier Model',
            focus: 'Understand Core ML Algorithms and Pipelines'
        },
        'typescript': {
            concepts: ['Static Typing', 'Interfaces & Types', 'Generics', 'Utility Types', 'TypeScript Configuration'],
            project: 'Refactor a JavaScript Project to TypeScript',
            focus: 'Learn Type-Safe JavaScript Development'
        },
        'java': {
            concepts: ['OOP Principles', 'Collections Framework', 'Multithreading', 'Stream API', 'JVM Internals'],
            project: 'Build a Console-based Banking System',
            focus: 'Master Core Java and Object-Oriented Programming'
        },
        'c++': {
            concepts: ['Pointers & References', 'Memory Management', 'STL (Standard Template Library)', 'OOP in C++', 'Templates'],
            project: 'Build a Simple Game Engine or System Tool',
            focus: 'Master Low-Level Programming and Performance'
        },
        'html/css': {
            concepts: ['Semantic HTML5', 'CSS Flexbox & Grid', 'Responsive Design', 'CSS Variables', 'Accessibility (A11y)'],
            project: 'Build a Responsive Landing Page',
            focus: 'Master Web Layouts and Styling'
        }
    };

    // Skill aliases for normalization
    private static SKILL_ALIASES: Record<string, string> = {
        // AI/ML
        'ai': 'Artificial Intelligence',
        'artificial intelligence': 'Artificial Intelligence',
        'ml': 'Machine Learning',
        'machine learning': 'Machine Learning',
        'genai': 'Generative AI',
        'gen ai': 'Generative AI',
        'generative ai': 'Generative AI',
        'deep learning': 'Deep Learning',
        'dl': 'Deep Learning',
        'nlp': 'Natural Language Processing',
        'natural language processing': 'Natural Language Processing',
        'cv': 'Computer Vision',
        'computer vision': 'Computer Vision',
        // Data
        'modeling': 'Data Modeling',
        'data modeling': 'Data Modeling',
        'data modelling': 'Data Modeling',
        'viz': 'Data Visualization',
        'vis': 'Data Visualization',
        'visualization': 'Data Visualization',
        'visualisation': 'Data Visualization',
        'data visualization': 'Data Visualization',
        'data visualisation': 'Data Visualization',
        'feature engineering': 'Feature Engineering',
        'numpy': 'NumPy',
        'sklearn': 'Scikit-learn',
        'scikit-learn': 'Scikit-learn',
        'scikit learn': 'Scikit-learn',
        // Programming languages
        'js': 'JavaScript',
        'javascript': 'JavaScript',
        'ts': 'TypeScript',
        'typescript': 'TypeScript',
        'reactjs': 'React',
        'react.js': 'React',
        'react js': 'React',
        'nodejs': 'Node.js',
        'node': 'Node.js',
        'node.js': 'Node.js',
        'node js': 'Node.js',
        'golang': 'Go',
        'c#': 'C#',
        'csharp': 'C#',
        'c sharp': 'C#',
        'dotnet': '.NET',
        '.net': '.NET',
        'c++': 'C++',
        'cpp': 'C++',
        'c plus plus': 'C++',
        // Tools & Frameworks
        'qa': 'Test Automation',
        'tf': 'TensorFlow',
        'tensorflow': 'TensorFlow',
        'pytorch': 'PyTorch',
        'k8s': 'Kubernetes',
        'kube': 'Kubernetes',
        'kubernetes': 'Kubernetes',
        'postgres': 'PostgreSQL',
        'postgresql': 'PostgreSQL',
        'mongo': 'MongoDB',
        'mongodb': 'MongoDB',
        // Cloud
        'aws': 'AWS',
        'amazon web services': 'AWS',
        'gcp': 'Google Cloud',
        'google cloud': 'Google Cloud',
        'azure': 'Azure',
        'microsoft azure': 'Azure',
    };

    // Skills to ignore/block (generic terms)
    private static SKILL_BLOCKLIST = new Set([
        'developer',
        'software',
        'software developer',
        'engineer',
        'dev',
        'technologies',
        'tools',
        'frameworks',
        'programming',
        'coding',
        'web',
        'app',
        'application',
        'system',
        'computer',
        'science'
    ]);

    // Normalize skill name
    private normalizeSkillName(name: string): string | null {
        const lowerName = name.toLowerCase().trim();

        // Check blocklist
        if (SkillService.SKILL_BLOCKLIST.has(lowerName)) {
            return null;
        }

        // Check direct alias
        if (SkillService.SKILL_ALIASES[lowerName]) {
            return SkillService.SKILL_ALIASES[lowerName];
        }
        return name;
    }

    // Get all available job roles for registration/personalization
    async getJobRoles() {
        return prisma.jobRole.findMany({
            where: { isActive: true },
            select: {
                id: true,
                title: true,
                category: true,
            },
            orderBy: [{ category: 'asc' }, { title: 'asc' }],
        });
    }

    // Get all skills with optional filtering
    async getAllSkills(category?: string, search?: string) {
        const where: any = { isActive: true };

        if (category) {
            where.category = category;
        }

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        return prisma.skill.findMany({
            where,
            orderBy: { demandScore: 'desc' },
        });
    }

    // Get skill by ID
    async getSkillById(skillId: string) {
        const skill = await prisma.skill.findUnique({
            where: { id: skillId },
            include: { courses: { where: { isActive: true }, take: 5 } },
        });

        if (!skill) {
            throw new AppError('Skill not found', 404);
        }

        return skill;
    }

    // Clear all resume-sourced skills for a user
    async clearResumeSkills(userId: string) {
        const deleted = await prisma.userSkill.deleteMany({
            where: {
                userId,
                source: 'resume',
            },
        });
        logger.info(`Cleared ${deleted.count} resume-sourced skills for user ${userId}`);
        return deleted.count;
    }

    // Analyze resume to extract skills using LLM
    async analyzeResumeSkills(userId: string, resumeId: string) {
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId, isActive: true },
        });

        if (!resume || !resume.parsedText) {
            throw new AppError('Resume not found or not parsed', 404);
        }

        // Clear existing resume-sourced skills before extracting new ones
        // This ensures we don't accumulate skills from multiple resume versions
        await this.clearResumeSkills(userId);

        // Get all available skills for matching
        const allSkills = await prisma.skill.findMany({ where: { isActive: true } });
        const skillNames = allSkills.map(s => s.name);

        // Use LLM to extract skills from resume
        const prompt = `Analyze the following resume text and extract all technical and soft skills.
    
Available skills to match against: ${skillNames.join(', ')}

Resume text:
${resume.parsedText}

Return a JSON object with:
{
  "extractedSkills": [
    { "name": "skill name", "proficiency": "beginner|intermediate|advanced|expert", "confidence": 0.0-1.0 }
  ],
  "suggestedSkills": ["skill names not in available list but found in resume"]
}`;

        try {
            const systemPrompt = 'You are an expert skills analyzer. Extract skills from resumes accurately. Return JSON only.';
            const analysis = await analyzeWithGemini(systemPrompt, prompt);

            // Handle case where LLM analysis fails or returns null
            if (!analysis || !analysis.extractedSkills) {
                logger.warn('LLM analysis returned null, falling back to keyword matching');
                const savedSkills = await this.fallbackSkillExtraction(userId, resume.parsedText, allSkills);
                return {
                    extractedSkills: savedSkills,
                    suggestedSkills: [],
                    totalFound: savedSkills.length,
                };
            }

            // Save extracted skills to user profile
            const savedSkills: any[] = [];
            for (const extracted of analysis.extractedSkills || []) {
                const normalizedName = this.normalizeSkillName(extracted.name);

                if (!normalizedName) {
                    continue;
                }

                const matchedSkill = allSkills.find(
                    s => s.name.toLowerCase() === normalizedName.toLowerCase()
                );

                if (matchedSkill && extracted.confidence >= 0.7) {
                    const userSkill = await prisma.userSkill.upsert({
                        where: {
                            userId_skillId: { userId, skillId: matchedSkill.id },
                        },
                        create: {
                            userId,
                            skillId: matchedSkill.id,
                            proficiencyLevel: extracted.proficiency || 'intermediate',
                            source: 'resume',
                        },
                        update: {
                            proficiencyLevel: extracted.proficiency || 'intermediate',
                        },
                        include: { skill: true },
                    });
                    savedSkills.push(userSkill);
                }
            }

            logger.info(`Extracted ${savedSkills.length} skills for user ${userId}`);

            return {
                extractedSkills: savedSkills,
                suggestedSkills: analysis.suggestedSkills || [],
                totalFound: analysis.extractedSkills?.length || 0,
            };
        } catch (error: any) {
            logger.error('Failed to analyze resume skills with LLM, using fallback', { error: error.message });

            // Fallback to keyword matching on any error
            try {
                const savedSkills = await this.fallbackSkillExtraction(userId, resume.parsedText, allSkills);
                return {
                    extractedSkills: savedSkills,
                    suggestedSkills: [],
                    totalFound: savedSkills.length,
                };
            } catch (fallbackError) {
                logger.error('Fallback skill extraction also failed', fallbackError);
                throw new AppError('Failed to analyze skills', 500);
            }
        }
    }

    // Fallback skill extraction using keyword matching (no LLM)
    private async fallbackSkillExtraction(
        userId: string,
        resumeText: string,
        allSkills: Array<{ id: string; name: string }>
    ): Promise<any[]> {
        const resumeLower = resumeText.toLowerCase();
        const savedSkills: any[] = [];

        for (const skill of allSkills) {
            const skillLower = skill.name.toLowerCase();
            const normalizedName = this.normalizeSkillName(skill.name);

            if (!normalizedName) continue;

            // Check if skill name appears in resume
            if (resumeLower.includes(skillLower)) {
                try {
                    const userSkill = await prisma.userSkill.upsert({
                        where: {
                            userId_skillId: { userId, skillId: skill.id },
                        },
                        create: {
                            userId,
                            skillId: skill.id,
                            proficiencyLevel: 'intermediate',
                            source: 'resume',
                        },
                        update: {
                            proficiencyLevel: 'intermediate',
                        },
                        include: { skill: true },
                    });
                    savedSkills.push(userSkill);
                } catch (e) {
                    logger.warn(`Failed to save skill ${skill.name} for user ${userId}`);
                }
            }
        }

        logger.info(`Fallback extraction found ${savedSkills.length} skills for user ${userId}`);
        return savedSkills;
    }

    // Get user's skills
    async getUserSkills(userId: string) {
        return prisma.userSkill.findMany({
            where: { userId },
            include: { skill: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Add a skill to user profile
    async addUserSkill(
        userId: string,
        skillId: string,
        proficiencyLevel: string,
        source: string
    ) {
        const skill = await prisma.skill.findUnique({ where: { id: skillId } });
        if (!skill) {
            throw new AppError('Skill not found', 404);
        }

        return prisma.userSkill.upsert({
            where: {
                userId_skillId: { userId, skillId },
            },
            create: {
                userId,
                skillId,
                proficiencyLevel,
                source,
            },
            update: {
                proficiencyLevel,
                source,
            },
            include: { skill: true },
        });
    }

    // Remove skill from user profile
    async removeUserSkill(userId: string, skillId: string) {
        await prisma.userSkill.deleteMany({
            where: { userId, skillId },
        });
    }

    // Gap analysis - compare user skills to target role requirements
    async getGapAnalysis(userId: string, targetRole: string) {
        // Get user's current skills
        const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            include: { skill: true },
        });

        // Get target role requirements
        const jobRole = await prisma.jobRole.findFirst({
            where: { title: { contains: targetRole, mode: 'insensitive' } },
        });

        if (!jobRole) {
            throw new AppError('Target role not found', 404);
        }

        const userSkillNames = userSkills.map(us => us.skill.name.toLowerCase());
        const requiredSkills = jobRole.requiredSkills || [];
        const preferredSkills = jobRole.preferredSkills || [];

        // Calculate gaps
        const missingRequired = requiredSkills.filter(
            skill => !userSkillNames.includes(skill.toLowerCase())
        );

        const missingPreferred = preferredSkills.filter(
            skill => !userSkillNames.includes(skill.toLowerCase())
        );

        const matchedRequired = requiredSkills.filter(
            skill => userSkillNames.includes(skill.toLowerCase())
        );

        const matchedPreferred = preferredSkills.filter(
            skill => userSkillNames.includes(skill.toLowerCase())
        );

        // Calculate match percentage
        const totalRequired = requiredSkills.length || 1;
        const matchPercent = Math.round((matchedRequired.length / totalRequired) * 100);

        return {
            targetRole: jobRole.title,
            matchPercent,
            summary: {
                requiredMatch: `${matchedRequired.length}/${requiredSkills.length}`,
                preferredMatch: `${matchedPreferred.length}/${preferredSkills.length}`,
            },
            matchedSkills: {
                required: matchedRequired,
                preferred: matchedPreferred,
            },
            missingSkills: {
                required: missingRequired,
                preferred: missingPreferred,
            },
            userSkills: userSkills.map(us => ({
                name: us.skill.name,
                proficiency: us.proficiencyLevel,
                isVerified: us.isVerified,
            })),
        };
    }

    // Generate deterministic learning roadmap based on skill gaps (No LLM Cost)
    async generateRoadmap(userId: string, targetRole: string, weeks: number) {
        const gapAnalysis = await this.getGapAnalysis(userId, targetRole);

        // Identify all skills to learn
        let skillsToLearn = [
            ...gapAnalysis.missingSkills.required,
            ...gapAnalysis.missingSkills.preferred
        ];

        // If no gaps, add advanced topics
        if (skillsToLearn.length === 0) {
            skillsToLearn = ['System Design', 'Architecture Patterns', 'Performance Optimization', 'Leadership'];
        }

        // Distribute skills across weeks
        const totalSkills = skillsToLearn.length;
        const skillsPerWeek = Math.max(1, Math.ceil(totalSkills / weeks));
        const roadmap: RoadmapWeek[] = [];

        for (let week = 1; week <= weeks; week++) {
            // Get skills for this week
            const startIdx = (week - 1) * skillsPerWeek;
            const weekSkills = skillsToLearn.slice(startIdx, startIdx + skillsPerWeek);

            // Stop if we run out of skills/weeks match
            if (weekSkills.length === 0 && week > 1) break;

            // If we have extra weeks but ran out of skills, focus on projects/review
            if (weekSkills.length === 0) {
                roadmap.push({
                    week,
                    focus: `Capstone Project & Review`,
                    skills: ['Full Stack Integration', 'Deployment'],
                    tasks: [
                        'Build a comprehensive capstone project integrating all learned skills',
                        'Deploy your application to a public cloud provider',
                        'Prepare for mock interviews regarding your project',
                        'Refine your resume with the new skills and project'
                    ],
                    resources: [],
                    estimatedHours: 20
                });
                continue;
            }

            const primarySkill = weekSkills[0];
            const primarySkillLower = primarySkill.toLowerCase();

            // Look up metadata
            let metadata: { concepts: string[]; project: string; focus: string } | null = null;
            for (const [key, data] of Object.entries(SkillService.SKILL_METADATA)) {
                if (primarySkillLower.includes(key) || key.includes(primarySkillLower)) {
                    metadata = data;
                    break;
                }
            }

            // Default metadata if not found
            if (!metadata) {
                metadata = {
                    focus: `Master ${primarySkill}`,
                    concepts: [`${primarySkill} Fundamentals`, 'Core Concepts', 'Advanced Features', 'Best Practices'],
                    project: `Build a small application using ${primarySkill}`
                };
            }

            // Construct rich task list
            const tasks = [
                ...metadata.concepts.map(c => `Study: ${c}`),
                `Hands-on: ${metadata.project}`,
                weekSkills.length > 1 ? `Explore basics of: ${weekSkills.slice(1).join(', ')}` : 'Review and document your learning'
            ];

            // Get curated resources
            const resources = this.getCourseResources(primarySkill);

            roadmap.push({
                week,
                focus: metadata.focus,
                skills: weekSkills,
                tasks: tasks,
                resources: resources,
                estimatedHours: 10 + (weekSkills.length * 2)
            });
        }

        return {
            targetRole,
            duration: `${weeks} weeks`,
            currentMatch: `${gapAnalysis.matchPercent}%`,
            roadmap,
            totalHours: roadmap.reduce((sum: number, w: RoadmapWeek) => sum + w.estimatedHours, 0),
            readinessScore: gapAnalysis.matchPercent,
        };
    }

    // Get course recommendations for user's missing skills
    async getCourseRecommendations(userId: string, skillId?: string, limit: number = 5) {
        if (skillId) {
            // Recommendations for specific skill
            return prisma.course.findMany({
                where: { skillId, isActive: true },
                include: { skill: true },
                orderBy: { rating: 'desc' },
                take: limit,
            });
        }

        // Get user skills to find gaps
        const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            select: { skillId: true },
        });

        const userSkillIds = userSkills.map(us => us.skillId);

        // Get courses for skills user doesn't have
        const courses = await prisma.course.findMany({
            where: {
                skillId: { notIn: userSkillIds },
                isActive: true,
            },
            include: { skill: true },
            orderBy: [{ skill: { demandScore: 'desc' } }, { rating: 'desc' }],
            take: limit,
        });

        return courses;
    }

    // Get curated course resources for a skill
    private getCourseResources(skill: string): Array<{ name: string; platform: string; url: string; type: string }> {
        const skillLower = skill.toLowerCase();
        const searchTerm = encodeURIComponent(skill);

        // Skill-specific curated resources
        const curatedResources: Record<string, Array<{ name: string; platform: string; url: string; type: string }>> = {
            'javascript': [
                { name: 'JavaScript - The Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/javascript-the-complete-guide-2020-beginner-advanced/', type: 'Course' },
                { name: 'JavaScript Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', type: 'Video' },
                { name: 'Programming with JavaScript', platform: 'Coursera', url: 'https://www.coursera.org/learn/javascript', type: 'Course' },
            ],
            'python': [
                { name: 'Python for Everybody', platform: 'Coursera', url: 'https://www.coursera.org/specializations/python', type: 'Course' },
                { name: 'Python Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', type: 'Video' },
                { name: '100 Days of Code Python', platform: 'Udemy', url: 'https://www.udemy.com/course/100-days-of-code/', type: 'Course' },
            ],
            'react': [
                { name: 'React - The Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', type: 'Course' },
                { name: 'React Tutorial for Beginners', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=SqcY0GlETPk', type: 'Video' },
                { name: 'Meta React Basics', platform: 'Coursera', url: 'https://www.coursera.org/learn/react-basics', type: 'Course' },
            ],
            'node.js': [
                { name: 'Node.js Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/nodejs-the-complete-guide/', type: 'Course' },
                { name: 'Node.js Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=Oe421EPjeBE', type: 'Video' },
                { name: 'Server-side with Node.js', platform: 'Coursera', url: 'https://www.coursera.org/learn/server-side-nodejs', type: 'Course' },
            ],
            'sql': [
                { name: 'SQL for Data Science', platform: 'Coursera', url: 'https://www.coursera.org/learn/sql-for-data-science', type: 'Course' },
                { name: 'SQL Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', type: 'Video' },
                { name: 'Complete SQL Bootcamp', platform: 'Udemy', url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/', type: 'Course' },
            ],
            'docker': [
                { name: 'Docker & Kubernetes', platform: 'Udemy', url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', type: 'Course' },
                { name: 'Docker Tutorial', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', type: 'Video' },
                { name: 'Docker Essentials', platform: 'Coursera', url: 'https://www.coursera.org/learn/docker-essentials', type: 'Course' },
            ],
            'aws': [
                { name: 'AWS Certified Solutions Architect', platform: 'Udemy', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/', type: 'Course' },
                { name: 'AWS Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc', type: 'Video' },
                { name: 'AWS Fundamentals', platform: 'Coursera', url: 'https://www.coursera.org/specializations/aws-fundamentals', type: 'Course' },
            ],
            'machine learning': [
                { name: 'Machine Learning by Andrew Ng', platform: 'Coursera', url: 'https://www.coursera.org/learn/machine-learning', type: 'Course' },
                { name: 'ML Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=Gv9_4yMHFhI', type: 'Video' },
                { name: 'Machine Learning A-Z', platform: 'Udemy', url: 'https://www.udemy.com/course/machinelearning/', type: 'Course' },
            ],
            'kubernetes': [
                { name: 'Kubernetes for Beginners', platform: 'Udemy', url: 'https://www.udemy.com/course/learn-kubernetes/', type: 'Course' },
                { name: 'Kubernetes Tutorial', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=X48VuDVv0do', type: 'Video' },
                { name: 'Google Cloud Kubernetes', platform: 'Coursera', url: 'https://www.coursera.org/learn/google-kubernetes-engine', type: 'Course' },
            ],
            'typescript': [
                { name: 'Understanding TypeScript', platform: 'Udemy', url: 'https://www.udemy.com/course/understanding-typescript/', type: 'Course' },
                { name: 'TypeScript Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=BwuLxPH8IDs', type: 'Video' },
                { name: 'TypeScript Documentation', platform: 'Docs', url: 'https://www.typescriptlang.org/docs/', type: 'Documentation' },
            ],
            'git': [
                { name: 'Git Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/git-complete/', type: 'Course' },
                { name: 'Git & GitHub Crash Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', type: 'Video' },
                { name: 'Version Control with Git', platform: 'Coursera', url: 'https://www.coursera.org/learn/version-control-with-git', type: 'Course' },
            ],
        };

        // Check if skill has curated resources
        for (const [key, resources] of Object.entries(curatedResources)) {
            if (skillLower.includes(key) || key.includes(skillLower)) {
                return resources;
            }
        }

        // Fallback: generate dynamic search URLs
        return [
            { name: `${skill} Course`, platform: 'Coursera', url: `https://www.coursera.org/search?query=${searchTerm}`, type: 'Search' },
            { name: `${skill} Tutorial`, platform: 'YouTube', url: `https://www.youtube.com/results?search_query=${searchTerm}+tutorial`, type: 'Search' },
            { name: `${skill} Complete Course`, platform: 'Udemy', url: `https://www.udemy.com/courses/search/?q=${searchTerm}`, type: 'Search' },
        ];
    }

    // Static certifications for popular job roles (no LLM cost)
    private static STATIC_CERTIFICATIONS: Record<string, Array<{ name: string; issuer: string; level: string; url: string; description: string }>> = {
        'DevOps Engineer': [
            { name: 'AWS Certified DevOps Engineer - Professional', issuer: 'Amazon Web Services', level: 'Professional', url: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/', description: 'Validates expertise in CI/CD, automation, and AWS services' },
            { name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF', level: 'Professional', url: 'https://www.cncf.io/certification/cka/', description: 'Proves ability to design, install, and configure Kubernetes clusters' },
            { name: 'Docker Certified Associate', issuer: 'Docker', level: 'Associate', url: 'https://training.mirantis.com/certification/dca-certification-exam/', description: 'Demonstrates proficiency in containerization with Docker' },
            { name: 'HashiCorp Certified: Terraform Associate', issuer: 'HashiCorp', level: 'Associate', url: 'https://www.hashicorp.com/certification/terraform-associate', description: 'Validates infrastructure as code skills with Terraform' },
        ],
        'Cloud Engineer': [
            { name: 'AWS Certified Solutions Architect - Associate', issuer: 'Amazon Web Services', level: 'Associate', url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', description: 'Demonstrates ability to design distributed systems on AWS' },
            { name: 'Google Cloud Professional Cloud Architect', issuer: 'Google Cloud', level: 'Professional', url: 'https://cloud.google.com/certification/cloud-architect', description: 'Validates expertise in designing GCP solutions' },
            { name: 'Microsoft Azure Solutions Architect Expert', issuer: 'Microsoft', level: 'Expert', url: 'https://learn.microsoft.com/en-us/certifications/azure-solutions-architect/', description: 'Proves mastery of Azure cloud architecture' },
        ],
        'Data Scientist': [
            { name: 'TensorFlow Developer Certificate', issuer: 'Google', level: 'Professional', url: 'https://www.tensorflow.org/certificate', description: 'Validates skills in building ML models with TensorFlow' },
            { name: 'AWS Certified Machine Learning - Specialty', issuer: 'Amazon Web Services', level: 'Specialty', url: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/', description: 'Demonstrates expertise in ML on AWS' },
            { name: 'IBM Data Science Professional Certificate', issuer: 'IBM', level: 'Professional', url: 'https://www.coursera.org/professional-certificates/ibm-data-science', description: 'Comprehensive data science certification covering Python, SQL, ML' },
        ],
        'Data Analyst': [
            { name: 'Google Data Analytics Professional Certificate', issuer: 'Google', level: 'Associate', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', description: 'In-demand certification for data analysis, R, and visualization' },
            { name: 'IBM Data Analyst Professional Certificate', issuer: 'IBM', level: 'Associate', url: 'https://www.coursera.org/professional-certificates/ibm-data-analyst', description: 'Covers Python, SQL, Excel, and Cognos Analytics' },
            { name: 'Microsoft Certified: Power BI Data Analyst Associate', issuer: 'Microsoft', level: 'Associate', url: 'https://learn.microsoft.com/en-us/certifications/power-bi-data-analyst-associate/', description: 'Validates expertise in data visualization with Power BI' },
        ],
        'Frontend Developer': [
            { name: 'Meta Front-End Developer Professional Certificate', issuer: 'Meta', level: 'Professional', url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer', description: 'Covers React, JavaScript, and modern frontend development' },
            { name: 'AWS Certified Developer - Associate', issuer: 'Amazon Web Services', level: 'Associate', url: 'https://aws.amazon.com/certification/certified-developer-associate/', description: 'Validates skills in developing cloud applications' },
        ],
        'Backend Developer': [
            { name: 'Oracle Certified Professional: Java SE Developer', issuer: 'Oracle', level: 'Professional', url: 'https://education.oracle.com/java-se-17-developer/pexam_1Z0-829', description: 'Demonstrates advanced Java programming skills' },
            { name: 'Microsoft Certified: Azure Developer Associate', issuer: 'Microsoft', level: 'Associate', url: 'https://learn.microsoft.com/en-us/certifications/azure-developer/', description: 'Validates ability to build Azure cloud solutions' },
            { name: 'MongoDB Associate Developer', issuer: 'MongoDB', level: 'Associate', url: 'https://learn.mongodb.com/pages/mongodb-associate-developer-exam', description: 'Proves proficiency in MongoDB database development' },
        ],
        'Full Stack Developer': [
            { name: 'Meta Full Stack Developer Professional Certificate', issuer: 'Meta', level: 'Professional', url: 'https://www.coursera.org/professional-certificates/meta-back-end-developer', description: 'Comprehensive full-stack certification covering frontend and backend' },
            { name: 'AWS Certified Developer - Associate', issuer: 'Amazon Web Services', level: 'Associate', url: 'https://aws.amazon.com/certification/certified-developer-associate/', description: 'Validates cloud application development skills' },
        ],
        'Cybersecurity Analyst': [
            { name: 'CompTIA Security+', issuer: 'CompTIA', level: 'Associate', url: 'https://www.comptia.org/certifications/security', description: 'Industry-standard entry-level security certification' },
            { name: 'Certified Ethical Hacker (CEH)', issuer: 'EC-Council', level: 'Professional', url: 'https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/', description: 'Validates ethical hacking and penetration testing skills' },
            { name: 'CISSP', issuer: 'ISC2', level: 'Expert', url: 'https://www.isc2.org/Certifications/CISSP', description: 'Gold standard for IT security professionals' },
        ],
        'Project Manager': [
            { name: 'PMP (Project Management Professional)', issuer: 'PMI', level: 'Professional', url: 'https://www.pmi.org/certifications/project-management-pmp', description: 'Most recognized project management certification globally' },
            { name: 'PRINCE2 Practitioner', issuer: 'AXELOS', level: 'Practitioner', url: 'https://www.axelos.com/certifications/prince2', description: 'Popular methodology-based project management certification' },
            { name: 'Certified Scrum Master (CSM)', issuer: 'Scrum Alliance', level: 'Associate', url: 'https://www.scrumalliance.org/get-certified/scrum-master-track/certified-scrummaster', description: 'Validates Agile/Scrum methodology expertise' },
        ],
    };

    // Get certifications for a target role (with caching)
    async getCertificationsForRole(targetRole: string) {
        // Find job role
        const jobRole = await prisma.jobRole.findFirst({
            where: { title: { contains: targetRole, mode: 'insensitive' } },
            include: { cache: true },
        });

        if (!jobRole) {
            // Return generic certifications if role not found
            return this.getStaticCertifications(targetRole);
        }

        // Check cache validity
        // Check cache validity (must be unexpired AND have actual content)
        if (jobRole.cache &&
            new Date() < jobRole.cache.expiresAt &&
            Array.isArray(jobRole.cache.certifications) &&
            (jobRole.cache.certifications as any[]).length > 0
        ) {
            logger.info(`Using cached certifications for ${targetRole}`);
            return {
                certifications: jobRole.cache.certifications,
                courseSuggestions: jobRole.cache.courseSuggestions,
                fromCache: true,
            };
        }

        // Get static certifications first (no LLM cost)
        const staticCerts = this.getStaticCertifications(targetRole);

        // If we have static certifications, use them and cache
        if (staticCerts.length > 0) {
            const courseSuggestions = this.generateCourseSuggestionsForRole(targetRole);

            // Save to cache
            await this.saveToCache(jobRole.id, staticCerts, courseSuggestions);

            return {
                certifications: staticCerts,
                courseSuggestions,
                fromCache: false,
            };
        }

        // Fallback: Generate with LLM if no static data (only runs once per role)
        try {
            const llmResult = await this.generateCertificationsWithLLM(targetRole);

            // Save to cache
            await this.saveToCache(jobRole.id, llmResult.certifications, llmResult.courseSuggestions);

            return {
                ...llmResult,
                fromCache: false,
            };
        } catch (error) {
            logger.error('Failed to generate certifications with LLM', error);
            return {
                certifications: [],
                courseSuggestions: [],
                fromCache: false,
            };
        }
    }

    // Get static certifications for a role
    private getStaticCertifications(targetRole: string): Array<{ name: string; issuer: string; level: string; url: string; description: string }> {
        const roleLower = targetRole.toLowerCase();

        for (const [role, certs] of Object.entries(SkillService.STATIC_CERTIFICATIONS)) {
            if (roleLower.includes(role.toLowerCase()) || role.toLowerCase().includes(roleLower)) {
                return certs;
            }
        }

        return [];
    }

    // Generate course suggestions for a role based on required skills
    private generateCourseSuggestionsForRole(targetRole: string): Array<{ name: string; platform: string; url: string; skill: string }> {
        const roleSkillMap: Record<string, string[]> = {
            'devops': ['docker', 'kubernetes', 'aws', 'terraform', 'git'],
            'cloud': ['aws', 'docker', 'kubernetes', 'python'],
            'frontend': ['react', 'javascript', 'typescript', 'css'],
            'backend': ['node.js', 'python', 'sql', 'docker'],
            'full stack': ['react', 'node.js', 'javascript', 'sql'],
            'data scientist': ['python', 'machine learning', 'sql'],
            'cybersecurity': ['python', 'networking', 'linux'],
        };

        const roleLower = targetRole.toLowerCase();
        let skills: string[] = [];

        for (const [key, roleSkills] of Object.entries(roleSkillMap)) {
            if (roleLower.includes(key)) {
                skills = roleSkills;
                break;
            }
        }

        // Get courses for each skill
        const courses: Array<{ name: string; platform: string; url: string; skill: string }> = [];
        for (const skill of skills.slice(0, 5)) {
            const skillCourses = this.getCourseResources(skill);
            if (skillCourses.length > 0) {
                courses.push({
                    ...skillCourses[0],
                    skill,
                });
            }
        }

        return courses;
    }

    // Save certifications to cache
    private async saveToCache(
        jobRoleId: string,
        certifications: any[],
        courseSuggestions: any[]
    ) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30-day cache

        await prisma.jobRoleCache.upsert({
            where: { jobRoleId },
            create: {
                jobRoleId,
                certifications,
                courseSuggestions,
                expiresAt,
            },
            update: {
                certifications,
                courseSuggestions,
                generatedAt: new Date(),
                expiresAt,
            },
        });

        logger.info(`Cached certifications for job role ${jobRoleId}`);
    }

    // Generate certifications with LLM (fallback, only for uncached roles)
    private async generateCertificationsWithLLM(targetRole: string) {
        const prompt = `Generate a list of the top 4-5 globally recognized professional certifications for a ${targetRole} role.
Prioritize official certifications from industry leaders (e.g., Google, NVIDIA, Microsoft, AWS, IBM, Meta, Cisco) over generic ones.

For each certification, provide:
- name: Official certification name
- issuer: Issuing organization
- level: Associate, Professional, or Expert
- url: Official certification page URL
- description: One sentence describing what the certification validates

Also provide 3-4 top-tier course suggestions from Coursera, edX, or YouTube by reputable providers (Google, IBM, Microsoft, etc.).

Return JSON:
{
  "certifications": [
    { "name": "...", "issuer": "...", "level": "...", "url": "...", "description": "..." }
  ],
  "courseSuggestions": [
    { "name": "Course name", "platform": "Coursera/Udemy/YouTube", "url": "...", "skill": "..." }
  ]
}`;

        const systemPrompt = 'You are a career development expert. Recommend industry-recognized certifications. Return JSON only.';
        const result = await analyzeWithGemini(systemPrompt, prompt);

        return {
            certifications: result?.certifications || [],
            courseSuggestions: result?.courseSuggestions || [],
        };
    }
}

